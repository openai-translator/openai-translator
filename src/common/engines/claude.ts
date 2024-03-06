import { CUSTOM_MODEL_ID } from '../constants'
import { fetchSSE, getSettings } from '../utils'
import { AbstractEngine } from './abstract-engine'
import { IMessageRequest, IModel } from './interfaces'


export class Claude extends AbstractEngine {
    supportCustomModel(): boolean {
        return true
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listModels(apiKey: string | undefined): Promise<IModel[]> {
        return [
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
            { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
            { id: 'claude-3-haiku-20240229', name: 'Claude 3 Haiku' },
            { id: 'phi', name: 'Phi-2' },
            { id: 'claude-2.1', name: 'Claude 2.1' },
            { id: 'claude-2.0', name: 'Claude 2.0' },
            { id: 'claude-instant-1.2', name: 'Claude Instant 1.2' },
        ]
    }

    async getModel(): Promise<string> {
        const settings = await getSettings()
        return settings.claudeAPIModel
    }

    async getAPIModel(): Promise<string> {
        const settings = await getSettings()
        if (settings.claudeAPIModel === CUSTOM_MODEL_ID) {
            return settings.claudeModelName
        }
        return settings.claudeAPIModel
    }

    async getAPIKey(): Promise<string> {
        const settings = await getSettings()
        return settings.claudeAPIKey
    }

    async getAPIURL(): Promise<string> {
        const settings = await getSettings()
        return settings.claudeAPIURL
    }

    async getAPIURLPath(): Promise<string> {
        const settings = await getSettings()
        return settings.claudeAPIURLPath
    }

    async sendMessage(req: IMessageRequest): Promise<void> {
        const settings = await getSettings()
        const model = await this.getModel()
        const apiKey = await this.getAPIKey()
        const url = await this.getAPIURL() + await this.getAPIURLPath()
        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': `${apiKey}`,
            'anthropic-version': '2023-06-01'
        }
        const body = {
            model,
            max_tokens: 1024,
            temperature: 0,
            top_p: 0.95,
            stream: true, 
            system: req.rolePrompt,      
            messages: [
                {"role": "user", "content": req.commandPrompt}
            ]
        }

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
                } catch (e: any) {             
                    req.onError?.(e?.message ?? msg + 'Cannot parse response JSON')
                    req.onFinished('stop')
                    finished = true
                    return
                }

                const { type:msgType,delta } = resp
                
                if (!delta) {
                    return
                }
                

                console.debug(msgType)
                if (msgType === 'message_delta') {
                    const {stop_reason : stopReason = ''}  = delta
                    if (stopReason === 'end_turn'){
                        req.onFinished('stop')
                        finished = true
                        return
                    }
                }else if (msgType == 'message_stop'){
                    req.onFinished('stop')
                    finished = true
                    return
                }
                else if (msgType === 'content_block_delta' && delta) {
                    const targetTxt = delta['text']
                    const role = 'assistant'
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
