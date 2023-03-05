chrome.runtime.onMessage.addListener(function(request) {
  if (request.type === 'speak') {
    chrome.tts.speak(request.text, {
      onEvent: function(event) {
        if (
          event.type === 'end' ||
          event.type === 'interrupted' ||
          event.type === 'cancelled' ||
          event.type === 'error'
        ) {
          chrome.runtime.sendMessage({ type: 'speakDone' })
        }
      },
    })
  } else if (request.type === 'stopSpeaking') {
    chrome.tts.stop()
  }
})
