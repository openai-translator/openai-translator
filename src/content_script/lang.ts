/* eslint-disable no-control-regex */
/* eslint-disable no-misleading-character-class */

import XRegExp from 'xregexp'
import LanguageDetect from 'languagedetect'
import GuessLanguage from 'guesslanguage-ng'
import { isTraditional } from '../common/traditional-or-simplified'

const langDetector = new LanguageDetect()
langDetector.setLanguageType('iso2')

const langGuesser = GuessLanguage()

export const supportLanguages: [string, string][] = [
    // ['auto', 'auto'],
    ['en', 'English'],
    // ['zh', '中文'],
    ['zh-Hans', '简体中文'],
    ['zh-Hant', '繁體中文'],
    ['yue', '粤语'],
    ['wyw', '古文'],
    ['ja', '日本語'],
    ['ko', '한국어'],
    ['fr', 'Français'],
    ['de', 'Deutsch'],
    ['es', 'Español'],
    ['it', 'Italiano'],
    ['ru', 'Русский'],
    ['pt', 'Português'],
    ['nl', 'Nederlands'],
    ['pl', 'Polski'],
    ['ar', 'العربية'],
    ['af', 'Afrikaans'],
    ['am', 'አማርኛ'],
    ['az', 'Azərbaycan'],
    ['be', 'Беларуская'],
    ['bg', 'Български'],
    ['bn', 'বাংলা'],
    ['bs', 'Bosanski'],
    ['ca', 'Català'],
    ['ceb', 'Cebuano'],
    ['co', 'Corsu'],
    ['cs', 'Čeština'],
    ['cy', 'Cymraeg'],
    ['da', 'Dansk'],
    ['el', 'Ελληνικά'],
    ['eo', 'Esperanto'],
    ['et', 'Eesti'],
    ['eu', 'Euskara'],
    ['fa', 'فارسی'],
    ['fi', 'Suomi'],
    ['fj', 'Fijian'],
    ['fy', 'Frysk'],
    ['ga', 'Gaeilge'],
    ['gd', 'Gàidhlig'],
    ['gl', 'Galego'],
    ['gu', 'ગુજરાતી'],
    ['ha', 'Hausa'],
    ['haw', 'Hawaiʻi'],
    ['he', 'עברית'],
    ['hi', 'हिन्दी'],
    ['hmn', 'Hmong'],
    ['hr', 'Hrvatski'],
    ['ht', 'Kreyòl Ayisyen'],
    ['hu', 'Magyar'],
    ['hy', 'Հայերեն'],
    ['id', 'Bahasa Indonesia'],
    ['ig', 'Igbo'],
    ['is', 'Íslenska'],
    ['jw', 'Jawa'],
    ['ka', 'ქართული'],
    ['kk', 'Қазақ'],
]

export const langMap: Map<string, string> = new Map(supportLanguages)
export const langMapReverse = new Map(
    supportLanguages.map(([standardLang, lang]) => [lang, standardLang]),
)

function detect(text: string) {
    const scores: Record<string, number> = {}
    // https://en.wikipedia.org/wiki/Unicode_block
    // http://www.regular-expressions.info/unicode.html#script
    const regexes = {
        // en: /[a-zA-Z]+/gi,
        en: XRegExp('\\p{Latin}', 'gi'),
        zh: XRegExp('\\p{Han}', 'gi'),
        hi: XRegExp('\\p{Devanagari}', 'gi'),
        ar: XRegExp('\\p{Arabic}', 'gi'),
        bn: XRegExp('\\p{Bengali}', 'gi'),
        he: XRegExp('\\p{Hebrew}', 'gi'),
        ru: XRegExp('\\p{Cyrillic}', 'gi'),
        ja: XRegExp('[\\p{Hiragana}\\p{Katakana}]', 'gi'),
        pa: XRegExp('\\p{Gurmukhi}', 'gi'),
    }
    for (const [lang, regex] of Object.entries(regexes)) {
        // detect occurrences of lang in a word
        const matches = XRegExp.match(text, regex) || []
        const score = matches.length / text.length
        if (score) {
            // high percentage, return result
            if (score > 0.85) {
                return lang
            }
            scores[lang] = score
        }
    }
    // not detected
    if (Object.keys(scores).length == 0) return null
    // pick lang with highest percentage
    return Object.keys(scores).reduce((a, b) => (scores[a] > scores[b] ? a : b))
}

export async function detectLang(text: string): Promise<string | null> {
    const lang = await _detectLang(text)
    if (lang === 'zh' || lang === 'zh-CN' || lang === 'zh-TW') {
        console.log('isTraditional', isTraditional(text))
        return isTraditional(text) ? 'zh-Hant' : 'zh-Hans'
    }
    return lang
}

export async function _detectLang(text: string): Promise<string | null> {
    const lang = await langGuesser.detect(text)
    if (lang !== 'unknown') {
        if (lang !== 'en' && lang !== 'zh' && lang !== 'zh-TW') {
            const res = langDetector.detect(text, 1)
            if (res.length > 0) {
                return res[0][0]
            }
        }
        return lang
    }

    const res = langDetector.detect(text, 1)
    if (res.length > 0) {
        return res[0][0]
    }

    // split into words
    const langs = text
        .trim()
        .split(/\s+/)
        .map((word) => {
            return detect(word)
        })

    if (langs.length === 0) return null

    // count occurrences of each lang
    const langCount: Record<string, number> = langs.reduce((acc, lang) => {
        if (lang) {
            acc[lang] = (acc[lang] || 0) + 1
        }
        return acc
    }, {} as Record<string, number>)
    // pick lang with highest count
    // if count is the same, pick the first lang
    // if no lang is detected, return null
    return (
        Object.keys(langCount).reduce((a, b) => (langCount[a] > langCount[b] ? a : b), 'en') || null
    )
}
