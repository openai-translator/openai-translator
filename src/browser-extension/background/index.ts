/* eslint-disable no-case-declarations */
import browser from 'webextension-polyfill'
import { BackgroundEventNames } from '../../common/background/eventnames'
import { BackgroundFetchRequestMessage, BackgroundFetchResponseMessage } from '../../common/background/fetch'
import { vocabularyInternalService } from '../../common/internal-services/vocabulary'
import { actionInternalService } from '../../common/internal-services/action'
import { optionsPageHeaderPromotionIDKey, optionsPageOpenaiAPIKeyPromotionIDKey } from '../common'
import { chatgptArkoseReqParams } from '@/common/constants'
import { keyChatgptArkoseReqForm, keyChatgptArkoseReqUrl } from '@/common/engines/chatgpt'
import { keyKimiAccessToken } from '@/common/engines/kimi'
import { keyChatGLMAccessToken } from '@/common/engines/chatglm'

browser.contextMenus?.create(
    {
        id: 'open-translator',
        type: 'normal',
        title: 'OpenAI Translator',
        contexts: ['page', 'selection'],
    },
    () => {
        browser.runtime.lastError
    }
)

browser.contextMenus?.onClicked.addListener(async function (info) {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    tab.id &&
        browser.tabs.sendMessage(tab.id, {
            type: 'open-translator',
            info,
        })
})

async function fetchWithStream(
    port: browser.Runtime.Port,
    message: BackgroundFetchRequestMessage,
    signal: AbortSignal
) {
    if (!message.details) {
        throw new Error('No fetch details')
    }

    const { url, options } = message.details
    let response: Response | null = null

    try {
        response = await fetch(url, { ...options, signal })
    } catch (error) {
        if (error instanceof Error) {
            const { message, name } = error
            port.postMessage({
                error: { message, name },
            })
        }
        port.disconnect()
        return
    }

    const responseSend: BackgroundFetchResponseMessage = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        redirected: response.redirected,
        type: response.type,
        url: response.url,
    }

    const reader = response?.body?.getReader()
    if (!reader) {
        port.postMessage(responseSend)
        return
    }

    try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read()
            if (done) {
                break
            }
            const str = new TextDecoder().decode(value)
            port.postMessage({
                ...responseSend,
                data: str,
            })
        }
    } catch (error) {
        if (error instanceof Error) {
            const { message, name } = error
            port.postMessage({
                error: { message, name },
            })
        }
    } finally {
        port.disconnect()
        reader.releaseLock()
    }
}

browser.runtime.onConnect.addListener(async function (port) {
    switch (port.name) {
        case BackgroundEventNames.fetch:
            const controller = new AbortController()
            const { signal } = controller

            port.onMessage.addListener(function (message: BackgroundFetchRequestMessage) {
                switch (message.type) {
                    case 'abort':
                        controller.abort()
                        break
                    case 'open':
                        fetchWithStream(port, message, signal)
                        break
                }
            })
            return
    }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callMethod(request: any, service: any): Promise<any> {
    const { method, args } = request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (service as any)[method](...args)
    if (result instanceof Promise) {
        const v = await result
        return { result: v }
    }
    return { result }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
browser.runtime.onMessage.addListener(async (request) => {
    switch (request.type) {
        case BackgroundEventNames.vocabularyService:
            return await callMethod(request, vocabularyInternalService)
        case BackgroundEventNames.actionService:
            return await callMethod(request, actionInternalService)
        case BackgroundEventNames.getItem:
            const resp = await browser.storage.local.get(request.key)
            return {
                value: resp[request.key],
            }
        case BackgroundEventNames.setItem:
            return await browser.storage.local.set({
                [request.key]: request.value,
            })
        case BackgroundEventNames.removeItem:
            return await browser.storage.local.remove(request.key)
        case 'openOptionsPage':
            await browser.storage.local.set({
                [optionsPageOpenaiAPIKeyPromotionIDKey]: request.openaiAPIKeyPromotionID,
            })
            await browser.storage.local.set({ [optionsPageHeaderPromotionIDKey]: request.headerPromotionID })
            browser.runtime.openOptionsPage()
            return
    }
})

browser.commands.onCommand.addListener(async (command) => {
    switch (command) {
        case 'open-popup': {
            await browser.windows.create({
                type: 'popup',
                url: '/src/browser-extension/popup/index.html',
            })
        }
    }
})

try {
    browser.webRequest.onBeforeRequest.addListener(
        (details) => {
            if (details.url.includes('/public_key') && !details.url.includes(chatgptArkoseReqParams)) {
                if (!details.requestBody) {
                    return
                }
                const formData = new URLSearchParams()
                for (const k in details.requestBody.formData) {
                    formData.append(k, details.requestBody.formData[k])
                }
                browser.storage.local
                    .set({
                        [keyChatgptArkoseReqUrl]: details.url,
                        [keyChatgptArkoseReqForm]:
                            formData.toString() ||
                            new TextDecoder('utf-8').decode(new Uint8Array(details.requestBody.raw?.[0].bytes)),
                    })
                    .then(() => {
                        console.log('Arkose req url and form saved')
                    })
            }
        },
        {
            urls: ['https://*.openai.com/*'],
            types: ['xmlhttprequest'],
        },
        ['requestBody']
    )

    browser.webRequest.onBeforeSendHeaders.addListener(
        (details) => {
            if (details.url.includes('/api/user')) {
                const headers = details.requestHeaders || []
                const authorization = headers.find((h) => h.name === 'Authorization')?.value || ''
                const accessToken = authorization.split(' ')[1]
                browser.storage.local
                    .set({
                        [keyKimiAccessToken]: accessToken,
                    })
                    .then(() => {
                        console.log('Kimi access_token saved')
                    })
            }
        },
        {
            urls: ['https://*.moonshot.cn/*'],
            types: ['xmlhttprequest'],
        },
        ['requestHeaders']
    )

    browser.webRequest.onBeforeSendHeaders.addListener(
        (details) => {
            if (details.url.includes('/chatglm/user-api/user/info')) {
                const headers = details.requestHeaders || []
                const authorization = headers.find((h) => h.name === 'Authorization')?.value || ''
                const accessToken = authorization.split(' ')[1]
                browser.storage.local
                    .set({
                        [keyChatGLMAccessToken]: accessToken,
                    })
                    .then(() => {
                        console.log('Kimi access_token saved')
                    })
            }
        },
        {
            urls: ['https://*.chatglm.cn/*'],
            types: ['xmlhttprequest'],
        },
        ['requestHeaders']
    )
} catch (error) {
    console.error('Error adding webRequest listener', error)
}
