/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable camelcase */
import { v4 as uuidv4 } from 'uuid'
import { getUniversalFetch } from '../universal-fetch'
import { IMessageRequest, IModel } from './interfaces'
import * as utils from '../utils'
import { AbstractEngine } from './abstract-engine'
import { chatgptArkoseReqParams } from '../constants'
import { sha3_512 } from 'js-sha3'
import { createParser } from 'eventsource-parser'
import { PubSubPayload } from '../types'
import { Base64 } from 'js-base64'
import { OnGroupDataMessageArgs, OnServerDataMessageArgs, WebPubSubClient } from '@azure/web-pubsub-client'

export const keyChatgptArkoseReqUrl = 'chatgptArkoseReqUrl'
export const keyChatgptArkoseReqForm = 'chatgptArkoseReqForm'

export async function isNeedWebsocket(accessToken: string) {
    const response = await callBackendAPIWithToken(accessToken, 'GET', '/accounts/check/v4-2023-04-27')
    const isNeedWebsocket = (await response.text()).includes('shared_websocket')
    return isNeedWebsocket
}

export async function getArkoseToken() {
    const browser = (await import('webextension-polyfill')).default
    const config = await browser.storage.local.get([keyChatgptArkoseReqUrl, keyChatgptArkoseReqForm])
    if (!config[keyChatgptArkoseReqUrl] || !config[keyChatgptArkoseReqForm]) {
        throw new Error(
            'Failed to get arkose token.' +
                '\n\n' +
                "Please keep https://chat.openai.com open and try again. If it still doesn't work, type some characters in the input box of chatgpt web page and try again."
        )
    }
    const fetcher = getUniversalFetch()
    const arkoseToken = await fetcher(config[keyChatgptArkoseReqUrl] + '?' + chatgptArkoseReqParams, {
        method: 'POST',
        body: config[keyChatgptArkoseReqForm],
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Origin': 'https://tcr9i.chat.openai.com',
            'Referer': 'https://tcr9i.chat.openai.com/v2/2.4.4/enforcement.f73f1debe050b423e0e5cd1845b2430a.html',
        },
    })
        .then((resp) => resp.json())
        .then((resp) => resp.token)
        .catch(() => null)
    if (!arkoseToken) {
        throw new Error(
            'Failed to get arkose token.' +
                '\n\n' +
                "Please keep https://chat.openai.com open and try again. If it still doesn't work, type some characters in the input box of chatgpt web page and try again."
        )
    }
    return arkoseToken
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callBackendAPIWithToken(token: string, method: string, endpoint: string, body?: any) {
    const fetcher = getUniversalFetch()
    return fetcher(`https://chat.openai.com/backend-api${endpoint}`, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })
}

async function getChatRequirements(accessToken: string) {
    const response = await callBackendAPIWithToken(accessToken, 'POST', '/sentinel/chat-requirements', {
        conversation_mode_kind: 'primary_assistant',
    })
    return response.json()
}

async function GenerateProofToken(seed: string, diff: string | number | unknown[], userAgent: string) {
    const cores = [8, 12, 16, 24]
    const screens = [3000, 4000, 6000]
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

    const core = cores[randomInt(0, cores.length)]
    const screen = screens[randomInt(0, screens.length)]

    const now = new Date(Date.now() - 8 * 3600 * 1000)
    const parseTime = now.toUTCString().replace('GMT', 'GMT-0500 (Eastern Time)')

    const config = [core + screen, parseTime, 4294705152, 0, userAgent]
    if (typeof diff === 'string') {
        const diffLen = Math.floor(diff.length / 2)
        // Continue with your code logic that uses diffLen
        for (let i = 0; i < 100000; i++) {
            config[3] = i
            const jsonData = JSON.stringify(config)
            const base = btoa(unescape(encodeURIComponent(jsonData)))
            const hashValue = sha3_512(seed + base)

            if (hashValue.substring(0, diffLen) <= diff) {
                const result = 'gAAAAAB' + base
                return result
            }
        }
    }

    const fallbackBase = btoa(unescape(encodeURIComponent(`"${seed}"`)))
    return 'gAAAAABwQ8Lk5FbGpA2NcR9dShT6gYjU7VxZ4D' + fallbackBase
}

async function registerWebsocket(accessToken: string): Promise<{ wss_url: string; expires_at: string }> {
    return callBackendAPIWithToken(accessToken, 'POST', '/register-websocket').then((resp) => resp.json())
}

interface ConversationContext {
    pubSubClient?: WebPubSubClient
}

