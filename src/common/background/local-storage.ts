/* eslint-disable @typescript-eslint/no-unused-vars */

import { BackgroundEventNames } from './eventnames'

export async function backgroundGetItem(key: string): Promise<string | null> {
    const browser = (await import('webextension-polyfill')).default
    const resp = await browser.runtime.sendMessage({
        type: BackgroundEventNames.getItem,
        key,
    })
    return resp.value
}

export async function backgroundSetItem(key: string, value: string | null): Promise<void> {
    const browser = (await import('webextension-polyfill')).default
    await browser.runtime.sendMessage({
        type: BackgroundEventNames.setItem,
        key,
        value,
    })
    return
}

export async function backgroundRemoveItem(key: string): Promise<void> {
    const browser = (await import('webextension-polyfill')).default
    await browser.runtime.sendMessage({
        type: BackgroundEventNames.removeItem,
        key,
    })
    return
}
