/* eslint-disable camelcase */
import * as utils from '../common/utils'
import { backgroundFetch } from '../common/background/fetch'
import * as lang from './lang'
import { fetchSSE } from './utils'
import { urlJoin } from 'url-join-ts'
import { v4 as uuidv4 } from 'uuid'

export type TranslateMode = 'translate' | 'polishing' | 'summarize' | 'analyze' | 'explain-code' | 'big-bang'
export type Provider = 'OpenAI' | 'ChatGPT' | 'Azure'
export type APIModel =
    | 'gpt-3.5-turbo'
    | 'gpt-3.5-turbo-0301'
    | 'gpt-4'
    | 'gpt-4-0314'
    | 'gpt-4-32k'
    | 'gpt-4-32k-0314'
    | string

export interface TranslateQuery {
    text: string
    selectedWord: string
    detectFrom: string
    detectTo: string
    mode: TranslateMode
    onMessage: (message: { content: string; role: string; isWordMode: boolean; isFullText?: boolean }) => void
    onError: (error: string) => void
    onFinish: (reason: string) => void
    onStatusCode?: (statusCode: number) => void
    signal: AbortSignal
    articlePrompt?: string
}

export interface TranslateResult {
    text?: string
    from?: string
    to?: string
    error?: string
}

export const isAWord = (langCode: string, text: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { Segmenter } = Intl as any
    if (!Segmenter) {
        return false
    }
    const segmenter = new Segmenter(langCode, { granularity: 'word' })
    const iterator = segmenter.segment(text)[Symbol.iterator]()
    return iterator.next().value?.segment === text
}

export class QuoteProcessor {
    private quote: string
    public quoteStart: string
    public quoteEnd: string
    private prevQuoteStartBuffer: string
    private prevQuoteEndBuffer: string

    constructor() {
        this.quote = uuidv4().replace(/-/g, '').slice(0, 4)
        this.quoteStart = `<${this.quote}>`
        this.quoteEnd = `</${this.quote}>`
        this.prevQuoteStartBuffer = ''
        this.prevQuoteEndBuffer = ''
    }

    public processText(text: string): string {
        const deltas = text.split('')
        const targetPieces = deltas.map((delta) => this.processTextDelta(delta))
        return targetPieces.join('')
    }

    private processTextDelta(textDelta: string): string {
        if (textDelta === '') {
            return ''
        }
        if (textDelta.trim() === this.quoteEnd) {
            return ''
        }
        let result = textDelta
        // process quote start
        let quoteStartBuffer = this.prevQuoteStartBuffer
        // console.debug('\n\n')
        // console.debug('---- process quote start -----')
        // console.debug('textDelta', textDelta)
        // console.debug('this.quoteStartbuffer', this.quoteStartBuffer)
        // console.debug('start loop:')
        let startIdx = 0
        for (let i = 0; i < textDelta.length; i++) {
            const char = textDelta[i]
            // console.debug(`---- i: ${i} startIdx: ${startIdx} ----`)
            // console.debug('char', char)
            // console.debug('quoteStartBuffer', quoteStartBuffer)
            // console.debug('result', result)
            if (char === this.quoteStart[quoteStartBuffer.length]) {
                if (this.prevQuoteStartBuffer.length > 0) {
                    if (i === startIdx) {
                        quoteStartBuffer += char
                        result = textDelta.slice(i + 1)
                        startIdx += 1
                    } else {
                        result = this.prevQuoteStartBuffer + textDelta
                        quoteStartBuffer = ''
                        break
                    }
                } else {
                    quoteStartBuffer += char
                    result = textDelta.slice(i + 1)
                }
            } else {
                if (quoteStartBuffer.length === this.quoteStart.length) {
                    quoteStartBuffer = ''
                    break
                }
                if (quoteStartBuffer.length > 0) {
                    result = this.prevQuoteStartBuffer + textDelta
                    quoteStartBuffer = ''
                    break
                }
            }
        }
        // console.debug('end loop!')
        this.prevQuoteStartBuffer = quoteStartBuffer
        // console.debug('result', result)
        // console.debug('this.quoteStartBuffer', this.quoteStartBuffer)
        // console.debug('---- end of process quote start -----')
        textDelta = result
        // process quote end
        let quoteEndBuffer = this.prevQuoteEndBuffer
        // console.debug('\n\n')
        // console.debug('---- start process quote end -----')
        // console.debug('textDelta', textDelta)
        // console.debug('this.quoteEndBuffer', this.quoteEndBuffer)
        // console.debug('start loop:')
        let endIdx = 0
        for (let i = 0; i < textDelta.length; i++) {
            const char = textDelta[i]
            // console.debug(`---- i: ${i}, endIdx: ${endIdx} ----`)
            // console.debug('char', char)
            // console.debug('quoteEndBuffer', quoteEndBuffer)
            // console.debug('result', result)
            if (char === this.quoteEnd[quoteEndBuffer.length]) {
                if (this.prevQuoteEndBuffer.length > 0) {
                    if (i === endIdx) {
                        quoteEndBuffer += char
                        result = textDelta.slice(i + 1)
                        endIdx += 1
                    } else {
                        result = this.prevQuoteEndBuffer + textDelta
                        quoteEndBuffer = ''
                        break
                    }
                } else {
                    quoteEndBuffer += char
                    result = textDelta.slice(0, textDelta.length - quoteEndBuffer.length)
                }
            } else {
                if (quoteEndBuffer.length === this.quoteEnd.length) {
                    quoteEndBuffer = ''
                    break
                }
                if (quoteEndBuffer.length > 0) {
                    result = this.prevQuoteEndBuffer + textDelta
                    quoteEndBuffer = ''
                    break
                }
            }
        }
        // console.debug('end loop!')
        this.prevQuoteEndBuffer = quoteEndBuffer
        // console.debug('totally result', result)
        // console.debug('this.quoteEndBuffer', this.quoteEndBuffer)
        // console.debug('---- end of process quote end -----')
        return result
    }
}

