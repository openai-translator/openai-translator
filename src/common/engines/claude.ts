/* eslint-disable camelcase */
import { urlJoin } from 'url-join-ts'
import { CUSTOM_MODEL_ID } from '../constants'
import { fetchSSE, getSettings } from '../utils'
import { AbstractEngine } from './abstract-engine'
import { IModel, IMessageRequest } from './interfaces'

export class Claude extends AbstractEngine {
    supportCustomModel(): boolean {
        return true
    }

    async getModel(): Promise<string> {
        const settings = await getSettings()
        if (settings.claudeAPIModel === CUSTOM_MODEL_ID) {
            return settings.claudeCustomModelName
        }
        return settings.claudeAPIModel
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listModels(apiKey_: string | undefined): Promise<IModel[]> {
        return Promise.resolve([
            {
                id: 'claude-3-5-sonnet-20240620',
                name: 'claude-3-5-sonnet-20240620',
            },
            {
                id: 'claude-3-sonnet-20240229',
                name: 'claude-3-sonnet-20240229',
            },
            {
                id: 'claude-3-opus-20240229',
                name: 'claude-3-opus-20240229',
            },
        ])
    }

    async sendMessage(req: IMessageRequest): Promise<void> {
        const settings = await getSettings()
        const apiKey = settings.claudeAPIKey
        const model = await this.getModel()
        const url = urlJoin(settings.claudeAPIURL, settings.claudeAPIURLPath)
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36 Edg/91.0.864.41',
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
            'anthropic-beta': 'messages-2023-12-15',
            'x-api-key': apiKey,
        }
        const body = {
            model,
            stream: true,
            max_tokens: 4096,
            temperature: 0,
            messages: [
                {
                    role: 'user',
                    content: req.rolePrompt ? req.rolePrompt + '\n\n' + req.commandPrompt : req.commandPrompt,
                },
            ],
        }

        let hasError = false
        let finished = false
        await fetchSSE(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: req.signal,
            onMessage: async (msg) => {
                if (finished) return
                let resp
                try {
                    resp = JSON.parse(msg)
                } catch (e) {
                    hasError = true
                    finished = true
                    req.onError(JSON.stringify(e))
                    return
                }
                const { type } = resp
                if (type === 'content_block_delta') {
                    const { delta } = resp
                    const { text } = delta
                    await req.onMessage({ content: text, role: '' })
                    return
                }
                if (type === 'message_stop') {
                    finished = true
                    req.onFinished('stop')
                    return
                }
                if (type === 'error') {
                    const { error } = resp
                    req.onError('Claude API response: ' + error.message)
                }
            },
            onError: (err) => {
                hasError = true
                if (err instanceof Error) {
                    req.onError(err.message)
                    return
                }
                if (typeof err === 'string') {
                    req.onError(err)
                    return
                }
                if (typeof err === 'object') {
                    const item = err[0]
                    if (item && item.error && item.error.message) {
                        req.onError(item.error.message)
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

        if (!finished && !hasError) {
            req.onFinished('stop')
        }
    }
}
