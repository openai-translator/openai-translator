import * as utils from '../../common/utils'
import icon from '../../common/assets/images/icon.png'
import { popupThumbID, zIndex } from './consts'
import { getContainer, queryPopupCardElement, queryPopupThumbElement } from './utils'

import hotkeys from 'hotkeys-js'
import '../../common/i18n.js'
import Browser from 'webextension-polyfill'
import { setupProxyExecutor } from '../../common/services/proxy-fetch'

function injectTip() {
    const div = document.createElement('div')
    div.innerText = 'Please keep this tab open, now you can go back to ChatHub'
    div.style.position = 'fixed'
    // put the div at right top of page
    div.style.top = '0'
    div.style.right = '0'
    div.style.zIndex = '50'
    div.style.padding = '10px'
    div.style.margin = '10px'
    div.style.border = '1px solid'
    div.style.color = 'red'
    document.body.appendChild(div)
}

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
    sendText($popupThumb.dataset['text'] || '')
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

async function sendText(text: string) {
    const $popupThumb: HTMLDivElement | null = await queryPopupThumbElement()
    if ($popupThumb) {
        $popupThumb.style.display = 'none'
    }

    chrome.runtime.sendMessage({ type: 'Text', text: text })
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
        $popupThumb.addEventListener('mousemove', (event) => {
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
    $popupThumb.style.display = 'block'
    $popupThumb.style.opacity = '100'
    $popupThumb.style.left = `${x}px`
    $popupThumb.style.top = `${y}px`
}

async function main() {
    const browser = await utils.getBrowser()
    let mousedownTarget: EventTarget | null
    let lastMouseEvent: MouseEvent | undefined

    Browser.runtime.onMessage.addListener(async (message) => {
        if (message === 'url') {
            return location.href
        }
    })
    if ((window as any).__NEXT_DATA__) {
        if (await Browser.runtime.sendMessage({ event: 'PROXY_TAB_READY' })) {
            injectTip()
        }
    }

    document.addEventListener('mouseup', async (event: MouseEvent) => {
        lastMouseEvent = event
        const settings = await utils.getSettings()
        if (
            (mousedownTarget instanceof HTMLInputElement || mousedownTarget instanceof HTMLTextAreaElement) &&
            settings.selectInputElementsText === false
        ) {
            return
        }
        window.setTimeout(async () => {
            let text = (window.getSelection()?.toString() ?? '').trim()
            if (!text) {
                if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                    const elem = event.target
                    text = elem.value.substring(elem.selectionStart ?? 0, elem.selectionEnd ?? 0).trim()
                }
            } else {
                if (settings.autoTranslate === true) {
                    sendText(text)
                } else if (settings.alwaysShowIcons === true) {
                    showPopupThumb(text, event.pageX + 7, event.pageY + 7)
                }
            }
        })
    })

    browser.runtime.onMessage.addListener(function (request) {
        if (request.type === 'open-translator') {
            if (window !== window.top) return
            const text = request.info.selectionText ?? ''
            sendText(text)
        }
    })

    document.addEventListener('mousedown', (event: MouseEvent) => {
        mousedownTarget = event.target
        hidePopupCard()
        hidePopupThumb()
    })

    const settings = await utils.getSettings()

    await bindHotKey(settings.hotkey)
}

const config = {
    chatgptArkoseReqUrl: localStorage.getItem('chatgptArkoseReqUrl') || '',
    chatgptArkoseReqParams: 'cgb=vhwi',
    chatgptArkoseReqForm: localStorage.getItem('chatgptArkoseReqForm') || '',
}

export async function getArkoseToken() {
    console.log('getArkoseToken', config)
    if (!config.chatgptArkoseReqUrl)
        throw new Error(
            'Please login at https://chat.openai.com first' +
                '\n\n' +
                "Please keep https://chat.openai.com open and try again. If it still doesn't work, type some characters in the input box of chatgpt web page and try again."
        )
    const arkoseToken = await fetch(config.chatgptArkoseReqUrl + '?' + config.chatgptArkoseReqParams, {
        method: 'POST',
        body: config.chatgptArkoseReqForm,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
    })
        .then((resp) => resp.json())
        .then((resp) => resp.token)
        .catch(() => null)
    if (!arkoseToken)
        throw new Error(
            'Failed to get arkose token.' +
                '\n\n' +
                "Please keep https://chat.openai.com open and try again. If it still doesn't work, type some characters in the input box of chatgpt web page and try again."
        )
    console.log(arkoseToken)

    return arkoseToken
}

export async function bindHotKey(hotkey_: string | undefined) {
    const hotkey = hotkey_?.trim().replace(/-/g, '+')

    if (!hotkey) {
        return
    }

    hotkeys(hotkey, (event) => {
        event.preventDefault()
        let text = (window.getSelection()?.toString() ?? '').trim()
        if (!text) {
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                const elem = event.target
                text = elem.value.substring(elem.selectionStart ?? 0, elem.selectionEnd ?? 0)
            }
        }
        hidePopupCard()
        // sendText in center of screen
        sendText(text)
    })

    chrome.runtime.onMessage.addListener((request: any, sender, sendResponse) => {
        console.log('Token received. Request:', request)
        if (request.action === 'getLocalStorage') {
            console.log(localStorage.getItem('arkoseToken'))
            const value = localStorage.getItem(request.key)
            if (value === null) {
                console.error('No value found for key:', request.key)
                sendResponse({ value: undefined }) // or provide a default value
            } else {
                console.log('receive:' + value)
                sendResponse({ value: value })
            }
        }
        return true // 必须返回true
    })
}
setupProxyExecutor()
main()
