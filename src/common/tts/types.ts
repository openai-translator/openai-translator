export interface SpeakOptions {
    text: string
    lang?: string
    onFinish?: () => void
}

export type TTSProvider = 'WebSpeech' | 'EdgeTTS'
