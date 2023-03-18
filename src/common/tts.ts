interface SpeakOptions {
    text: string
    lang?: string
    onFinish?: () => void
}

const langMap: Record<string, string> = {
    'en': 'en-US',
    'zh-Hans': 'zh-CN',
    'zh-Hant': 'zh-TW',
    'yue': 'zh-HK',
    'wyw': 'zh-CN',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'es': 'es-ES',
    'it': 'it-IT',
    'ru': 'ru-RU',
    'pt': 'pt-PT',
    'nl': 'nl-NL',
    'pl': 'pl-PL',
    'ar': 'ar-001',
    'bg': 'bg-BG',
    'ca': 'ca-ES',
    'cs': 'cs-CZ',
    'da': 'da-DK',
    'el': 'el-GR',
    'fi': 'fi-FI',
    'he': 'he-IL',
    'hi': 'hi-IN',
    'hr': 'hr-HR',
    'id': 'id-ID',
    'vi': 'vi-VN',
}

export function speak({ text, lang, onFinish }: SpeakOptions) {
    const utterance = new SpeechSynthesisUtterance()
    if (onFinish) {
        utterance.addEventListener('end', onFinish, { once: true })
    }
    utterance.text = text
    const langTag = langMap[lang ?? 'en'] ?? 'en-US'
    const voices = speechSynthesis.getVoices().filter((v) => v.lang === langTag && v.default)
    utterance.lang = langTag
    if (voices.length > 0) {
        utterance.voice = voices[0]
    }
    speechSynthesis.speak(utterance)
}
