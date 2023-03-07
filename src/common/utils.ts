import browser from 'webextension-polyfill'
import { TranslateMode } from '../content_script/translate'

export interface ISettings {
    apiKeys: string
    apiURL: string
    autoTranslate: boolean
    defaultTranslateMode: TranslateMode | 'nop'
    defaultTargetLanguage: string
}

export const defaultAPIURL = 'https://api.openai.com'

export const defaultAutoTranslate = false
export const defaultTargetLanguage = 'zh-Hans'

export async function getApiKey(): Promise<string> {
    const settings = await getSettings()
    const apiKeys = (settings.apiKeys ?? '').split(',').map((s) => s.trim())
    return apiKeys[Math.floor(Math.random() * apiKeys.length)] ?? ''
}

export async function getSettings(): Promise<ISettings> {
    const items = await browser.storage.sync.get([
        'apiKeys',
        'apiURL',
        'autoTranslate',
        'defaultTranslateMode',
        'defaultTargetLanguage',
    ] as Array<keyof ISettings>)

    const settings = items as ISettings
    if (!settings.apiKeys) {
        settings.apiKeys = ''
    }
    if (!settings.apiURL) {
        settings.apiURL = defaultAPIURL
    }
    if (settings.autoTranslate === undefined || settings.autoTranslate === null) {
        settings.autoTranslate = defaultAutoTranslate
    }
    if (!settings.defaultTranslateMode) {
        settings.defaultTranslateMode = 'translate'
    }
    if (!settings.defaultTargetLanguage) {
        settings.defaultTargetLanguage = defaultTargetLanguage
    }
    return settings
}

export async function setSettings(settings: ISettings) {
    await browser.storage.sync.set(settings)
}
