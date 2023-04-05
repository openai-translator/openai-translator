import { createParser } from 'eventsource-parser'
import { backgroundFetch } from '../common/background-fetch'
import { userscriptFetch } from '../common/userscript-polyfill'
import { isFirefox, isUserscript } from '../common/utils'
import { containerID, documentPadding, popupCardID, popupThumbID, zIndex } from './consts'

function attachEventsToContainer($container: HTMLElement) {
    $container.addEventListener('mousedown', (event) => {
        event.stopPropagation()
    })
    $container.addEventListener('mouseup', (event) => {
        event.stopPropagation()
    })
}

export async function getContainer(): Promise<HTMLElement> {
    let $container: HTMLElement | null = document.getElementById(containerID)
    if (!$container) {
        $container = document.createElement('div')
        $container.id = containerID
        attachEventsToContainer($container)
        $container.style.zIndex = zIndex
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const $container_: HTMLElement | null = document.getElementById(containerID)
                if ($container_) {
                    resolve($container_)
                    return
                }
                if (!$container) {
                    reject(new Error('Failed to create container'))
                    return
                }
                const shadowRoot = $container.attachShadow({ mode: 'open' })
                const $inner = document.createElement('div')
                shadowRoot.appendChild($inner)
                const $html = document.body.parentElement
                if ($html) {
                    $html.appendChild($container as HTMLElement)
                } else {
                    document.appendChild($container as HTMLElement)
                }
                resolve($container)
            }, 100)
        })
    }
    return new Promise((resolve) => {
        resolve($container as HTMLElement)
    })
}

export async function queryPopupThumbElement(): Promise<HTMLDivElement | null> {
    const $container = await getContainer()
    return $container.shadowRoot?.querySelector(`#${popupThumbID}`) as HTMLDivElement | null
}

export async function queryPopupCardElement(): Promise<HTMLDivElement | null> {
    const $container = await getContainer()
    return $container.shadowRoot?.querySelector(`#${popupCardID}`) as HTMLDivElement | null
}

interface FetchSSEOptions extends RequestInit {
    onMessage(data: string): void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError(error: any): void
}

export async function fetchSSE(input: string, options: FetchSSEOptions) {
    const { onMessage, onError, ...fetchOptions } = options

    if (isFirefox) {
        return await backgroundFetch(input, options)
    }

    const fetch = isUserscript() ? userscriptFetch : window.fetch
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
    const reader = resp.body.getReader()
    const contentType = resp.headers?.get('content-type')
    try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read()
            if (done) {
                break
            }
            const str = new TextDecoder().decode(value)
            if (contentType === 'application/octet-stream') {
                // only process the final line
                const lastIndex = str.lastIndexOf('\n', str.length - 2)
                const msg = lastIndex === -1 ? str : str.substring(lastIndex)
                onMessage(msg)
            } else {
                parser.feed(str)
            }
        }
    } finally {
        reader.releaseLock()
    }
}

export function calculateMaxXY($popupCard: HTMLElement): number[] {
    const { innerWidth, innerHeight } = window
    const { scrollLeft, scrollTop } = document.documentElement
    const { width, height } = $popupCard.getBoundingClientRect()
    const maxX = scrollLeft + innerWidth - width - documentPadding
    const maxY = scrollTop + innerHeight - height - documentPadding
    return [maxX, maxY]
}
