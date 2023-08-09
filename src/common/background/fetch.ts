import { isFirefox } from '../utils'
import { BackgroundEventNames } from './eventnames'
import { ReadableStream as ReadableStreamPolyfill } from 'web-streams-polyfill/ponyfill'

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

async function readText(stream: ReadableStream) {
    const reader = stream.getReader()
    let text = ''
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { done, value } = await reader.read()
        if (done) {
            break
        }
        const str = new TextDecoder().decode(value)
        text += str
    }
    return text
}

export async function backgroundFetch(input: string, options: RequestInit) {
    return new Promise<Response>((resolve, reject) => {
        ;(async () => {
            const { signal, ...fetchOptions } = options
            if (signal?.aborted) {
                reject(new DOMException('Aborted', 'AbortError'))
                return
            }

            const ReadableStream = isFirefox()
                ? (ReadableStreamPolyfill as typeof window.ReadableStream)
                : window.ReadableStream
            const textEncoder = new TextEncoder()
            let resolved = false
            const browser = (await import('webextension-polyfill')).default
            const port = browser.runtime.connect({ name: BackgroundEventNames.fetch })
            const message: BackgroundFetchRequestMessage = {
                type: 'open',
                details: { url: input, options: fetchOptions },
            }

            const readableStream = new ReadableStream({
                start(controller) {
                    port.onMessage.addListener((msg: BackgroundFetchResponseMessage) => {
                        const { data, error, ...restResp } = msg
                        if (error) {
                            const e = new Error()
                            e.message = error.message
                            e.name = error.name
                            controller.error(e)
                            return
                        }
                        controller.enqueue(textEncoder.encode(data))
                        if (!resolved) {
                            resolve({
                                ...restResp,
                                body: readableStream,
                                text: () => readText(readableStream),
                                json: async () => {
                                    const text = await readText(readableStream)
                                    return JSON.parse(text)
                                },
                            } as unknown as Response)
                            resolved = true
                        }
                    })

                    port.onDisconnect.addListener(() => {
                        signal?.removeEventListener('abort', handleAbort)
                        try {
                            controller.close()
                        } catch (e) {
                            // may throw if controller is errored
                        }
                    })

                    port.postMessage(message)
                },
            })

            function handleAbort() {
                port.postMessage({ type: 'abort' })
            }
            signal?.addEventListener('abort', handleAbort)
        })()
    })
}
