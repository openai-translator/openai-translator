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
        'https://raw.githubusercontent.com/yetone/openai-translator-configs/main/promotions.json',
        { cache: 'no-store' }
    )
    if (!resp.ok) {
        throw new Error(resp.statusText)
    }
    return resp.json()
}
