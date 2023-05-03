/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { IBrowser } from '../types'

class BrowserStorageSync {
    async get(keys: string[]): Promise<Record<string, any>> {
        return await (window['electronAPI' as any]['storeGets' as any] as any)(keys)
    }

    async set(items: Record<string, any>): Promise<void> {
        const newItems = Object.entries(items).reduce((acc, [key, value]) => {
            if (value === undefined) {
                return acc
            }
            return { ...acc, [key]: value }
        }, {})
        return await (window['electronAPI' as any]['storeSets' as any] as any)(newItems)
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

export const electronBrowser = new Browser()