export class ChatGPT extends AbstractEngine {
    private context: ConversationContext
    private length = 0
    private accessToken?: string
    constructor() {
        super()
        this.context = {}
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listModels(apiKey_: string | undefined): Promise<IModel[]> {
        const fetcher = getUniversalFetch()
        const sessionResp = await fetcher(utils.defaultChatGPTAPIAuthSessionAPIURL, {
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

    async getAccessToken(req: IMessageRequest): Promise<string> {
        const response = await fetch(utils.defaultChatGPTAPIAuthSessionAPIURL, { signal: req.signal })
        if (response.status === 200) {
            const { accessToken } = await response.json()
            return accessToken
        } else {
            const errorText = response.status === 401 ? 'Authentication required.' : 'Failed to fetch access token.'
            throw new Error(errorText)
        }
    }

    private subscribeWebsocket(websocketRequestId: string, onMessage: (message: string) => void) {
        const parser = createParser((event) => {
            if (event.type === 'event') {
                onMessage(event.data)
            }
        })
        const listener = (e: OnServerDataMessageArgs | OnGroupDataMessageArgs) => {
            console.debug('raw message', e.message)
            const payload = e.message.data as PubSubPayload
            if (payload.websocket_request_id && payload.websocket_request_id !== websocketRequestId) {
                console.debug('skip message')
                return
            }
            const encodedBody = payload.body
            const bodyChunk = Base64.decode(encodedBody)
            parser.feed(bodyChunk)
        }
        this.context.pubSubClient!.on('server-message', listener)
        this.context.pubSubClient!.on('group-message', listener)
        return () => {
            this.context.pubSubClient?.off('server-message', listener)
            this.context.pubSubClient?.off('group-message', listener)
        }
    }

    async postMessage(req: IMessageRequest, websocketRequestId?: string): Promise<Response | undefined> {
        try {
            const apiKey = await this.getAccessToken(req)
            if (!apiKey) {
                throw new Error('There is no logged-in ChatGPT account in this browser.')
            }

            const [model, arkoseToken, requirements] = await Promise.all([
                this.getModel(),
                getArkoseToken(),
                getChatRequirements(apiKey), // 确保传递 apiKey
            ])

            const userAgent =
                process.env.USER_AGENT ||
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
            const proofToken = await GenerateProofToken(
                requirements.proofofwork.seed,
                requirements.proofofwork.difficulty,
                userAgent
            )

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Openai-Sentinel-Arkose-Token': arkoseToken,
                'Openai-Sentinel-Chat-Requirements-Token': requirements.token,
                'openai-sentinel-proof-token': proofToken,
            }

            const body = {
                action: 'next',
                messages: [
                    {
                        id: uuidv4(),
                        role: 'user',
                        content: { content_type: 'text', parts: [`${req.rolePrompt}\n\n${req.commandPrompt}`] },
                    },
                ],
                model: model,
                parent_message_id: uuidv4(),
                conversation_mode: { kind: 'primary_assistant' },
                force_nulligen: false,
                force_paragen: false,
                force_paragen_model_slug: '',
                force_rate_limit: false,
                suggestions: [],
                history_and_training_disabled: false,
                conversation_id: undefined,
                websocket_request_id: websocketRequestId,
            }

            const response = await fetch(`${utils.defaultChatGPTWebAPI}/conversation`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: req.signal,
            })

            if (response.status !== 200) {
                const errorText = await response.text()
                throw new Error(`API call failed with status ${response.status}: ${errorText}`)
            }

            return response
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            req.onError(error.message)
        }
    }

    async sendMessage(req: IMessageRequest) {
        if (!this.accessToken) {
            this.accessToken = await this.getAccessToken(req)
        }

        type ResponseMode = 'sse' | 'websocket'
        const responseMode: ResponseMode = (await isNeedWebsocket(this.accessToken)) ? 'websocket' : 'sse'
        console.debug('chatgpt response mode:', responseMode)

        if (responseMode === 'sse') {
            const resp = await this.postMessage(req)
            if (!resp) return
            await utils.parseSSEResponse(resp, this.createMessageHandler(req))
            return
        }

        if (responseMode === 'websocket' && !this.context.pubSubClient) {
            const { wss_url } = await registerWebsocket(this.accessToken)
            const client = new WebPubSubClient(wss_url)
            await client.start()
            this.context.pubSubClient = client
        }

        const websocketRequestId = uuidv4()

        const unsubscribe = this.subscribeWebsocket(websocketRequestId, this.createMessageHandler(req))

        const resp = await this.postMessage(req, websocketRequestId).catch((err) => {
            unsubscribe()
            throw err
        })

        if (resp && !resp.ok) {
            unsubscribe()
            const error = await resp.json()
            throw new Error(`${resp.status} ` + JSON.stringify(error))
        }
    }

    private createMessageHandler(req: IMessageRequest) {
        return async (message: string) => {
            if (message === '[DONE]') {
                console.debug('Received completion signal from server.')
                req.onFinished('stop')
                return
            }
            let finished = false
            let resp
            if (finished) return
            try {
                resp = JSON.parse(message)
            } catch (err) {
                console.error(err)
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
            if (content.content_type !== 'text') {
                return
            }
            if (author.role === 'assistant') {
                const targetTxt = content.parts.join('')
                const textDelta = targetTxt.slice(this.length)
                this.length = targetTxt.length
                await req.onMessage({ content: textDelta, role: '' })
            }
        }
    }
}
