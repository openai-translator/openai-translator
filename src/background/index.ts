import browser from 'webextension-polyfill'
import { detectLang } from '../content_script/lang'

const isFirefox = /firefox/i.test(navigator.userAgent)

async function handleSpeakDone() {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    tab.id && browser.tabs.sendMessage(tab.id, { type: 'speakDone' })
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
