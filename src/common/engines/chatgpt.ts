/* eslint-disable camelcase */
import { v4 as uuidv4 } from 'uuid'
import { getUniversalFetch } from '../universal-fetch'
import { IEngine, IMessageRequest, IModel } from './interfaces'
import * as utils from '../utils'
import { codeBlock } from 'common-tags'

export class ChatGPT implements IEngine {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listModels(apiKey_: string | undefined): Promise<IModel[]> {
        const fetcher = getUniversalFetch()
        const sessionResp = await fetcher(utils.defaultChatGPTAPIAuthSession, {
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

    async sendMessage(req: IMessageRequest): Promise<void> {
        const settings = await utils.getSettings()
        const fetcher = getUniversalFetch()
        let resp: Response | null = null
        resp = await fetcher(utils.defaultChatGPTAPIAuthSession, { signal: req.signal })
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
            req.onStatusCode?.(resp.status)
            return
        }
        const respJson = await resp?.json()
        const apiKey = respJson.accessToken
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
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
            model: settings.chatgptModel, // 'text-davinci-002-render-sha'
            parent_message_id: uuidv4(),
            history_and_training_disabled: true,
        }
        console.log('body: ', JSON.stringify(body, null, 2))

        const conversationResp = await fetcher(`${utils.defaultChatGPTWebAPI}/conversation`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: req.signal,
        });

        if (conversationResp.status !== 200) {
            // 处理错误情况
            req.onError('Failed to start ChatGPT Web conversation.');
            req.onStatusCode?.(conversationResp.status);
            return;
        }

        const conversationRespJson = await conversationResp.json();
        const wssUrl = conversationRespJson.wss_url;
        if (!wssUrl) {
            req.onError('Failed to get WebSocket URL.');
            return;
        }

        const ws = new WebSocket(wssUrl);
        
        ws.onopen = () => {
            // WebSocket 连接已开启，可以发送消息等操作
            console.log('WebSocket opened...', wssUrl);
        };

        let lastContent = '';

        ws.onmessage = async (event) => {
            const msg = JSON.parse(event.data);
            // 处理接收到的消息
            if (msg.body && msg.body !== 'ZGF0YTogW0RPTkVdCgo=') {
                // 通过base64解码 lastMsg.body
                const lastMsgDataBody = atob(msg.body);
                // 提取parts的内容，并使用unicode解码
                const messageObj = JSON.parse(lastMsgDataBody.substring(6));
                const parts = messageObj.message.content.parts;
                console.log('received message: ', parts);
                const content = parts.map((part: string) => {
                    return unescape(part);
                });
                const contentStr = content[0];
                await req.onMessage({ content: contentStr.substring(lastContent.length), role: '' })
                lastContent = contentStr
            } else {
                await req.onFinished('stop')
            }
        };

        ws.onerror = async (event) => {
            // 处理错误情况
            await req.onError('WebSocket error...');
        };

        ws.onclose = () => {
            // WebSocket 连接已关闭
            console.log('WebSocket closed...', wssUrl);
        };
        
    }
}
