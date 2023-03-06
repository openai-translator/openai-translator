/* eslint-disable camelcase */
import * as utils from '../common/utils'
import * as lang from './lang'
import { fetchSSE } from './utils'

export interface TranslateQuery {
    text: string
    detectFrom: string
    detectTo: string
    onMessage: (message: { content: string; role: string }) => void
    onError: (error: string) => void
    onFinish: (reason: string) => void
}

export interface TranslateResult {
    text?: string
    from?: string
    to?: string
    error?: string
}

export async function translate(query: TranslateQuery) {
    const apiKey = await utils.getApiKey()
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
    }
    let prompt = `translate from ${lang.langMap.get(query.detectFrom) || query.detectFrom} to ${lang.langMap.get(query.detectTo) || query.detectTo
        }`
    if (query.detectTo === 'wyw' || query.detectTo === 'yue') {
        prompt = `翻译成${lang.langMap.get(query.detectTo) || query.detectTo}`
    }
    const isZh =
        query.detectFrom === 'wyw' ||
        query.detectFrom === 'zh' ||
        query.detectFrom === 'zh-Hans' ||
        query.detectFrom === 'zh-Hant'
    if (isZh) {
        if (query.detectTo === 'zh-Hant') {
            prompt = '翻译成繁体白话文'
        } else if (query.detectTo === 'zh-Hans') {
            prompt = '翻译成简体白话文'
        } else if (query.detectTo === 'yue') {
            prompt = '翻译成粤语白话文'
        }
    }
    const isEmbellisher = query.detectFrom === query.detectTo
    if (isEmbellisher) {
        if (isZh) {
            prompt = '润色此句'
        } else {
            prompt = 'polish this sentence'
        }
    }
    prompt = `${prompt}:\n\n"${query.text}" =>`
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
                content: isEmbellisher
                    ? 'You are a text embellisher, you can only embellish the text, don\'t interpret it.'
                    : 'You are a translation engine that can only translate text and cannot interpret it.',
            },
            { role: 'user', content: prompt },
        ],
        stream: true,
    }

    let isFirst = true

    await fetchSSE('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
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

            if ((isFirst && targetTxt.startsWith('"')) || targetTxt.startsWith('「')) {
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
