/* eslint-disable no-control-regex */
/* eslint-disable no-misleading-character-class */

import { isTraditional } from '../../traditional-or-simplified'
import ISO6391 from 'iso-639-1'

import { languageConfigs, LanguageConfig as OptionalLanguageConfig } from './data'

export type LanguageConfig = Required<OptionalLanguageConfig>
export const supportedLanguages = Object.entries(languageConfigs).map(([code, config]) => [code, config.name])
export const langMap = new Map(Object.entries(languageConfigs).map(([code, config]) => [code, config.name]))
export const langMapReverse = new Map(Object.entries(languageConfigs).map(([code, config]) => [config.name, code]))

export async function detectLang(text: string): Promise<string | null> {
    const lang = await _detectLang(text)
    if (lang === 'zh' || lang === 'zh-CN' || lang === 'zh-TW') {
        return isTraditional(text) ? 'zh-Hant' : 'zh-Hans'
    }
    return lang
}

export function getLangName(langCode: string): string {
    const langName = ISO6391.getName(langCode)
    return langName || langMap.get(langCode) || langCode
}

export async function _detectLang(text: string): Promise<string | null> {
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
        const langCode = ISO6391.getCode(langName) || langMapReverse.get(langName)
        resolve(langCode)
    })
}

export function getLangConfig(langCode: string): LanguageConfig {
    const config = languageConfigs[langCode]
    const defaultConfig: LanguageConfig = {
        name: 'Unknown',
        nameEn: 'Unknown',
        phoneticNotation: 'transcription',
        isSource: true,
        isTarget: true,
        rolePrompt:
            'You are a professional translation engine, please translate the text into a colloquial, professional, elegant and fluent content, without the style of machine translation. You must only translate the text content, never interpret it.',
        genCommandPrompt: (sourceLanguageConfig: LanguageConfig, quoteStart: string, quoteEnd: string) =>
            `Translate from ${sourceLanguageConfig.nameEn} to ${config.name}. Return translated text only. Only translate the text between ${quoteStart} and ${quoteEnd}.`,
        isVariant: false,
    }
    return { ...config, ...defaultConfig }
}
