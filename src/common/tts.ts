import { getSettings } from './utils'

interface SpeakOptions {
    text: string
    lang?: string
    onFinish?: () => void
}

export const supportTTSLang: Record<string, string> = {
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

let supportVoices: SpeechSynthesisVoice[]
window.speechSynthesis.onvoiceschanged = () => {
    supportVoices = speechSynthesis.getVoices()
}

export async function speak({ text, lang, onFinish }: SpeakOptions) {
    const utterance = new SpeechSynthesisUtterance()
    if (onFinish) {
        utterance.addEventListener('end', onFinish, { once: true })
    }

    const langTag = supportTTSLang[lang ?? 'en'] ?? 'en-US'
    utterance.text = text
    utterance.lang = langTag

    const settings = await getSettings()
    const defaultVoice = supportVoices.find((v) => v.lang === langTag) ?? null
    const settingsVoice = supportVoices.find((v) => v.voiceURI === settings.tts?.voices?.[langTag])
    utterance.voice = settingsVoice ?? defaultVoice

    speechSynthesis.speak(utterance)
}
