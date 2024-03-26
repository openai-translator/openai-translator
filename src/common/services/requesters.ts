import Browser, { Runtime } from 'webextension-polyfill'
import { proxyFetch } from './proxy-fetch'
import { RequestInitSubset } from '../types'

const CHATGPT_HOME_URL = 'https://chat.openai.com'

export interface Requester {
    fetch(url: string, options?: RequestInitSubset): Promise<Response>
}

class GlobalFetchRequester implements Requester {
    fetch(url: string, options?: RequestInitSubset) {
        return fetch(url, options)
    }
}

class ProxyFetchRequester implements Requester {
    async findExistingProxyTab() {
        const tabs = await Browser.tabs.query({ pinned: true })
        const results: (string | undefined)[] = await Promise.all(
            tabs.map(async (tab) => {
                if (tab.url) {
                    return tab.url
                }
                return Browser.tabs.sendMessage(tab.id!, 'url').catch(() => undefined)
            })
        )
        for (let i = 0; i < results.length; i++) {
            if (results[i]?.startsWith('https://chat.openai.com')) {
                return tabs[i]
            }
        }
    }

    waitForProxyTabReady(): Promise<Browser.Tabs.Tab> {
        return new Promise((resolve, reject) => {
            const listener = async function (message: any, sender: Runtime.MessageSender) {
                if (message.event === 'PROXY_TAB_READY') {
                    console.debug('new proxy tab ready')
                    Browser.runtime.onMessage.removeListener(listener)
                    clearTimeout(timer)
                    resolve(sender.tab!)
                    return true
                }
            }
            const timer = setTimeout(() => {
                Browser.runtime.onMessage.removeListener(listener)
                reject(new Error('Timeout waiting for ChatGPT tab'))
            }, 10 * 1000)

            Browser.runtime.onMessage.addListener(listener)
        })
    }

    async createProxyTab() {
        const readyPromise = this.waitForProxyTabReady()
        Browser.tabs.create({ url: CHATGPT_HOME_URL, pinned: true })
        return readyPromise
    }

    async getProxyTab() {
        let tab = await this.findExistingProxyTab()
        if (!tab) {
            tab = await this.createProxyTab()
        }
        return tab
    }

    async refreshProxyTab() {
        const tab = await this.findExistingProxyTab()
        if (!tab) {
            await this.createProxyTab()
            return
        }
        const readyPromise = this.waitForProxyTabReady()
        Browser.tabs.reload(tab.id!)
        return readyPromise
    }

    async fetch(url: string, options?: RequestInitSubset) {
        const tab = await this.getProxyTab()
        const resp = await proxyFetch(tab.id!, url, options)
        if (resp.status === 403) {
            await this.refreshProxyTab()
            return proxyFetch(tab.id!, url, options)
        }
        return resp
    }
}

export const globalFetchRequester = new GlobalFetchRequester()
export const proxyFetchRequester = new ProxyFetchRequester()
