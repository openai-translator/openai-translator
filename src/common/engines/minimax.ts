/* eslint-disable camelcase */
import { fetchSSE, getSettings } from '../utils'
import { IEngine, IMessageRequest, IModel } from './interfaces'

export class MiniMax implements IEngine {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listModels(apiKey_: string | undefined): Promise<IModel[]> {
        return [
            {
                id: 'abab5.5-chat',
                name: 'abab5.5-chat',
            },
        ]
    }

    async sendMessage(req: IMessageRequest): Promise<void> {
        const settings = await getSettings()
        const apiKey = settings.miniMaxAPIKey
        const url = `https://api.minimax.chat/v1/text/chatcompletion_pro?GroupId=${settings.miniMaxGroupID}`
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        }
        const body = {
            model: 'abab5.5-chat',
            tokens_to_generate: 1024,
            temperature: 0.9,
            top_p: 0.95,
            stream: true,
            reply_constraints: {
                sender_type: 'BOT',
                sender_name: 'MM智能助理',
            },
            sample_messages: [],
            plugins: [],
            messages: [
                {
                    sender_type: 'USER',
                    sender_name: '用户',
                    text: req.rolePrompt,
                },
                {
                    sender_type: 'USER',
                    sender_name: '用户',
                    text: req.commandPrompt,
                },
            ],
            bot_setting: [
                {
                    bot_name: 'MM智能助理',
                    content:
                        'MM智能助理是一款由MiniMax自研的，没有调用其他产品的接口的大型语言模型。MiniMax是一家中国科技公司，一直致力于进行大模型相关的研究。',
                },
            ],
        }
        let finished = false
        await fetchSSE(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: req.signal,
            onMessage: (msg) => {
                if (finished) return
                let resp
                try {
                    resp = JSON.parse(msg)
                    // eslint-disable-next-line no-empty
                } catch {
                    req.onFinished('stop')
                    finished = true
                    return
                }

                const { choices } = resp
                if (!choices || choices.length === 0) {
                    return { error: 'No result' }
                }
                const { finish_reason: finishReason } = choices[0]
                if (finishReason) {
                    req.onFinished(finishReason)
                    finished = true
                    return
                }

                for (const msg of choices[0].messages) {
                    const targetTxt = msg.text

                    req.onMessage({ content: targetTxt, role: '' })
                }
            },
            onError: (err) => {
                if (err instanceof Error) {
                    req.onError(err.message)
                    return
                }
                if (typeof err === 'string') {
                    req.onError(err)
                    return
                }
                if (typeof err === 'object') {
                    const { detail } = err
                    if (detail) {
                        req.onError(detail)
                        return
                    }
                }
                const { error } = err
                if (error instanceof Error) {
                    req.onError(error.message)
                    return
                }
                if (typeof error === 'object') {
                    const { message } = error
                    if (message) {
                        if (typeof message === 'string') {
                            req.onError(message)
                        } else {
                            req.onError(JSON.stringify(message))
                        }
                        return
                    }
                }
                req.onError('Unknown error')
            },
        })
    }
}
