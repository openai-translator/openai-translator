import browser from 'webextension-polyfill'
import { createParser } from 'eventsource-parser'

const isFirefox = /firefox/i.test(navigator.userAgent)

async function handleSpeakDone() {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    if (tab?.id) {
        browser.tabs.sendMessage(tab.id, { type: 'speakDone' })
    } else {
        // popup doesn't have tab id
        browser.runtime.sendMessage({ type: 'speakDone' })
    }
}

if (isFirefox) {
    const utterance = new SpeechSynthesisUtterance()
    utterance.addEventListener('end', handleSpeakDone)
    browser.runtime.onMessage.addListener(function (request) {
        if (request.type === 'speak') {
            utterance.text = request.text
            utterance.lang = request.lang
            speechSynthesis.speak(utterance)
        } else if (request.type === 'stopSpeaking') {
            speechSynthesis.cancel()
        }
    })
} else {
    browser.runtime.onMessage.addListener(function (request) {
        if (request.type === 'speak') {
            chrome.tts.speak(request.text, {
                lang: request.lang,
                onEvent: function (event) {
                    if (
                        event.type === 'end' ||
                        event.type === 'interrupted' ||
                        event.type === 'cancelled' ||
                        event.type === 'error'
                    ) {
                        // TODO: interrupted event will cause error when PopupCard unmount
                        // Uncaught (in promise) Error: Could not establish connection. Receiving end does not exist.
                        handleSpeakDone()
                    }
                },
            })
        } else if (request.type === 'stopSpeaking') {
            chrome.tts.stop()
        }
    })
}

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
browser.contextMenus.onClicked.addListener(async function (info, _tab) {
    const [tab] = await chrome.tabs.query({ active: true })
    tab.id &&
        browser.tabs.sendMessage(tab.id, {
            type: 'open-translator',
            info,
        })
})

type FetchMessage = {
    type: string
    details: { url: string; options: RequestInit }
}

const portSet = new Set()

async function fetchWithStream(port: browser.Runtime.Port, message: FetchMessage, signal: AbortSignal) {
    const { url, options } = message.details
    let response: Response | null = null
    const tabId = port.sender?.tab?.id

    try {
        response = await fetch(url, { ...options, signal })
    } catch (error) {
        if (error instanceof Error) {
            const { message, name } = error
            port.postMessage({
                error: { message, name },
            })
        }
        tabId && portSet.delete(tabId)
        port.disconnect()
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
        tabId && portSet.delete(tabId)
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
    // only one port is allowed per tab.
    if (portSet.has(tabId)) {
        return
    }

    portSet.add(tabId)
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
