/* eslint-disable camelcase */
import { getUniversalFetch } from '../universal-fetch'
import { fetchSSE, getSettings } from '../utils'
import { AbstractEngine } from './abstract-engine'
import { IMessageRequest, IModel } from './interfaces'

export class Cohere extends AbstractEngine {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listModels(apiKey: string | undefined): Promise<IModel[]> {
        if (!apiKey) {
            return []
        }
        const url = 'https://api.cohere.ai/v1/models'
        const fetcher = getUniversalFetch()
        const resp = await fetcher(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
        })
        if (!resp.ok) {
            throw new Error(`Failed to fetch models: ${resp.statusText}`)
        }
        const data = await resp.json()
        return (
            data.models
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((item: any) => {
                    return item.endpoints.includes('chat')
                })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((item: any) => {
                    return {
                        id: item.name,
                        name: item.name,
                    }
                })
        )
    }

    async getModel() {
        const settings = await getSettings()
        return settings.cohereAPIModel
    }

    async sendMessage(req: IMessageRequest): Promise<void> {
        const settings = await getSettings()
        const apiKey = settings.cohereAPIKey
        const model = await this.getModel()
        const url = 'https://api.cohere.ai/v1/chat'
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        }
        const body = {
            stream: true,
            model: model,
            chat_history: [],
            message: req.rolePrompt ? req.rolePrompt + '\n\n' + req.commandPrompt : req.commandPrompt,
        }

        let hasError = false
        let finished = false
        await fetchSSE(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: req.signal,
            isJSONStream: true,
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
                if (resp.is_finished) {
                    finished = true
                    req.onFinished('stop')
                    return
                }
                if (resp.event_type === 'text-generation') {
                    await req.onMessage({ content: resp.text, role: '' })
                    return
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
