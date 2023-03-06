import { createParser } from 'eventsource-parser'
import { containerTagName, popupCardID, popupThumbID, zIndex } from './consts'

export async function getContainer(): Promise<HTMLElement> {
    let $container: HTMLElement | null = document.querySelector(containerTagName)
    if (!$container) {
        $container = document.createElement(containerTagName)
        $container.style.zIndex = zIndex
        return new Promise((resolve) => {
            setTimeout(() => {
                const $container_: HTMLElement | null = document.querySelector(containerTagName)
                if ($container_) {
                    resolve($container_)
                    return
                }
                const $html = document.body.parentElement
                if ($html) {
                    $html.appendChild($container as HTMLElement)
                } else {
                    document.appendChild($container as HTMLElement)
                }
                resolve($container as HTMLElement)
            }, 100)
        })
    }
    return new Promise((resolve) => {
        resolve($container as HTMLElement)
    })
}

export async function queryPopupThumbElement(): Promise<HTMLDivElement | null> {
    const $container = await getContainer()
    return $container.querySelector(`#${popupThumbID}`) as HTMLDivElement | null
}

export async function queryPopupCardElement(): Promise<HTMLDivElement | null> {
    const $container = await getContainer()
    return $container.querySelector(`#${popupCardID}`) as HTMLDivElement | null
}

export async function* streamAsyncIterable(stream: ReadableStream<Uint8Array> | null) {
    if (!stream) {
        return
    }
    const reader = stream.getReader()
    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) {
                return
            }
            yield value
        }
    } finally {
        reader.releaseLock()
    }
}

interface FetchSSEOptions extends RequestInit {
    onMessage(data: string): void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError(error: any): void
}

export async function fetchSSE(input: string, options: FetchSSEOptions) {
    const { onMessage, onError, ...fetchOptions } = options
    const resp = await fetch(input, fetchOptions)
    if (resp.status !== 200) {
        onError(await resp.json())
        return
    }
    const parser = createParser((event) => {
        if (event.type === 'event') {
            onMessage(event.data)
        }
    })
    for await (const chunk of streamAsyncIterable(resp.body)) {
        const str = new TextDecoder().decode(chunk)
        parser.feed(str)
    }
}
