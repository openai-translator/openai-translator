/* eslint-disable camelcase */
import { v4 as uuidv4 } from 'uuid'
import { getLangConfig, getLangName, LangCode } from '../common/lang'
import { Action } from './internal-services/db'
import { codeBlock, oneLine, oneLineTrim } from 'common-tags'
import { getEngine } from './engines'
import { getSettings } from './utils'

export type TranslateMode = 'translate' | 'polishing' | 'summarize' | 'analyze' | 'explain-code' | 'big-bang'
export type APIModel =
    | 'gpt-3.5-turbo-1106'
    | 'gpt-3.5-turbo'
    | 'gpt-3.5-turbo-0301'
    | 'gpt-3.5-turbo-0613'
    | 'gpt-3.5-turbo-16k'
    | 'gpt-3.5-turbo-16k-0613'
    | 'gpt-4'
    | 'gpt-4-0314'
    | 'gpt-4-0613'
    | 'gpt-4-32k'
    | 'gpt-4-32k-0314'
    | 'gpt-4-32k-0613'
    | string

interface BaseTranslateQuery {
    text: string
    writing?: boolean
    selectedWord?: string
    detectFrom: LangCode
    detectTo: LangCode
    mode?: Exclude<TranslateMode, 'big-bang'>
    action: Action
    onMessage: (message: { content: string; role: string; isWordMode: boolean; isFullText?: boolean }) => Promise<void>
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

export async function translate(query: TranslateQuery) {
    let rolePrompt = ''
    let commandPrompt = ''
    let contentPrompt = query.text
    let isWordMode = false

    if (query.mode === 'big-bang') {
        rolePrompt = oneLine`
        You are a professional writer
        and you will write ${query.articlePrompt}
        based on the given words`
        commandPrompt = oneLine`
        Write ${query.articlePrompt} of no more than 160 words.
        The article must contain the words in the following text.
        The more words you use, the better`
    } else {
        const sourceLangCode = query.detectFrom
        const targetLangCode = query.detectTo
        const sourceLangName = getLangName(sourceLangCode)
        const targetLangName = getLangName(targetLangCode)
        console.debug('sourceLang', sourceLangName)
        console.debug('targetLang', targetLangName)
        const toChinese = chineseLangCodes.indexOf(targetLangCode) >= 0
        const targetLangConfig = getLangConfig(targetLangCode)
        const sourceLangConfig = getLangConfig(sourceLangCode)
        console.debug('Source language is', sourceLangConfig)
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
                    contentPrompt = query.text
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
                    commandPrompt =
                        `(Requirements: The output format must be ${query.action.outputRenderingFormat}) ` +
                        commandPrompt
                }
                break
            case 'translate':
                commandPrompt = targetLangConfig.genCommandPrompt(sourceLangConfig)
                contentPrompt = query.text
                if (!query.writing && query.text.length < 5 && toChinese) {
                    // 当用户的默认语言为中文时，查询中文词组（不超过5个字），展示多种翻译结果，并阐述适用语境。
                    rolePrompt = codeBlock`
                    ${oneLineTrim`
                    你是一个翻译引擎，
                    请将给到的文本翻译成${targetLangName}。
                    请列出3种（如果有）最常用翻译结果：单词或短语，
                    并列出对应的适用语境（用中文阐述）、音标或转写、词性、双语示例。
                    按照下面格式用中文阐述：`}
                        ${oneLineTrim`
                        <序号><单词或短语> · /<${targetLangConfig.phoneticNotation}>/
                        `}
                        [<词性缩写>] <适用语境（用中文阐述）>
                        例句：<例句>(例句翻译)
                    `
                    commandPrompt = ''
                }
                if (!query.writing && isAWord(sourceLangCode, query.text.trim())) {
                    isWordMode = true
                    if (toChinese) {
                        // 单词模式，可以更详细的翻译结果，包括：音标、词性、含义、双语示例。
                        rolePrompt = codeBlock`
                        ${oneLineTrim`
                        你是一个翻译引擎，请翻译给出的文本，只需要翻译不需要解释。
                        当且仅当文本只有一个单词时，
                        请给出单词原始形态（如果有）、
                        单词的语种、
                        ${targetLangConfig.phoneticNotation && '对应的音标或转写、'}
                        所有含义（含词性）、
                        双语示例，至少三条例句。
                        如果你认为单词拼写错误，请提示我最可能的正确拼写，
                        否则请严格按照下面格式给到翻译结果：
                        `}
                            <单词>
                            [<语种>]· / ${targetLangConfig.phoneticNotation && `<${targetLangConfig.phoneticNotation}>`}
                            [<词性缩写>] <中文含义>]
                            例句：
                            <序号><例句>(例句翻译)
                            词源：
                            <词源>
                        `
                        commandPrompt = '好的，我明白了，请给我这个单词。'
                        contentPrompt = `单词是：${query.text}`
                    } else {
                        const isSameLanguage = sourceLangCode === targetLangCode
                        rolePrompt = codeBlock`${oneLine`
                            You are a professional translation engine.
                            Please translate the text into ${targetLangName} without explanation.
                            When the text has only one word,
                            please act as a professional
                            ${sourceLangName}-${targetLangName} dictionary,
                            and list the original form of the word (if any),
                            the language of the word,
                            ${
                                targetLangConfig.phoneticNotation &&
                                'the corresponding phonetic notation or transcription, '
                            }
                            all senses with parts of speech,
                            ${isSameLanguage ? '' : 'bilingual '}
                            sentence examples (at least 3) and etymology.
                            If you think there is a spelling mistake,
                            please tell me the most possible correct word
                            otherwise reply in the following format:
                            `}
<word> (<original form>)
${oneLine`
[<language>]· /
${targetLangConfig.phoneticNotation && `<${targetLangConfig.phoneticNotation}>`}
`}
${oneLine`
[<part of speech>]
${isSameLanguage ? '' : '<translated meaning> / '}
<meaning in source language>
`}
Examples:
<index>. <sentence>(<sentence translation>)
Etymology:
<etymology>`
                        commandPrompt = 'I understand. Please give me the word.'
                        contentPrompt = `The word is: ${query.text}`
                    }
                }
                if (!query.writing && query.selectedWord) {
                    rolePrompt = codeBlock`
${oneLine`
You are an expert in the semantic syntax of the ${sourceLangName} language,
and you are teaching me the ${sourceLangName} language.
I will give you a sentence in ${sourceLangName} and a word from that sentence.
${
    sourceLangConfig.phoneticNotation &&
    'Firstly, provide the corresponding phonetic notation or transcription of the word in ' + sourceLangName + '.'
}
Then, help me explain in ${targetLangName} what the word means in the sentence, what the sentence itself means,
and whether the word is part of an idiom in the sentence. If it is, explain the idiom in the sentence.
Provide 3 to 5 examples in ${sourceLangName} with the same meaning, and explain these examples in ${targetLangName}.
The answer should follow the format below:
`}

${oneLine`<word> · /${sourceLangConfig.phoneticNotation && `<${sourceLangConfig.phoneticNotation}>`}/ `}
${oneLine`<the remaining part>`}

If you understand, say "yes", and then we will begin.`
                    commandPrompt = 'Yes, I understand. Please give me the sentence and the word.'
                    contentPrompt = `the sentence is: ${query.text}\n\nthe word is: ${query.selectedWord}`
                }
                break
            case 'polishing':
                rolePrompt = 'You are an expert translator, translate directly without explanation.'
                commandPrompt = `Please edit the following sentences in ${sourceLangName} to improve clarity, conciseness, and coherence, making them match the expression of native speakers.`
                contentPrompt = query.text
                break
            case 'summarize':
                rolePrompt =
                    "You are a professional text summarizer, you can only summarize the text, don't interpret it."
                commandPrompt = oneLine`
                Please summarize this text in the most concise language
                and must use ${targetLangName} language!`
                contentPrompt = query.text
                break
            case 'analyze':
                rolePrompt = 'You are a professional translation engine and grammar analyzer.'
                commandPrompt = oneLine`
                Please translate this text to ${targetLangName}
                and explain the grammar in the original text using ${targetLangName}.`
                contentPrompt = query.text
                break
            case 'explain-code':
                rolePrompt =
                    'You are a code explanation engine that can only explain code but not interpret or translate it. Also, please report bugs and errors (if any).'
                commandPrompt = oneLine`
                explain the provided code,
                regex or script in the most concise language
                and must use ${targetLangName} language!
                You may use Markdown.
                If the content is not code,
                return an error message.
                If the code has obvious errors, point them out.`
                contentPrompt = '```\n' + query.text + '\n```'
                break
        }
    }

    if (contentPrompt) {
        commandPrompt = `Only reply the result and nothing else. ${commandPrompt}:\n\n${contentPrompt.trimEnd()}`
    }

    const settings = await getSettings()

    const engine = getEngine(settings.provider)
    await engine.sendMessage({
        signal: query.signal,
        rolePrompt,
        commandPrompt,
        onMessage: async (message) => {
            await query.onMessage({ ...message, isWordMode })
        },
        onFinished: (reason) => {
            query.onFinish(reason)
        },
        onError: (error) => {
            query.onError(error)
        },
        onStatusCode: (statusCode) => {
            query.onStatusCode?.(statusCode)
        },
    })
}
