import React from 'react'
import ReactDOM from 'react-dom'
import icon from './assets/images/icon.png'
import { popupCardID, popupThumbID, zIndex } from './consts'
import { PopupCard } from './PopupCard'

let hidePopupThumbTimer: number | null = null

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

async function tryToRemoveContainer() {
    const $popupThumb: HTMLDivElement | null = document.querySelector(`#${popupThumbID}`)
    const $popupCard: HTMLDivElement | null = document.querySelector(`#${popupCardID}`)
    if (
        $popupThumb &&
        $popupThumb.style.display === 'none' &&
        $popupCard &&
        $popupCard.style.display === 'none'
    ) {
        const $container = await getContainer()
        $container.remove()
    }
}

async function hidePopupThumb() {
    if (hidePopupThumbTimer) {
        clearTimeout(hidePopupThumbTimer)
    }
    hidePopupThumbTimer = window.setTimeout(() => {
        const $popupThumb: HTMLDivElement | null = document.querySelector(`#${popupThumbID}`)
        if (!$popupThumb) {
            return
        }
        $popupThumb.style.display = 'none'
        tryToRemoveContainer()
    }, 100)
}

async function hidePopupCard() {
    const $popupCard: HTMLDivElement | null = document.querySelector(`#${popupCardID}`)
    if (!$popupCard) {
        return
    }
    chrome.runtime.sendMessage({
        type: 'stopSpeaking',
    })
    $popupCard.style.display = 'none'
    ReactDOM.unmountComponentAtNode($popupCard)
    await tryToRemoveContainer()
}

async function getContainer(): Promise<HTMLElement> {
    const containerTagName = 'yetone-openai-translator'
    let $container: HTMLElement | null = document.querySelector(containerTagName)
    if (!$container) {
        $container = document.createElement(containerTagName)
        $container.style.zIndex = zIndex
        return new Promise((resolve) => {
            setTimeout(() => {
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
        $popupCard.style.zIndex = zIndex
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
        const $container = await getContainer()
        $container.appendChild($popupCard)
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

async function showPopupThumb(text: string, x: number, y: number) {
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
