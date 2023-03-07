import browser from 'webextension-polyfill'
import { TranslateMode } from '../content_script/translate'

export interface ISettings {
    apiKeys: string
    apiURL: string
    defaultTranslateMode: TranslateMode | 'nop'
}

export const defaultAPIURL = 'https://api.openai.com'

export async function getApiKey(): Promise<string> {
    const settings = await getSettings()
    const apiKeys = (settings.apiKeys ?? '').split(',').map((s) => s.trim())
    return apiKeys[Math.floor(Math.random() * apiKeys.length)] ?? ''
}

export async function getSettings(): Promise<ISettings> {
    return new Promise((resolve) => {
        browser.storage.sync.get(
            ['apiKeys', 'apiURL', 'defaultTranslateMode'] as Array<keyof ISettings>).then((items) => {
                const settings = items as ISettings
                if (!settings.apiKeys) {
                    settings.apiKeys = ''
                }
                if (!settings.apiURL) {
                    settings.apiURL = defaultAPIURL
                }
                if (!settings.defaultTranslateMode) {
                    settings.defaultTranslateMode = 'translate'
                }
                resolve(settings)
            }
        )
    })
}

export async function setSettings(settings: ISettings) {
    return new Promise<void>((resolve) => {
        browser.storage.sync.set(settings).then(() => {
            resolve()
        })
    })
}
