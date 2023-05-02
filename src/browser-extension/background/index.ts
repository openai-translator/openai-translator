import browser from 'webextension-polyfill'

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
    details: { url: string; options: RequestInit }
}

async function fetchWithStream(port: browser.Runtime.Port, message: BackgroundFetchMessage, signal: AbortSignal) {
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

    const responseSend = {
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
