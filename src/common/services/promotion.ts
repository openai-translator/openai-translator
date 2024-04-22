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
    can_never_display?: boolean
}

export interface IPromotionResponse {
    openai_api_key?: IPromotionItem[]
    settings_header?: IPromotionItem[]
}

export async function fetchPromotions(): Promise<IPromotionResponse> {
    try {
        const resp = await fetch(
            `https://raw.githubusercontent.com/yetone/openai-translator-configs/main/promotions.json?ts=${Date.now()}`,
            { cache: 'no-cache' }
        )
        if (!resp.ok) {
            throw new Error(resp.statusText)
        }
        return resp.json()
    } catch (error) {
        console.error('Error fetching promotions: ', error)

        return {
            openai_api_key: [
                {
                    id: '3',
                    promotion: {
                        content: {
                            'zh-Hans':
                                '推荐 [Aihubmix](https://sourl.cn/RCXQLM) 的 OpenAI API 密钥，速度飞快，经济实惠，1 美元 OpenAI API 额度只需人民币 4.2 元。',
                        },
                        format: 'markdown',
                        fallback_language: 'zh-Hans',
                    },
                    disclaimer: {
                        content: {
                            'zh-Hans':
                                '免责声明：这是一个合作推广，虽然此 OpenAI API 密钥在推广前已经经过本软件的全面测试，但是由于本软件推荐的 OpenAI API 密钥由第三方平台 [Aihubmix](https://sourl.cn/RCXQLM) 提供，所以本软件不对密钥的有效性和安全性负责，请自行承担购买和使用密钥的风险。',
                        },
                        format: 'markdown',
                        fallback_language: 'zh-Hans',
                    },
                    started_at: '2023-12-11T00:00:00+08:00',
                },
            ],
        }
    }
}

export async function choicePromotionItem(items?: IPromotionItem[]) {
    if (!items) {
        return undefined
    }

    const availablePromotions = await Promise.all(
        items.filter(isPromotionItemAvailable).map(async (item) => {
            return {
                item,
                showed: await isPromotionItemShowed(item),
            }
        })
    )

    const unshowedPromotions = availablePromotions.filter((item) => !item.showed)

    const item = unshowedPromotions[Math.floor(Math.random() * unshowedPromotions.length)]?.item
    if (item) {
        return item
    }

    return availablePromotions[Math.floor(Math.random() * availablePromotions.length)]?.item
}

export function isPromotionItemAvailable(item?: IPromotionItem) {
    if (!item) {
        return false
    }
    const now = dayjs()
    if (item.started_at) {
        if (dayjs(item.started_at).isAfter(now)) {
            return false
        }
    }
    if (item.ended_at) {
        if (dayjs(item.ended_at).isBefore(now)) {
            return false
        }
    }
    return true
}

function getPromotionItemShowedKey(item: IPromotionItem) {
    return `promotion:${item.id}:showed`
}

function getPromotionItemNeverDisplayKey(item: IPromotionItem) {
    return `promotion:${item.id}:never_display`
}

const lastShowPromotionItemTimestampKey = 'promotion:last-show-timestamp'

export async function checkShouldShowPromotionNotification() {
    let timestamp: string | null
    if (isDesktopApp() || isUserscript()) {
        timestamp = localStorage.getItem(lastShowPromotionItemTimestampKey)
    } else {
        timestamp = await backgroundGetItem(lastShowPromotionItemTimestampKey)
    }
    if (!timestamp) {
        return true
    }
    const lastShowDatetime = dayjs(timestamp)
    if (dayjs().isAfter(lastShowDatetime.add(30, 'minutes'))) {
        return true
    }
    return false
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
        localStorage.setItem(lastShowPromotionItemTimestampKey, dayjs().toISOString())
        return
    }
    await backgroundSetItem(key, 'true')
    await backgroundSetItem(lastShowPromotionItemTimestampKey, dayjs().toISOString())
}

export async function unsetPromotionItemShowed(item?: IPromotionItem) {
    if (!item) {
        return
    }
    const key = getPromotionItemShowedKey(item)
    if (isDesktopApp() || isUserscript()) {
        localStorage.removeItem(key)
        return
    }
    return await backgroundRemoveItem(key)
}

export async function isPromotionItemNeverDisplay(item?: IPromotionItem): Promise<boolean> {
    if (!item) {
        return true
    }
    const key = getPromotionItemNeverDisplayKey(item)
    if (isDesktopApp() || isUserscript()) {
        return localStorage.getItem(key) === 'true'
    }
    return (await backgroundGetItem(key)) === 'true'
}

export async function setPromotionItemNeverDisplay(item?: IPromotionItem) {
    if (!item) {
        return
    }
    const key = getPromotionItemNeverDisplayKey(item)
    if (isDesktopApp() || isUserscript()) {
        localStorage.setItem(key, 'true')
        return
    }
    await backgroundSetItem(key, 'true')
}

export async function unsetPromotionItemNeverDisplay(item?: IPromotionItem) {
    if (!item) {
        return
    }
    const key = getPromotionItemNeverDisplayKey(item)
    if (isDesktopApp() || isUserscript()) {
        localStorage.removeItem(key)
        return
    }
    return await backgroundRemoveItem(key)
}
