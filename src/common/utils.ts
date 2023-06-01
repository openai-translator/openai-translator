/* eslint-disable @typescript-eslint/no-explicit-any */
import { createParser } from 'eventsource-parser'
import { BaseDirectory, writeTextFile } from '@tauri-apps/api/fs'
import { IBrowser, IProviderProps, ISettings } from './types'
import { getUniversalFetch } from './universal-fetch'
import { Provider } from './translate'

export const defaultAPIURL = 'https://api.openai.com'
export const defaultAPIURLPath = '/v1/chat/completions'
export const defaultProvider = 'OpenAI'
export const defaultAPIModel = 'gpt-3.5-turbo'

export const defaultChatGPTAPIAuthSession = 'https://chat.openai.com/api/auth/session'

export const defaultAutoTranslate = false
export const defaultTargetLanguage = 'zh-Hans'
export const defaultSelectInputElementsText = true
export const defaulti18n = 'en'

export const defaultProvidersProps: Record<Provider, IProviderProps> = {
    Azure: {
        apiKeys: '',
        apiURL: '',
        apiURLPath: '',
        apiModel: defaultAPIModel,
        subscriptionLinks: '',
    },
    ChatGPT: {
        apiKeys: '',
        apiURL: 'https://chat.openai.com',
        apiURLPath: '/backend-api',
        apiModel: defaultAPIModel,
        subscriptionLinks: '',
    },
    OpenAI: {
        apiKeys: '',
        apiURL: defaultAPIURL,
        apiURLPath: defaultAPIURLPath,
        apiModel: defaultAPIModel,
        subscriptionLinks: '',
    },
    ThirdPartyChatGPT: {
        apiKeys: '',
        apiURL: '',
        apiURLPath: '/api/chat-process',
        apiModel: defaultAPIModel,
        subscriptionLinks: '',
    },
}

export const requiredApiKeysProviders: Provider[] = ['OpenAI', 'Azure']
export const enabledSubscribeProviders: Provider[] = ['OpenAI', 'ThirdPartyChatGPT']
export const disabledSelectModelProviders: Provider[] = ['Azure', 'ThirdPartyChatGPT']

export async function getApiKey(provider: Provider): Promise<string> {
    const settings = await getSettings()
    const apiKeys = (settings.providersProps[provider]?.apiKeys ?? '').split(',').map((s) => s.trim())
    return apiKeys[Math.floor(Math.random() * apiKeys.length)] ?? ''
}

export async function getApiURL(provider: Provider): Promise<string> {
    const settings = await getSettings()
    const providerProps = settings.providersProps[provider]
    let apiURLs = (settings.providersProps[provider]?.apiURL ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== '')
    if (apiURLs.length === 0 && provider === 'ThirdPartyChatGPT' && providerProps && providerProps.subscriptionLinks) {
        const apiURLSet = new Set<string>()
        const subscriptions = providerProps.subscriptionLinks.split(',')
        await Promise.all(
            subscriptions.map(async (subscription) => {
                await getUniversalFetch()(subscription, { method: 'GET' })
                    .then((response) => {
                        if (response?.status !== 200) {
                            return ''
                        }

                        return response?.text() || ''
                    })
                    .then((content) => {
                        content?.split(',').map((s) => {
                            const flag = isIegalHTTPUrl(s)
                            if (flag) {
                                apiURLSet.add(s)
                            }
                        })
                    })
                    .catch(() => {
                        console.log(`subscribe error, subscription: ${subscription}`)
                    })
            })
        )

        apiURLs = Array.from(apiURLSet)
        if (apiURLs.length !== 0) {
            providerProps.apiURL = apiURLs.join(',') || ''
            settings.providersProps[provider] = providerProps
            setSettings(settings)
        }
    }

    return apiURLs[Math.floor(Math.random() * apiURLs.length)] ?? ''
}

// In order to let the type system remind you that all keys have been passed to browser.storage.sync.get(keys)
export const settingKeys: Record<keyof ISettings, number> = {
    provider: 1,
    providersProps: 1,
    autoTranslate: 1,
    defaultTranslateMode: 1,
    defaultTargetLanguage: 1,
    alwaysShowIcons: 1,
    hotkey: 1,
    ocrHotkey: 1,
    themeType: 1,
    i18n: 1,
    tts: 1,
    restorePreviousPosition: 1,
    runAtStartup: 1,
    selectInputElementsText: 1,
    disableCollectingStatistics: 1,
    allowUsingClipboardWhenSelectedTextNotAvailable: 1,
}

