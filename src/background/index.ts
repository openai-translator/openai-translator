import browser from 'webextension-polyfill'

browser.runtime.onMessage.addListener(function (request) {
    if (typeof chrome !== 'undefined') {
        if (request.type === 'speak') {
            chrome.tts.speak(request.text, {
                onEvent: function (event) {
                    if (
                        event.type === 'end' ||
                        event.type === 'interrupted' ||
                        event.type === 'cancelled' ||
                        event.type === 'error'
                    ) {
                        browser.runtime.sendMessage({ type: 'speakDone' })
                    }
                },
            })
        } else if (request.type === 'stopSpeaking') {
            chrome.tts.stop()
        }
    }
})

browser.runtime.onInstalled.addListener(async () => {
    if (typeof chrome !== 'undefined') {
        chrome.contextMenus.create({
            id: 'openasdfasdf',
            title: 'Translate with OpenAI',
            type: 'normal',
            contexts: ['selection'],
        })
    }
})

// Open a new search tab when the user clicks a context menu
browser.contextMenus.onClicked.addListener((item, tab) => {
    if (typeof chrome !== 'undefined' && tab?.id) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [item.selectionText],
            func: (selectionText) => {
                window.__openai_translator_show_popup__(selectionText)
            },
        })
    }
})
