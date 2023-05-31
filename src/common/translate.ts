/* eslint-disable camelcase */
import * as utils from '../common/utils'
import * as lang from './components/lang/lang'
import { fetchSSE, isDesktopApp } from './utils'
import { urlJoin } from 'url-join-ts'
import { v4 as uuidv4 } from 'uuid'
import { getLangConfig, LangCode } from './components/lang/lang'
import { getUniversalFetch } from './universal-fetch'
import { Action } from './internal-services/db'
import { AuthCodeModelManager, batchSubscribeApiKeys, defaultOpenAIModelDetail, filterApiKeys } from './subscribe'

export type TranslateMode = 'translate' | 'polishing' | 'summarize' | 'analyze' | 'explain-code' | 'big-bang'
export type Provider = 'OpenAI' | 'ChatGPT' | 'Azure' | 'ThirdPartyChatGPT'
export type APIModel =
    | 'gpt-3.5-turbo'
    | 'gpt-3.5-turbo-0301'
    | 'gpt-4'
    | 'gpt-4-0314'
    | 'gpt-4-32k'
    | 'gpt-4-32k-0314'
    | string

interface BaseTranslateQuery {
    text: string
    selectedWord: string
    detectFrom: LangCode
    detectTo: LangCode
    mode?: Exclude<TranslateMode, 'big-bang'>
    action: Action
    onMessage: (message: { content: string; role: string; isWordMode: boolean; isFullText?: boolean }) => void
    onError: (error: string) => void
    onFinish: (reason: string) => void
    onStatusCode?: (statusCode: number) => void
    signal: AbortSignal
}

type TranslateQueryBigBang = Omit<
    BaseTranslateQuery,
    'mode' | 'action' | 'selectedWord' | 'detectFrom' | 'detectTo'
> & {
    mode: 'big-bang'
    articlePrompt: string
}

export type TranslateQuery = BaseTranslateQuery | TranslateQueryBigBang

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

const bodyTypes = ['OpenAI', 'ChatGPT', 'Azure', 'ProxiedOpenAI', 'AILink'] as const
type BodyType = (typeof bodyTypes)[number]

type RequestOptions = {
    headers: Record<string, string>
    apiURL: string
    apiURLPath: string
    bodyType: BodyType
    auth?: boolean
    eventStream?: boolean
}

