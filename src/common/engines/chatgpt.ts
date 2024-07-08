/* eslint-disable camelcase */
import { v4 as uuidv4 } from 'uuid'
import { getUniversalFetch } from '../universal-fetch'
import { IMessageRequest, IModel } from './interfaces'
import * as utils from '../utils'
import { codeBlock } from 'common-tags'
import { fetchSSE } from '../utils'
import { AbstractEngine } from './abstract-engine'
import { chatgptArkoseReqParams } from '../constants'
import { sha3_512 } from 'js-sha3'
import { urlJoin } from 'url-join-ts'

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
async function callBackendAPIWithToken(token: string, method: string, endpoint: string, body: any) {
    const fetcher = getUniversalFetch()
    const url = urlJoin('https://chat.openai.com/backend-api', endpoint)
    return fetcher(url, {
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

export class ChatGPT extends AbstractEngine {
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

    async sendMessage(req: IMessageRequest): Promise<void> {
        const model = await this.getModel()
        const fetcher = getUniversalFetch()
        req.onStatusCode?.(200)
        let resp: Response | null = null
        resp = await fetcher(utils.defaultChatGPTAPIAuthSessionAPIURL, { signal: req.signal })
        req.onStatusCode?.(resp.status)
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
            return
        }
        const respJson = await resp?.json()
        const apiKey = respJson.accessToken
        const arkoseToken = await getArkoseToken()
        const requirements = await getChatRequirements(apiKey)
        const requirementstoken = requirements.token
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
            'Openai-Sentinel-Chat-Requirements-Token': requirementstoken,
            'openai-sentinel-proof-token': proofToken,
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
            conversation_mode: {
                kind: 'primary_assistant',
            },
            history_and_training_disabled: false,
            force_paragen: false,
            force_paragen_model_slug: '',
            force_rate_limit: false,
            suggestions: [],
        }
        let finished = false
        let length = 0
        const url = urlJoin(utils.defaultChatGPTWebAPI, '/conversation')
        await fetchSSE(url, {
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
