/* eslint-disable @typescript-eslint/no-explicit-any */
import { createParser } from 'eventsource-parser'
import { IBrowser, ISettings } from './types'
import { getUniversalFetch } from './universal-fetch'
import { v4 as uuidv4 } from 'uuid'
import { invoke } from '@tauri-apps/api/core'
import { listen, Event, emit } from '@tauri-apps/api/event'

export const defaultAPIURL = 'https://api.openai.com'
export const defaultAPIURLPath = '/v1/chat/completions'
export const defaultProvider = 'OpenAI'
export const defaultAPIModel = 'gpt-3.5-turbo'

export const defaultChatGPTAPIAuthSessionAPIURL = 'https://chat.openai.com/api/auth/session'
export const defaultChatGPTWebAPI = 'https://chat.openai.com/backend-api'
export const defaultGeminiAPIURL = 'https://generativelanguage.googleapis.com'
export const defaultChatGPTModel = 'text-davinci-002-render-sha'

export const defaultAutoTranslate = false
export const defaultTargetLanguage = 'zh-Hans'
export const defaultWritingTargetLanguage = 'en'
export const defaultSelectInputElementsText = true
export const defaultReadSelectedWordsFromInputElementsText = false
export const defaulti18n = 'en'

export async function getApiKey(): Promise<string> {
    const settings = await getSettings()
    const apiKeys = (settings.apiKeys ?? '').split(',').map((s) => s.trim())
    return apiKeys[Math.floor(Math.random() * apiKeys.length)] ?? ''
}

export async function getAzureApiKey(): Promise<string> {
    const settings = await getSettings()
    const apiKeys = (settings.azureAPIKeys ?? '').split(',').map((s) => s.trim())
    return apiKeys[Math.floor(Math.random() * apiKeys.length)] ?? ''
}

