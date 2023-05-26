import { BackgroundEventNames } from '../eventnames'

export async function callMethod(eventType: keyof typeof BackgroundEventNames, methodName: string, args: any[]): Promise<any> {
    const browser = (await import('webextension-polyfill')).default
    const resp = await browser.runtime.sendMessage({
        type: BackgroundEventNames[eventType],
        method: methodName,
        args: args,
    })
    return resp.result
}
