/* eslint-disable camelcase */
import { getSettings } from '../utils'
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
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
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

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        })

        const json = await response.json()

        if (response.status !== 200) {
            return req.onError(`${json.error.message}`)
        }
        const targetTxt = json.candidates[0].content.parts[0].text
        req.onMessage({ content: targetTxt, role: '' })
        req.onFinished('stop')
    }
}
