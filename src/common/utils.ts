export interface ISettings {
    apiKeys: string
    apiURL: string
    autoTranslate: string
}

export const defaultAPIURL = 'https://api.openai.com'

export const defaultAutoTranslate = 'false'

export async function getApiKey(): Promise<string> {
    const settings = await getSettings()
    const apiKeys = (settings.apiKeys ?? '').split(',').map((s) => s.trim())
    return apiKeys[Math.floor(Math.random() * apiKeys.length)] ?? ''
}

export async function getSettings(): Promise<ISettings> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['apiKeys', 'apiURL', 'autoTranslate'] as Array<keyof ISettings>, (items) => {
            const settings = items as ISettings
            if (!settings.apiKeys) {
                settings.apiKeys = ''
            }
            if (!settings.apiURL) {
                settings.apiURL = defaultAPIURL
            }
            if (!settings.autoTranslate) {
                settings.autoTranslate = defaultAutoTranslate
            }
            resolve(settings)
        })
    })
}

export async function setSettings(settings: ISettings) {
    return new Promise<void>((resolve) => {
        chrome.storage.sync.set(settings, () => {
            resolve()
        })
    })
}
