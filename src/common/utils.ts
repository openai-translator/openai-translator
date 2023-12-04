/* eslint-disable @typescript-eslint/no-explicit-any */
import { createParser } from 'eventsource-parser'
import { IBrowser, ISettings } from './types'
import { getUniversalFetch } from './universal-fetch'
import { Action } from './internal-services/db'

export const defaultAPIURL = 'https://api.openai.com'
export const defaultAPIURLPath = '/v1/chat/completions'
export const defaultProvider = 'OpenAI'
export const defaultAPIModel = 'gpt-3.5-turbo'

export const defaultChatGPTAPIAuthSession = 'https://chat.openai.com/api/auth/session'
export const defaultChatGPTWebAPI = 'https://chat.openai.com/backend-api'
export const defaultChatContext = false
export const defaultAutoTranslate = false
export const defaultTargetLanguage = 'zh-Hans'
export const defaultSelectInputElementsText = true
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
    apiModel: 1,
    provider: 1,
    autoTranslate: 1,
    chatContext: 1,
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
    if (!settings.chatContext === undefined || settings.autoTranslate === null) {
        settings.chatContext = defaultChatContext
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
    return settings.provider === defaultProvider && settings.apiURL === defaultAPIURL
}

export const isUsingOpenAIOfficial = async () => {
    const settings = await getSettings()
    return settings.provider === 'ChatGPT' || (await isUsingOpenAIOfficialAPIEndpoint())
}


export async function exportToJson<T extends Action>(filename: string, rows: T[]) {
    if (!rows.length) return
    filename += '.json'
    const jsonFile = JSON.stringify(rows, null, 2) // 格式化 JSON 字符串

    if (isDesktopApp()) {
        const { BaseDirectory, writeTextFile } = await import('@tauri-apps/api/fs')
        try {
            return await writeTextFile(filename, jsonFile, { dir: BaseDirectory.Desktop })
        } catch (e) {
            console.error(e)
        }
    } else {
        const link = document.createElement('a')
        if (link.download !== undefined) {
            link.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonFile))
            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }
}





export async function jsonToActions(file: File): Promise<Action[]> {
    try {
        console.log('Starting jsonToActions function');

        // 读取文件内容
        console.log('Reading file content');
        const fileContent = await file.text();
        console.log('File content:', fileContent.substring(0, 100)); // 显示前100字符，以避免太长

        // 解析JSON数据
        console.log('Parsing JSON data');
        const parsedData = JSON.parse(fileContent);
        console.log('Parsed data:', parsedData.slice(0, 5)); // 显示前5条数据

        // 简单验证以检查parsedData是否为动作数组
        if (!Array.isArray(parsedData)) {
            throw new Error('Invalid file format: Expected an array of actions');
        }

        console.log('Returning parsed data');
        return parsedData;
    } catch (error) {
        console.error('Error importing actions:', error);
        return [];
    }
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
