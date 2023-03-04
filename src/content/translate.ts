/* eslint-disable camelcase */
import * as utils from '../utils'
import * as lang from './lang'

export interface TranslateQuery {
    text: string
    detectFrom: string
    detectTo: string
}

export interface TranslateResult {
    text?: string
    from?: string
    to?: string
    error?: string
}

export async function translate(query: TranslateQuery): Promise<TranslateResult> {
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
    if (
        query.detectFrom === 'wyw' ||
        query.detectFrom === 'zh-Hans' ||
        query.detectFrom === 'zh-Hant'
    ) {
        if (query.detectTo === 'zh-Hant') {
            prompt = '翻译成繁体白话文'
        } else if (query.detectTo === 'zh-Hans') {
            prompt = '翻译成简体白话文'
        } else if (query.detectTo === 'yue') {
            prompt = '翻译成粤语白话文'
        }
    }
    if (query.detectFrom === query.detectTo) {
        if (query.detectTo === 'zh-Hant' || query.detectTo === 'zh-Hans') {
            prompt = '润色此句'
        } else {
            prompt = 'polish this sentence'
        }
    }
    const body = {
        model: 'gpt-3.5-turbo',
        temperature: 0,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 1,
        presence_penalty: 1,
        messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: `"${query.text}"` },
        ],
    }

    // use fetch to request
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    })

    if (resp.status !== 200) {
        const { error } = await resp.json()
        return { error: error.message }
    }

    const { choices } = await resp.json()
    if (!choices || choices.length === 0) {
        return { error: 'No result' }
    }
    let targetTxt = choices[0].message.content.trim()

    if (targetTxt.startsWith('"') || targetTxt.startsWith('「')) {
        targetTxt = targetTxt.slice(1)
    }
    if (targetTxt.endsWith('"') || targetTxt.endsWith('」')) {
        targetTxt = targetTxt.slice(0, -1)
    }

    return {
        from: query.detectFrom,
        to: query.detectTo,
        text: targetTxt,
    }
}
