import dayjs from 'dayjs'

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

export function isPromotionItemShowed(item?: IPromotionItem) {
    if (!item) {
        return true
    }
    return localStorage.getItem(`promotion:${item.id}:showed`) === 'true'
}

export function setPromotionItemShowed(item?: IPromotionItem) {
    if (!item) {
        return
    }
    localStorage.setItem(`promotion:${item.id}:showed`, 'true')
}

export function unsetPromotionItemShowed(item?: IPromotionItem) {
    if (!item) {
        return
    }
    localStorage.removeItem(`promotion:${item.id}:showed`)
}
