/* eslint-disable camelcase */
import * as utils from '../common/utils'
import * as lang from './lang'
import { fetchSSE } from './utils'

export type TranslateMode = 'translate' | 'polishing' | 'summarize'

export interface TranslateQuery {
    text: string
    detectFrom: string
    detectTo: string
    mode: TranslateMode
    onMessage: (message: { content: string; role: string }) => void
    onError: (error: string) => void
    onFinish: (reason: string) => void
    signal: AbortSignal
}

export interface TranslateResult {
    text?: string
    from?: string
    to?: string
    error?: string
}

const chineseLangs = ['zh-Hans', 'zh-Hant', 'wyw', 'yue']

export async function translate(query: TranslateQuery) {
    const settings = await utils.getSettings()
    const apiKey = await utils.getApiKey()
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    }
    const fromChinese = chineseLangs.indexOf(query.detectFrom) > 0
    const toChinese = chineseLangs.indexOf(query.detectTo) > 0
    let systemPrompt = 'You are a translation engine that can only translate text and cannot interpret it.'
    let assistantPrompt = `translate from ${lang.langMap.get(query.detectFrom) || query.detectFrom} to ${
        lang.langMap.get(query.detectTo) || query.detectTo
    }`
    switch (query.mode) {
        case 'translate':
            if (query.detectTo === 'wyw' || query.detectTo === 'yue') {
                assistantPrompt = `翻译成${lang.langMap.get(query.detectTo) || query.detectTo}`
            }
            if (fromChinese) {
                if (query.detectTo === 'zh-Hant') {
                    assistantPrompt = '翻譯成台灣常用用法之繁體中文白話文'
                } else if (query.detectTo === 'zh-Hans') {
                    assistantPrompt = '翻译成简体白话文'
                } else if (query.detectTo === 'yue') {
                    assistantPrompt = '翻译成粤语白话文'
                }
            }
            break
        case 'polishing':
            systemPrompt = "You are a text embellisher, you can only embellish the text, don't interpret it."
            if (fromChinese) {
                assistantPrompt = `使用 ${lang.langMap.get(query.detectFrom) || query.detectFrom} 语言润色此段文本`
            } else {
                assistantPrompt = `polish this text in ${lang.langMap.get(query.detectFrom) || query.detectFrom}`
            }
            break
        case 'summarize':
            systemPrompt = "You are a text summarizer, you can only summarize the text, don't interpret it."
            if (toChinese) {
                assistantPrompt = '用最简洁的语言使用中文总结此段文本'
            } else {
                assistantPrompt = `summarize this text in the most concise language and muse use ${
                    lang.langMap.get(query.detectTo) || query.detectTo
                } language!`
            }
            break
    }
    const body = {
        model: 'gpt-3.5-turbo',
        temperature: 0,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 1,
        presence_penalty: 1,
        messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            {
                role: 'assistant',
                content: assistantPrompt,
            },
            { role: 'user', content: `"${query.text}"` },
        ],
        stream: true,
    }

    let isFirst = true

    await fetchSSE(`${settings.apiURL}/v1/chat/completions`, {
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
            const { delta, finish_reason: finishReason } = choices[0]
            if (finishReason) {
                query.onFinish(finishReason)
                return
            }
            const { content = '', role } = delta
            let targetTxt = content

            if (isFirst && targetTxt && ['“', '"', '「'].indexOf(targetTxt[0]) >= 0) {
                targetTxt = targetTxt.slice(1)
            }

            if (!role) {
                isFirst = false
            }

            query.onMessage({ content: targetTxt, role })
        },
        onError: (err) => {
            const { error } = err
            query.onError(error.message)
        },
    })
}