// In order to let the type system remind you that all keys have been passed to browser.storage.sync.get(keys)
const settingKeys: Record<keyof ISettings, number> = {
    automaticCheckForUpdates: 1,
    apiKeys: 1,
    apiURL: 1,
    apiURLPath: 1,
    apiModel: 1,
    provider: 1,
    chatgptModel: 1,
    azureAPIKeys: 1,
    azureAPIURL: 1,
    azureAPIURLPath: 1,
    azureAPIModel: 1,
    miniMaxGroupID: 1,
    miniMaxAPIKey: 1,
    miniMaxAPIModel: 1,
    moonshotAPIKey: 1,
    moonshotAPIModel: 1,
    geminiAPIURL: 1,
    geminiAPIKey: 1,
    geminiAPIModel: 1,
    autoTranslate: 1,
    defaultTranslateMode: 1,
    defaultTargetLanguage: 1,
    alwaysShowIcons: 1,
    hotkey: 1,
    displayWindowHotkey: 1,
    ocrHotkey: 1,
    writingTargetLanguage: 1,
    writingHotkey: 1,
    writingNewlineHotkey: 1,
    themeType: 1,
    i18n: 1,
    tts: 1,
    restorePreviousPosition: 1,
    runAtStartup: 1,
    selectInputElementsText: 1,
    readSelectedWordsFromInputElementsText: 1,
    disableCollectingStatistics: 1,
    allowUsingClipboardWhenSelectedTextNotAvailable: 1,
    pinned: 1,
    autoCollect: 1,
    hideTheIconInTheDock: 1,
    languageDetectionEngine: 1,
    autoHideWindowWhenOutOfFocus: 1,
    proxy: 1,
    customModelName: 1,
    ollamaAPIURL: 1,
    ollamaAPIModel: 1,
    ollamaCustomModelName: 1,
    groqAPIURL: 1,
    groqAPIURLPath: 1,
    groqAPIModel: 1,
    groqAPIKey: 1,
    groqCustomModelName: 1,
    claudeAPIURL: 1,
    claudeAPIURLPath: 1,
    claudeAPIModel: 1,
    claudeAPIKey: 1,
    claudeCustomModelName: 1,
    kimiRefreshToken: 1,
    kimiAccessToken: 1,
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
    if (!settings.apiModel) {
        settings.apiModel = defaultAPIModel
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
    if (!settings.writingTargetLanguage) {
        settings.writingTargetLanguage = defaultWritingTargetLanguage
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
    if (
        settings.readSelectedWordsFromInputElementsText === undefined ||
        settings.readSelectedWordsFromInputElementsText === null
    ) {
        settings.readSelectedWordsFromInputElementsText = defaultReadSelectedWordsFromInputElementsText
    }
    if (!settings.themeType) {
        settings.themeType = 'followTheSystem'
    }
    if (settings.provider === 'Azure') {
        if (!settings.azureAPIKeys) {
            settings.azureAPIKeys = settings.apiKeys
        }
        if (!settings.azureAPIURL) {
            settings.azureAPIURL = settings.apiURL
        }
        if (!settings.azureAPIURLPath) {
            settings.azureAPIURLPath = settings.apiURLPath
        }
        if (!settings.azureAPIModel) {
            settings.azureAPIModel = settings.apiModel
        }
    }
    if (settings.provider === 'ChatGPT') {
        if (!settings.chatgptModel) {
            settings.chatgptModel = settings.apiModel
        }
    }
    if (settings.automaticCheckForUpdates === undefined || settings.automaticCheckForUpdates === null) {
        settings.automaticCheckForUpdates = true
    }
    if (!settings.languageDetectionEngine) {
        settings.languageDetectionEngine = 'baidu'
    }
    if (!settings.proxy) {
        settings.proxy = {
            enabled: false,
            protocol: 'HTTP',
            server: '127.0.0.1',
            port: '1080',
            basicAuth: {
                username: '',
                password: '',
            },
            noProxy: 'localhost,127.0.0.1',
        }
    }
    if (!settings.ollamaAPIURL) {
        settings.ollamaAPIURL = 'http://127.0.0.1:11434'
    }
    if (!settings.miniMaxAPIModel) {
        settings.miniMaxAPIModel = 'abab5.5-chat'
    }
    if (!settings.groqAPIURL) {
        settings.groqAPIURL = 'https://api.groq.com'
    }
    if (!settings.groqAPIURLPath) {
        settings.groqAPIURLPath = '/openai/v1/chat/completions'
    }
    if (!settings.claudeAPIURL) {
        settings.claudeAPIURL = 'https://api.anthropic.com'
    }
    if (!settings.claudeAPIURLPath) {
        settings.claudeAPIURLPath = '/v1/messages'
    }
    if (settings.geminiAPIURL === undefined || settings.geminiAPIURL === null) {
        settings.geminiAPIURL = defaultGeminiAPIURL
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

export const isBrowserExtensionOptions = () => {
    if (typeof window === 'undefined') {
        return false
    }
    return window['__IS_OT_BROWSER_EXTENSION_OPTIONS__' as any] !== undefined
}

export const isBrowserExtensionContentScript = () => {
    if (typeof window === 'undefined') {
        return false
    }
    return window['__IS_OT_BROWSER_EXTENSION_CONTENT_SCRIPT__' as any] !== undefined
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
    return settings.provider === defaultProvider && settings.apiURL === defaultAPIURL
}

export const isUsingOpenAIOfficial = async () => {
    const settings = await getSettings()
    return settings.provider === 'ChatGPT' || (await isUsingOpenAIOfficialAPIEndpoint())
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
        const { BaseDirectory, writeTextFile } = await import('@tauri-apps/plugin-fs')
        try {
            return await writeTextFile(filename, csvFile, { baseDir: BaseDirectory.Desktop })
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

interface FetchSSEOptions extends RequestInit {
    onMessage(data: string): Promise<void>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError(error: any): void
    onStatusCode?: (statusCode: number) => void
    fetcher?: (input: string, options: RequestInit) => Promise<Response>
    useJSONParser?: boolean
}

function tryParse(currentText: string): {
    remainingText: string
    parsedResponse: any
} {
    let jsonText: string
    if (currentText.startsWith('[')) {
        if (currentText.endsWith(']')) {
            jsonText = currentText
        } else {
            jsonText = currentText + ']'
        }
    } else if (currentText.startsWith(',')) {
        if (currentText.endsWith(']')) {
            jsonText = '[' + currentText.slice(1)
        } else {
            jsonText = '[' + currentText.slice(1) + ']'
        }
    } else {
        return {
            remainingText: currentText,
            parsedResponse: null,
        }
    }

    try {
        const parsedResponse = JSON.parse(jsonText)
        return {
            remainingText: '',
            parsedResponse,
        }
    } catch (e) {
        throw new Error(`Invalid JSON: "${jsonText}"`)
    }
}

export async function fetchSSE(input: string, options: FetchSSEOptions) {
    const {
        onMessage,
        onError,
        onStatusCode,
        useJSONParser = false,
        fetcher = getUniversalFetch(),
        ...fetchOptions
    } = options

    let currentText = ''
    const jsonParser = async ({ value, done }: { value: string; done: boolean }) => {
        if (done && !value) {
            return
        }

        currentText += value
        const { parsedResponse, remainingText } = tryParse(currentText)
        if (parsedResponse) {
            currentText = remainingText
            for (const item of parsedResponse) {
                await onMessage(JSON.stringify(item))
            }
        }
    }

    const sseParser = createParser(async (event) => {
        if (event.type === 'event') {
            await onMessage(event.data)
        }
    })

    if (isTauri()) {
        const id = uuidv4()
        let unlisten: (() => void) | undefined = undefined
        return await new Promise<void>((resolve, reject) => {
            options.signal?.addEventListener('abort', () => {
                unlisten?.()
                emit('abort-fetch-stream', { id })
            })
            listen(
                'fetch-stream-chunk',
                (event: Event<{ id: string; data: string; done: boolean; status: number }>) => {
                    const payload = event.payload
                    if (payload.id !== id) {
                        return
                    }
                    if (payload.done) {
                        resolve()
                        return
                    }
                    if (payload.status !== 200) {
                        try {
                            const data = JSON.parse(payload.data)
                            onError(data)
                        } catch (e) {
                            onError(payload.data)
                        }
                        resolve()
                        return
                    }
                    if (useJSONParser) {
                        jsonParser({ value: payload.data, done: payload.done })
                    } else {
                        sseParser.feed(payload.data)
                    }
                }
            )
                .then((cb) => {
                    unlisten = cb
                })
                .catch((e) => {
                    reject(e)
                })

            invoke('fetch_stream', {
                id,
                url: input,
                optionsStr: JSON.stringify(fetchOptions),
            })
                .catch((e) => {
                    reject(e)
                })
                .finally(() => {
                    unlisten?.()
                })
        })
    }

    const resp = await fetcher(input, fetchOptions)
    onStatusCode?.(resp.status)
    if (resp.status !== 200) {
        onError(await resp.json())
        return
    }
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
            if (useJSONParser) {
                jsonParser({ value: str, done })
            } else {
                sseParser.feed(str)
            }
        }
    } finally {
        reader.releaseLock()
    }
}

export function getAssetUrl(asset: string) {
    if (isUserscript()) {
        return asset
    }
    return new URL(asset, import.meta.url).href
}
export const isMacOS = navigator.userAgent.includes('Mac OS X')
