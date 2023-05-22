/* eslint-disable no-control-regex */
/* eslint-disable no-misleading-character-class */

import { isTraditional } from '../../traditional-or-simplified'
import ISO6391 from 'iso-639-1'
import { languageConfigs, Config as OptionalLanguageConfig } from './data'

export type LanguageConfig = Required<OptionalLanguageConfig>
export type SupportedLanguageCode = keyof typeof languageConfigs
export const supportedLanguages = Object.entries(languageConfigs).map(
    ([code, config]) => [code, config.name] as [SupportedLanguageCode, string]
)
export const sourceLanguages = Object.entries(languageConfigs)
    .filter(([, config]) => config.isSource !== false)
    .map(([code, config]) => [code, config.name] as [SupportedLanguageCode, string])
export const targetLanguages = Object.entries(languageConfigs)
    .filter(([, config]) => config.isTarget !== false)
    .map(([code, config]) => [code, config.name] as [SupportedLanguageCode, string])
export const langMap = new Map(Object.entries(languageConfigs).map(([code, config]) => [code, config.name]))
export const langMapReverse = new Map(Object.entries(languageConfigs).map(([code, config]) => [config.name, code]))

export async function detectLang(text: string): Promise<SupportedLanguageCode> {
    const lang = await _detectLang(text)
    if (lang === ('zh' as SupportedLanguageCode)) {
        return intoSupportedLanguageCode(isTraditional(text) ? 'zh-Hant' : 'zh-Hans')
    }
    return intoSupportedLanguageCode(lang)
}

export function getLangName(langCode: string): string {
    const langName = ISO6391.getName(langCode)
    return langName || langMap.get(langCode) || langCode
}

export async function _detectLang(text: string): Promise<SupportedLanguageCode> {
    const detectedText = text.trim()
    return new Promise((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const langName = (window as any).detectLanguage(detectedText)
        console.debug('detected text:', detectedText)
        console.debug('detected lang:', langName)
        if (langName === 'Chineset') {
            resolve('zh-Hant' as SupportedLanguageCode)
            return
        }
        const langCode = ISO6391.getCode(langName) || langMapReverse.get(langName) // can never be 'zh-CN' or 'zh-TW'
        resolve(intoSupportedLanguageCode(langCode))
    })
}

export function getLangConfig(langCode: SupportedLanguageCode): LanguageConfig {
    const config = languageConfigs[langCode]
    const DEFAULT_CONFIG: LanguageConfig = {
        name: 'Unknown',
        nameEn: 'Unknown',
        phoneticNotation: 'transcription',
        isSource: true,
        isTarget: true,
        isVariant: false,
        direction: 'ltr',
        rolePrompt:
            'You are a professional translation engine, please translate the text into a colloquial, professional, elegant and fluent content, without the style of machine translation. You must only translate the text content, never interpret it.',
        genCommandPrompt: (sourceLanguageConfig: LanguageConfig, quoteStart: string, quoteEnd: string) =>
            `Translate from ${sourceLanguageConfig.name} to ${config.name}. Return translated text only. Only translate the text between ${quoteStart} and ${quoteEnd}.`,
    }
    return { ...DEFAULT_CONFIG, ...config }
}

export function intoSupportedLanguageCode(langCode: string | null): SupportedLanguageCode {
    const DEFAULT_LANGUAGE_CODE = 'en' as SupportedLanguageCode
    if (langCode && langCode in languageConfigs) {
        return langCode as SupportedLanguageCode
    }
    return DEFAULT_LANGUAGE_CODE
}
