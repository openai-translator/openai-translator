import { Theme } from 'baseui-sd/theme'
import { TranslateMode, Provider } from './translate'
import { TTSProvider } from './tts/types'

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ISync {
    get(keys: string[]): Promise<Record<string, any>>
    set(items: Record<string, any>): Promise<void>
}

interface IStorage {
    sync: ISync
}

interface IRuntimeOnMessage {
    addListener(callback: (message: any, sender: any, sendResponse: any) => void): void
    removeListener(callback: (message: any, sender: any, sendResponse: any) => void): void
}

interface IRuntime {
    onMessage: IRuntimeOnMessage
    sendMessage(message: any): void
    getURL(path: string): string
}

interface II18n {
    detectLanguage(text: string): Promise<{ languages: { language: string; percentage: number }[] }>
}

export interface IBrowser {
    storage: IStorage
    runtime: IRuntime
    i18n: II18n
}

export type BaseThemeType = 'light' | 'dark'
export type ThemeType = BaseThemeType | 'followTheSystem'

export interface IThemedStyleProps {
    theme: Theme
    themeType: BaseThemeType
    isDesktopApp?: boolean
}

export interface ISettings {
    chatgptArkoseReqUrl: string
    chatgptArkoseReqForm: string
    [x: string]: any
    apiKeys: string
    apiURL: string
    apiURLPath: string
    apiModel: string
    provider: Provider | 'OpenAI'
    autoTranslate: boolean
    chatContext: boolean
    defaultTranslateMode: Exclude<TranslateMode, 'big-bang'> | 'nop'
    defaultTargetLanguage: string
    defaultSourceLanguage: string
    defaultYouglishLanguage: string
    alwaysShowIcons: boolean
    hotkey?: string
    ocrHotkey?: string
    themeType?: ThemeType
    i18n?: string
    tts?: {
        voices?: {
            lang: string
            voice: string
        }[]
        provider?: TTSProvider
        volume?: number
        rate?: number
    }
    restorePreviousPosition?: boolean
    selectInputElementsText?: boolean
    runAtStartup?: boolean
    disableCollectingStatistics?: boolean
    allowUsingClipboardWhenSelectedTextNotAvailable?: boolean
}

export type RequestInitSubset = {
    method?: string
    body?: BodyInit | null | undefined
    headers?: Record<string, string>
    signal?: AbortSignal
}

export interface ProxyFetchRequestMessage {
    url: string
    options?: RequestInitSubset
}

export interface ProxyFetchResponseMetadata {
    status?: number
    statusText?: string
    headers?: Record<string, string>
}

export interface ProxyFetchResponseMetadataMessage {
    type: 'PROXY_RESPONSE_METADATA'
    metadata: ProxyFetchResponseMetadata
}

export type ProxyFetchResponseBodyChunkMessage = {
    type: 'PROXY_RESPONSE_BODY_CHUNK'
} & ({ done: true } | { done: false; value: string })

interface FetcherOptions {
    method: string
    headers: Record<string, string>
    body: string
}

export type ResponsePayload = {
    conversation_id: string
    message: {
        id: string
        author: { role: 'assistant' | 'tool' | 'user' }
        content: ResponseContent
        recipient: 'all' | string
    }
    error: null
}

export type ResponseContent =
    | {
          content_type: 'text'
          parts: string[]
      }
    | {
          content_type: 'code'
          text: string
      }
    | {
          content_type: 'tether_browsing_display'
          result: string
      }
    | {
          content_type: 'multimodal_text'
          parts: ({ content_type: 'image_asset_pointer' } & ImageContent)[]
      }
