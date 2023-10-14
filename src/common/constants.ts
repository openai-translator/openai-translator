import { TranslateMode } from './translate'

export const PREFIX = '__yetone-openai-translator'
export const builtinActionModes: {
    name: string
    mode: Exclude<TranslateMode, 'big-bang'>
    icon: string
    group: string
}[] = [
    {
        name: 'Translate',
        mode: 'translate',
        icon: 'MdOutlineGTranslate',
        group: 'default',
    },
    {
        name: 'Polishing',
        mode: 'polishing',
        icon: 'MdPalette',
        group: 'default',
    },
    {
        name: 'Summarize',
        mode: 'summarize',
        icon: 'MdOutlineSummarize',
        group: 'default',
    },
    {
        name: 'Analyze',
        mode: 'analyze',
        icon: 'MdOutlineAnalytics',
        group: 'default',
    },
    {
        name: 'Explain Code',
        mode: 'explain-code',
        icon: 'MdCode',
        group: 'default',
    },
]
