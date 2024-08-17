/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable camelcase */
import { v4 as uuidv4 } from 'uuid'
import { getUniversalFetch } from '../universal-fetch'
import { IMessageRequest, IModel } from './interfaces'
import * as utils from '../utils'
import { AbstractEngine } from './abstract-engine'
import { chatgptArkoseReqParams } from '../constants'
import { sha3_512 } from 'js-sha3'
import { OnGroupDataMessageArgs, OnServerDataMessageArgs, WebPubSubClient } from '@azure/web-pubsub-client'
import { createParser } from 'eventsource-parser'
import { PubSubPayload } from '../types'
import { Base64 } from 'js-base64'
import Browser from 'webextension-polyfill'
import { useChatStore } from '@/store/file/store'

export const keyChatgptArkoseReqUrl = 'chatgptArkoseReqUrl'
export const keyChatgptArkoseReqForm = 'chatgptArkoseReqForm'

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
            'Referer': 'https://tcr9i.chat.openai.com/v2/2.5.0/enforcement.13af146b6f5532afc450f0718859ea0f.html',
        },
    })
        .then((resp) => resp.json())
        .then((resp) => resp.token)
        .catch(() => null)
    if (!arkoseToken) {
        throw new Error(
            'Failed to get arkose token.' +
                '\n\n' +
                "Please keep https://chatgpt.com open and try again. If it still doesn't work, type some characters in the input box of chatgpt web page and try again."
        )
    }
    return arkoseToken
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callBackendAPIWithToken(token: string, method: string, endpoint: string, body?: any) {
    const fetcher = getUniversalFetch() // Assuming getUniversalFetch returns the global fetch
    const response = await fetcher(`https://chatgpt.com/backend-api${endpoint}`, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (response.status === 401) {
        // Token might be expired or invalid
        throw new Error('Token expired or invalid')
    }
    return response
}

async function getChatRequirements(accessToken: string) {
    try {
        const response = await callBackendAPIWithToken(accessToken, 'POST', '/sentinel/chat-requirements', {
            conversation_mode_kind: 'primary_assistant',
        })
        return response.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error.message === 'Token expired or invalid') {
            // Try to refresh the token
            const newAccessToken = await utils.getAccessToken(true) // Force token refresh
            const retryResponse = await callBackendAPIWithToken(newAccessToken, 'POST', '/sentinel/chat-requirements', {
                conversation_mode_kind: 'primary_assistant',
            })
            return retryResponse.json()
        }
        throw error // Re-throw other errors for further handling
    }
}

function toBase64(str: string): string {
    try {
        const encoder = new TextEncoder() // 创建一个 TextEncoder 实例
        const bytes = encoder.encode(str) // 编码字符串为UTF-8字节序列
        const base64String = btoa(String.fromCharCode.apply(null, bytes as unknown as number[])) // 将字节序列转换为字符，然后编码为Base64
        return base64String
    } catch (error) {
        console.error('Error encoding to Base64:', error, 'Input string:', str)
        throw new Error('Failed to encode to Base64.') // 抛出新的错误，可以提供给调用者更清晰的错误信息
    }
}

// https://github.com/tctien342/chatgpt-proxy/blob/9147a4345b34eece20681f257fd475a8a2c81171/src/openai.ts#L103
// https://github.com/zatxm/aiproxy
async function GenerateProofToken(seed: string, diff: string | number | unknown[], userAgent: string): Promise<string> {
    const cores = [1, 2, 4]
    const screens = [3008, 4010, 6000]
    const reacts = ['_reactListeningcfilawjnerp', '_reactListening9ne2dfo1i47', '_reactListening410nzwhan2a']
    const acts = ['alert', 'ontransitionend', 'onprogress']
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

    const core = cores[randomInt(0, cores.length - 1)]
    const screen = screens[randomInt(0, screens.length - 1)] + core
    const react = reacts[randomInt(0, reacts.length - 1)]
    const act = acts[randomInt(0, acts.length - 1)]

    const parseTime = new Date().toString()

    const config = [
        screen,
        parseTime,
        4294705152,
        0,
        userAgent,
        'https://tcr9i.chat.openai.com/v2/35536E1E-65B4-4D96-9D97-6ADB7EFF8147/api.js',
        'dpl=1440a687921de39ff5ee56b92807faaadce73f13',
        'en',
        'en-US',
        4294705152,
        'plugins−[object PluginArray]',
        react,
        act,
    ]

    for (let i = 0; i < 200000; i++) {
        config[3] = i
        const jsonData = JSON.stringify(config)
        const base = toBase64(jsonData)
        const hashValue = sha3_512.create().update(seed + base)

        if (hashValue.hex().substring(0, diff.length) <= diff) {
            const result = 'gAAAAAB' + base
            return result
        }
    }

    const fallbackBase = toBase64(`"${seed}"`)
    return 'gAAAAABwQ8Lk5FbGpA2NcR9dShT6gYjU7VxZ4D' + fallbackBase
}

