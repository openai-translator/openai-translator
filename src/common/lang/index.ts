/* eslint-disable no-control-regex */
/* eslint-disable no-misleading-character-class */

import { isTraditional } from '../traditional-or-simplified'
import ISO6391 from 'iso-639-1'
import { LANG_CONFIGS, Config as OptionalLangConfig } from './data'
import { oneLine } from 'common-tags'
import { getUniversalFetch } from '../universal-fetch'

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
    | 'sv'
    | 'th'
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

export async function baiduDetectLang(text: string): Promise<LangCode> {
    const fetcher = getUniversalFetch()
    let detectedText = text.trim()
    return new Promise((resolve) => {
        if (!detectedText) {
            resolve('en')
            return
        }
        if (detectedText.match(/^[a-zA-Z0-9]+$/)) {
            resolve('en')
            return
        }
        if (detectedText.length > 1000) {
            detectedText = detectedText.slice(0, 1000)
        }
        const data = new URLSearchParams()
        data.append('query', detectedText)
        const url = 'https://fanyi.baidu.com/langdetect?' + data.toString()
        fetcher(url, {
            method: 'POST',
            mode: 'cors',
        })
            .then((res) => res.json())
            .then((res) => {
                const langCode = res.data.lan
                if (langCode === 'zh') {
                    resolve(isTraditional(detectedText) ? 'zh-Hant' : 'zh-Hans')
                } else {
                    resolve(langCode)
                }
            })
            .catch(() => {
                resolve('en')
            })
    })
}

export async function detectLang(text: string): Promise<LangCode> {
    // Detect Traditional Chinese
    if (/[\u4e00-\u9fa5]/.test(text) && /[\u4e00-\u9ccc]/.test(text)) {
        return isTraditional(text) ? 'zh-Hant' : 'zh-Hans'
    }
    // Detect Simplified Chinese
    else if (/[\u4e00-\u9fa5]/.test(text)) {
        return isTraditional(text) ? 'zh-Hant' : 'zh-Hans'
    }
    // Detect Korean
    else if (/[\uAC00-\uD7A3]/.test(text)) {
        return 'ko'
    }
    // Detect Vietnamese
    else if (
        /[\u0103\u00E2\u00EA\u00F4\u01A1\u01B0\u1EA1\u1EB9\u1EC7\u1ED3\u1EDD\u1EF3\u1EA3\u1EBB\u1EC9\u1ED5\u1EDF\u1EF5\u1EA7\u1EBF\u1EC5\u1ED1\u1EDB\u1EF1\u1EA5\u1EBD\u1EC3\u1ECF\u1ED9\u1EE3\u1EF7\u1EA9\u1EC1\u1ED7\u1EE1\u1EF9\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF]/.test(
            text
        )
    ) {
        return 'vi'
    }
    // Detect Thai
    else if (/[\u0E01-\u0E5B]/.test(text)) {
        return 'th'
    }
    // Detect Hmong
    else if (/[\u16F0-\u16F9]/.test(text)) {
        return 'hmn'
    }
    // Detect Japanese
    else if (/[\u3040-\u30ff]/.test(text)) {
        return 'ja'
    }
    // Detect Russian
    else if (/[\u0400-\u04FF]/.test(text)) {
        return 'ru'
    }
    // Detect Spanish
    else if (/[áéíóúüñ]/.test(text)) {
        return 'es'
    }
    // Detect French
    else if (/[àâçéèêëîïôûùüÿœæ]/.test(text)) {
        return 'fr'
    }
    // Detect German
    else if (/[äöüß]/.test(text)) {
        return 'de'
    }
    // If none match, we assume it's English
    else if (/[a-zA-Z]/.test(text)) {
        return 'en'
    }
    // If none match, we return 'en'
    else {
        return 'en'
    }
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
