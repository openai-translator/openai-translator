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
    return $container.shadowRoot?.getElementById(popupThumbID) as HTMLDivElement | null
}

export async function queryPopupCardElement(): Promise<HTMLDivElement | null> {
    const $container = await getContainer()
    return $container.shadowRoot?.getElementById(popupCardID) as HTMLDivElement | null
}
