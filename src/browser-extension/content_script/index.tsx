import * as utils from '../../common/utils'
import React from 'react'
import icon from '../../common/assets/images/icon.png'
import {
    documentPadding,
    popupCardID,
    popupCardMaxWidth,
    popupCardMinHeight,
    popupCardMinWidth,
    popupCardOffset,
    popupThumbID,
    zIndex,
} from './consts'
import { Translator } from '../../common/components/Translator'
import { getContainer, queryPopupCardElement, queryPopupThumbElement } from './utils'
import { create } from 'jss'
import preset from 'jss-preset-default'
import { JssProvider, createGenerateId } from 'react-jss'
import { Client as Styletron } from 'styletron-engine-atomic'
import { createRoot, Root } from 'react-dom/client'
import hotkeys from 'hotkeys-js'
import '../../common/i18n.js'
import { PREFIX } from '../../common/constants'
import { getClientX, getClientY, getPageX, getPageY, UserEventType } from '../../common/user-event'
import { GlobalSuspense } from '../../common/components/GlobalSuspense'
import { computePosition, shift, flip, offset, size, type ReferenceElement } from '@floating-ui/dom'

let root: Root | null = null
const generateId = createGenerateId()
const hidePopupThumbTimer: number | null = null

async function popupThumbClickHandler(event: UserEventType) {
    event.stopPropagation()
    event.preventDefault()
    const $popupThumb: HTMLDivElement | null = await queryPopupThumbElement()
    if (!$popupThumb) {
        return
    }
    showPopupCard($popupThumb, $popupThumb.dataset['text'] || '')
}

async function removeContainer() {
    const $container = await getContainer()
    $container.remove()
}

async function hidePopupThumb() {
    const $popupThumb: HTMLDivElement | null = await queryPopupThumbElement()
    if (!$popupThumb) {
        return
    }
    removeContainer()
}

async function hidePopupCard() {
    const $popupCard: HTMLDivElement | null = await queryPopupCardElement()
    if (!$popupCard) {
        return
    }
    speechSynthesis.cancel()
    if (root) {
        root.unmount()
        root = null
    }
    removeContainer()
}

