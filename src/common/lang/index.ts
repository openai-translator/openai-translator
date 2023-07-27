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
    if (text.length > 200) {
        text = text.slice(0, 200)
    }
    const langWeights = {
        en: 0,
        zh: 0,
        ko: 0,
        vi: 0,
        th: 0,
        hmn: 0,
        ja: 0,
        ru: 0,
        es: 0,
        fr: 0,
        de: 0,
    }
    const VietnameseCharsRegEx =
        /[\u0103\u00E2\u00EA\u00F4\u01A1\u01B0\u1EA1\u1EB9\u1EC7\u1ED3\u1EDD\u1EF3\u1EA3\u1EBB\u1EC9\u1ED5\u1EDF\u1EF5\u1EA7\u1EBF\u1EC5\u1ED1\u1EDB\u1EF1\u1EA5\u1EBD\u1EC3\u1ECF\u1ED9\u1EE3\u1EF7\u1EA9\u1EC1\u1ED7\u1EE1\u1EF9\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF]/
    for (const char of text.split('')) {
        if (/[\u4e00-\u9fa5]/.test(char)) {
            // Detect Chinese
            langWeights.zh += 1
            langWeights.ja += 1
        }
        if (/[\uAC00-\uD7A3]/.test(char)) {
            // Detect Korean
            langWeights.ko += 1
        }
        if (VietnameseCharsRegEx.test(char)) {
            // Detect Vietnamese
            langWeights.vi += 1
        }
        if (/[\u0E01-\u0E5B]/.test(char)) {
            // Detect Thai
            langWeights.th += 1
        }
        if (/[\u16F0-\u16F9]/.test(char)) {
            // Detect Hmong
            langWeights.hmn += 1
        }
        if (/[\u3040-\u30ff]/.test(char)) {
            // Detect Japanese
            langWeights.ja += 1
        }
        if (/[\u0400-\u04FF]/.test(char)) {
            // Detect Russian
            langWeights.ru += 1
        }
        if (/[áéíóúüñ]/.test(char)) {
            // Detect Spanish
            langWeights.es += 1
        }
        if (/[àâçéèêëîïôûùüÿœæ]/.test(char)) {
            // Detect French
            langWeights.fr += 1
        }
        if (/[äöüß]/.test(char)) {
            // Detect German
            langWeights.de += 1
        }
        if (/[a-zA-Z]/.test(char)) {
            // Detect English
            langWeights.en += 1
            langWeights.es += 1
            langWeights.fr += 1
            langWeights.de += 1
        }
    }
    if (langWeights.zh > 0 && langWeights.zh === langWeights.ja) {
        // fix pure Chinese text
        langWeights.zh += 1
    }
    if (
        langWeights.en > 0 &&
        langWeights.en === langWeights.es &&
        langWeights.en === langWeights.fr &&
        langWeights.en === langWeights.de
    ) {
        // fix pure English text
        langWeights.en += 1
    }
    const langWeightResult = Object.entries(langWeights).sort((a, b) => b[1] - a[1])[0]
    if (langWeightResult[1] === 0) {
        return 'en'
    } else if (langWeightResult[0] === 'zh') {
        return isTraditional(text) ? 'zh-Hant' : 'zh-Hans'
    } else {
        return langWeightResult[0] as LangCode
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
