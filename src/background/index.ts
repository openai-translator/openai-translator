import browser from 'webextension-polyfill'

const isFirefox = /firefox/i.test(navigator.userAgent)

async function handleSpeakDone() {
    const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true })
    tab.id && browser.tabs.sendMessage(tab.id, { type: 'speakDone' })
}

function handleSpeak(request) {
    if (request.type === 'speak') {
        const utterance = new SpeechSynthesisUtterance()
        utterance.text = request.text
        utterance.lang = request.lang
        utterance.addEventListener('end', handleSpeakDone)
        speechSynthesis.speak(utterance)
    } else if (request.type === 'stopSpeaking') {
        speechSynthesis.cancel()
    }
}

if (isFirefox) {
    browser.runtime.onMessage.addListener(handleSpeak)
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
