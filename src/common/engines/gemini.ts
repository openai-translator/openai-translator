/* eslint-disable camelcase */
import { fetchSSE, getSettings } from '../utils'
import { IEngine, IMessageRequest, IModel } from './interfaces'

const SAFETY_SETTINGS = [
    {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
    },
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
]

export class Gemini implements IEngine {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listModels(apiKey_: string | undefined): Promise<IModel[]> {
        return [
            {
                id: 'gemini-pro',
                name: 'gemini-pro',
            },
        ]
    }

    async sendMessage(req: IMessageRequest): Promise<void> {
        const settings = await getSettings()
        const apiKey = settings.geminiAPIKey
        const model = settings.geminiAPIModel
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`
        const headers = {
            'Content-Type': 'application/json',
        }
        const body = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: req.commandPrompt,
                        },
                    ],
                },
                {
                    role: 'model',
                    parts: [
                        {
                            text: req.rolePrompt,
                        },
                    ],
                },
                {
                    role: 'user',
                    parts:
                        req.assistantPrompts?.map((prompt) => ({
                            text: prompt,
                        })) ?? [],
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
            useJSONParser: true,
            onMessage: async (msg) => {
                if (finished) return
                let resp
                try {
                    resp = JSON.parse(msg)
                } catch (e) {
                    req.onError(JSON.stringify(e))
                    hasError = true
                    finished = true
                    return
                }
                if (!resp.candidates || resp.candidates.length === 0) {
                    req.onError('no candidates')
                    hasError = true
                    finished = true
                    return
                }
                const targetTxt = resp.candidates[0].content.parts[0].text
                await req.onMessage({ content: targetTxt, role: '' })
                if (resp.candidates[0].finishReason !== 'STOP') {
                    req.onFinished(resp.candidates[0].finishReason)
                    finished = true
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

        if (!finished && !hasError) {
            req.onFinished('stop')
        }
    }
}
