/* eslint-disable camelcase */
import { v4 as uuidv4 } from 'uuid'
import { getUniversalFetch } from '../universal-fetch'
import { IMessageRequest, IModel } from './interfaces'
import * as utils from '../utils'
import { codeBlock } from 'common-tags'
import { fetchSSE } from '../utils'
import { AbstractEngine } from './abstract-engine'

export class ChatGPT extends AbstractEngine {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listModels(apiKey_: string | undefined): Promise<IModel[]> {
        const fetcher = getUniversalFetch()
        const sessionResp = await fetcher(utils.defaultChatGPTAPIAuthSession, {
            cache: 'no-cache',
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) chatall/1.29.40 Chrome/114.0.5735.134 Safari/537.36',
            },
        })
        if (sessionResp.status !== 200) {
            try {
                const sessionRespJsn = await sessionResp.json()
                if (sessionRespJsn && sessionRespJsn.error) {
                    throw new Error(sessionRespJsn.error)
                }
                if (sessionRespJsn && sessionRespJsn.detail) {
                    throw new Error(`Failed to fetch ChatGPT Web accessToken: ${sessionRespJsn.detail}`)
                } else {
                    throw new Error(`Failed to fetch ChatGPT Web accessToken: ${sessionResp.statusText}`)
                }
            } catch {
                throw new Error(`Failed to fetch ChatGPT Web accessToken: ${sessionResp.statusText}`)
            }
        }
        const sessionRespJsn = await sessionResp.json()
        const headers: Record<string, string> = {
            Authorization: `Bearer ${sessionRespJsn.accessToken}`,
        }
        const modelsResp = await fetcher(`${utils.defaultChatGPTWebAPI}/models`, {
            cache: 'no-cache',
            headers,
        })
        const modelsRespJsn = await modelsResp.json()
        if (!modelsRespJsn) {
            return []
        }
        if (modelsResp.status !== 200) {
            if (modelsResp.status === 401) {
                throw new Error('ChatGPT is not login')
            }
            return []
        }
        const { models } = modelsRespJsn
        if (!models) {
            return []
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return models.map((model: any) => ({
            name: `${model.title} (${model.tags.join(', ')})`,
            description: model.description,
            id: model.slug,
        }))
    }

    async getModel(): Promise<string> {
        const settings = await utils.getSettings()
        return settings.chatgptModel
    }

    async sendMessage(req: IMessageRequest): Promise<void> {
        const model = await this.getModel()
        const fetcher = getUniversalFetch()
        let resp: Response | null = null
        resp = await fetcher(utils.defaultChatGPTAPIAuthSession, { signal: req.signal })
        if (resp.status !== 200) {
            try {
                const respJsn = await resp.json()
                if (respJsn && respJsn.detail) {
                    req.onError(`Failed to fetch ChatGPT Web accessToken: ${respJsn.detail}`)
                } else {
                    req.onError(`Failed to fetch ChatGPT Web accessToken: ${resp.statusText}`)
                }
            } catch {
                req.onError('Failed to fetch ChatGPT Web accessToken.')
            }
            req.onStatusCode?.(resp.status)
            return
        }
        const respJson = await resp?.json()
        const apiKey = respJson.accessToken
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        }
        const body = {
            action: 'next',
            messages: [
                {
                    id: uuidv4(),
                    role: 'user',
                    content: {
                        content_type: 'text',
                        parts: [
                            codeBlock`
                        ${req.rolePrompt}

                        ${req.commandPrompt}
                        `,
                        ],
                    },
                },
            ],
            model, // 'text-davinci-002-render-sha'
            parent_message_id: uuidv4(),
            history_and_training_disabled: true,
        }
        let finished = false
        let length = 0
        await fetchSSE(`${utils.defaultChatGPTWebAPI}/conversation`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: req.signal,
            onStatusCode: (status) => {
                req.onStatusCode?.(status)
            },
            onMessage: async (msg) => {
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

                if (resp.is_completion) {
                    req.onFinished('stop')
                    finished = true
                    return
                }

                if (!resp.message) {
                    if (resp.error) {
                        req.onError(`ChatGPT Web error: ${resp.error}`)
                    }
                    return
                }

                const { content, author } = resp.message
                if (author.role === 'assistant') {
                    const targetTxt = content.parts.join('')
                    const textDelta = targetTxt.slice(length)
                    length = targetTxt.length
                    await req.onMessage({ content: textDelta, role: '' })
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
                        const { message } = detail
                        if (message) {
                            req.onError(`ChatGPT Web: ${message}`)
                            return
                        }
                    }
                    req.onError(`ChatGPT Web: ${JSON.stringify(err)}`)
                    return
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
