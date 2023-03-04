import icon from './assets/images/icon.png'
import { translate } from './translate'
import { detectLang } from './lang'

const popupThumbID = '__yetone-openai-translator-popup-thumb'
const popupCardID = '__yetone-openai-translator-popup-card'
let hidePopupThumbTimer: number | null = null
let txt = ''

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
    showPopupCard(x, y)
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
    $popupCard.style.display = 'none'
}

async function showPopupCard(x: number, y: number) {
    if (!txt) {
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
        // $popupCard.addEventListener('mousemove', (event) => {
        //     event.stopPropagation()
        // })
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
    $popupCard.innerHTML = ''
    const $loading = document.createElement('div')
    $loading.style.padding = '10px'
    $loading.style.display = 'flex'
    $loading.style.flexDirection = 'row'
    $loading.style.alignItems = 'center'
    $loading.style.gap = '10px'
    $loading.style.fontSize = '13px'
    const loadingIcons = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘']
    let loadingIndex = 0
    const loading = () => {
        $loading.innerHTML = `<div>${loadingIcons[loadingIndex]}</div><div>Loading...</div>`
        loadingIndex = (loadingIndex + 1) % loadingIcons.length
    }
    loading()
    const loadingTimer = setInterval(loading, 300)
    $popupCard.appendChild($loading)
    try {
        const detectFrom = detectLang(txt) ?? 'en'
        const detectTo = detectFrom === 'zh' ? 'en' : 'zh'
        const res = await translate({
            text: txt,
            detectFrom,
            detectTo,
        })
        clearInterval(loadingTimer)
        $popupCard.innerHTML = ''
        if (res.error) {
            $popupCard.appendChild(getErrorContainer(res.error))
            return
        }
        if (!res.text) {
            $popupCard.appendChild(getErrorContainer('No result'))
            return
        }
        const $container = document.createElement('div')
        $container.style.display = 'flex'
        $container.style.flexDirection = 'column'
        $container.style.alignItems = 'flex-start'
        $container.style.justifyContent = 'flex-start'
        $container.style.width = '100%'
        $container.style.height = '100%'
        $container.style.overflow = 'auto'
        const $header = document.createElement('div')
        $header.style.display = 'flex'
        $header.style.flexDirection = 'row'
        $header.style.alignItems = 'center'
        $header.style.justifyContent = 'flex-start'
        $header.style.width = '100%'
        $header.style.padding = '5px 10px'
        $header.style.borderBottom = '1px solid #eee'
        $header.style.gap = '10px'
        $header.style.cursor = 'move'
        const $icon = document.createElement('img')
        $icon.src = icon
        $icon.style.width = '16px'
        $icon.style.height = '16px'
        $header.appendChild($icon)
        const $from = document.createElement('div')
        $from.style.display = 'flex'
        $from.innerText = `${res.from ?? 'auto'}`.toUpperCase()
        $from.style.color = '#999'
        $from.style.fontSize = '12px'
        $header.appendChild($from)
        $header.appendChild(getArrowIcon())
        const $to = document.createElement('div')
        $to.style.display = 'flex'
        $to.innerText = `${res.to ?? 'auto'}`.toUpperCase()
        $to.style.color = '#999'
        $to.style.fontSize = '12px'
        $header.appendChild($to)
        $container.appendChild($header)
        const $content = document.createElement('div')
        $content.innerText = res.text
        $content.style.padding = '10px'
        $container.appendChild($content)
        $popupCard.appendChild($container)
        const $close = document.createElement('div')
        $close.style.position = 'absolute'
        $close.style.top = '0'
        $close.style.right = '0'
        $close.style.padding = '10px'
        $close.style.cursor = 'pointer'
        $close.innerText = 'X'
        $close.addEventListener('click', () => {
            if ($popupCard) {
                $popupCard.style.display = 'none'
            }
        })
        dragElement($popupCard, $header)
    } catch (error) {
        $popupCard.innerHTML = ''
        $popupCard.appendChild(getErrorContainer(error as string))
        throw error
    }
}

function dragElement($ele: HTMLDivElement, $header: HTMLDivElement) {
    let closed = true

    $header.addEventListener('mousedown', dragMouseDown)
    $header.addEventListener('mouseup', closeDragElement)

    function dragMouseDown(e: MouseEvent) {
        closed = false
        e = e || window.event
        e.preventDefault()
        document.addEventListener('mouseup', closeDragElement)
        document.addEventListener('mousemove', elementDrag)
    }

    function elementDrag(e: MouseEvent) {
        if (closed) {
            return
        }
        e = e || window.event
        e.preventDefault()
        console.dir(e)
        $ele.style.top = $ele.offsetTop + e.movementY + 'px'
        $ele.style.left = $ele.offsetLeft + e.movementX + 'px'
    }

    function closeDragElement() {
        closed = true
        document.removeEventListener('mouseup', closeDragElement)
        document.removeEventListener('mousemove', elementDrag)
    }
}

function getArrowIcon() {
    const $arrow = document.createElement('div')
    $arrow.innerText = '➡'
    $arrow.style.color = '#999'
    return $arrow
}

function getErrorContainer(error: string) {
    const $content = document.createElement('div')
    $content.style.padding = '10px'
    $content.style.color = 'red'
    $content.innerText = error
    return $content
}

function showPopupThumb() {
    if (!txt) {
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
        $img.style.width = '16px'
        $img.style.height = '16px'
        $popupThumb.appendChild($img)
        document.body.appendChild($popupThumb)
    }
    $popupThumb.style.display = 'block'
    $popupThumb.style.width = 'auto'
    $popupThumb.style.height = 'auto'
    $popupThumb.style.opacity = '100'
    $popupThumb.style.left = `${mousePos.x ?? 0}px`
    $popupThumb.style.top = `${mousePos.y ?? 0}px`
}

document.body.addEventListener('mousemove', (event) => {
    mousePos.x = event.clientX + window.scrollX + 7
    mousePos.y = event.clientY + window.scrollY + 7
})

document.addEventListener('mouseup', () => {
    console.log('mouseup')
    window.setTimeout(() => {
        txt = (window.getSelection()?.toString() ?? '').trim()
        showPopupThumb()
    })
})

document.addEventListener('mousedown', () => {
    hidePopupCard()
    hidePopupThumb()
})
