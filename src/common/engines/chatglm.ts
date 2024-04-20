/* eslint-disable camelcase */
import { getUniversalFetch } from '@/common/universal-fetch'
import { fetchSSE, getSettings, isDesktopApp } from '@/common/utils'
import { AbstractEngine } from '@/common/engines/abstract-engine'
import { IModel, IMessageRequest } from '@/common/engines/interfaces'
import qs from 'qs'
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, string>({
    max: 100,
    ttl: 1000 * 60 * 60,
})

export const keyChatGLMAccessToken = 'chatglm-access-token'
export const keyChatGLMRefreshToken = 'chatglm-refresh-token'

export class ChatGLM extends AbstractEngine {
    async getModel(): Promise<string> {
        return ''
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listModels(_apiKey: string | undefined): Promise<IModel[]> {
        return []
    }

    async getHeaders() {
        const settings = await getSettings()
        let accessToken = settings.chatglmAccessToken

        if (!isDesktopApp()) {
            const browser = (await import('webextension-polyfill')).default
            const config = await browser.storage.local.get([keyChatGLMAccessToken])
            accessToken = config[keyChatGLMAccessToken]
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36 Edg/91.0.864.41',
            'Origin': 'https://chatglm.cn',
            'Referer': 'https://chatglm.cn/main/alltoolsdetail',
        }
    }

    async sendMessage(req: IMessageRequest): Promise<void> {
        const fetcher = getUniversalFetch()

        const assistantID = '65940acff94777010aa6b796'
        const conversationTitle = 'OpenAI Translator'
        const conversationIDCacheKey = `chatglm-conversation-id-${assistantID}`
        let conversationID = cache.get(conversationIDCacheKey) || ''

        if (conversationID) {
            console.log('Using cached conversation ID:', conversationID)
        }

        req.onStatusCode?.(200)

        const headers = await this.getHeaders()

        if (!conversationID) {
            const conversationListResp = await fetcher(
                `https://chatglm.cn/chatglm/backend-api/assistant/conversation/list?${qs.stringify({
                    assistant_id: assistantID,
                    page: 1,
                    page_size: 25,
                })}`,
                {
                    method: 'GET',
                    headers,
                }
            )

            req.onStatusCode?.(conversationListResp.status)

            if (!conversationListResp.ok) {
                const jsn = await conversationListResp.json()
                req.onError?.(jsn.message ?? jsn.msg ?? 'unknown error')
                return
            }

            const conversationList = await conversationListResp.json()

            const conversation = conversationList.result.conversation_list.find(
                (c: { id: string; title: string }) => c.title === conversationTitle
            )

            conversationID = conversation?.id
        }

        if (!conversationID) {
            try {
                const signalController = new AbortController()
                await fetchSSE('https://chatglm.cn/chatglm/backend-api/assistant/stream', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        assistant_id: assistantID,
                        conversation_id: '',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'text',
                                        text: conversationTitle,
                                    },
                                ],
                            },
                        ],
                        meta_data: {
                            mention_conversation_id: '',
                            is_test: false,
                            input_question_type: 'xxxx',
                            channel: '',
                            draft_id: '',
                        },
                    }),
                    signal: signalController.signal,
                    onError: () => {},
                    onMessage: async (msg) => {
                        const data = JSON.parse(msg)
                        conversationID = data.conversation_id
                        signalController.abort()
                    },
                })
                if (conversationID) {
                    await new Promise((resolve) => setTimeout(resolve, 2000))
                }
            } catch (e) {
                console.error('err', e)
            } finally {
                // ignore
            }
        }

        if (!conversationID) {
            req.onError?.('Failed to create conversation')
            return
        }

        cache.set(conversationIDCacheKey, conversationID)

        let hasError = false
        let finished = false
        let length = 0
        await fetchSSE('https://chatglm.cn/chatglm/backend-api/assistant/stream', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                assistant_id: assistantID,
                conversation_id: conversationID,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: req.rolePrompt + '\n' + req.commandPrompt,
                            },
                        ],
                    },
                ],
                meta_data: {
                    mention_conversation_id: '',
                    is_test: false,
                    input_question_type: 'xxxx',
                    channel: '',
                    draft_id: '',
                },
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
                if (resp.status !== 'init') {
                    if (resp.event === 'finish') {
                        finished = true
                        req.onFinished('stop')
                        return
                    }
                    return
                }
                resp.parts.forEach((part: { content: { text: string }[] }) => {
                    part.content.forEach(async (content: { text: string }) => {
                        const textDelta = content.text.slice(length)
                        length = content.text.length
                        await req.onMessage({ content: textDelta, role: '' })
                    })
                })
            },
            onError: (err) => {
                console.error('err', err)
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
                if (typeof err === 'object') {
                    const { message } = err
                    if (message) {
                        if (typeof message === 'string') {
                            req.onError(message)
                        } else {
                            req.onError(JSON.stringify(message))
                        }
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
