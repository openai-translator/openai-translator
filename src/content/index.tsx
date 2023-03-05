import React from 'react'
import ReactDOM from 'react-dom'
import icon from './assets/images/icon.png'
import { popupCardID, popupThumbID } from './consts'
import { PopupCard } from './PopupCard'

let hidePopupThumbTimer: number | null = null

const mousePos: { x?: number; y?: number } = { x: undefined, y: undefined }

function popupThumbClickHandler(event: MouseEvent) {
    event.stopPropagation()
    event.preventDefault()
    const $popupThumb: HTMLDivElement | null = document.querySelector(`#${popupThumbID}`)
    if (!$popupThumb) {
        return
    }
    const x = $popupThumb.offsetLeft
    const y = $popupThumb.offsetTop
    showPopupCard(x, y, $popupThumb.dataset['text'] || '')
}

function hidePopupThumb() {
    if (hidePopupThumbTimer) {
        clearTimeout(hidePopupThumbTimer)
    }
    hidePopupThumbTimer = window.setTimeout(() => {
        const $popupThumb: HTMLDivElement | null = document.querySelector(`#${popupThumbID}`)
        if (!$popupThumb) {
            return
        }
        $popupThumb.style.display = 'none'
    }, 100)
}

function hidePopupCard() {
    const $popupCard: HTMLDivElement | null = document.querySelector(`#${popupCardID}`)
    if (!$popupCard) {
        return
    }
    chrome.runtime.sendMessage({
        type: 'stopSpeaking',
    })
    $popupCard.style.display = 'none'
    ReactDOM.unmountComponentAtNode($popupCard)
}

async function showPopupCard(x: number, y: number, text: string) {
    if (!text) {
        return
    }
    hidePopupThumb()
    let $popupCard: HTMLDivElement | null = document.querySelector(`#${popupCardID}`)
    if (!$popupCard) {
        $popupCard = document.createElement('div')
        $popupCard.id = popupCardID
        $popupCard.style.position = 'absolute'
        $popupCard.style.zIndex = '99999999'
        $popupCard.style.background = '#fff'
        $popupCard.style.borderRadius = '4px'
        $popupCard.style.boxShadow = '0 0 6px rgba(0,0,0,.3)'
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
        document.body.appendChild($popupCard)
    }
    $popupCard.style.display = 'block'
    $popupCard.style.width = 'auto'
    $popupCard.style.height = 'auto'
    $popupCard.style.opacity = '100'
    $popupCard.style.left = `${x}px`
    $popupCard.style.top = `${y}px`
    ReactDOM.render(
        <React.StrictMode>
            <PopupCard text={text} />
        </React.StrictMode>,
        $popupCard,
    )
}

function showPopupThumb(text: string) {
    if (!text) {
        return
    }
    if (hidePopupThumbTimer) {
        clearTimeout(hidePopupThumbTimer)
    }
    let $popupThumb: HTMLDivElement | null = document.querySelector(`#${popupThumbID}`)
    if (!$popupThumb) {
        $popupThumb = document.createElement('div')
        $popupThumb.id = popupThumbID
        $popupThumb.style.position = 'absolute'
        $popupThumb.style.zIndex = '99999999'
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
        document.body.appendChild($popupThumb)
    }
    $popupThumb.dataset['text'] = text
    $popupThumb.style.display = 'block'
    $popupThumb.style.opacity = '100'
    $popupThumb.style.left = `${mousePos.x ?? 0}px`
    $popupThumb.style.top = `${mousePos.y ?? 0}px`
}

document.body.addEventListener('mousemove', (event) => {
    mousePos.x = event.clientX + window.scrollX + 7
    mousePos.y = event.clientY + window.scrollY + 7
})

document.addEventListener('mouseup', () => {
    window.setTimeout(() => {
        const text = (window.getSelection()?.toString() ?? '').trim()
        showPopupThumb(text)
    })
})

document.addEventListener('mousedown', () => {
    hidePopupCard()
    hidePopupThumb()
})
