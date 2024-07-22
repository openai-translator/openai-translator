/* eslint-disable camelcase */
import { getUniversalFetch } from '@/common/universal-fetch'
import { fetchSSE, getSettings, isDesktopApp, setSettings } from '@/common/utils'
import { AbstractEngine } from '@/common/engines/abstract-engine'
import { IModel, IMessageRequest } from '@/common/engines/interfaces'

export const keyKimiAccessToken = 'kimi-access-token'
export const keyKimiRefreshToken = 'kimi-refresh-token'

export class Kimi extends AbstractEngine {
    async checkLogin(): Promise<boolean> {
        const fetcher = getUniversalFetch()

        const headers = await this.getHeaders()

        const resp = await fetcher('https://kimi.moonshot.cn/api/user', {
            method: 'GET',
            headers,
        })

        return resp.status === 200
    }

    async getModel(): Promise<string> {
        return ''
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listModels(_apiKey: string | undefined): Promise<IModel[]> {
        return []
    }

    async getHeaders() {
        const settings = await getSettings()
        let accessToken = settings.kimiAccessToken

        if (!isDesktopApp()) {
            const browser = (await import('webextension-polyfill')).default
            const config = await browser.storage.local.get([keyKimiAccessToken])
            accessToken = config[keyKimiAccessToken]
        }

        // generate traffic id like clg4susodhsh25d6vdhv
        const trafficID = Array.from({ length: 20 }, () => Math.floor(Math.random() * 36).toString(36)).join('')

        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36 Edg/91.0.864.41',
            'Origin': 'https://kimi.moonshot.cn',
            'Referer': 'https://kimi.moonshot.cn/',
            'X-Traffic-Id': trafficID,
        }
    }

    async sendMessage(req: IMessageRequest): Promise<void> {
        const settings = await getSettings()
        const fetcher = getUniversalFetch()

        req.onStatusCode?.(200)

        const headers = await this.getHeaders()

        let createChatResp = await fetcher('https://kimi.moonshot.cn/api/chat', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Kimi',
                is_example: false,
            }),
        })

        if (createChatResp.status === 401) {
            if (isDesktopApp() && settings.kimiRefreshToken) {
                headers['Authorization'] = `Bearer ${settings.kimiRefreshToken}`
                const refreshResp = await fetcher('https://kimi.moonshot.cn/api/auth/token/refresh', {
                    method: 'GET',
                    headers,
                })
                req.onStatusCode?.(refreshResp.status)
                if (refreshResp.status === 200) {
                    const data = await refreshResp.json()
                    headers['Authorization'] = `Bearer ${data.access_token}`
                    await setSettings({
                        ...settings,
                        kimiRefreshToken: data.refresh_token,
                        kimiAccessToken: data.access_token,
                    })
                    createChatResp = await fetcher('https://kimi.moonshot.cn/api/chat', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            name: 'Kimi',
                            is_example: false,
                        }),
                    })
                    req.onStatusCode?.(createChatResp.status)
                } else {
                    const jsn = (await createChatResp.json()) as {
                        message: string
                    }
                    req.onError('Kimi: ' + jsn.message)
                    return
                }
            } else {
                req.onStatusCode?.(createChatResp.status)
                const jsn = (await createChatResp.json()) as {
                    message: string
                }
                req.onError('Kimi: ' + jsn.message)
                return
            }
        }

        const chatJsn = (await createChatResp.json()) as {
            id: string
        }

        const chatID = chatJsn.id

        const messages = [
            {
                role: 'user',
                content: req.rolePrompt ? req.rolePrompt + '\n\n' + req.commandPrompt : req.commandPrompt,
            },
        ]

        let hasError = false
        let finished = false
        await fetchSSE(`https://kimi.moonshot.cn/api/chat/${chatID}/completion/stream`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                messages,
                refs: [],
                user_search: true,
            }),
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
                if (resp.event !== 'cmpl') {
                    if (resp.event === 'all_done') {
                        finished = true
                        req.onFinished('stop')
                        return
                    }
                    return
                }
                await req.onMessage({ content: resp.text, role: '' })
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
