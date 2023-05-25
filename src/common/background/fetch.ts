import { BackgroundEventNames } from './eventnames'

export interface BackgroundFetchRequestMessage {
    type: 'open' | 'abort'
    details?: { url: string; options: RequestInit }
}

export interface BackgroundFetchResponseMessage
    extends Pick<Response, 'ok' | 'status' | 'statusText' | 'redirected' | 'type' | 'url'> {
    error?: { message: string; name: string }
    status: number
    data?: string
}

export async function backgroundFetch(input: string, options: RequestInit) {
    return new Promise<Response>((resolve, reject) => {
        ;(async () => {
            const { signal, ...fetchOptions } = options
            if (signal?.aborted) {
                reject(new DOMException('Aborted', 'AbortError'))
                return
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

            const browser = (await import('webextension-polyfill')).default
            let resolved = false
            const port = browser.runtime.connect({ name: BackgroundEventNames.fetch })
            const message: BackgroundFetchRequestMessage = {
                type: 'open',
                details: { url: input, options: fetchOptions },
            }
            port.postMessage(message)
            port.onMessage.addListener((msg: BackgroundFetchResponseMessage) => {
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
