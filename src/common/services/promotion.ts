import dayjs from 'dayjs'
import { isDesktopApp, isUserscript } from '../utils'
import { backgroundGetItem, backgroundRemoveItem, backgroundSetItem } from '../background/local-storage'

export interface II18nPromotionContent {
    'en'?: string
    'th'?: string
    'ja'?: string
    'ko'?: string
    'zh-Hans': string
    'zh-Hant'?: string
}

export type PromotionFormat = 'markdown' | 'html' | 'text'

export interface II18nPromotionContentItem {
    content: II18nPromotionContent
    format: PromotionFormat
    fallback_language: keyof II18nPromotionContent
}

export interface IPromotionItem {
    id: string
    promotion: II18nPromotionContentItem
    disclaimer: II18nPromotionContentItem
    configuration_doc_link?: string
    started_at?: string
    ended_at?: string
    version_constraint?: string
}

export interface IPromotionResponse {
    openai_api_key?: IPromotionItem[]
}

export async function fetchPromotions(): Promise<IPromotionResponse> {
    const resp = await fetch(
        `https://raw.githubusercontent.com/yetone/openai-translator-configs/main/promotions.json?ts=${Date.now()}`,
        { cache: 'no-cache' }
    )
    if (!resp.ok) {
        throw new Error(resp.statusText)
    }
    return resp.json()
}

export function getPromotionItem(items?: IPromotionItem[]) {
    if (!items) {
        return undefined
    }

    return items.find(isPromotionItemAvailable)
}

export function isPromotionItemAvailable(item?: IPromotionItem) {
    if (!item) {
        return false
    }
    if (item.started_at) {
        if (dayjs(item.started_at).isAfter(dayjs())) {
            return false
        }
    }
    if (item.ended_at) {
        if (dayjs(item.ended_at).isBefore(dayjs())) {
            return false
        }
    }
    return true
}

function getPromotionItemShowedKey(item: IPromotionItem) {
    return `promotion:${item.id}:showed`
}

export async function isPromotionItemShowed(item?: IPromotionItem): Promise<boolean> {
    if (!item) {
        return true
    }
    const key = getPromotionItemShowedKey(item)
    if (isDesktopApp() || isUserscript()) {
        return localStorage.getItem(key) === 'true'
    }
    return (await backgroundGetItem(key)) === 'true'
}

export async function setPromotionItemShowed(item?: IPromotionItem) {
    if (!item) {
        return
    }
    const key = getPromotionItemShowedKey(item)
    if (isDesktopApp() || isUserscript()) {
        localStorage.setItem(key, 'true')
    }
    return await backgroundSetItem(key, 'true')
}

export async function unsetPromotionItemShowed(item?: IPromotionItem) {
    if (!item) {
        return
    }
    const key = getPromotionItemShowedKey(item)
    if (isDesktopApp() || isUserscript()) {
        localStorage.removeItem(`promotion:${item.id}:showed`)
    }
    return await backgroundRemoveItem(key)
}
