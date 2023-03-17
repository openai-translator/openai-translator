/* eslint-disable @typescript-eslint/no-explicit-any */
import { TranslateMode, Provider } from '../content_script/translate'
import { IBrowser, ThemeType } from './types'

export interface ISettings {
    apiKeys: string
    apiURL: string
    apiURLPath: string
    provider: Provider | 'OpenAI'
    autoTranslate: boolean
    defaultTranslateMode: TranslateMode | 'nop'
    defaultTargetLanguage: string
    hotkey?: string
    themeType?: ThemeType
    i18n?: string
}

export const defaultAPIURL = 'https://api.openai.com'
export const defaultAPIURLPath = '/v1/chat/completions'
export const defaultProvider = 'OpenAI'

export const defaultAutoTranslate = false
export const defaultTargetLanguage = 'zh-Hans'

export const defaulti18n = 'en'

export async function getApiKey(): Promise<string> {
    const settings = await getSettings()
    const apiKeys = (settings.apiKeys ?? '').split(',').map((s) => s.trim())
    return apiKeys[Math.floor(Math.random() * apiKeys.length)] ?? ''
}

// In order to let the type system remind you that all keys have been passed to browser.storage.sync.get(keys)
const settingKeys: Record<keyof ISettings, number> = {
    apiKeys: 1,
    apiURL: 1,
    apiURLPath: 1,
    provider: 1,
    autoTranslate: 1,
    defaultTranslateMode: 1,
    defaultTargetLanguage: 1,
    hotkey: 1,
    themeType: 1,
    i18n: 1,
}

export async function getSettings(): Promise<ISettings> {
    const browser = await getBrowser()
    const items = await browser.storage.sync.get(Object.keys(settingKeys))

    const settings = items as ISettings
    if (!settings.apiKeys) {
        settings.apiKeys = ''
    }
    if (!settings.apiURL) {
        settings.apiURL = defaultAPIURL
    }
    if (!settings.apiURLPath) {
        settings.apiURLPath = defaultAPIURLPath
    }
    if (!settings.provider) {
        settings.provider = defaultProvider
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
    if (!settings.i18n) {
        settings.i18n = defaulti18n
    }
    return settings
}

export async function setSettings(settings: Partial<ISettings>) {
    const browser = await getBrowser()
    await browser.storage.sync.set(settings)
}

export async function getBrowser(): Promise<IBrowser> {
    if (isElectron()) {
        return (await import('./electron-polyfill')).electronBrowser
    }
    if (isTauri()) {
        return (await import('./tauri-polyfill')).tauriBrowser
    }
    if (isUserscript()) {
        return (await import('./userscript-polyfill')).userscriptBrowser
    }
    return await require('webextension-polyfill')
}

export const isElectron = () => {
    return navigator.userAgent.indexOf('Electron') >= 0
}

export const isTauri = () => {
    return window['__TAURI__' as any] !== undefined
}

export const isDesktopApp = () => {
    return isElectron() || isTauri()
}

export const isUserscript = () => {
    // eslint-disable-next-line camelcase
    return typeof GM_info !== 'undefined'
}

export const isDarkMode = async () => {
    const settings = await getSettings()
    if (settings.themeType === 'followTheSystem') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return settings.themeType === 'dark'
}
