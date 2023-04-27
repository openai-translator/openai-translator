interface BackgroundFetchMessage
    extends Pick<Response, 'ok' | 'status' | 'statusText' | 'redirected' | 'type' | 'url'> {
    error: { message: string; name: string }
    status: number
    data?: string
}

export async function backgroundFetch(input: string, options: RequestInit) {
    return new Promise<Response>((resolve, reject) => {
        ;(async () => {
            const { signal, ...fetchOptions } = options
            if (signal?.aborted) {
                reject(new DOMException('Aborted', 'AbortError'))
            }

            const transformStream = new TransformStream<Uint8Array, Uint8Array>()
            const { writable, readable } = transformStream
            const writer = writable.getWriter()
            const textEncoder = new TextEncoder()

            async function readText() {
                const decoder = new TextDecoderStream()
                const reader = readable.pipeThrough(decoder).getReader()
                let text = ''
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) {
                        break
                    }
                    text += value
                }
                return text
            }

            const browser = await require('webextension-polyfill')
            let resolved = false
            const port = browser.runtime.connect({ name: 'background-fetch' })
            port.postMessage({ type: 'open', details: { url: input, options: fetchOptions } })
            port.onMessage.addListener((msg: BackgroundFetchMessage) => {
                const { data, error, ...restResp } = msg
                if (error) {
                    const e = new Error()
                    e.message = error.message
                    e.name = error.name
                    reject(e)
                    return
                }
                writer.write(textEncoder.encode(data))
                if (!resolved) {
                    resolve({
                        ...restResp,
                        body: readable,
                        text: readText,
                        json: async () => {
                            const text = await readText()
                            return JSON.parse(text)
                        },
                    } as Response)
                    resolved = true
                }
            })

            function handleAbort() {
                port.postMessage({ type: 'abort' })
            }
            port.onDisconnect.addListener(() => {
                signal?.removeEventListener('abort', handleAbort)
                writer.close()
            })
            signal?.addEventListener('abort', handleAbort)
        })()
    })
}