export async function registerWebsocket(accessToken: string): Promise<{ wss_url: string; expires_at: string }> {
    return callBackendAPIWithToken(accessToken, 'POST', '/register-websocket').then((resp) => resp.json())
}

export async function listModels(): Promise<IModel[]> {
    const fetcher = getUniversalFetch()
    const accessToken = await utils.getAccessToken(true)

    const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
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

interface ConversationContext {
    messageId?: string
    conversationId?: string
    pubSubClient?: WebPubSubClient
}

export class ChatGPT extends AbstractEngine {
    private length = 0
    private context: ConversationContext
    private accessToken?: string
    private model: string
    private store: ReturnType<typeof useChatStore>

    constructor() {
        super()
        this.context = {}
        this.model = 'text-davinci-003'
        this.store = useChatStore
    }

    saveConversationContext(name: string, model: string, conversationId: string) {
        // 使用 chrome.storage.local.set() 保存上下文
        // 保存的键为 name 和 model 的组合，然后保存对话 ID
        const conversationKey = `${name}.${model}.conversationId`
        chrome.storage.local.set({
            [conversationKey]: {
                value: conversationId,
            },
        })
    }

    saveMessageContext(name: string, model: string, messageId: string) {
        // 使用 chrome.storage.local.set() 保存上下文
        // 保存的键为 name 和 model 的组合，然后保存对话 ID
        const messageKey = `${name}.${model}.messageId`
        chrome.storage.local.set({
            [messageKey]: {
                value: messageId,
            },
        })
    }

    getConversationId(name: string, model: string) {
        const key = `${name}.${model}.conversationId`
        return new Promise(function (resolve) {
            chrome.storage.local.get([key], function (result) {
                const conversationId = result[key]?.value
                useChatStore.getInitialState().setConversationId(conversationId)
                console.log('set conversationId', conversationId)
                resolve(conversationId)
            })
        })
    }

    saveMessageId(name: string, model: string, messageId: string) {
        const key = `${name}.${model}.messageId`
        chrome.storage.local.set({
            [key]: {
                value: messageId,
            },
        })
    }

    getMessageId(name: string, model: string) {
        const key = `${name}.${model}.messageId`
        return new Promise(function (resolve) {
            chrome.storage.local.get([key], function (result) {
                const messageId = result[key]?.value
                resolve(messageId)
            })
        })
    }

    getConversationIdAndMessageId(name: string, model: string) {
        return Promise.all([this.getConversationId(name, model), this.getMessageId(name, model)])
    }

    removeConversationId(name: string, model: string) {
        const key = `${name}.${model}.conversationId`
        chrome.storage.local.remove([key])
    }

    removeMessageId(name: string, model: string) {
        const key = `${name}.${model}.messageId`
        chrome.storage.local.remove([key])
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listModels(apiKey_: string | undefined): Promise<IModel[]> {
        const fetcher = getUniversalFetch()
        const accessToken = await utils.getAccessToken(true)

        const headers: Record<string, string> = {
            Authorization: `Bearer ${accessToken}`,
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
            console.log('get req' + JSON.stringify(req))
            const accessToken = await utils.getAccessToken()
            if (!accessToken) {
                throw new Error('There is no logged-in ChatGPT account in this browser.')
            }

            const [arkoseToken, requirements] = await Promise.all([
                getArkoseToken(),
                getChatRequirements(accessToken), // 确保传递 apiKey
            ])

            let model = 'text-davinci-003'
            let lastConversationId
            let lastMessageId

            if (req.activateAction.model) {
                const [provider, modelName] = req.activateAction.model.split('&')
                if (provider === 'ChatGPT') {
                    model = modelName
                }
            } else {
                model = await this.getModel()
            }
            this.model = model

            // 辅助action使用与父action相同的conversationId
            if (req.parentAction) {
                lastConversationId = await this.getConversationId(req.parentAction.name, model)
                lastMessageId = await this.getMessageId(req.parentAction.name, model)
            } else {
                lastConversationId = await this.getConversationId(req.activateAction.name, model)
                lastMessageId = uuidv4()
            }

            const messageId = uuidv4()

            const userAgent =
                process.env.USER_AGENT ||
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
            const proofToken = await GenerateProofToken(
                requirements.proofofwork.seed,
                requirements.proofofwork.difficulty,
                userAgent
            )
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            let cookie
            let oaiDeviceId

            if (Browser.cookies && Browser.cookies.getAll) {
                try {
                    const cookies = await Browser.cookies.getAll({ url: 'https://chatgpt.com/' })
                    if (cookies.length > 0) {
                        cookie = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ')
                    } else {
                        console.log('No cookies returned for the URL')
                    }
                } catch (error) {
                    console.error('Failed to get cookies:', error)
                }

                try {
                    const oaiCookie = await Browser.cookies.get({
                        url: 'https://chatgpt.com/',
                        name: 'oai-did',
                    })
                    if (oaiCookie) {
                        oaiDeviceId = oaiCookie.value
                    } else {
                        console.log('oai-did cookie not found or not accessible')
                    }
                } catch (error) {
                    console.error('Failed to get oai-did cookie:', error)
                }
            }

            let headers
            type ResponseMode = 'sse' | 'websocket'
            const responseMode: ResponseMode = (await utils.isNeedWebsocket(accessToken)) ? 'websocket' : 'sse'

            console.log('oaiDeviceId:', oaiDeviceId)

            if (responseMode === 'websocket') {
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'Openai-Sentinel-Arkose-Token': arkoseToken,
                    'Openai-Sentinel-Chat-Requirements-Token': requirements.token,
                    'openai-sentinel-proof-token': proofToken,
                    'Oai-Device-Id': oaiDeviceId!,
                    'Oai-Language': 'en-US',
                }
            }

            if (responseMode === 'sse') {
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'Openai-Sentinel-Arkose-Token': arkoseToken,
                    'Openai-Sentinel-Chat-Requirements-Token': requirements.token,
                    'openai-sentinel-proof-token': proofToken,
                    'Oai-Device-Id': oaiDeviceId!,
                    'Oai-Language': 'en-US',
                }
            }

            const body = {
                action: 'next',
                messages: [
                    {
                        id: messageId,
                        role: 'user',
                        content: { content_type: 'text', parts: [`${req.rolePrompt}\n\n${req.commandPrompt}`] },
                    },
                ],
                model: this.model,
                parent_message_id: lastMessageId,
                conversation_mode: { kind: 'primary_assistant', plugin_ids: null },
                force_nulligen: false,
                force_paragen: false,
                force_use_sse: true,
                force_paragen_model_slug: '',
                force_rate_limit: false,
                reset_rate_limits: false,
                suggestions: [],
                history_and_training_disabled: false,
                conversation_id: lastConversationId || undefined,
                websocket_request_id: websocketRequestId,
            }

            const response = await fetch(`${utils.defaultChatGPTWebAPI}/conversation`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: req.signal,
            })

            if (response.status === 404) {
                this.removeConversationId(req.activateAction.name, this.model)
                throw new Error(
                    `API call failed with status ${response.status}: ${response.statusText}, please try again.`
                )
            }
            if (response.status !== 200) {
                const errorText = await response.text()
                throw new Error(`API call failed with status ${response.status}: ${errorText}`)
            }

            return response
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            if (error.response && error.response.data.detail.code === 'token_expired') {
                // Clear the expired token from localStorage
                localStorage.removeItem('accessToken')
                // Optional: Redirect user to login or automatically re-authenticate
                req.onError('Token expired. Please try again.')
                // Re-authentication logic here...
            } else {
                req.onError(error.message)
            }
        }
    }

    async sendMessage(req: IMessageRequest) {
        if (!this.accessToken) {
            this.accessToken = await utils.getAccessToken()
        }

        type ResponseMode = 'sse' | 'websocket' | 'test'
        const responseMode: ResponseMode = (await utils.isNeedWebsocket(this.accessToken)) ? 'websocket' : 'sse'
        console.debug('chatgpt response mode:', responseMode)

        if (responseMode === 'sse') {
            const resp = await this.postMessage(req)
            if (!resp) return
            await utils.parseSSEResponse(resp, this.createMessageHanlder(req))
            return
        }

        if (responseMode === 'websocket' && !this.context.pubSubClient) {
            const { wss_url } = await registerWebsocket(this.accessToken)
            const client = new WebPubSubClient(wss_url)
            await client.start()
            this.context.pubSubClient = client
        }

        const websocketRequestId = uuidv4()

        const unsubscribe = this.subscribeWebsocket(websocketRequestId, this.createMessageHanlder(req))

        const resp = await this.postMessage(req, websocketRequestId).catch((err) => {
            unsubscribe()
            throw err
        })
        if (resp) {
            await utils.parseSSEResponse(resp, this.createMessageHanlder(req))
        }

        if (resp && !resp.ok) {
            unsubscribe()
            const error = await resp.json()
            throw new Error(`${resp.status} ` + JSON.stringify(error))
        }
    }

    private createMessageHanlder(req: IMessageRequest) {
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
                this.saveConversationContext(req.activateAction.name, this.model, resp.conversation_id)

                useChatStore.getInitialState().setConversationId(resp.conversation_id)
                this.context = {
                    ...this.context,
                    conversationId: resp.conversation_id,
                    messageId: resp.message_id,
                }
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
                    req.onError(
                        `ChatGPT Web error: ${resp.error}. Please go to chatgpt.com and select the most recent conversation in the list, then try to regenerate.`
                    )
                }
                return
            }

            const { content, author, id } = resp.message
            if (content.content_type !== 'text') {
                return
            }
            useChatStore.getInitialState().setMessageId(id)
            this.saveMessageContext(req.activateAction.name, this.model, id)
            if (author.role === 'assistant') {
                const targetTxt = content.parts.join('')
                const textDelta = targetTxt.slice(this.length)
                this.length = targetTxt.length
                await req.onMessage({ content: textDelta, role: '' })
            }
        }
    }
}
