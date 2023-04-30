import { SpeakOptions } from './types'
import { getSettings } from '../utils'
import { speak as edgeSpeak } from './edge-tts'

export const langCode2TTSLang: Record<string, string> = {
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

let supportVoices: SpeechSynthesisVoice[] = []
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
        supportVoices = speechSynthesis.getVoices()
    }
}

export async function speak({ text, lang, onFinish }: SpeakOptions) {
    const settings = await getSettings()
    const langTag = langCode2TTSLang[lang ?? 'en'] ?? 'en-US'
    const voiceCfg = settings.tts?.voices?.find((item) => item.lang === lang)
    if (settings.tts?.provider === 'EdgeTTS') {
        return edgeSpeak({ text, lang: langTag, onFinish, voice: voiceCfg?.voice })
    }

    const utterance = new SpeechSynthesisUtterance()
    if (onFinish) {
        utterance.addEventListener('end', onFinish, { once: true })
    }

    utterance.text = text
    utterance.lang = langTag

    const defaultVoice = supportVoices.find((v) => v.lang === langTag) ?? null
    const settingsVoice = supportVoices.find((v) => v.voiceURI === voiceCfg?.voice)
    utterance.voice = settingsVoice ?? defaultVoice

    speechSynthesis.speak(utterance)
    return { stopSpeak: () => speechSynthesis.cancel() }
}
