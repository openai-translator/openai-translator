interface SpeakOptions {
    text: string
    lang?: string
    onFinish?: () => void
}

export function speak({ text, lang, onFinish }: SpeakOptions) {
    const utterance = new SpeechSynthesisUtterance()
    if (onFinish) {
        utterance.addEventListener('end', onFinish)
    }
    utterance.text = text
    utterance.lang = lang ?? 'en'
    speechSynthesis.speak(utterance)
}