export async function translate(query: TranslateQuery) {
    const fetcher = getUniversalFetch()
    let rolePrompt = ''
    let commandPrompt = ''
    let contentPrompt = query.text
    const assistantPrompts: string[] = []
    let quoteProcessor: QuoteProcessor | undefined
    const settings = await utils.getSettings()
    const providerProps = settings.providersProps[settings.provider]
    let isWordMode = false

    if (query.mode === 'big-bang') {
        rolePrompt = `You are a professional writer and you will write ${query.articlePrompt} based on the given words`
        commandPrompt = `Write ${query.articlePrompt} of no more than 160 words. The article must contain the words in the following text. The more words you use, the better`
    } else {
        const sourceLangCode = query.detectFrom
        const targetLangCode = query.detectTo
        const sourceLangName = lang.getLangName(sourceLangCode)
        const targetLangName = lang.getLangName(targetLangCode)
        console.debug('sourceLang', sourceLangName)
        console.debug('targetLang', targetLangName)
        const toChinese = chineseLangCodes.indexOf(targetLangCode) >= 0
        const targetLangConfig = getLangConfig(targetLangCode)
        const sourceLangConfig = getLangConfig(sourceLangCode)
        console.log('Source language is', sourceLangConfig)
        rolePrompt = targetLangConfig.rolePrompt

        switch (query.action.mode) {
            case null:
            case undefined:
                if (
                    (query.action.rolePrompt ?? '').includes('${text}') ||
                    (query.action.commandPrompt ?? '').includes('${text}')
                ) {
                    contentPrompt = ''
                } else {
                    contentPrompt = '"""' + query.text + '"""'
                }
                rolePrompt = (query.action.rolePrompt ?? '')
                    .replace('${sourceLang}', sourceLangName)
                    .replace('${targetLang}', targetLangName)
                    .replace('${text}', query.text)
                commandPrompt = (query.action.commandPrompt ?? '')
                    .replace('${sourceLang}', sourceLangName)
                    .replace('${targetLang}', targetLangName)
                    .replace('${text}', query.text)
                if (query.action.outputRenderingFormat) {
                    commandPrompt += `. Format: ${query.action.outputRenderingFormat}`
                }
                break
            case 'translate':
                quoteProcessor = new QuoteProcessor()
                commandPrompt = targetLangConfig.genCommandPrompt(
                    sourceLangConfig,
                    quoteProcessor.quoteStart,
                    quoteProcessor.quoteEnd
                )
                contentPrompt = `${quoteProcessor.quoteStart}${query.text}${quoteProcessor.quoteEnd}`
                console.debug('--------------', query)
                if (query.text.length < 5 && toChinese) {
                    // 当用户的默认语言为中文时，查询中文词组（不超过5个字），展示多种翻译结果，并阐述适用语境。
                    rolePrompt = `你是一个翻译引擎，请将给到的文本翻译成${targetLangName}。请列出3种（如果有）最常用翻译结果：单词或短语，并列出对应的适用语境（用中文阐述）、音标或转写、词性、双语示例。按照下面格式用中文阐述：
                    <序号><单词或短语> · /<${targetLangConfig.phoneticNotation}>/
                    [<词性缩写>] <适用语境（用中文阐述）>
                    例句：<例句>(例句翻译)`
                    commandPrompt = ''
                }
                if (isAWord(sourceLangCode, query.text.trim())) {
                    isWordMode = true
                    if (toChinese) {
                        // 单词模式，可以更详细的翻译结果，包括：音标、词性、含义、双语示例。
                        rolePrompt = `你是一个翻译引擎，请翻译给出的文本，只需要翻译不需要解释。当且仅当文本只有一个单词时，请给出单词原始形态（如果有）、单词的语种、${
                            targetLangConfig.phoneticNotation && '对应的音标或转写、'
                        }所有含义（含词性）、双语示例，至少三条例句。如果你认为单词拼写错误，请提示我最可能的正确拼写，否则请严格按照下面格式给到翻译结果：
                <单词>
                [<语种>] · / ${targetLangConfig.phoneticNotation && '<' + targetLangConfig.phoneticNotation + '>'}
                [<词性缩写>] <中文含义>]
                例句：
                <序号><例句>(例句翻译)
                词源：
                <词源>`
                        commandPrompt = '好的，我明白了，请给我这个单词。'
                        contentPrompt = `单词是：${query.text}`
                    } else {
                        const isSameLanguage = sourceLangCode === targetLangCode
                        rolePrompt = `You are a professional translation engine. Please translate the text into ${targetLangName} without explanation. When the text has only one word, please act as a professional ${sourceLangName}-${targetLangName} dictionary, and list the original form of the word (if any), the language of the word, ${
                            targetLangConfig.phoneticNotation &&
                            'the corresponding phonetic notation or transcription, '
                        }all senses with parts of speech, ${
                            isSameLanguage ? '' : 'bilingual '
                        }sentence examples (at least 3) and etymology. If you think there is a spelling mistake, please tell me the most possible correct word otherwise reply in the following format:
                <word> (<original form>)
                [<language>] · / ${targetLangConfig.phoneticNotation && '<' + targetLangConfig.phoneticNotation + '>'}
                [<part of speech>] ${isSameLanguage ? '' : '<translated meaning> / '}<meaning in source language>
                Examples:
                <index>. <sentence>(<sentence translation>)
                Etymology:
                <etymology>`
                        console.log(rolePrompt)
                        commandPrompt = 'I understand. Please give me the word.'
                        contentPrompt = `The word is: ${query.text}`
                    }
                }
                if (query.selectedWord) {
                    rolePrompt = `You are an expert in the semantic syntax of the ${sourceLangName} language and you are teaching me the ${sourceLangName} language. I give you a sentence in ${sourceLangName} and a word in that sentence. Please help me explain in ${targetLangName} language what the word means in the sentence and what the sentence itself means, and if the word is part of an idiom in the sentence, explain the idiom in the sentence and give a few examples in ${sourceLangName} with the same meaning and explain the examples in ${targetLangName} language, and must in ${targetLangName} language. If you understand, say yes, and then we will begin.`
                    commandPrompt = 'Yes, I understand. Please give me the sentence and the word.'
                    contentPrompt = `the sentence is: ${query.text}\n\nthe word is: ${query.selectedWord}`
                }
                break
            case 'polishing':
                rolePrompt =
                    'You are an expert translator, please revise the following sentences to make them more clear, concise, and coherent.'
                quoteProcessor = new QuoteProcessor()
                commandPrompt = `Please polish this text in ${sourceLangName}. Only polish the text between ${quoteProcessor.quoteStart} and ${quoteProcessor.quoteEnd}.`
                contentPrompt = `${quoteProcessor.quoteStart}${query.text}${quoteProcessor.quoteEnd}`
                break
            case 'summarize':
                rolePrompt =
                    "You are a professional text summarizer, you can only summarize the text, don't interpret it."
                quoteProcessor = new QuoteProcessor()
                commandPrompt = `Please summarize this text in the most concise language and must use ${targetLangName} language! Only summarize the text between ${quoteProcessor.quoteStart} and ${quoteProcessor.quoteEnd}.`
                contentPrompt = `${quoteProcessor.quoteStart}${query.text}${quoteProcessor.quoteEnd}`
                break
            case 'analyze':
                rolePrompt = 'You are a professional translation engine and grammar analyzer.'
                quoteProcessor = new QuoteProcessor()
                commandPrompt = `Please translate this text to ${targetLangName} and explain the grammar in the original text using ${targetLangName}. Only analyze the text between ${quoteProcessor.quoteStart} and ${quoteProcessor.quoteEnd}.`
                contentPrompt = `${quoteProcessor.quoteStart}${query.text}${quoteProcessor.quoteEnd}`
                break
            case 'explain-code':
                rolePrompt =
                    'You are a code explanation engine that can only explain code but not interpret or translate it. Also, please report bugs and errors (if any).'
                commandPrompt = `explain the provided code, regex or script in the most concise language and must use ${targetLangName} language! You may use Markdown. If the content is not code, return an error message. If the code has obvious errors, point them out.`
                contentPrompt = '```\n' + query.text + '\n```'
                break
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: Record<string, any> = {
        model: providerProps.apiModel || utils.defaultAPIModel,
        temperature: 0,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 1,
        presence_penalty: 1,
        stream: true,
    }

    const generateRequestParams = async (): Promise<RequestOptions> => {
        let apiURL = await utils.getApiURL(settings.provider)
        let apiURLPath = providerProps.apiURLPath
        let auth = false
        let eventStream = false
        let bodyType: BodyType = settings.provider === 'ChatGPT' ? 'ChatGPT' : 'OpenAI'
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }

        if (settings.provider === 'Azure' && providerProps.apiURLPath.indexOf('/chat/completions') < 0) {
            bodyType = 'Azure'
        }

        if (settings.provider === 'ThirdPartyChatGPT') {
            headers['path'] = 'v1/chat/completions'

            const index = apiURL.indexOf('/', 8)
            if (index < 0 || index === apiURL.length - 1) {
                apiURL = `${apiURL}${apiURLPath || utils.defaultProvidersProps['ThirdPartyChatGPT'].apiURLPath}`
            }

            const urlObj = new URL(apiURL)
            apiURL = urlObj.origin
            apiURLPath = urlObj.pathname
            auth = urlObj.searchParams.get('auth')?.toLocaleLowerCase() === 'true'

            eventStream = urlObj.searchParams.get('stream') === 'true'
            const mode = urlObj.searchParams.get('mode')?.toLowerCase() || ''
            if (mode) {
                for (let i = 0; i < bodyType.length; i++) {
                    const element = bodyTypes[i]
                    if (element.toLowerCase() === mode.toLowerCase()) {
                        bodyType = element
                        break
                    }
                }
            }
        }

        return { headers, apiURL, apiURLPath, bodyType: bodyType, auth, eventStream }
    }

    const { headers, apiURL, apiURLPath, bodyType: bodyType, auth, eventStream } = await generateRequestParams()
    let apiKey = settings.provider === 'ChatGPT' ? '' : await utils.getApiKey(settings.provider)

    if (!apiURL) {
        query.onError('Invalid API URL')
        return
    }

    let isChatAPI = true
    switch (bodyType) {
        case 'Azure':
            // Azure OpenAI Service supports multiple API.
            // We should check if the settings.apiURLPath is match `/deployments/{deployment-id}/chat/completions`.
            // If not, we should use the legacy parameters.
            isChatAPI = false
            body[
                'prompt'
            ] = `<|im_start|>system\n${rolePrompt}\n<|im_end|>\n<|im_start|>user\n${commandPrompt}\n${contentPrompt}\n<|im_end|>\n<|im_start|>assistant\n`
            body['stop'] = ['<|im_end|>']
            break
        case 'ChatGPT': {
            let resp: Response | null = null
            resp = await fetcher(utils.defaultChatGPTAPIAuthSession, { signal: query.signal })
            if (resp.status !== 200) {
                query.onError?.('Failed to fetch ChatGPT Web accessToken.')
                query.onStatusCode?.(resp.status)
                return
            }
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
                model: providerProps.apiModel, // 'text-davinci-002-render-sha'
                parent_message_id: utils.generateUUID(),
            }
            break
        }
        case 'AILink': {
            body = {
                temperature: 0,
                continuous: true,
                list: [
                    {
                        role: 'system',
                        content: rolePrompt,
                        isMe: true,
                    },
                    ...assistantPrompts.map((prompt) => {
                        return {
                            role: 'user',
                            content: prompt,
                            isMe: true,
                        }
                    }),
                    {
                        role: 'user',
                        content: commandPrompt,
                        isMe: true,
                    },
                    {
                        role: 'user',
                        content: contentPrompt,
                        isMe: true,
                    },
                    {
                        role: 'assistant',
                        content: '...',
                        isMe: false,
                    },
                ],
            }
            break
        }
        default: {
            if (bodyType === 'ProxiedOpenAI') {
                if (auth) {
                    const authCodeModel = await AuthCodeModelManager.getInstance(settings).get(apiURL)
                    if (!authCodeModel?.authCode) {
                        query.onError('Cannot obtain authentication code')
                        return
                    }

                    headers['x-auth-code'] = authCodeModel.authCode
                    body['model'] = authCodeModel.model
                } else {
                    body['model'] = defaultOpenAIModelDetail
                }
            }

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
            ]
            if (contentPrompt) {
                messages.push({
                    role: 'user',
                    content: contentPrompt,
                })
            }
            body['messages'] = messages
            break
        }
    }

    if (apiKey) {
        switch (settings.provider) {
            case 'OpenAI':
            case 'ChatGPT':
            case 'ThirdPartyChatGPT':
                headers['Authorization'] = `Bearer ${apiKey}`
                break

            case 'Azure':
                headers['api-key'] = `${apiKey}`
                break
        }
    } else if (utils.requiredApiKeysProviders.includes(settings.provider) && providerProps.subscriptionLinks === '') {
        query.onError('An API Key must be provided')
        return
    }

    const removeUnreachableService = () => {
        if (settings.provider !== 'ThirdPartyChatGPT' || (!auth && !providerProps.subscriptionLinks)) {
            return
        }

        // remove authCode
        if (bodyType === 'ProxiedOpenAI' && auth) {
            return AuthCodeModelManager.getInstance(settings).remove(apiURL)
        }

        const apiURLs = providerProps.apiURL?.split(',').filter((s) => !s.startsWith(apiURL)) || []
        providerProps.apiURL = apiURLs.join(',') || ''

        settings.providersProps[settings.provider] = providerProps
        utils.setSettings(settings)
    }

    const extractTextWithRegex = (text: string, regex: RegExp, index: number, sep = '') => {
        if (!text) return ''

        index || (index = 1)
        let match: RegExpExecArray | null
        const contents: string[] = []
        try {
            while ((match = regex.exec(text)) !== null) {
                contents.push(match[index])
            }
        } catch {
            console.log(`invalid regex: ${regex}`)
        }

        return contents.join(sep)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commonHandleError = (err: any, regex: RegExp | null = null, index = 1) => {
        if (err instanceof Error) {
            query.onError(err.message)
            return
        }
        if (typeof err === 'string') {
            if (regex && index >= 0) {
                const errorMessage = extractTextWithRegex(err, regex, index) || err
                query.onError(errorMessage)
            } else {
                query.onError(err)
            }

            return
        }
        if (typeof err === 'object') {
            const { detail } = err
            if (detail) {
                const { message } = detail
                if (message) {
                    query.onError(message)
                    return
                }
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
            query.onError(JSON.stringify(err))
            return
        }
        query.onError('Unknown error')
    }

    switch (settings.provider) {
        case 'ChatGPT': {
            const url = `${apiURL}${apiURLPath}`
            let conversationId = ''
            let length = 0
            await fetchSSE(`${url}/conversation`, {
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
                    commonHandleError(err)
                },
            })

            if (conversationId) {
                await fetcher(`${url}/conversation/${conversationId}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ is_visible: false }),
                })
            }
            break
        }
        case 'ThirdPartyChatGPT': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const handleError = (err: any) => {
                // process error
                commonHandleError(err, /"message":(?:\s+)?"(.*?)"/g, 1)

                // remove unavailable service
                removeUnreachableService()
            }

            const url = `${apiURL}${apiURLPath}`

            if (eventStream) {
                await fetchSSE(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                    signal: query.signal,
                    onMessage: (msg) => {
                        try {
                            const resp = JSON.parse(msg)
                            const { choices } = resp
                            if (!choices || choices.length === 0) {
                                return { error: 'No result' }
                            }
                            const { finish_reason: finishReason } = choices[0]
                            if (finishReason) {
                                query.onFinish(finishReason)
                                return
                            }

                            const { content = '', role } = choices[0].delta
                            const targetTxt = quoteProcessor ? quoteProcessor.processText(content) : content
                            query.onMessage({ content: targetTxt, role, isWordMode })
                            // eslint-disable-next-line no-empty
                        } catch {
                            query.onFinish('stop')
                            return
                        }
                    },
                    onError: (err) => {
                        commonHandleError(err)
                    },
                })
                return
            }

            try {
                const resp = await fetcher(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                    signal: query.signal,
                })

                if (!resp || resp.status !== 200 || resp.redirected) {
                    const error = resp.redirected ? `Invalid API URL: ${url}` : await resp?.text()
                    return handleError(error)
                }

                const content: string = (await resp.text()) || ''
                let data, valid, targetTxt: string

                try {
                    // Content-Type: application/octet-stream
                    const lastIndex = content.lastIndexOf('\n', content.length - 2)
                    const message = lastIndex === -1 ? content : content.substring(lastIndex)
                    data = JSON.parse(message)
                    valid = data && typeof data === 'object'
                } catch {
                    valid = false
                }

                if (!valid) {
                    if (content?.match(/"error":(\s+)?{/g)) {
                        return handleError(content)
                    }

                    // Content-Type: plain/text
                    if (content?.match(/"role":(\s+)?".*",(\s+)?"id":(\s+)?"[A-Za-z0-9\\-]+"/)) {
                        const regex = /"text":(?:\s+)?"([\s\S]*?)"/g
                        targetTxt = extractTextWithRegex(content, regex, 1) || ''
                    } else {
                        const regex = /"delta":(?:\s+)?{"content":(?:\s+)?"([\s\S]*?)"/g
                        // extract, then remove first and last double quote or backslash
                        targetTxt =
                            (extractTextWithRegex(content, regex, 1) || content)?.replace(/^["\\](.*)["\\]$/, '$1') ||
                            ''
                    }
                    if (!targetTxt) {
                        return { error: 'No result' }
                    }
                } else {
                    targetTxt = data.text || ''
                    if (!targetTxt) {
                        return handleError(data)
                    }
                }

                targetTxt = quoteProcessor ? quoteProcessor.processText(targetTxt) : targetTxt
                query.onMessage({ content: targetTxt, role: '', isWordMode, isFullText: true })
                query.onFinish('stop')
            } catch (error) {
                handleError(error)
            }
            break
        }
        default: {
            const url = urlJoin(apiURL, apiURLPath)
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
                    commonHandleError(err)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const postProcess = async (error: Record<string, any>) => {
                        try {
                            if (
                                settings.provider === 'OpenAI' &&
                                (error?.type === 'insufficient_quota' ||
                                    error?.type === 'invalid_request_error' ||
                                    error?.code === 'invalid_api_key')
                            ) {
                                let existApiKeys = (providerProps.apiKeys ?? '')
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter((s) => s !== '' && s !== apiKey)

                                if (existApiKeys.length === 0 && providerProps.subscriptionLinks) {
                                    const subscriptions = providerProps.subscriptionLinks.split(',')
                                    let newApiKeys =
                                        (await batchSubscribeApiKeys(subscriptions, query.signal))?.flat() || []

                                    // due to chrome sync.storage limitation, up to 100 candidate apiKeys are kept
                                    if (newApiKeys.length > 100 && !isDesktopApp()) {
                                        // shuffle
                                        let currentIndex = newApiKeys.length,
                                            randomIndex
                                        while (currentIndex !== 0) {
                                            // pick a remaining element.
                                            randomIndex = Math.floor(Math.random() * currentIndex)
                                            currentIndex--
                                            // swap it with the current element.
                                            ;[newApiKeys[currentIndex], newApiKeys[randomIndex]] = [
                                                newApiKeys[randomIndex],
                                                newApiKeys[currentIndex],
                                            ]
                                        }

                                        newApiKeys = newApiKeys.slice(0, 100)
                                    }

                                    const apiKeySet = new Set<string>(newApiKeys)
                                    const validateUrl = `${apiURL}${providerProps.apiURLPath}`
                                    existApiKeys = (await filterApiKeys(validateUrl, apiKeySet, query.signal, 20)) || []
                                }

                                providerProps.apiKeys = existApiKeys?.join(',') || ''
                                settings.providersProps[settings.provider] = providerProps
                                utils.setSettings(settings)
                            } else {
                                removeUnreachableService()
                            }
                        } catch (error) {
                            console.error(error)
                        }
                    }

                    if (typeof err === 'object' && err?.error) {
                        const { error } = err
                        postProcess(error)
                    }
                },
            })
        }
    }
}
