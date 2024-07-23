/* eslint-disable camelcase */
import { urlJoin } from 'url-join-ts'
import { getUniversalFetch } from '../universal-fetch'
import { fetchSSE, getSettings } from '../utils'
import { AbstractEngine } from './abstract-engine'
import { IMessageRequest, IModel } from './interfaces'
import qs from 'qs'

const SAFETY_SETTINGS = [
    {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
    },
    {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
    },
    {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
    },
    {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
    },
]

export class Gemini extends AbstractEngine {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listModels(apiKey: string | undefined): Promise<IModel[]> {
        if (!apiKey) {
            return []
        }
        const settings = await getSettings()
        const geminiAPIURL = settings.geminiAPIURL
        const url =
            urlJoin(geminiAPIURL, '/v1beta/models') +
            qs.stringify({ key: apiKey, pageSize: 1000 }, { addQueryPrefix: true })
        const fetcher = getUniversalFetch()
        const resp = await fetcher(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        const jsn = await resp.json()
        if (!jsn.models) {
            return []
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return jsn.models.map((model: any) => {
            const name = model.name.split('/').pop()
            return {
                id: name,
                name: name,
            }
        })
    }

    async getModel() {
        const settings = await getSettings()
        return settings.geminiAPIModel
    }

    async sendMessage(req: IMessageRequest): Promise<void> {
        const settings = await getSettings()
        const apiKey = settings.geminiAPIKey
        const geminiAPIURL = settings.geminiAPIURL
        const model = await this.getModel()
        const url =
            urlJoin(geminiAPIURL, '/v1beta/models/', `${model}:streamGenerateContent`) +
            qs.stringify({ key: apiKey }, { addQueryPrefix: true })
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36 Edg/91.0.864.41',
        }
        const body = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: req.rolePrompt ? req.rolePrompt + '\n\n' + req.commandPrompt : req.commandPrompt,
                        },
                    ],
                },
            ],
            safetySettings: SAFETY_SETTINGS,
        }

        let hasError = false
        let finished = false
        await fetchSSE(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: req.signal,
            usePartialArrayJSONParser: true,
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
                if (!resp.candidates || resp.candidates.length === 0) {
                    hasError = true
                    finished = true
                    req.onError('no candidates')
                    return
                }
                if (resp.candidates[0].finishReason !== 'STOP') {
                    finished = true
                    req.onFinished(resp.candidates[0].finishReason)
                    return
                }
                const targetTxt = resp.candidates[0].content.parts[0].text
                await req.onMessage({ content: targetTxt, role: '' })
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
