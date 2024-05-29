/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { Proxy, ProxyConfig, fetch } from '@tauri-apps/plugin-http'
import * as utils from '../utils'
import { IBrowser, ISettings } from '../types'
import { commands } from '@/tauri/bindings'

async function getSettings(): Promise<Record<string, any>> {
    const settings = await commands.getConfigContent()
    return JSON.parse(settings)
}

class BrowserStorageSync {
    async get(keys: string[]): Promise<Record<string, any>> {
        const settings = await getSettings()
        return keys.reduce((acc, key) => {
            return {
                ...acc,
                [key]: settings[key],
            }
        }, {})
    }

    async set(items: Record<string, any>): Promise<void> {
        const newItems = Object.entries(items).reduce((acc, [key, value]) => {
            if (value === undefined) {
                return acc
            }
            return { ...acc, [key]: value }
        }, {})
        const settings = await getSettings()
        const newSettings = { ...settings, ...newItems }
        await writeTextFile('config.json', JSON.stringify(newSettings), {
            baseDir: BaseDirectory.AppConfig,
        })
    }
}

class BrowserStorage {
    sync: BrowserStorageSync

    constructor() {
        this.sync = new BrowserStorageSync()
    }
}

class BrowserRuntimeOnMessage {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    addListener(_callback: (message: any, sender: any, sendResponse: any) => void): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    removeListener(_callback: (message: any, sender: any, sendResponse: any) => void): void {}
}

class BrowserRuntime {
    onMessage: BrowserRuntimeOnMessage

    constructor() {
        this.onMessage = new BrowserRuntimeOnMessage()
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    sendMessage(_message: any): void {}

    getURL(path: string): string {
        return path
    }
}

class BrowserI18n {
    detectLanguage(_text: string): Promise<{ languages: { language: string; percentage: number }[] }> {
        return new Promise((resolve) => {
            resolve({
                languages: [],
            })
        })
    }
}

class Browser implements IBrowser {
    storage: BrowserStorage
    runtime: BrowserRuntime
    i18n: BrowserI18n

    constructor() {
        this.storage = new BrowserStorage()
        this.runtime = new BrowserRuntime()
        this.i18n = new BrowserI18n()
    }
}

export const tauriBrowser = new Browser()

export const getFetchProxy = (proxy?: ISettings['proxy'], ignoreEnabled?: boolean): Proxy | undefined => {
    const proxyConfig = getFetchProxyConfig(proxy, ignoreEnabled)
    if (!proxyConfig) {
        return undefined
    }
    return {
        all: proxyConfig,
        http: proxyConfig,
        https: proxyConfig,
    }
}

export const getFetchProxyConfig = (proxy?: ISettings['proxy'], ignoreEnabled?: boolean): ProxyConfig | undefined => {
    if (!proxy) {
        return undefined
    }
    if (!ignoreEnabled && !proxy.enabled) {
        return undefined
    }
    if (!proxy.protocol || !proxy.server || !proxy.port) {
        return undefined
    }
    const proxyURL = `${proxy.protocol?.toLowerCase()}://${proxy.server}:${proxy.port}`
    const proxyConfig: ProxyConfig = {
        url: proxyURL,
        noProxy: proxy.noProxy,
    }
    if (proxy.basicAuth?.username) {
        proxyConfig.basicAuth = {
            username: proxy.basicAuth?.username || '',
            password: proxy.basicAuth?.password || '',
        }
    }
    return proxyConfig
}

export const tauriFetch = async (input: RequestInfo, init?: RequestInit) => {
    const settings = await utils.getSettings()
    const fetchProxy = getFetchProxy(settings.proxy, false)
    const proxyInit = {
        ...init,
        proxy: fetchProxy,
    }
    return await fetch(input, proxyInit)
}
