interface BackgroundFetchMessage {
    error: { message: string; name: string }
    status: number
    response: string
}

interface BackgroundFetchOptions extends RequestInit {
    stream?: boolean
    onMessage(data: string): void
    onError(error: Pick<BackgroundFetchMessage, 'error'>): void
}

export async function backgroundFetch(input: string, { stream = true, ...options }: BackgroundFetchOptions) {
    return new Promise((_resolve, reject) => {
        ;(async () => {
            const { onMessage, onError, signal, ...fetchOptions } = options

            const browser = await require('webextension-polyfill')
            const port = browser.runtime.connect({ name: 'background-fetch' })
            port.postMessage({ type: 'open', details: { url: input, options: { ...fetchOptions, stream } } })
            port.onMessage.addListener((msg: BackgroundFetchMessage) => {
                if (msg.error) {
                    const error = new Error()
                    error.message = msg.error.message
                    error.name = msg.error.name
                    reject(error)
                    !stream && port.disconnect()
                    return
                }

                if (msg.status !== 200) {
                    onError(msg)
                } else {
                    onMessage(msg.response)
                }

                !stream && port.disconnect()
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
