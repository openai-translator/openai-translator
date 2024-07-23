import { LangCode } from '.'

export interface Config {
    name: string
    nameEn: string
    isVariant?: boolean // whether the language is one of the variants of the language, default `false`
    isSource?: boolean // whether the language can be translated from, default `true`
    isTarget?: boolean // whether the language can be translated to, default `true`
    direction?: 'ltr' | 'rtl' // direction of the language, default `ltr`
    rolePrompt?: string // prompt for the role of the translator, default `''`
    genCommandPrompt?: (sourceLanguageConfig: Required<Config>) => string
    phoneticNotation?: string | false // string for the name of the transcription / transliteration system, `false` if not applicable, default 'transcription'
    /*
     `phoneticNotation` is not applicable for languages that have no phonetic transcription, only
     when the language has neither transcription nor transliteration systems. This can happen
     only in the below circumstances:
     1. The language is written in latin alphabets AND using a phonemic orthography, i.e. an
        orthography (system for writing a language) in which the graphemes (written symbols)
        correspond to the phonemes (significant spoken sounds) of the language;
     2. GPT does not support it well;
     3. This is a variant and only native speakers understand so that it is not necessary to mark
        its pronunciation.
    */
}

export const LANG_CONFIGS: Record<LangCode, Config> = {
    // English
    'en': {
        name: 'English',
        nameEn: 'English',
        phoneticNotation: 'IPA',
    },
    'en-US': {
        name: 'American English',
        nameEn: 'English (US)',
        phoneticNotation: 'IPA',
        isSource: false,
    },
    'en-GB': {
        name: 'British English',
        nameEn: 'English (UK)',
        phoneticNotation: 'IPA',
        isSource: false,
    },
    'en-CA': {
        name: 'Canadian English',
        nameEn: 'English (Canada)',
        phoneticNotation: 'IPA',
        isSource: false,
    },
    'en-AU': {
        name: 'Australian English',
        nameEn: 'English (Australia)',
        phoneticNotation: 'IPA',
        isSource: false,
    },

    // CJK
    // Chinese
    'zh-Hans': {
        nameEn: 'Simplified Chinese',
        name: '简体中文',
        isVariant: true,
        phoneticNotation: 'Pinyin',
    },
    'zh-Hant': {
        nameEn: 'Traditional Chinese',
        name: '繁體中文',
        isVariant: true,
        phoneticNotation: 'Bopomofo', // aka 注音
    },
    'yue': {
        nameEn: 'Cantonese',
        name: '粤语',
        phoneticNotation: 'Jyutping',
        isSource: false,
    },
    'lzh': {
        nameEn: 'Classical Chinese',
        name: '古文',
        phoneticNotation: 'Pinyin',
    },
    'jdbhw': {
        nameEn: 'Modern Standard Chinese',
        name: '近代白话文',
        phoneticNotation: 'Gwoyeu Romatzyh',
        rolePrompt: '您是一位在中文系研究中文的资深学者',
        isSource: false,
    },
    'xdbhw': {
        nameEn: 'Contemporary Chinese',
        name: '现代白话文',
        phoneticNotation: 'Hanyu Pinyin',
        rolePrompt: '您是一位在中文系研究中文的资深学者',
        isSource: false,
    },

    // Japanese
    'ja': {
        name: '日本語',
        nameEn: 'Japanese',
        phoneticNotation: 'hiragana',
    },
    // Korean
    'ko': {
        nameEn: 'Korean',
        name: '한국어', // Korean formal speech (GPT uses formal speech by default if not specified)
        phoneticNotation: 'Revised Romanization',
    },
    'ko-banmal': {
        nameEn: 'Korean',
        name: '한국어 반말', // Korean casual / informal speech, especially Haera-che,
        // used when talking to close friends or relatives of similar age, and by adults to children,
        // in impersonal writing (books, newspapers, magazines and 報告書),
        // grammar books or indirect quotations.
        // see https://en.wikipedia.org/wiki/Korean_speech_levels
        phoneticNotation: 'Revised Romanization',
        isVariant: true,
        isSource: false,
        genCommandPrompt: (sourceLanguageConfig) =>
            `Translate from ${sourceLanguageConfig.nameEn} to Korean banmal. Please use 이다 and 다 endings. Never use formal or honorific endings. Return translated text only.`,
    },

    'fr': {
        nameEn: 'French',
        name: 'Français',
        phoneticNotation: 'IPA',
    },
    'de': {
        nameEn: 'German',
        name: 'Deutsch',
        phoneticNotation: 'IPA',
    },
    'es': {
        nameEn: 'Spanish',
        name: 'Español',
        phoneticNotation: 'IPA',
    },
    'it': {
        nameEn: 'Italian',
        name: 'Italiano',
        phoneticNotation: 'IPA',
    },
    'ru': {
        nameEn: 'Russian',
        name: 'Русский',
        phoneticNotation: 'Latin transcription',
    },
    'pt': {
        nameEn: 'Portuguese',
        name: 'Português',
    },
    'nl': {
        nameEn: 'Dutch',
        name: 'Nederlands',
    },
    'pl': {
        nameEn: 'Polish',
        name: 'Polski',
    },

    'ar': {
        nameEn: 'Arabic',
        name: 'العربية',
        phoneticNotation: 'Arabic script',
        direction: 'rtl',
    },
    'af': {
        nameEn: 'Afrikaans',
        name: 'Afrikaans',
        phoneticNotation: 'IPA',
    },
    'am': {
        nameEn: 'Amharic',
        name: 'አማርኛ',
    },
    'az': {
        nameEn: 'Azerbaijani',
        name: 'Azərbaycan',
    },
    'be': {
        nameEn: 'Belarusian',
        name: 'Беларуская',
    },
    'bg': {
        nameEn: 'Bulgarian',
        name: 'Български',
    },
    'bn': {
        nameEn: 'Bengali',
        name: 'বাংলা',
    },
    'bs': {
        nameEn: 'Bosnian',
        name: 'Bosanski',
    },
    'ca': {
        nameEn: 'Catalan',
        name: 'Català',
    },
    'ceb': {
        nameEn: 'Cebuano',
        name: 'Cebuano',
    },
    'co': {
        nameEn: 'Corsican',
        name: 'Corsu',
    },
    'cs': {
        nameEn: 'Czech',
        name: 'Čeština',
    },
    'cy': {
        nameEn: 'Welsh',
        name: 'Cymraeg',
    },
    'da': {
        nameEn: 'Danish',
        name: 'Dansk',
    },
    'el': {
        nameEn: 'Greek',
        name: 'Ελληνικά',
    },
    'eo': {
        nameEn: 'Esperanto',
        name: 'Esperanto',
    },
    'et': {
        nameEn: 'Estonian',
        name: 'Eesti',
    },
    'eu': {
        nameEn: 'Basque',
        name: 'Euskara',
    },
    'fa': {
        nameEn: 'Persian',
        name: 'فارسی',
        phoneticNotation: 'latin transcription',
        direction: 'rtl',
    },
    'fi': {
        nameEn: 'Finnish',
        name: 'Suomi',
    },
    'fj': {
        nameEn: 'Fijian',
        name: 'Fijian',
    },
    'fy': {
        nameEn: 'Frisian',
        name: 'Frysk',
    },
    'ga': {
        nameEn: 'Irish',
        name: 'Gaeilge',
    },
    'gd': {
        nameEn: 'Scottish Gaelic',
        name: 'Gàidhlig',
    },
    'gl': {
        nameEn: 'Galician',
        name: 'Galego',
    },
    'gu': {
        nameEn: 'Gujarati',
        name: 'ગુજરાતી',
    },
    'ha': {
        nameEn: 'Hausa',
        name: 'Hausa',
    },
    'haw': {
        nameEn: 'Hawaiian',
        name: 'Hawaiʻi',
    },
    'he': {
        nameEn: 'Hebrew',
        name: 'עברית',
        phoneticNotation: 'latin transcription',
        direction: 'rtl',
    },
    'hi': {
        nameEn: 'Hindi',
        name: 'हिन्दी',
        phoneticNotation: 'latin transcription',
    },
    'hmn': {
        nameEn: 'Hmong',
        name: 'Hmong',
        phoneticNotation: 'latin transcription',
    },
    'hr': {
        nameEn: 'Croatian',
        name: 'Hrvatski',
    },
    'ht': {
        nameEn: 'Haitian Creole',
        name: 'Kreyòl Ayisyen',
    },
    'hu': {
        nameEn: 'Hungarian',
        name: 'Magyar',
    },
    'hy': {
        nameEn: 'Armenian',
        name: 'Հայերեն',
    },
    'id': {
        nameEn: 'Indonesian',
        name: 'Bahasa Indonesia',
    },
    'ig': {
        nameEn: 'Igbo',
        name: 'Igbo',
    },
    'is': {
        nameEn: 'Icelandic',
        name: 'Íslenska',
    },
    'jw': {
        nameEn: 'Javanese',
        name: 'Jawa',
    },
    'ka': {
        nameEn: 'Georgian',
        name: 'ქართული',
    },
    'kk': {
        nameEn: 'Kazakh',
        name: 'Қазақ',
    },
    'mn': {
        nameEn: 'Mongolian',
        name: 'Монгол хэл',
        phoneticNotation: 'Latin script',
    },
    'tr': {
        nameEn: 'Turkish',
        name: 'Türkçe',
    },
    'ug': {
        nameEn: 'Uyghur',
        name: 'ئۇيغۇر تىلى',
        phoneticNotation: 'Latin Yëziqi',
        direction: 'rtl',
    },
    'uk': {
        nameEn: 'Ukrainian',
        name: 'Українська',
        phoneticNotation: 'national transcription',
    },
    'ur': {
        nameEn: 'Urdu',
        name: 'اردو',
        phoneticNotation: 'Urdu script',
        direction: 'rtl',
    },
    'vi': {
        nameEn: 'Vietnamese',
        name: 'Tiếng Việt',
        phoneticNotation: false,
    },
    'sv': {
        nameEn: 'Swedish',
        name: 'Svenska',
        phoneticNotation: 'IPA',
    },
    'th': {
        nameEn: 'Thai',
        name: 'ไทย',
        phoneticNotation: 'IPA',
    },
}