export async function getSettings(): Promise<ISettings> {
    const browser = await getBrowser()
    const items = await browser.storage.sync.get(Object.keys(settingKeys))

    const settings = items as ISettings
    if (!settings.provider) {
        settings.provider = defaultProvider
    }
    if (!settings.providersProps) {
        settings.providersProps = defaultProvidersProps
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
    if (settings.alwaysShowIcons === undefined || settings.alwaysShowIcons === null) {
        settings.alwaysShowIcons = !isTauri()
    }
    if (!settings.i18n) {
        settings.i18n = defaulti18n
    }
    if (!settings.disableCollectingStatistics) {
        settings.disableCollectingStatistics = false
    }
    if (settings.selectInputElementsText === undefined || settings.selectInputElementsText === null) {
        settings.selectInputElementsText = defaultSelectInputElementsText
    }
    if (!settings.themeType) {
        settings.themeType = 'followTheSystem'
    }
    return settings
}

export async function setSettings(settings: Partial<ISettings>) {
    const browser = await getBrowser()
    await browser.storage.sync.set(settings)
}

export async function getBrowser(): Promise<IBrowser> {
    if (isElectron()) {
        return (await import('./polyfills/electron')).electronBrowser
    }
    if (isTauri()) {
        return (await import('./polyfills/tauri')).tauriBrowser
    }
    if (isUserscript()) {
        return (await import('./polyfills/userscript')).userscriptBrowser
    }
    return (await import('webextension-polyfill')).default
}

export const isElectron = () => {
    return navigator.userAgent.indexOf('Electron') >= 0
}

export const isTauri = () => {
    if (typeof window === 'undefined') {
        return false
    }
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

export const isFirefox = () => /firefox/i.test(navigator.userAgent)

export const isUsingOpenAIOfficialAPIEndpoint = async () => {
    const settings = await getSettings()
    return settings.provider === defaultProvider && defaultProvidersProps[settings.provider].apiURL === defaultAPIURL
}

export const isUsingOpenAIOfficial = async () => {
    const settings = await getSettings()
    return settings.provider === 'ChatGPT' || (await isUsingOpenAIOfficialAPIEndpoint())
}

// source: https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid#answer-8809472
export function generateUUID() {
    let d = new Date().getTime() // Timestamp
    // Time in microseconds since page-load or 0 if unsupported
    let d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        // random number between 0 and 16
        let r = Math.random() * 16
        if (d > 0) {
            // Use timestamp until depleted
            r = (d + r) % 16 | 0
            d = Math.floor(d / 16)
        } else {
            // Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0
            d2 = Math.floor(d2 / 16)
        }
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
}

// js to csv
export async function exportToCsv<T extends Record<string, string | number>>(filename: string, rows: T[]) {
    if (!rows.length) return
    filename += '.csv'
    const columns = Object.keys(rows[0])
    let csvFile = ''
    for (const key of columns) {
        csvFile += key + ','
    }
    csvFile += '\r\n'
    const processRow = function (row: T) {
        let s = ''
        for (const key of columns) {
            if (key === 'updatedAt') {
                s += '\t' + `${row[key]}` + ','
            } else {
                s += '"' + `${row[key]}` + '"' + ','
            }
        }
        return s + '\r\n'
    }

    for (let i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i])
    }

    if (isDesktopApp()) {
        try {
            return await writeTextFile(filename, csvFile, { dir: BaseDirectory.Desktop })
        } catch (e) {
            console.error(e)
        }
    } else {
        const link = document.createElement('a')
        if (link.download !== undefined) {
            link.setAttribute('href', 'data:text/csv;charset=utf-8,ufeff' + encodeURIComponent(csvFile))
            link.setAttribute('download', filename)
            // link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }
}

export const copyPropertyValues = function <T, K extends keyof T>(source: Pick<T, K>, target: T, keys: K[]) {
    if (!source || !keys) {
        return target
    }

    target = target || ({} as T)
    keys.forEach((k) => {
        if (source[k] !== undefined) {
            target[k] = source[k]
        }
    })

    return target
}

interface FetchSSEOptions extends RequestInit {
    onMessage(data: string): void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError(error: any): void
    onStatusCode?: (statusCode: number) => void
    fetcher?: (input: string, options: RequestInit) => Promise<Response>
}

export async function fetchSSE(input: string, options: FetchSSEOptions) {
    const { onMessage, onError, onStatusCode, fetcher = getUniversalFetch(), ...fetchOptions } = options

    const resp = await fetcher(input, fetchOptions)
    onStatusCode?.(resp.status)
    if (resp.status !== 200) {
        onError(await resp.json())
        return
    }

    const parser = createParser((event) => {
        if (event.type === 'event') {
            onMessage(event.data)
        }
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const reader = resp.body!.getReader()
    try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read()
            if (done) {
                break
            }
            const str = new TextDecoder().decode(value)
            parser.feed(str)
        }
    } finally {
        reader.releaseLock()
    }
}

export function isIegalHTTPUrl(text: string) {
    if (!text) {
        return false
    }

    try {
        const url = new URL(text)
        return url ? url.protocol === 'http:' || url.protocol === 'https:' : false
    } catch {
        return false
    }
}

export function validateURL(urls: string | undefined): boolean {
    if (urls === undefined || !urls.trim()) {
        return false
    }

    const illegalUrls = urls.split(',').filter((s) => !isIegalHTTPUrl(s)) || []
    return illegalUrls.length === 0
}
