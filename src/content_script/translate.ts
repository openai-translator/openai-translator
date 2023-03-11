/* eslint-disable camelcase */
import * as utils from '../common/utils'
import * as lang from './lang'
import { fetchSSE } from './utils'

export type TranslateMode = 'translate' | 'polishing' | 'summarize' | 'analyze' | 'explain-code'

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
    const fromChinese = chineseLangs.indexOf(query.detectFrom) >= 0
    const toChinese = chineseLangs.indexOf(query.detectTo) >= 0
    let systemPrompt = 'Eres un motor de traducción que solo puede traducir texto y no interpretarlo.'
    let assistantPrompt = `traducir desde ${lang.langMap.get(query.detectFrom) || query.detectFrom} a ${
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
                }
            }
            break
        case 'polishing':
            systemPrompt = 'Revise las siguientes oraciones para que sean más claras, concisas y coherentes.'
            if (fromChinese) {
                assistantPrompt = `使用 ${lang.langMap.get(query.detectFrom) || query.detectFrom} 语言润色此段文本`
            } else {
                assistantPrompt = `Pulir este texto en  ${lang.langMap.get(query.detectFrom) || query.detectFrom}`
            }
            break
        case 'summarize':
            systemPrompt = 'Eres un resumidor de texto, solo puedes resumir el texto, no interpretarlo.'
            if (toChinese) {
                assistantPrompt = '用最简洁的语言使用中文总结此段文本'
            } else {
                assistantPrompt = `Lo siento, no puedo traducir sin un texto específico para trabajar. Por favor proporcione el texto que desea traducir. ${
                    lang.langMap.get(query.detectTo) || query.detectTo
                } language!`
            }
            break
        case 'analyze':
            systemPrompt = 'Eres un motor de traducción y analizador gramatical.'
            if (toChinese) {
                assistantPrompt = `请用中文翻译此段文本并解析原文中的语法`
            } else {
                assistantPrompt = `translate this text to ${
                    lang.langMap.get(query.detectTo) || query.detectTo
                } and explain the grammar in the original text using ${
                    lang.langMap.get(query.detectTo) || query.detectTo
                }`
            }
            break
        case 'explain-code':
            systemPrompt =
                'Eres un motor de explicación de código, solo puedes explicar el código, no interpretarlo ni traducirlo. Además, por favor informa cualquier error que encuentres en el código al autor del mismo.'
            if (toChinese) {
                assistantPrompt =
                    '用最简洁的语言使用中文解释此段代码、正则表达式或脚本。如果内容不是代码，请返回错误提示。如果代码有明显的错误，请指出。'
            } else {
                assistantPrompt = `Explicar el código, regex o script proporcionado en el lenguaje más conciso y obligatoriamente utilizar. ${
                    lang.langMap.get(query.detectTo) || query.detectTo
                } ¡Lenguaje! Si el contenido no es código, devuelve un mensaje de error. Si el código tiene errores obvios, señálalos.`
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
                role: 'user',
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
