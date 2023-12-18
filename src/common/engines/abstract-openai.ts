/* eslint-disable camelcase */
import { fetchSSE } from '../utils'
import { IEngine, IMessageRequest, IModel } from './interfaces'

export abstract class AbstractOpenAI implements IEngine {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listModels(apiKey_: string | undefined): Promise<IModel[]> {
        return [
            { name: 'gpt-3.5-turbo-1106', id: 'gpt-3.5-turbo-1106' },
            { name: 'gpt-3.5-turbo', id: 'gpt-3.5-turbo' },
            { name: 'gpt-3.5-turbo-0613', id: 'gpt-3.5-turbo-0613' },
            { name: 'gpt-3.5-turbo-0301', id: 'gpt-3.5-turbo-0301' },
            { name: 'gpt-3.5-turbo-16k', id: 'gpt-3.5-turbo-16k' },
            { name: 'gpt-3.5-turbo-16k-0613', id: 'gpt-3.5-turbo-16k-0613' },
            { name: 'gpt-4', id: 'gpt-4' },
            { name: 'gpt-4-1106-preview (recommended)', id: 'gpt-4-1106-preview' },
            { name: 'gpt-4-0314', id: 'gpt-4-0314' },
            { name: 'gpt-4-0613', id: 'gpt-4-0613' },
            { name: 'gpt-4-32k', id: 'gpt-4-32k' },
            { name: 'gpt-4-32k-0314', id: 'gpt-4-32k-0314' },
            { name: 'gpt-4-32k-0613', id: 'gpt-4-32k-0613' },
        ]
    }

    abstract getAPIModel(): Promise<string>
    abstract getAPIKey(): Promise<string>
    abstract getAPIURL(): Promise<string>
    abstract getAPIURLPath(): Promise<string>

    async getHeaders(): Promise<Record<string, string>> {
        const apiKey = await this.getAPIKey()
        return {
            'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) chatall/1.29.40 Chrome/114.0.5735.134 Safari/537.36',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        }
    }

    async isChatAPI(): Promise<boolean> {
        return true
    }

    async sendMessage(req: IMessageRequest): Promise<void> {
        const model = await this.getAPIModel()
        const url = `${await this.getAPIURL()}${await this.getAPIURLPath()}`
        const headers = await this.getHeaders()
        const isChatAPI = await this.isChatAPI()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: Record<string, any> = {
            model,
            temperature: 0,
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 1,
            presence_penalty: 1,
            stream: true,
        }
        if (!isChatAPI) {
            // Azure OpenAI Service supports multiple API.
            // We should check if the settings.apiURLPath is match `/deployments/{deployment-id}/chat/completions`.
            // If not, we should use the legacy parameters.
            body[
                'prompt'
            ] = `<|im_start|>system\n${req.rolePrompt}\n<|im_end|>\n<|im_start|>user\n${req.commandPrompt}\n<|im_end|>\n<|im_start|>assistant\n`
            body['stop'] = ['<|im_end|>']
        } else {
            const messages = [
                {
                    role: 'system',
                    content: req.rolePrompt,
                },
                ...(req.assistantPrompts?.map((prompt) => {
                    return {
                        role: 'user',
                        content: prompt,
                    }
                }) ?? []),
                {
                    role: 'user',
                    content: req.commandPrompt,
                },
            ]
            body['messages'] = messages
        }
        let finished = false // finished can be called twice because event.data is 1. "finish_reason":"stop"; 2. [DONE]
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
                    // eslint-disable-next-line no-empty, @typescript-eslint/no-explicit-any
                } catch (e: any) {
                    // avoid `Unexpected token 'D', "[DONE]" is not valid JSON`
                    if (msg.trim() !== '[DONE]') {
                        req.onError?.(e?.message ?? 'Cannot parse response JSON')
                    }

                    req.onFinished('stop')
                    finished = true
                    return
                }

                const { choices } = resp
                if (!choices || choices.length === 0) {
                    return
                }
                const { finish_reason: finishReason } = choices[0]
                if (finishReason) {
                    req.onFinished(finishReason)
                    finished = true
                    return
                }

                let targetTxt = ''
                if (!isChatAPI) {
                    // It's used for Azure OpenAI Service's legacy parameters.
                    targetTxt = choices[0].text

                    await req.onMessage({ content: targetTxt, role: '' })
                } else {
                    const { content = '', role } = choices[0].delta

                    targetTxt = content

                    await req.onMessage({ content: targetTxt, role })
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
