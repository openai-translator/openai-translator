/* eslint-disable camelcase */
import * as utils from '../common/utils'
import * as lang from './lang'
import { fetchSSE } from './utils'

export type TranslateMode = 'translate' | 'polishing' | 'summarize' | 'analyze' | 'explain-code'
export type Provider = 'OpenAI' | 'Azure'

export interface TranslateQuery {
    text: string
    selectedWord: string
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
    const trimFirstQuotation = !query.selectedWord
    const settings = await utils.getSettings()
    const fromChinese = chineseLangs.indexOf(query.detectFrom) >= 0
    const toChinese = chineseLangs.indexOf(query.detectTo) >= 0
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
                }
            }
            if (query.selectedWord) {
                // 在选择的句子中，选择特定的单词。触发语境学习功能。
                systemPrompt = `你是一位${
                    lang.langMap.get(query.detectFrom) || query.detectFrom
                }词义语法专家，你在教我${lang.langMap.get(query.detectFrom) || query.detectFrom}，我给你一句${
                    lang.langMap.get(query.detectFrom) || query.detectFrom
                }句子，和这个句子中的一个单词，请用${
                    lang.langMap.get(query.detectTo) || query.detectTo
                }帮我解释一下，这个单词在句子中的意思和句子本身的意思,如果单词在这个句子中是习话的一部分，请解释这句句子中的习话，并举几个相同意思的${
                    lang.langMap.get(query.detectFrom) || query.detectFrom
                }例句,并用${
                    lang.langMap.get(query.detectTo) || query.detectTo
                }解释例句。如果你明白了请说同意，然后我们开始。`
                assistantPrompt = '好的，我明白了，请给我这个句子和单词。'
                query.text = `句子是：${query.text}\n单词是：${query.selectedWord}`
            }
            break
        case 'polishing':
            systemPrompt = 'Revise the following sentences to make them more clear, concise, and coherent.'
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
                assistantPrompt = `summarize this text in the most concise language and must use ${
                    lang.langMap.get(query.detectTo) || query.detectTo
                } language!`
            }
            break
        case 'analyze':
            systemPrompt = 'You are a translation engine and grammar analyzer.'
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
                'You are a code explanation engine, you can only explain the code, do not interpret or translate it. Also, please report any bugs you find in the code to the author of the code.'
            if (toChinese) {
                assistantPrompt =
                    '用最简洁的语言使用中文解释此段代码、正则表达式或脚本。如果内容不是代码，请返回错误提示。如果代码有明显的错误，请指出。'
            } else {
                assistantPrompt = `explain the provided code, regex or script in the most concise language and must use ${
                    lang.langMap.get(query.detectTo) || query.detectTo
                } language! If the content is not code, return an error message. If the code has obvious errors, point them out.`
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
        stream: true,
    }

    const apiKey = await utils.getApiKey()
    const headers = {
        'Content-Type': 'application/json',
    }

    switch (settings.provider) {
        case 'OpenAI':
            headers['Authorization'] = `Bearer ${apiKey}`
            body['messages'] = [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: assistantPrompt,
                },
                { role: 'user', content: `"${query.text}"` },
            ]
            break

        case 'Azure':
            headers['api-key'] = `${apiKey}`
            body[
                'prompt'
            ] = `<|im_start|>system\n${systemPrompt}\n<|im_end|>\n<|im_start|>user\n${assistantPrompt}\n${query.text}\n<|im_end|>\n<|im_start|>assistant\n`
            body['stop'] = ['<|im_end|>']
            break
    }

    let isFirst = true

    await fetchSSE(`${settings.apiURL}${settings.apiURLPath}`, {
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
            switch (settings.provider) {
                case 'OpenAI': {
                    const { content = '', role } = choices[0].delta
                    targetTxt = content

                    if (trimFirstQuotation && isFirst && targetTxt && ['“', '"', '「'].indexOf(targetTxt[0]) >= 0) {
                        targetTxt = targetTxt.slice(1)
                    }

                    if (!role) {
                        isFirst = false
                    }

                    query.onMessage({ content: targetTxt, role })
                    break
                }
                case 'Azure':
                    targetTxt = choices[0].text
                    console.log(resp)

                    if (trimFirstQuotation && isFirst && targetTxt && ['“', '"', '「'].indexOf(targetTxt[0]) >= 0) {
                        targetTxt = targetTxt.slice(1)
                    }

                    query.onMessage({ content: targetTxt, role: '' })
                    break
            }
        },
        onError: (err) => {
            const { error } = err
            query.onError(error.message)
        },
    })
}
