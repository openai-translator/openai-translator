/* eslint-disable no-control-regex */
/* eslint-disable no-misleading-character-class */

import { isTraditional } from '../traditional-or-simplified'
import ISO6391 from 'iso-639-1'
import { LANG_CONFIGS, Config as OptionalLangConfig } from './data'
import { oneLine } from 'common-tags'
import { getUniversalFetch } from '../universal-fetch'
import qs from 'qs'
import { getSettings } from '../utils'

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

export async function googleDetectLang(text: string): Promise<LangCode> {
    const langMap: Record<string, LangCode> = {
        'zh-CN': 'zh-Hans',
        'zh-TW': 'zh-Hant',
        'ja': 'ja',
        'en': 'en',
        'ko': 'ko',
        'fr': 'fr',
        'es': 'es',
        'ru': 'ru',
        'de': 'de',
        'it': 'it',
        'tr': 'tr',
        'pt': 'pt',
        'vi': 'vi',
        'id': 'id',
        'th': 'th',
        'ar': 'ar',
        'hi': 'hi',
        'mn': 'mn',
        'fa': 'fa',
    }

    const fetcher = getUniversalFetch()
    const resp = await fetcher(
        `https://translate.google.com/translate_a/single?dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&${qs.stringify(
            {
                client: 'gtx',
                sl: 'auto',
                tl: 'zh-CN',
                hl: 'zh-CN',
                ie: 'UTF-8',
                oe: 'UTF-8',
                otf: '1',
                ssel: '0',
                tsel: '0',
                kc: '7',
                q: text,
            }
        )}`,
        {
            method: 'GET',
            headers: { 'content-type': 'application/json' },
        }
    )
    if (resp.ok) {
        const result = await resp.json()
        if (result[2] && result[2] in langMap) {
            return langMap[result[2] as string]
        }
    }
    return 'en'
}

export async function bingDetectLang(text: string): Promise<LangCode> {
    const tokenURL = 'https://edge.microsoft.com/translate/auth'

    const fetcher = getUniversalFetch()

    const tokenResp = await fetcher(tokenURL, {
        method: 'GET',
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42',
        },
    })

    if (tokenResp.ok) {
        const token = await tokenResp.text()
        const url = `https://api-edge.cognitive.microsofttranslator.com/detect?${qs.stringify({
            'api-version': '3.0',
        })}`

        const resp = await fetcher(url, {
            method: 'POST',
            headers: {
                'accept': '*/*',
                'accept-language': 'zh-TW,zh;q=0.9,ja;q=0.8,zh-CN;q=0.7,en-US;q=0.6,en;q=0.5',
                'authorization': 'Bearer ' + token,
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                'pragma': 'no-cache',
                'sec-ch-ua': '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'Referer': 'https://appsumo.com/',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42',
            },
            body: JSON.stringify([{ Text: text }]),
        })

        if (resp.ok) {
            const result = await resp.json()
            if (result[0].language) {
                return result[0].language
            }
        }
    }
    return 'en'
}

export async function baiduDetectLang(text: string): Promise<LangCode> {
    const langMap: Record<string, LangCode> = {
        zh: 'zh-Hans',
        cht: 'zh-Hant',
        en: 'en',
        jp: 'ja',
        kor: 'ko',
        fra: 'fr',
        spa: 'es',
        ru: 'ru',
        de: 'de',
        it: 'it',
        tr: 'tr',
        pt: 'pt',
        vie: 'vi',
        id: 'id',
        th: 'th',
        ar: 'ar',
        hi: 'hi',
        per: 'fa',
    }

    const fetcher = getUniversalFetch()
    const data = new URLSearchParams()
    data.append('query', text)
    const url = 'https://fanyi.baidu.com/langdetect?' + data.toString()
    const resp = await fetcher(url, {
        method: 'POST',
    })

    if (resp.ok) {
        const jsn = await resp.json()
        if (jsn && jsn.lan) {
            return langMap[jsn.lan] || 'en'
        }
    }

    return 'en'
}

export async function localDetectLang(text: string): Promise<LangCode> {
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
    }
    for (const char of text.split(' ')) {
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

export async function detectLang(text: string): Promise<LangCode> {
    let detectedText = text
    if (detectedText.length > 1000) {
        detectedText = detectedText.slice(0, 1000)
    }
    const settings = await getSettings()
    switch (settings.languageDetectionEngine) {
        case 'baidu':
            return await baiduDetectLang(detectedText)
        case 'google':
            return await googleDetectLang(detectedText)
        case 'bing':
            return await bingDetectLang(detectedText)
        case 'local':
            return await localDetectLang(detectedText)
        default:
            return await localDetectLang(detectedText)
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
        rolePrompt: 'You are a professional translator.',
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        genCommandPrompt: (sourceLanguageConfig: LanguageConfig) => oneLine`Please translate to ${config.name}`,
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
