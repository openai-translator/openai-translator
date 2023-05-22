export interface Config {
    name: string
    nameEn: string
    isVariant?: boolean // whether the language is one of the variants of the language, default `false`
    isSource?: boolean // whether the language can be translated from, default `true`
    isTarget?: boolean // whether the language can be translated to, default `true`
    direction?: 'ltr' | 'rtl' // direction of the language, default `ltr`
    rolePrompt?: string // prompt for the role of the translator, default `''`
    genCommandPrompt?: (sourceLanguageConfig: Required<Config>, quoteStart: string, quoteEnd: string) => string
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

interface LanguageConfigs {
    [key: string]: Config
}

export const languageConfigs = {
    // English
    'en': {
        name: 'English',
        nameEn: 'English',
        phoneticNotation: 'IPA',
    } as Config,
    'en-US': {
        name: 'American English',
        nameEn: 'English (US)',
        phoneticNotation: 'IPA',
        isSource: false,
    } as Config,
    'en-GB': {
        name: 'British English',
        nameEn: 'English (UK)',
        phoneticNotation: 'IPA',
        isSource: false,
    } as Config,
    'en-CA': {
        name: 'Canadian English',
        nameEn: 'English (Canada)',
        phoneticNotation: 'IPA',
        isSource: false,
    } as Config,
    'en-AU': {
        name: 'Australian English',
        nameEn: 'English (Australia)',
        phoneticNotation: 'IPA',
        isSource: false,
    } as Config,

    // CJK
    // Chinese
    'zh-Hans': {
        nameEn: 'Simplified Chinese',
        name: '简体中文',
        isVariant: true,
        phoneticNotation: 'Pinyin',
    } as Config,
    'zh-Hant': {
        nameEn: 'Traditional Chinese',
        name: '繁體中文',
        isVariant: true,
        phoneticNotation: 'Bopomofo', // aka 注音
    } as Config,
    'yue': {
        nameEn: 'Cantonese',
        name: '粤语',
        phoneticNotation: 'Jyutping',
        isSource: false,
    } as Config,
    'lzh': {
        nameEn: 'Classical Chinese',
        name: '文言',
        phoneticNotation: 'Pinyin',
    } as Config,
    'jdbhw': {
        nameEn: 'Modern Standard Chinese',
        name: '近代白话文',
        phoneticNotation: 'Gwoyeu Romatzyh',
        rolePrompt: '您是一位在中文系研究中文的资深学者',
        isSource: false,
    } as Config,
    'xdbhw': {
        nameEn: 'Contemporary Chinese',
        name: '现代白话文',
        phoneticNotation: 'Hanyu Pinyin',
        rolePrompt: '您是一位在中文系研究中文的资深学者',
        isSource: false,
    } as Config,

    // Japanese
    'ja': {
        name: '日本語',
        nameEn: 'Japanese',
        phoneticNotation: 'hiragana',
    } as Config,
    // Korean
    'ko': {
        nameEn: 'Korean',
        name: '한국어', // Korean formal speech (GPT uses formal speech by default if not specified)
        phoneticNotation: 'Revised Romanization',
    } as Config,
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
        genCommandPrompt: (sourceLanguageConfig, quoteStart, quoteEnd) =>
            `Translate from ${sourceLanguageConfig.nameEn} to Korean banmal. Please use 다 endings. Never use formal or honorific endings. Return translated text only. Only translate the text between ${quoteStart} and ${quoteEnd}. You can only translate and cannot interpret the content.`,
    } as Config,

    'fr': {
        nameEn: 'French',
        name: 'Français',
        phoneticNotation: 'IPA',
    } as Config,
    'de': {
        nameEn: 'German',
        name: 'Deutsch',
        phoneticNotation: 'IPA',
    } as Config,
    'es': {
        nameEn: 'Spanish',
        name: 'Español',
        phoneticNotation: 'IPA',
    } as Config,
    'it': {
        nameEn: 'Italian',
        name: 'Italiano',
        phoneticNotation: 'IPA',
    } as Config,
    'ru': {
        nameEn: 'Russian',
        name: 'Русский',
        phoneticNotation: 'Latin transcription',
    } as Config,
    'pt': {
        nameEn: 'Portuguese',
        name: 'Português',
    } as Config,
    'nl': {
        nameEn: 'Dutch',
        name: 'Nederlands',
    } as Config,
    'pl': {
        nameEn: 'Polish',
        name: 'Polski',
    } as Config,

    'ar': {
        nameEn: 'Arabic',
        name: 'العربية',
        phoneticNotation: 'Arabic script',
        direction: 'rtl',
    } as Config,
    'af': {
        nameEn: 'Afrikaans',
        name: 'Afrikaans',
        phoneticNotation: 'IPA',
    } as Config,
    'am': {
        nameEn: 'Amharic',
        name: 'አማርኛ',
    } as Config,
    'az': {
        nameEn: 'Azerbaijani',
        name: 'Azərbaycan',
    } as Config,
    'be': {
        nameEn: 'Belarusian',
        name: 'Беларуская',
    } as Config,
    'bg': {
        nameEn: 'Bulgarian',
        name: 'Български',
    } as Config,
    'bn': {
        nameEn: 'Bengali',
        name: 'বাংলা',
    } as Config,
    'bs': {
        nameEn: 'Bosnian',
        name: 'Bosanski',
    } as Config,
    'ca': {
        nameEn: 'Catalan',
        name: 'Català',
    } as Config,
    'ceb': {
        nameEn: 'Cebuano',
        name: 'Cebuano',
    } as Config,
    'co': {
        nameEn: 'Corsican',
        name: 'Corsu',
    } as Config,
    'cs': {
        nameEn: 'Czech',
        name: 'Čeština',
    } as Config,
    'cy': {
        nameEn: 'Welsh',
        name: 'Cymraeg',
    } as Config,
    'da': {
        nameEn: 'Danish',
        name: 'Dansk',
    } as Config,
    'el': {
        nameEn: 'Greek',
        name: 'Ελληνικά',
    } as Config,
    'eo': {
        nameEn: 'Esperanto',
        name: 'Esperanto',
    } as Config,
    'et': {
        nameEn: 'Estonian',
        name: 'Eesti',
    } as Config,
    'eu': {
        nameEn: 'Basque',
        name: 'Euskara',
    } as Config,
    'fa': {
        nameEn: 'Persian',
        name: 'فارسی',
        phoneticNotation: 'latin transcription',
        direction: 'rtl',
    } as Config,
    'fi': {
        nameEn: 'Finnish',
        name: 'Suomi',
    } as Config,
    'fj': {
        nameEn: 'Fijian',
        name: 'Fijian',
    } as Config,
    'fy': {
        nameEn: 'Frisian',
        name: 'Frysk',
    } as Config,
    'ga': {
        nameEn: 'Irish',
        name: 'Gaeilge',
    } as Config,
    'gd': {
        nameEn: 'Scottish Gaelic',
        name: 'Gàidhlig',
    } as Config,
    'gl': {
        nameEn: 'Galician',
        name: 'Galego',
    } as Config,
    'gu': {
        nameEn: 'Gujarati',
        name: 'ગુજરાતી',
    } as Config,
    'ha': {
        nameEn: 'Hausa',
        name: 'Hausa',
    } as Config,
    'haw': {
        nameEn: 'Hawaiian',
        name: 'Hawaiʻi',
    } as Config,
    'he': {
        nameEn: 'Hebrew',
        name: 'עברית',
        phoneticNotation: 'latin transcription',
        direction: 'rtl',
    } as Config,
    'hi': {
        nameEn: 'Hindi',
        name: 'हिन्दी',
        phoneticNotation: 'latin transcription',
    } as Config,
    'hmn': {
        nameEn: 'Hmong',
        name: 'Hmong',
        phoneticNotation: 'latin transcription',
    } as Config,
    'hr': {
        nameEn: 'Croatian',
        name: 'Hrvatski',
    } as Config,
    'ht': {
        nameEn: 'Haitian Creole',
        name: 'Kreyòl Ayisyen',
    } as Config,
    'hu': {
        nameEn: 'Hungarian',
        name: 'Magyar',
    } as Config,
    'hy': {
        nameEn: 'Armenian',
        name: 'Հայերեն',
    } as Config,
    'id': {
        nameEn: 'Indonesian',
        name: 'Bahasa Indonesia',
    } as Config,
    'ig': {
        nameEn: 'Igbo',
        name: 'Igbo',
    } as Config,
    'is': {
        nameEn: 'Icelandic',
        name: 'Íslenska',
    } as Config,
    'jw': {
        nameEn: 'Javanese',
        name: 'Jawa',
    } as Config,
    'ka': {
        nameEn: 'Georgian',
        name: 'ქართული',
    } as Config,
    'kk': {
        nameEn: 'Kazakh',
        name: 'Қазақ',
    } as Config,
    'mn': {
        nameEn: 'Mongolian',
        name: 'Монгол хэл',
        phoneticNotation: 'Latin script',
    } as Config,
    'tr': {
        nameEn: 'Turkish',
        name: 'Türkçe',
    } as Config,
    'ug': {
        nameEn: 'Uyghur',
        name: 'ئۇيغۇر تىلى',
        phoneticNotation: 'Latin Yëziqi',
        direction: 'rtl',
    } as Config,
    'uk': {
        nameEn: 'Ukrainian',
        name: 'Українська',
        phoneticNotation: 'national transcription',
    } as Config,
    'ur': {
        nameEn: 'Urdu',
        name: 'اردو',
        phoneticNotation: 'Urdu script',
        direction: 'rtl',
    } as Config,
    'vi': {
        nameEn: 'Vietnamese',
        name: 'Tiếng Việt',
        phoneticNotation: false,
    } as Config,
} satisfies LanguageConfigs
