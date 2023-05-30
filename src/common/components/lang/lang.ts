/* eslint-disable no-control-regex */
/* eslint-disable no-misleading-character-class */

import { isTraditional } from '../../traditional-or-simplified'
import ISO6391 from 'iso-639-1'
import { LANG_CONFIGS, Config as OptionalLangConfig } from './data'
import { oneLine } from 'common-tags'

export type LangCode =
    | 'en'
    | 'en-US'
    | 'en-GB'
    | 'en-CA'
    | 'en-AU'
    | 'zh-Hans'
    | 'zh-Hant'
    | 'yue'
    | 'lzh'
    | 'jdbhw'
    | 'xdbhw'
    | 'ja'
    | 'ko'
    | 'ko-banmal'
    | 'fr'
    | 'de'
    | 'es'
    | 'it'
    | 'ru'
    | 'pt'
    | 'nl'
    | 'pl'
    | 'ar'
    | 'af'
    | 'am'
    | 'az'
    | 'be'
    | 'bg'
    | 'bn'
    | 'bs'
    | 'ca'
    | 'ceb'
    | 'co'
    | 'cs'
    | 'cy'
    | 'da'
    | 'el'
    | 'eo'
    | 'et'
    | 'eu'
    | 'fa'
    | 'fi'
    | 'fj'
    | 'fy'
    | 'ga'
    | 'gd'
    | 'gl'
    | 'gu'
    | 'ha'
    | 'haw'
    | 'he'
    | 'hi'
    | 'hmn'
    | 'hr'
    | 'ht'
    | 'hu'
    | 'hy'
    | 'id'
    | 'ig'
    | 'is'
    | 'jw'
    | 'ka'
    | 'kk'
    | 'mn'
    | 'tr'
    | 'ug'
    | 'uk'
    | 'ur'
    | 'vi'
export type LanguageConfig = Required<OptionalLangConfig>
export const supportedLanguages = Object.entries(LANG_CONFIGS).map(
    ([code, config]) => [code, config.name] as [LangCode, string]
)
export const sourceLanguages = Object.entries(LANG_CONFIGS)
    .filter(([, config]) => config.isSource !== false)
    .map(([code, config]) => [code, config.name] as [LangCode, string])
export const targetLanguages = Object.entries(LANG_CONFIGS)
    .filter(([, config]) => config.isTarget !== false)
    .map(([code, config]) => [code, config.name] as [LangCode, string])
export const langMap = new Map(Object.entries(LANG_CONFIGS).map(([code, config]) => [code, config.name]))
export const langMapReverse = new Map(Object.entries(LANG_CONFIGS).map(([code, config]) => [config.name, code]))

export function getLangName(langCode: string): string {
    const langName = ISO6391.getName(langCode)
    return langName || langMap.get(langCode) || langCode
}

export async function detectLang(text: string): Promise<LangCode> {
    const detectedText = text.trim()
    return new Promise((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const langName = (window as any).detectLanguage(detectedText)
        console.debug('detected text:', detectedText)
        console.debug('detected lang:', langName)
        if (langName === 'Chineset') {
            resolve('zh-Hant')
            return
        }
        const langCode = ISO6391.getCode(langName) || langMapReverse.get(langName) // can never be 'zh-CN' or 'zh-TW'
        console.debug('detected langCode:', langCode)
        if (langCode === 'zh') {
            resolve(isTraditional(detectedText) ? 'zh-Hant' : 'zh-Hans')
            return
        }
        resolve(intoLangCode(langCode))
    })
}

export function getLangConfig(langCode: LangCode): LanguageConfig {
    const config = LANG_CONFIGS[langCode]
    const DEFAULT_CONFIG: LanguageConfig = {
        name: 'Unknown',
        nameEn: 'Unknown',
        phoneticNotation: 'transcription',
        isSource: true,
        isTarget: true,
        isVariant: false,
        direction: 'ltr',
        rolePrompt: oneLine`
            You are a professional translation engine,
            please translate the text into a colloquial,
            professional, elegant and fluent content,
            without the style of machine translation. 
            You must only translate the text content, never interpret it.`,
        genCommandPrompt: (sourceLanguageConfig: LanguageConfig, quoteStart: string, quoteEnd: string) =>
            oneLine`Translate from ${sourceLanguageConfig.name} to ${config.name}.
            Return translated text only.
            Only translate the text between ${quoteStart} and ${quoteEnd}.`,
    }
    return { ...DEFAULT_CONFIG, ...config }
}

export function intoLangCode(langCode: string | null): LangCode {
    const DEFAULT_LANGUAGE_CODE = 'en'
    if (langCode && langCode in LANG_CONFIGS) {
        return langCode as LangCode
    }
    return DEFAULT_LANGUAGE_CODE
}
