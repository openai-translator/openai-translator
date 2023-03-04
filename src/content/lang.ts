/* eslint-disable no-control-regex */
/* eslint-disable no-misleading-character-class */

import XRegExp from 'xregexp'

export const supportLanguages: [string, string][] = [
    ['auto', 'auto'],
    ['zh-Hans', 'zh-CN'],
    ['zh-Hant', 'zh-TW'],
    ['en', 'en'],
    ['yue', '粤语'],
    ['wyw', '古文'],
    ['en', 'en'],
    ['ja', 'ja'],
    ['ko', 'ko'],
    ['fr', 'fr'],
    ['de', 'de'],
    ['es', 'es'],
    ['it', 'it'],
    ['ru', 'ru'],
    ['pt', 'pt'],
    ['nl', 'nl'],
    ['pl', 'pl'],
    ['ar', 'ar'],
    ['af', 'af'],
    ['am', 'am'],
    ['az', 'az'],
    ['be', 'be'],
    ['bg', 'bg'],
    ['bn', 'bn'],
    ['bs', 'bs'],
    ['ca', 'ca'],
    ['ceb', 'ceb'],
    ['co', 'co'],
    ['cs', 'cs'],
    ['cy', 'cy'],
    ['da', 'da'],
    ['el', 'el'],
    ['eo', 'eo'],
    ['et', 'et'],
    ['eu', 'eu'],
    ['fa', 'fa'],
    ['fi', 'fi'],
    ['fj', 'fj'],
    ['fy', 'fy'],
    ['ga', 'ga'],
    ['gd', 'gd'],
    ['gl', 'gl'],
    ['gu', 'gu'],
    ['ha', 'ha'],
    ['haw', 'haw'],
    ['he', 'he'],
    ['hi', 'hi'],
    ['hmn', 'hmn'],
    ['hr', 'hr'],
    ['ht', 'ht'],
    ['hu', 'hu'],
    ['hy', 'hy'],
    ['id', 'id'],
    ['ig', 'ig'],
    ['is', 'is'],
    ['jw', 'jw'],
    ['ka', 'ka'],
    ['kk', 'kk'],
    ['km', 'km'],
    ['kn', 'kn'],
    ['ku', 'ku'],
    ['ky', 'ky'],
    ['la', 'lo'],
    ['lb', 'lb'],
    ['lo', 'lo'],
    ['lt', 'lt'],
    ['lv', 'lv'],
    ['mg', 'mg'],
    ['mi', 'mi'],
    ['mk', 'mk'],
    ['ml', 'ml'],
    ['mn', 'mn'],
    ['mr', 'mr'],
    ['ms', 'ms'],
    ['mt', 'mt'],
    ['my', 'my'],
    ['ne', 'ne'],
    ['no', 'no'],
    ['ny', 'ny'],
    ['or', 'or'],
    ['pa', 'pa'],
    ['ps', 'ps'],
    ['ro', 'ro'],
    ['rw', 'rw'],
    ['si', 'si'],
    ['sk', 'sk'],
    ['sl', 'sl'],
    ['sm', 'sm'],
    ['sn', 'sn'],
    ['so', 'so'],
    ['sq', 'sq'],
    ['sr', 'sr'],
    ['sr-Cyrl', 'sr'],
    ['sr-Latn', 'sr'],
    ['st', 'st'],
    ['su', 'su'],
    ['sv', 'sv'],
    ['sw', 'sw'],
    ['ta', 'ta'],
    ['te', 'te'],
    ['tg', 'tg'],
    ['th', 'th'],
    ['tk', 'tk'],
    ['tl', 'tl'],
    ['tr', 'tr'],
    ['tt', 'tt'],
    ['ug', 'ug'],
    ['uk', 'uk'],
    ['ur', 'ur'],
    ['uz', 'uz'],
    ['vi', 'vi'],
    ['xh', 'xh'],
    ['yi', 'yi'],
    ['yo', 'yo'],
    ['zu', 'zu'],
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
        jp: XRegExp('[\\p{Hiragana}\\p{Katakana}]', 'gi'),
        pa: XRegExp('\\p{Gurmukhi}', 'gi'),
    }
    for (const [lang, regex] of Object.entries(regexes)) {
        // detect occurances of lang in a word
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

export function detectLang(text: string): string | null {
    // split into words
    const langs = text
        .trim()
        .split(/\s+/)
        .map((word) => {
            return detect(word)
        })

    // count occurances of each lang
    const langCount: Record<string, number> = langs.reduce((acc, lang) => {
        if (lang) {
            acc[lang] = (acc[lang] || 0) + 1
        }
        return acc
    }, {} as Record<string, number>)
    // pick lang with highest count
    // if count is the same, pick the first lang
    // if no lang is detected, return null
    return Object.keys(langCount).reduce((a, b) => (langCount[a] > langCount[b] ? a : b)) || null
}
