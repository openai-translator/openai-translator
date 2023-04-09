interface BackgroundFetchMessage {
    error: { message: string; name?: string }
    status: number
    response: unknown
}

interface BackgroundFetchOptions extends RequestInit {
    stream?: boolean
    onMessage(data: string): void
    onError(error: Pick<BackgroundFetchMessage, 'error'>): void
}

export async function backgroundFetch(input: string, { stream = true, ...options }: BackgroundFetchOptions) {
    return new Promise<void>((resolve, reject) => {
        ;(async () => {
            const { onMessage, onError, signal, ...fetchOptions } = options

            const browser = await require('webextension-polyfill')
            const port = browser.runtime.connect({ name: 'background-fetch' })
            port.postMessage({ type: 'open', details: { url: input, options: { ...fetchOptions, stream } } })
            port.onMessage.addListener((msg: BackgroundFetchMessage) => {
                if (msg.error) {
                    const error = new Error()
                    error.message = msg.error.message
                    error.name = msg.error.name ?? 'UnknownError'
                    reject(error)
                    return
                }

                if (msg.status !== 200) {
                    onError(msg.response as Pick<BackgroundFetchMessage, 'error'>)
                    resolve()
                } else {
                    onMessage(msg.response as string)
                    if (!stream) {
                        port.disconnect()
                        resolve()
                    }
                }
            })

            function handleAbort() {
                port.postMessage({ type: 'abort' })
            }
            port.onDisconnect.addListener(() => {
                signal?.removeEventListener('abort', handleAbort)
            })
            signal?.addEventListener('abort', handleAbort)
        })()
    })
}
