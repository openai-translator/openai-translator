import browser from 'webextension-polyfill'
import { createParser } from 'eventsource-parser'

browser.contextMenus.create(
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
browser.contextMenus.onClicked.addListener(async function (info) {
    const [tab] = await chrome.tabs.query({ active: true })
    tab.id &&
        browser.tabs.sendMessage(tab.id, {
            type: 'open-translator',
            info,
        })
})

interface BackgroundFetchMessage {
    type: 'open' | 'abort'
    details: { url: string; options: { stream?: boolean } & RequestInit }
}

async function fetchWithStream(port: browser.Runtime.Port, message: BackgroundFetchMessage, signal: AbortSignal) {
    const {
        url,
        options: { stream, ...fetchOptions },
    } = message.details
    let response: Response | null = null

    try {
        response = await fetch(url, { ...fetchOptions, signal })
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

    if (!stream) {
        port.postMessage({
            status: response.status,
            response: await response.text(),
        })
        return
    }

    const reader = response?.body?.getReader()
    if (!reader) {
        port.postMessage({
            status: response.status,
        })
        return
    }
    const parser = createParser((event) => {
        if (event.type === 'event') {
            port.postMessage({
                status: response?.status,
                response: event.data,
            })
        }
    })
    try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read()
            if (done) {
                break
            }
            const str = new TextDecoder().decode(value)
            parser.feed(str)
        }
    } catch (error) {
        console.log(error)
    } finally {
        port.disconnect()
        reader.releaseLock()
    }
}

browser.runtime.onConnect.addListener(async function (port) {
    if (port.name !== 'background-fetch') {
        return
    }
    const tabId = port.sender?.tab?.id
    if (!tabId) {
        return
    }

    const controller = new AbortController()
    const { signal } = controller

    port.onMessage.addListener(function (message) {
        switch (message.type) {
            case 'abort':
                controller.abort()
                break
            case 'open':
                fetchWithStream(port, message, signal)
                break
        }
    })
})