const chineseLangCodes = ['zh-Hans', 'zh-Hant', 'lzh', 'yue', 'jdbhw', 'xdbhw']

export async function translate(query: TranslateQuery) {
    const sourceLangCode = query.detectFrom
    const targetLangCode = query.detectTo
    const sourceLang = lang.getLangName(sourceLangCode)
    const targetLang = lang.getLangName(targetLangCode)
    console.debug('sourceLang', sourceLang)
    console.debug('targetLang', targetLang)
    let quoteProcessor: QuoteProcessor | undefined
    const settings = await utils.getSettings()
    const toChinese = chineseLangCodes.indexOf(targetLangCode) >= 0
    let rolePrompt =
        'You are a professional translation engine, please translate the text into a colloquial, professional, elegant and fluent content, without the style of machine translation. You must only translate the text content, never interpret it.'
    const assistantPrompts: string[] = []
    let commandPrompt = `Translate from ${sourceLang} to ${targetLang}. Only the translated text can be returned.`
    let contentPrompt = query.text

    // a word could be collected
    let isWordMode = false
    switch (query.mode) {
        case 'translate':
            quoteProcessor = new QuoteProcessor()
            commandPrompt += ` Only translate the text between ${quoteProcessor.quoteStart} and ${quoteProcessor.quoteEnd}.`
            contentPrompt = `${quoteProcessor.quoteStart}${query.text}${quoteProcessor.quoteEnd} =>`
            if (targetLangCode === 'xdbhw') {
                rolePrompt = '您是一位在中文系研究中文的资深学者'
                commandPrompt = `夹在${quoteProcessor.quoteStart}和${quoteProcessor.quoteEnd}之间的内容是原文，请您将原文内容翻译成《呐喊》风格的现代白话文`
            } else if (targetLangCode === 'jdbhw') {
                rolePrompt = '您是一位在中文系研究中文的资深学者'
                commandPrompt = `夹在${quoteProcessor.quoteStart}和${quoteProcessor.quoteEnd}之间的内容是原文，请您将原文内容翻译成《红楼梦》风格的近代白话文`
            } else if (query.text.length < 5 && toChinese) {
                // 当用户的默认语言为中文时，查询中文词组（不超过5个字），展示多种翻译结果，并阐述适用语境。
                rolePrompt = `你是一个翻译引擎，请将给到的文本翻译成${targetLang}。请列出3种（如果有）最常用翻译结果：单词或短语，并列出对应的适用语境（用中文阐述）、音标、词性、双语示例。按照下面格式用中文阐述：
                    <序号><单词或短语> · /<音标>
                    [<词性缩写>] <适用语境（用中文阐述）>
                    例句：<例句>(例句翻译)`
                commandPrompt = ''
            }
            if (toChinese && isAWord(sourceLangCode, query.text.trim())) {
                isWordMode = true
                // 翻译为中文时，增加单词模式，可以更详细的翻译结果，包括：音标、词性、含义、双语示例。
                rolePrompt = `你是一个翻译引擎，请将翻译给到的文本，只需要翻译不需要解释。当且仅当文本只有一个单词时，请给出单词原始形态（如果有）、单词的语种、对应的音标（如果有）、所有含义（含词性）、双语示例，至少三条例句，请严格按照下面格式给到翻译结果：
                <单词>
                [<语种>] · / <单词音标>
                [<词性缩写>] <中文含义>]
                例句：
                <序号><例句>(例句翻译)`
                commandPrompt = '好的，我明白了，请给我这个单词。'
                contentPrompt = `单词是：${query.text}`
            }
            if (query.selectedWord) {
                rolePrompt = `You are an expert in the semantic syntax of the ${sourceLang} language and you are teaching me the ${sourceLang} language. I give you a sentence in ${sourceLang} and a word in that sentence. Please help me explain in ${targetLang} language what the word means in the sentence and what the sentence itself means, and if the word is part of an idiom in the sentence, explain the idiom in the sentence and give a few examples in ${sourceLang} with the same meaning and explain the examples in ${targetLang} language, and must in ${targetLang} language. If you understand, say yes, and then we will begin.`
                commandPrompt = 'yes, I understand, please give me the sentence and the word.'
                contentPrompt = `the sentence is: ${query.text}\n\nthe word is: ${query.selectedWord}`
            }
            break
        case 'polishing':
            rolePrompt =
                'You are an expert translator, please revise the following sentences to make them more clear, concise, and coherent.'
            quoteProcessor = new QuoteProcessor()
            commandPrompt = `Please polish this text in ${sourceLang}. Only polish the text between ${quoteProcessor.quoteStart} and ${quoteProcessor.quoteEnd}.`
            contentPrompt = `${quoteProcessor.quoteStart}${query.text}${quoteProcessor.quoteEnd}`
            break
        case 'summarize':
            rolePrompt = "You are a professional text summarizer, you can only summarize the text, don't interpret it."
            quoteProcessor = new QuoteProcessor()
            commandPrompt = `Please summarize this text in the most concise language and must use ${targetLang} language! Only summarize the text between ${quoteProcessor.quoteStart} and ${quoteProcessor.quoteEnd}.`
            contentPrompt = `${quoteProcessor.quoteStart}${query.text}${quoteProcessor.quoteEnd}`
            break
        case 'analyze':
            rolePrompt = 'You are a professional translation engine and grammar analyzer.'
            quoteProcessor = new QuoteProcessor()
            commandPrompt = `Please translate this text to ${targetLang} and explain the grammar in the original text using ${targetLang}. Only analyze the text between ${quoteProcessor.quoteStart} and ${quoteProcessor.quoteEnd}.`
            contentPrompt = `${quoteProcessor.quoteStart}${query.text}${quoteProcessor.quoteEnd}`
            break
        case 'explain-code':
            rolePrompt =
                'You are a code explanation engine that can only explain code but not interpret or translate it. Also, please report bugs and errors (if any).'
            commandPrompt = `explain the provided code, regex or script in the most concise language and must use ${targetLang} language! You may use Markdown. If the content is not code, return an error message. If the code has obvious errors, point them out.`
            contentPrompt = '```\n' + query.text + '\n```'
            break
        case 'big-bang':
            rolePrompt = `You are a professional writer and you will write ${query.articlePrompt} based on the given words`
            commandPrompt = `Write ${query.articlePrompt} of no more than 160 words. The article must contain the words in the following text. The more words you use, the better`
            break
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: Record<string, any> = {
        model: settings.apiModel,
        temperature: 0,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 1,
        presence_penalty: 1,
        stream: true,
    }

    let apiKey = ''
    if (settings.provider !== 'ChatGPT') {
        apiKey = await utils.getApiKey()
    }
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    let isChatAPI = true
    if (settings.provider === 'Azure' && settings.apiURLPath && settings.apiURLPath.indexOf('/chat/completions') < 0) {
        // Azure OpenAI Service supports multiple API.
        // We should check if the settings.apiURLPath is match `/deployments/{deployment-id}/chat/completions`.
        // If not, we should use the legacy parameters.
        isChatAPI = false
        body[
            'prompt'
        ] = `<|im_start|>system\n${rolePrompt}\n<|im_end|>\n<|im_start|>user\n${commandPrompt}\n${contentPrompt}\n<|im_end|>\n<|im_start|>assistant\n`
        body['stop'] = ['<|im_end|>']
    } else if (settings.provider === 'ChatGPT') {
        let resp: Response | null = null
        resp = await backgroundFetch(utils.defaultChatGPTAPIAuthSession, { signal: query.signal })
        const respJson = await resp?.json()
        apiKey = respJson.accessToken
        body = {
            action: 'next',
            messages: [
                {
                    id: utils.generateUUID(),
                    role: 'user',
                    content: {
                        content_type: 'text',
                        parts: [rolePrompt + '\n\n' + commandPrompt + ':\n' + `${contentPrompt}`],
                    },
                },
            ],
            model: settings.apiModel, // 'text-davinci-002-render-sha'
            parent_message_id: utils.generateUUID(),
        }
    } else {
        const messages = [
            {
                role: 'system',
                content: rolePrompt,
            },
            ...assistantPrompts.map((prompt) => {
                return {
                    role: 'user',
                    content: prompt,
                }
            }),
            {
                role: 'user',
                content: commandPrompt,
            },
            {
                role: 'user',
                content: contentPrompt,
            },
        ]
        body['messages'] = messages
    }

    switch (settings.provider) {
        case 'OpenAI':
        case 'ChatGPT':
            headers['Authorization'] = `Bearer ${apiKey}`
            break

        case 'Azure':
            headers['api-key'] = `${apiKey}`
            break
    }

    if (settings.provider === 'ChatGPT') {
        let conversationId = ''
        let length = 0
        await fetchSSE(`${utils.defaultChatGPTWebAPI}/conversation`, {
            fetcher: backgroundFetch,
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: query.signal,
            onStatusCode: (status) => {
                query.onStatusCode?.(status)
            },
            onMessage: (msg) => {
                let resp
                try {
                    resp = JSON.parse(msg)
                    // eslint-disable-next-line no-empty
                } catch {
                    query.onFinish('stop')
                    return
                }
                if (!conversationId) {
                    conversationId = resp.conversation_id
                }
                const { finish_details: finishDetails } = resp.message
                if (finishDetails) {
                    query.onFinish(finishDetails.type)
                    return
                }

                const { content, author } = resp.message
                if (author.role === 'assistant') {
                    const targetTxt = content.parts.join('')
                    let textDelta = targetTxt.slice(length)
                    if (quoteProcessor) {
                        textDelta = quoteProcessor.processText(textDelta)
                    }
                    query.onMessage({ content: textDelta, role: '', isWordMode })
                    length = targetTxt.length
                }
            },
            onError: (err) => {
                if (err instanceof Error) {
                    query.onError(err.message)
                    return
                }
                if (typeof err === 'string') {
                    query.onError(err)
                    return
                }
                if (typeof err === 'object') {
                    const { detail } = err
                    if (detail) {
                        const { message } = detail
                        if (message) {
                            query.onError(`ChatGPT Web: ${message}`)
                            return
                        }
                    }
                    query.onError(`ChatGPT Web: ${JSON.stringify(err)}`)
                    return
                }
                const { error } = err
                if (error instanceof Error) {
                    query.onError(error.message)
                    return
                }
                if (typeof error === 'object') {
                    const { message } = error
                    if (message) {
                        query.onError(message)
                        return
                    }
                }
                query.onError('Unknown error')
            },
        })

        if (conversationId) {
            await backgroundFetch(`${utils.defaultChatGPTWebAPI}/conversation/${conversationId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ is_visible: false }),
            })
        }
    } else {
        const url = urlJoin(settings.apiURL, settings.apiURLPath)
        await fetchSSE(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: query.signal,
            onMessage: (msg) => {
                let resp
                try {
                    resp = JSON.parse(msg)
                    // eslint-disable-next-line no-empty
                } catch {
                    query.onFinish('stop')
                    return
                }

                const { choices } = resp
                if (!choices || choices.length === 0) {
                    return { error: 'No result' }
                }
                const { finish_reason: finishReason } = choices[0]
                if (finishReason) {
                    query.onFinish(finishReason)
                    return
                }

                let targetTxt = ''
                if (!isChatAPI) {
                    // It's used for Azure OpenAI Service's legacy parameters.
                    targetTxt = choices[0].text

                    if (quoteProcessor) {
                        targetTxt = quoteProcessor.processText(targetTxt)
                    }

                    query.onMessage({ content: targetTxt, role: '', isWordMode })
                } else {
                    const { content = '', role } = choices[0].delta

                    targetTxt = content

                    if (quoteProcessor) {
                        targetTxt = quoteProcessor.processText(targetTxt)
                    }

                    query.onMessage({ content: targetTxt, role, isWordMode })
                }
            },
            onError: (err) => {
                if (err instanceof Error) {
                    query.onError(err.message)
                    return
                }
                if (typeof err === 'string') {
                    query.onError(err)
                    return
                }
                if (typeof err === 'object') {
                    const { detail } = err
                    if (detail) {
                        query.onError(detail)
                        return
                    }
                }
                const { error } = err
                if (error instanceof Error) {
                    query.onError(error.message)
                    return
                }
                if (typeof error === 'object') {
                    const { message } = error
                    if (message) {
                        query.onError(message)
                        return
                    }
                }
                query.onError('Unknown error')
            },
        })
    }
}
