/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { IBrowser } from './types'

class BrowserStorageSync {
    async get(keys: string[]): Promise<Record<string, any>> {
        const result: Record<string, any> = {}
        for (const key of keys) {
            result[key] = await GM.getValue(key, null)
        }
        return result
    }

    async set(items: Record<string, any>): Promise<void> {
        Object.entries(items).forEach(async ([key, value]) => {
            value && (await GM.setValue(key, value))
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
        return GM_getResourceURL(path)
    }
}

class Browser implements IBrowser {
    storage: BrowserStorage
    runtime: BrowserRuntime

    constructor() {
        this.storage = new BrowserStorage()
        this.runtime = new BrowserRuntime()
    }
}

export const userscriptBrowser = new Browser()

export async function userscriptFetch(url: string, { body, headers, method, signal }: RequestInit): Promise<any> {
    return new Promise((resolve) => {
        const handle = GM_xmlhttpRequest({
            url,
            data: body as string,
            headers: headers as any,
            method: method as any,
            responseType: 'stream' as any,
            onreadystatechange: async function (r) {
                Object.assign(r, { body: r.response, status: r.status })
                if (r.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
                    if (r.status === 200) {
                        resolve(r)
                    } else {
                        const reader = r.response.getReader()
                        const { value } = await reader.read()
                        const str = new TextDecoder().decode(value)
                        Object.assign(r, { json: () => JSON.parse(str) })
                        resolve(r)
                    }
                }
            },
        })
        signal?.addEventListener('abort', () => {
            handle.abort()
        })
    })
}
