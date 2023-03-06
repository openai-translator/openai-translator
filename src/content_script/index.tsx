import '@webcomponents/webcomponentsjs'
import React from 'react'
import icon from './assets/images/icon.png'
import { popupCardID, popupThumbID, zIndex } from './consts'
import { PopupCard } from './PopupCard'
import { getContainer, queryPopupCardElement, queryPopupThumbElement } from './utils'
import { create } from 'jss'
import preset from 'jss-preset-default'
import { JssProvider, createGenerateId } from 'react-jss'
import { Client as Styletron } from 'styletron-engine-atomic'
import { createRoot, Root } from 'react-dom/client'

let root: Root | null = null
const generateId = createGenerateId()
const hidePopupThumbTimer: number | null = null

async function popupThumbClickHandler(event: MouseEvent) {
    event.stopPropagation()
    event.preventDefault()
    const $popupThumb: HTMLDivElement | null = await queryPopupThumbElement()
    if (!$popupThumb) {
        return
    }
    const x = $popupThumb.offsetLeft
    const y = $popupThumb.offsetTop
    showPopupCard(x, y, $popupThumb.dataset['text'] || '')
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
    chrome.runtime.sendMessage({
        type: 'stopSpeaking',
    })
    if (root) {
        root.unmount()
        root = null
    }
    removeContainer()
}

async function showPopupCard(x: number, y: number, text: string) {
    if (!text) {
        return
    }
    const $popupThumb: HTMLDivElement | null = await queryPopupThumbElement()
    if ($popupThumb) {
        $popupThumb.style.display = 'none'
    }
    let $popupCard: HTMLDivElement | null = await queryPopupCardElement()
    if (!$popupCard) {
        $popupCard = document.createElement('div')
        $popupCard.id = popupCardID
        $popupCard.style.position = 'absolute'
        $popupCard.style.zIndex = zIndex
        $popupCard.style.background = '#fff'
        $popupCard.style.borderRadius = '4px'
        $popupCard.style.boxShadow = '0 0 8px rgba(0,0,0,.3)'
        $popupCard.style.minWidth = '200px'
        $popupCard.style.maxWidth = '600px'
        $popupCard.style.lineHeight = '1.6'
        $popupCard.style.fontSize = '13px'
        $popupCard.style.color = '#333'
        $popupCard.style.font =
            '14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji'
        $popupCard.addEventListener('mousedown', (event) => {
            event.stopPropagation()
        })
        $popupCard.addEventListener('mouseup', (event) => {
            event.stopPropagation()
        })
        const $container = await getContainer()
        $container.appendChild($popupCard)
    }
    $popupCard.style.display = 'block'
    $popupCard.style.width = 'auto'
    $popupCard.style.height = 'auto'
    $popupCard.style.opacity = '100'
    $popupCard.style.left = `${x}px`
    $popupCard.style.top = `${y}px`
    const engine = new Styletron({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        container: $popupCard.parentElement as any,
        prefix: '__yetone-openai-translator-styletron-',
    })
    const jss = create().setup({
        ...preset(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        insertionPoint: $popupCard.parentElement as any,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const JSS = JssProvider as any
    root = createRoot($popupCard)
    root.render(
        <React.StrictMode>
            <div>
                <JSS jss={jss} generateId={generateId} classNamePrefix='__yetone-openai-translator-jss-'>
                    <PopupCard text={text} engine={engine} />
                </JSS>
            </div>
        </React.StrictMode>,
    )
}

async function showPopupThumb(text: string, x: number, y: number) {
    if (!text) {
        return
    }
    if (hidePopupThumbTimer) {
        clearTimeout(hidePopupThumbTimer)
    }
    let $popupThumb: HTMLDivElement | null = await queryPopupThumbElement()
    if (!$popupThumb) {
        $popupThumb = document.createElement('div')
        $popupThumb.id = popupThumbID
        $popupThumb.style.position = 'absolute'
        $popupThumb.style.zIndex = zIndex
        $popupThumb.style.background = '#fff'
        $popupThumb.style.padding = '2px'
        $popupThumb.style.borderRadius = '4px'
        $popupThumb.style.boxShadow = '0 0 4px rgba(0,0,0,.2)'
        $popupThumb.style.cursor = 'pointer'
        $popupThumb.style.userSelect = 'none'
        $popupThumb.style.width = '20px'
        $popupThumb.style.height = '20px'
        $popupThumb.style.overflow = 'hidden'
        $popupThumb.addEventListener('click', popupThumbClickHandler)
        $popupThumb.addEventListener('mousemove', (event) => {
            event.stopPropagation()
        })
        $popupThumb.addEventListener('mousedown', (event) => {
            event.stopPropagation()
        })
        $popupThumb.addEventListener('mouseup', (event) => {
            event.stopPropagation()
        })
        const $img = document.createElement('img')
        $img.src = icon
        $img.style.display = 'block'
        $img.style.width = '100%'
        $img.style.height = '100%'
        $popupThumb.appendChild($img)
        const $container = await getContainer()
        $container.appendChild($popupThumb)
    }
    $popupThumb.dataset['text'] = text
    $popupThumb.style.display = 'block'
    $popupThumb.style.opacity = '100'
    $popupThumb.style.left = `${x}px`
    $popupThumb.style.top = `${y}px`
}

document.addEventListener('mouseup', (event: MouseEvent) => {
    window.setTimeout(() => {
        const text = (window.getSelection()?.toString() ?? '').trim()
        showPopupThumb(text, event.pageX + 7, event.pageY + 7)
    })
})

document.addEventListener('mousedown', () => {
    hidePopupCard()
    hidePopupThumb()
})