async function showPopupCard(reference: ReferenceElement, text: string, autoFocus: boolean | undefined = false) {
    const $popupThumb: HTMLDivElement | null = await queryPopupThumbElement()
    if ($popupThumb) {
        $popupThumb.style.visibility = 'hidden'
    }

    let $popupCard: HTMLDivElement | null = await queryPopupCardElement()
    if (!$popupCard) {
        $popupCard = document.createElement('div')
        $popupCard.id = popupCardID
        $popupCard.style.position = 'fixed'
        $popupCard.style.zIndex = zIndex
        $popupCard.style.borderRadius = '4px'
        $popupCard.style.boxShadow = '0 0 8px rgba(0,0,0,.3)'
        $popupCard.style.minWidth = `${popupCardMinWidth}px`
        $popupCard.style.maxWidth = `${popupCardMaxWidth}px`
        $popupCard.style.lineHeight = '1.6'
        $popupCard.style.fontSize = '13px'
        $popupCard.style.color = '#333'
        $popupCard.style.font =
            '14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji'
        const $container = await getContainer()
        $container.shadowRoot?.querySelector('div')?.appendChild($popupCard)
    }
    $popupCard.style.display = 'block'
    $popupCard.style.width = 'max-content'
    $popupCard.style.minHeight = `${popupCardMinHeight}px`
    $popupCard.style.opacity = '100'

    async function update() {
        if (!$popupCard) {
            return
        }
        const { x, y } = await computePosition(reference, $popupCard, {
            placement: 'bottom',
            middleware: [
                shift({ padding: documentPadding }),
                offset(popupCardOffset),
                flip(),
                size({
                    apply({ availableHeight, elements }) {
                        Object.assign(elements.floating.style, {
                            maxHeight: `${availableHeight}px`,
                        })
                    },
                }),
            ],
            strategy: 'fixed',
        })
        $popupCard.style.left = `${x}px`
        $popupCard.style.top = `${y}px`
    }

    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe($popupCard)

    const engine = new Styletron({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        container: $popupCard.parentElement as any,
        prefix: `${PREFIX}-styletron-`,
    })
    const jss = create().setup({
        ...preset(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        insertionPoint: $popupCard.parentElement as any,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const JSS = JssProvider as any
    const isUserscript = utils.isUserscript()
    root = createRoot($popupCard)
    root.render(
        <React.StrictMode>
            <GlobalSuspense>
                <div>
                    <JSS jss={jss} generateId={generateId} classNamePrefix='__yetone-openai-translator-jss-'>
                        <Translator
                            text={text}
                            engine={engine}
                            autoFocus={autoFocus}
                            showSettings={isUserscript ? true : false}
                            defaultShowSettings={isUserscript ? true : false}
                        />
                    </JSS>
                </div>
            </GlobalSuspense>
        </React.StrictMode>
    )
}

async function showPopupThumb(text: string, x: number, y: number) {
    if (!text) {
        return
    }
    if (hidePopupThumbTimer) {
        clearTimeout(hidePopupThumbTimer)
    }
    const isDark = await utils.isDarkMode()
    let $popupThumb: HTMLDivElement | null = await queryPopupThumbElement()
    if (!$popupThumb) {
        $popupThumb = document.createElement('div')
        $popupThumb.id = popupThumbID
        $popupThumb.style.position = 'absolute'
        $popupThumb.style.zIndex = zIndex
        $popupThumb.style.background = isDark ? '#1f1f1f' : '#fff'
        $popupThumb.style.padding = '2px'
        $popupThumb.style.borderRadius = '4px'
        $popupThumb.style.boxShadow = '0 0 4px rgba(0,0,0,.2)'
        $popupThumb.style.cursor = 'pointer'
        $popupThumb.style.userSelect = 'none'
        $popupThumb.style.width = '20px'
        $popupThumb.style.height = '20px'
        $popupThumb.style.overflow = 'hidden'
        $popupThumb.addEventListener('click', popupThumbClickHandler)
        $popupThumb.addEventListener('touchend', popupThumbClickHandler)
        $popupThumb.addEventListener('mousemove', (event) => {
            event.stopPropagation()
        })
        $popupThumb.addEventListener('touchmove', (event) => {
            event.stopPropagation()
        })
        const $img = document.createElement('img')
        $img.src = icon
        $img.style.display = 'block'
        $img.style.width = '100%'
        $img.style.height = '100%'
        $popupThumb.appendChild($img)
        const $container = await getContainer()
        $container.shadowRoot?.querySelector('div')?.appendChild($popupThumb)
    }
    $popupThumb.dataset['text'] = text
    $popupThumb.style.visibility = 'visible'
    $popupThumb.style.opacity = '100'
    $popupThumb.style.left = `${x}px`
    $popupThumb.style.top = `${y}px`
}

async function main() {
    const browser = await utils.getBrowser()
    let mousedownTarget: EventTarget | null
    let lastMouseEvent: UserEventType | undefined

    const mouseUpHandler = async (event: UserEventType) => {
        lastMouseEvent = event
        const settings = await utils.getSettings()
        if (
            (mousedownTarget instanceof HTMLInputElement || mousedownTarget instanceof HTMLTextAreaElement) &&
            settings.selectInputElementsText === false
        ) {
            return
        }
        window.setTimeout(async () => {
            const sel = window.getSelection()
            let text = (sel?.toString() ?? '').trim()
            if (!text) {
                if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                    const elem = event.target
                    text = elem.value.substring(elem.selectionStart ?? 0, elem.selectionEnd ?? 0).trim()
                }
            } else {
                if (settings.autoTranslate === true) {
                    const x = getClientX(event)
                    const y = getClientY(event)
                    showPopupCard(
                        { getBoundingClientRect: () => new DOMRect(x, y, popupCardOffset, popupCardOffset) },
                        text
                    )
                } else if (settings.alwaysShowIcons === true) {
                    showPopupThumb(text, getPageX(event) + popupCardOffset, getPageY(event) + popupCardOffset)
                }
            }
        })
    }

    document.addEventListener('mouseup', mouseUpHandler)
    document.addEventListener('touchend', mouseUpHandler)

    browser.runtime.onMessage.addListener(function (request) {
        if (request.type === 'open-translator') {
            if (window !== window.top) return
            const text = request.info.selectionText ?? ''
            const x = lastMouseEvent ? getClientX(lastMouseEvent) : 0
            const y = lastMouseEvent ? getClientY(lastMouseEvent) : 0
            showPopupCard({ getBoundingClientRect: () => new DOMRect(x, y, popupCardOffset, popupCardOffset) }, text)
        }
    })

    const mouseDownHandler = async (event: UserEventType) => {
        mousedownTarget = event.target
        hidePopupCard()
        hidePopupThumb()
    }
    document.addEventListener('mousedown', mouseDownHandler)
    document.addEventListener('touchstart', mouseDownHandler)

    const settings = await utils.getSettings()

    await bindHotKey(settings.hotkey)
}

export async function bindHotKey(hotkey_: string | undefined) {
    const hotkey = hotkey_?.trim().replace(/-/g, '+')

    if (!hotkey) {
        return
    }

    hotkeys(hotkey, (event) => {
        event.preventDefault()
        const sel = window.getSelection()
        let text = (sel?.toString() ?? '').trim()
        if (!text) {
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                const elem = event.target
                text = elem.value.substring(elem.selectionStart ?? 0, elem.selectionEnd ?? 0)
            }
        }
        const selRange = sel?.getRangeAt(0)
        selRange && showPopupCard({ getBoundingClientRect: () => selRange.getBoundingClientRect() }, text)
    })
}

if (utils.isFirefox()) {
    // workaround for `"then" is read-only` error caused by dexie in firefox
    const nativeP = crypto.subtle.digest('SHA-512', new Uint8Array([0]))
    Object.defineProperty(Object.getPrototypeOf(nativeP), 'then', {
        get: () => Promise.prototype.then,
        set: () => {
            // do nothing
        },
    })
}

main()
