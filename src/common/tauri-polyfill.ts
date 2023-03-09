/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { writeTextFile, BaseDirectory } from '@tauri-apps/api/fs'
import { invoke } from '@tauri-apps/api/tauri'
import { IBrowser } from './types'

async function getSettings(): Promise<Record<string, any>> {
    const settings = await invoke<string>('get_config_content')
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
            dir: BaseDirectory.AppConfig,
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
}

class Browser implements IBrowser {
    storage: BrowserStorage
    runtime: BrowserRuntime

    constructor() {
        this.storage = new BrowserStorage()
        this.runtime = new BrowserRuntime()
    }
}

export const tauriBrowser = new Browser()
