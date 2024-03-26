import { useCallback, useEffect, useMemo, useState } from 'react'
import _ from 'underscore'
import icon from '../assets/images/icon-large.png'
import beams from '../assets/images/beams.jpg'
import toast, { Toaster } from 'react-hot-toast'
import * as utils from '../utils'
import { Client as Styletron } from 'styletron-engine-atomic'
import { Provider as StyletronProvider } from 'styletron-react'
import { BaseProvider } from 'baseui-sd'
import { Input } from 'baseui-sd/input'
import { createForm } from './Form'
import { Button } from 'baseui-sd/button'
import { TranslateMode, Provider, APIModel } from '../translate'
import { Select, Value, Option } from 'baseui-sd/select'
import { Checkbox } from 'baseui-sd/checkbox'
import { supportedLanguages } from './lang/lang'
import { useRecordHotkeys } from 'react-hotkeys-hook'
import { createUseStyles } from 'react-jss'
import clsx from 'clsx'
import { ISettings, IThemedStyleProps, ThemeType } from '../types'
import { useTheme } from '../hooks/useTheme'
import { IoCloseCircle } from 'react-icons/io5'
import { useTranslation } from 'react-i18next'
import AppConfig from '../../../package.json'
import { useSettings } from '../hooks/useSettings'
import { langCode2TTSLang } from '../tts'
import { RiDeleteBin5Line } from 'react-icons/ri'
import { IoMdAdd } from 'react-icons/io'
import { TTSProvider } from '../tts/types'
import { getEdgeVoices } from '../tts/edge-tts'
import { useThemeType } from '../hooks/useThemeType'
import { Slider } from 'baseui-sd/slider'
import { getUniversalFetch } from '../universal-fetch'
import { useLiveQuery } from 'dexie-react-hooks'
import { actionService } from '../services/action'
import { GlobalSuspense } from './GlobalSuspense'
import { Modal, ModalBody, ModalHeader } from 'baseui-sd/modal'
import wechat from '../assets/images/wechat.png'
import alipay from '../assets/images/alipay.png'
const langOptions: Value = supportedLanguages.reduce((acc, [id, label]) => {
    return [
        ...acc,
        {
            id,
            label,
        } as Option,
    ]
}, [] as Value)

const specifiedLangCodes = [
    'ar', // Arabic
    'zh-Hans',
    'zh-Hant', // Chinese (Simplified and Traditional)
    'zh-sg',
    'nl', // Dutch
    'nl-be',
    'en',
    'en-US',
    'en-GB',
    'en-CA',
    'en-AU', // English (All variants)
    'fr', // French
    'fr-be',
    'fr-qc',
    'fr-ch',
    'de', // German
    'el', // Greek
    'he', // Hebrew
    'it', // Italian
    'ja', // Japanese
    'ko', // Korean
    'pl', // Polish
    'pt', // Portuguese
    'pt-br',
    'ru', // Russian
    'es', // Spanish
    'es-la',
    'sv', // Swedish
    'th', // Thai
    'tr', // Turkish
    'uk', // Ukrainian
    'vi', // Vietnamese
    'sign-us',
    'sign-uk',
    'sign-ie',
    'sign-aus',
    'sign-nz',
]

const yourglishLangOptions: Value = supportedLanguages.reduce((acc, [id, label]) => {
    if (specifiedLangCodes.includes(id)) {
        return [
            ...acc,
            {
                id,
                label,
            } as Option,
        ];
    }
    return acc;
}, [] as Value);


interface ILanguageSelectorProps {
    value?: string
    onChange?: (value: string) => void
    onBlur?: () => void
}

function LanguageSelector({ value, onChange, onBlur }: ILanguageSelectorProps) {
    return (
        <Select
            onBlur={onBlur}
            size='compact'
            clearable={false}
            options={langOptions}
            value={value ? [{ id: value }] : []}
            onChange={({ value }) => {
                const selected = value[0]
                onChange?.(selected?.id as string)
            }}
        />
    )
}

function YouglishLanguageSelector({ value, onChange, onBlur }: ILanguageSelectorProps) {
    return (
        <Select
            onBlur={onBlur}
            size='compact'
            clearable={false}
            options={yourglishLangOptions}
            value={value ? [{ id: value }] : []}
            onChange={({ value }) => {
                const selected = value[0]
                onChange?.(selected?.id as string)
            }}
        />
    )
}

interface ITranslateModeSelectorProps {
    value?: TranslateMode | 'nop'
    onChange?: (value: TranslateMode | 'nop') => void
    onBlur?: () => void
}

interface AlwaysShowIconsCheckboxProps {
    value?: boolean
    onChange?: (value: boolean) => void
    onBlur?: () => void
}

function AlwaysShowIconsCheckbox({ value, onChange, onBlur }: AlwaysShowIconsCheckboxProps) {
    return (
        <Checkbox
            checkmarkType='toggle_round'
            checked={value}
            onChange={(e) => {
                onChange?.(e.target.checked)
                onBlur?.()
            }}
        />
    )
}

interface AutoTranslateCheckboxProps {
    value?: boolean
    onChange?: (value: boolean) => void
    onBlur?: () => void
}

interface IProviderSelectorProps {
    value?: Provider | 'OpenAI'
    onChange?: (value: Provider | 'OpenAI') => void
}

function TranslateModeSelector({ value, onChange, onBlur }: ITranslateModeSelectorProps) {
    const actions = useLiveQuery(() => actionService.list())
    const { t } = useTranslation()

    return (
        <Select
            size='compact'
            onBlur={onBlur}
            searchable={false}
            clearable={false}
            value={
                value && [
                    {
                        id: value,
                    },
                ]
            }
            onChange={(params) => {
                onChange?.(params.value[0].id as TranslateMode | 'nop')
            }}
            options={
                [
                    { label: t('Nop'), id: 'nop' },
                    ...(actions?.map((item) => ({
                        label: item.mode ? t(item.name) : item.name,
                        id: item.mode ? item.mode : String(item.id),
                    })) ?? []),
                ] as {
                    label: string
                    id: string
                }[]
            }
        />
    )
}

interface IThemeTypeSelectorProps {
    value?: ThemeType
    onChange?: (value: ThemeType) => void
    onBlur?: () => void
}

function ThemeTypeSelector({ value, onChange, onBlur }: IThemeTypeSelectorProps) {
    const { t } = useTranslation()

    return (
        <Select
            size='compact'
            onBlur={onBlur}
            searchable={false}
            clearable={false}
            value={
                value
                    ? [
                          {
                              id: value,
                          },
                      ]
                    : []
            }
            onChange={(params) => {
                onChange?.(params.value[0].id as ThemeType)
            }}
            options={[
                { label: t('Follow the System'), id: 'followTheSystem' },
                { label: t('Dark'), id: 'dark' },
                { label: t('Light'), id: 'light' },
            ]}
        />
    )
}

const useTTSSettingsStyles = createUseStyles({
    settingsLabel: (props: IThemedStyleProps) => ({
        color: props.theme.colors.contentPrimary,
        display: 'block',
        marignTop: '4px',
    }),
    voiceSelector: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '10px',
    },
    providerSelector: {
        marginTop: '10px',
    },
    formControl: {
        marginBottom: '12px',
    },
    tickBar: (props: IThemedStyleProps) => ({
        color: props.theme.colors.contentPrimary,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: '16px',
        paddingLeft: '16px',
    }),
})

interface TTSVoicesSettingsProps {
    value?: ISettings['tts']
    onChange?: (value: ISettings['tts']) => void
    onBlur?: () => void
}

const ttsProviderOptions: {
    label: string
    id: TTSProvider
}[] = [
    { label: 'Edge TTS', id: 'EdgeTTS' },
    { label: 'System Default', id: 'WebSpeech' },
]

function TTSVoicesSettings({ value, onChange, onBlur }: TTSVoicesSettingsProps) {
    const { t } = useTranslation()
    const { theme, themeType } = useTheme()

    const styles = useTTSSettingsStyles({ theme, themeType, isDesktopApp: utils.isDesktopApp() })

    const [showLangSelector, setShowLangSelector] = useState(false)

    const [supportVoices, setSupportVoices] = useState<SpeechSynthesisVoice[]>([])

    useEffect(() => {
        ;(async () => {
            switch (value?.provider ?? 'WebSpeech') {
                case 'EdgeTTS':
                    setSupportVoices(await getEdgeVoices())
                    break
                case 'WebSpeech':
                    setSupportVoices(speechSynthesis.getVoices())
                    break
                default:
                    setSupportVoices(speechSynthesis.getVoices())
                    break
            }
        })()
    }, [value?.provider])

    const getLangOptions = useCallback(
        (lang: string) => {
            return supportedLanguages.reduce((acc, [langCode, label]) => {
                const ttsLang = langCode2TTSLang[langCode]
                if (ttsLang && supportVoices.find((v) => v.lang === ttsLang)) {
                    if (value?.voices?.find((item) => item.lang === langCode) && langCode !== lang) {
                        return acc
                    }
                    return [
                        ...acc,
                        {
                            id: langCode,
                            label,
                        } as Option,
                    ]
                }
                return acc
            }, [] as Value)
        },
        [value?.voices, supportVoices]
    )

    const getVoiceOptions = useCallback(
        (lang: string) => {
            const ttsLang = langCode2TTSLang[lang]
            return supportVoices
                .filter((v) => v.lang === ttsLang)
                .map((sv) => ({ id: sv.voiceURI, label: sv.name, lang: sv.lang }))
        },
        [supportVoices]
    )

    const handleDeleteLang = useCallback(
        (lang: string) => {
            const voices = value?.voices ?? []
            const newVoices = voices.filter((item) => {
                return item.lang !== lang
            })
            onChange?.({ ...value, voices: newVoices })
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [value]
    )

    const handleChangeLang = useCallback(
        (prevLang: string, newLang: string) => {
            const voices = value?.voices ?? []
            const newVoices = voices.map((item) => {
                if (item.lang === prevLang) {
                    return {
                        ...item,
                        lang: newLang,
                    }
                }
                return item
            })
            onChange?.({ ...value, voices: newVoices })
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [value]
    )

    const handleAddLang = useCallback(
        (lang: string) => {
            const voices = value?.voices ?? []
            onChange?.({
                ...value,
                voices: [
                    ...voices,
                    {
                        lang,
                        voice: '',
                    },
                ],
            })
            setShowLangSelector(false)
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [value]
    )

    const handleChangeVoice = useCallback(
        (lang: string, voice: string) => {
            const voices = value?.voices ?? []
            const newVoices = voices.map((item) => {
                if (item.lang === lang) {
                    return {
                        ...item,
                        voice,
                    }
                }
                return item
            })
            onChange?.({ ...value, voices: newVoices })
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [value]
    )

    const handleChangeProvider = useCallback(
        (provider: TTSProvider) => {
            onChange?.({ ...value, provider })
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [value]
    )

    return (
        <div>
            <div className={styles.formControl}>
                <label className={styles.settingsLabel}>{t('Provider')}</label>
                <div className={styles.providerSelector}>
                    <Select
                        size='compact'
                        clearable={false}
                        searchable={false}
                        options={ttsProviderOptions}
                        value={[{ id: value?.provider ?? 'EdgeTTS' }]}
                        onChange={({ option }) => handleChangeProvider(option?.id as TTSProvider)}
                        onBlur={onBlur}
                    />
                </div>
            </div>
            <div className={styles.formControl}>
                <label className={styles.settingsLabel}>{t('Rate')}</label>
                <Slider
                    min={1}
                    max={20}
                    step={1}
                    value={[value?.rate ?? 10]}
                    onChange={(params) => onChange?.({ ...value, rate: params.value[0] })}
                    overrides={{
                        ThumbValue: () => null,
                        InnerThumb: () => null,
                        TickBar: () => (
                            <div className={styles.tickBar}>
                                <div>{t('Slow')}</div>
                                <div>{t('Fast')}</div>
                            </div>
                        ),
                    }}
                />
            </div>
            <div className={styles.formControl}>
                <label className={styles.settingsLabel}>{t('Volume')}</label>
                <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[value?.volume ?? 100]}
                    onChange={(params) => onChange?.({ ...value, volume: params.value[0] })}
                    overrides={{
                        ThumbValue: () => null,
                        InnerThumb: () => null,
                        TickBar: () => (
                            <div className={styles.tickBar}>
                                <div>{t('Quiet')}</div>
                                <div>{t('Loud')}</div>
                            </div>
                        ),
                    }}
                />
            </div>
            <div className={styles.formControl}>
                <label className={styles.settingsLabel}>{t('Voice')}</label>
                {(value?.voices ?? []).map(({ lang, voice }) => (
                    <div className={styles.voiceSelector} key={lang}>
                        <Select
                            size='compact'
                            clearable={false}
                            options={getLangOptions(lang)}
                            onChange={({ option }) => handleChangeLang(lang, option?.id as string)}
                            value={[{ id: lang }]}
                        />
                        <Select
                            size='compact'
                            options={getVoiceOptions(lang)}
                            value={[{ id: voice }]}
                            onChange={({ option }) => handleChangeVoice(lang, option?.id as string)}
                            clearable={false}
                            onBlur={onBlur}
                        />
                        <Button
                            shape='circle'
                            size='mini'
                            overrides={{
                                Root: {
                                    style: {
                                        flexShrink: 0,
                                    },
                                },
                            }}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDeleteLang(lang)
                            }}
                        >
                            <RiDeleteBin5Line />
                        </Button>
                    </div>
                ))}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginTop: 10,
                    }}
                >
                    {showLangSelector && (
                        <Select
                            size='mini'
                            clearable={false}
                            options={getLangOptions('')}
                            onChange={({ option }) => handleAddLang(option?.id as string)}
                        />
                    )}
                    <Button
                        size='mini'
                        startEnhancer={() => <IoMdAdd size={12} />}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setShowLangSelector(true)
                        }}
                    >
                        {t('Add')}
                    </Button>
                </div>
            </div>
        </div>
    )
}

interface Ii18nSelectorProps {
    value?: string
    onChange?: (value: string) => void
    onBlur?: () => void
}

function Ii18nSelector({ value, onChange, onBlur }: Ii18nSelectorProps) {
    const { i18n } = useTranslation()

    const options = [
        { label: 'English', id: 'en' },
        { label: '简体中文', id: 'zh-Hans' },
        { label: '繁體中文', id: 'zh-Hant' },
        { label: '日本語', id: 'ja' },
        { label: 'ไทย', id: 'th' },
    ]

    return (
        <Select
            size='compact'
            onBlur={onBlur}
            searchable={false}
            clearable={false}
            value={
                value
                    ? [
                          {
                              id: value,
                              label: options.find((option) => option.id === value)?.label || 'en',
                          },
                      ]
                    : undefined
            }
            onChange={(params) => {
                onChange?.(params.value[0].id as string)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;(i18n as any).changeLanguage(params.value[0].id as string)
            }}
            options={options}
        />
    )
}

interface APIModelSelectorProps {
    provider: Provider
    value?: string
    onChange?: (value: string) => void
    onBlur?: () => void
}

interface APIModelOption {
    label: string
    id: string
}

function APIModelSelector({ provider, value, onChange, onBlur }: APIModelSelectorProps) {
    const fetcher = useMemo(() => getUniversalFetch(), [])
    const { t } = useTranslation()
    const [isLoading, setIsLoading] = useState(false)
    const [options, setOptions] = useState<APIModelOption[]>([])
    const [errMsg, setErrMsg] = useState<string>()
    const [isChatGPTNotLogin, setIsChatGPTNotLogin] = useState(false)
    useEffect(() => {
        setIsChatGPTNotLogin(false)
        setErrMsg('')
        setOptions([])
        if (provider === 'OpenAI') {
            setOptions([
                { label: 'gpt-3.5-turbo', id: 'gpt-3.5-turbo' },
                { label: 'gpt-3.5-turbo-0301', id: 'gpt-3.5-turbo-0301' },
                { label: 'gpt-4', id: 'gpt-4' },
                { label: 'gpt-4-0314', id: 'gpt-4-0314' },
                { label: 'gpt-4-32k', id: 'gpt-4-32k' },
                { label: 'gpt-4-32k-0314', id: 'gpt-4-32k-0314' },
            ])
        } else if (provider === 'ChatGPT') {
            setIsLoading(true)
            try {
                ;(async () => {
                    const sessionResp = await fetcher(utils.defaultChatGPTAPIAuthSession, { cache: 'no-cache' })
                    if (sessionResp.status !== 200) {
                        setIsChatGPTNotLogin(true)
                        setErrMsg('Failed to fetch ChatGPT Web accessToken')
                        return
                    }
                    const sessionRespJsn = await sessionResp.json()
                    const headers: Record<string, string> = {
                        Authorization: `Bearer ${sessionRespJsn.accessToken}`,
                    }
                    const modelsResp = await fetcher(`${utils.defaultChatGPTWebAPI}/models`, {
                        cache: 'no-cache',
                        headers,
                    })
                    const modelsRespJsn = await modelsResp.json()
                    if (!modelsRespJsn) {
                        return
                    }
                    if (modelsResp.status !== 200) {
                        if (modelsResp.status === 401) {
                            setIsChatGPTNotLogin(true)
                        }
                        setErrMsg(modelsRespJsn.detail.message)
                        return
                    }
                    const { models } = modelsRespJsn
                    if (!models) {
                        return
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setOptions(models.map((model: any) => ({ label: model.title, id: model.slug })))
                })()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                setErrMsg(JSON.stringify(e))
            } finally {
                setIsLoading(false)
            }
        }
    }, [fetcher, provider])

    return (
        <div>
            <Select
                isLoading={isLoading}
                size='compact'
                onBlur={onBlur}
                searchable={false}
                clearable={false}
                value={
                    value
                        ? [
                              {
                                  id: value,
                              },
                          ]
                        : undefined
                }
                onChange={(params) => {
                    onChange?.(params.value[0].id as APIModel)
                }}
                options={options}
            />
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                }}
            >
                {errMsg && (
                    <div
                        style={{
                            color: 'red',
                        }}
                    >
                        {errMsg}
                    </div>
                )}
                {isChatGPTNotLogin && (
                    <div>
                        <span>{t('Please login to ChatGPT Web')}: </span>
                        <a href='https://chat.openai.com' target='_blank' rel='noreferrer'>
                            Login
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}

interface AutoTranslateCheckboxProps {
    value?: boolean
    onChange?: (value: boolean) => void
    onBlur?: () => void
}

function AutoTranslateCheckbox({ value, onChange, onBlur }: AutoTranslateCheckboxProps) {
    return (
        <Checkbox
            checkmarkType='toggle_round'
            checked={value}
            onChange={(e) => {
                onChange?.(e.target.checked)
                onBlur?.()
            }}
        />
    )
}

interface MyCheckboxProps {
    value?: boolean
    onChange?: (value: boolean) => void
    onBlur?: () => void
}

function MyCheckbox({ value, onChange, onBlur }: MyCheckboxProps) {
    return (
        <Checkbox
            checkmarkType='toggle_round'
            checked={value}
            onChange={(e) => {
                onChange?.(e.target.checked)
                onBlur?.()
            }}
        />
    )
}

interface ChatContextCheckboxProps {
    value?: boolean
    onChange?: (value: boolean) => void
    onBlur?: () => void
}

function ChatContextCheckbox({ value, onChange, onBlur }: ChatContextCheckboxProps) {
    return (
        <Checkbox
            checkmarkType='toggle_round'
            checked={value}
            onChange={(e) => {
                onChange?.(e.target.checked)
                onBlur?.()
            }}
        />
    )
}

interface RestorePreviousPositionCheckboxProps {
    value?: boolean
    onChange?: (value: boolean) => void
    onBlur?: () => void
}

function RestorePreviousPositionCheckbox({ value, onChange, onBlur }: RestorePreviousPositionCheckboxProps) {
    return (
        <Checkbox
            checkmarkType='toggle_round'
            checked={value}
            onChange={(e) => {
                onChange?.(e.target.checked)
                onBlur?.()
            }}
        />
    )
}
interface SelectInputElementsProps {
    value?: boolean
    onChange?: (value: boolean) => void
    onBlur?: () => void
}

function SelectInputElementsCheckbox({ value, onChange, onBlur }: SelectInputElementsProps) {
    return (
        <Checkbox
            checkmarkType='toggle_round'
            checked={value}
            onChange={(e) => {
                onChange?.(e.target.checked)
                onBlur?.()
            }}
        />
    )
}
interface RunAtStartupCheckboxProps {
    value?: boolean
    onChange?: (value: boolean) => void
    onBlur?: () => void
}

function RunAtStartupCheckbox({ value, onChange, onBlur }: RunAtStartupCheckboxProps) {
    return (
        <Checkbox
            checkmarkType='toggle_round'
            checked={value}
            onChange={(e) => {
                onChange?.(e.target.checked)
                onBlur?.()
            }}
        />
    )
}

const useHotkeyRecorderStyles = createUseStyles({
    'hotkeyRecorder': (props: IThemedStyleProps) => ({
        position: 'relative',
        height: '32px',
        lineHeight: '32px',
        padding: '0 14px',
        borderRadius: '4px',
        width: '200px',
        cursor: 'pointer',
        border: '1px dashed transparent',
        backgroundColor: props.theme.colors.backgroundTertiary,
        color: props.theme.colors.primary,
    }),
    'clearHotkey': {
        position: 'absolute',
        top: '10px',
        right: '12px',
    },
    'caption': {
        marginTop: '4px',
        fontSize: '11px',
        color: '#999',
    },
    'recording': {
        animation: '$recording 2s infinite',
    },
    '@keyframes recording': {
        '0%': {
            backgroundColor: 'transparent',
        },
        '50%': {
            backgroundColor: 'rgb(238, 238, 238)',
            borderColor: '#999',
        },
        '100%': {
            backgroundColor: 'transparent',
        },
    },
})

interface IHotkeyRecorderProps {
    value?: string
    onChange?: (value: string) => void
    onBlur?: () => void
    testId?: string
}

function HotkeyRecorder({ value, onChange, onBlur, testId }: IHotkeyRecorderProps) {
    const { theme, themeType } = useTheme()

    const { t } = useTranslation()

    const styles = useHotkeyRecorderStyles({ themeType, theme })
    const [keys, { start, stop, isRecording }] = useRecordHotkeys()

    const [hotKeys, setHotKeys] = useState<string[]>([])
    useEffect(() => {
        if (value) {
            setHotKeys(
                value
                    .replace(/-/g, '+')
                    .split('+')
                    .map((k) => k.trim())
                    .filter(Boolean)
            )
        }
    }, [value])

    useEffect(() => {
        let keys_ = Array.from(keys)
        if (keys_ && keys_.length > 0) {
            keys_ = keys_.filter((k) => k.toLowerCase() !== 'meta')
            setHotKeys(keys_)
            onChange?.(keys_.join('+'))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keys])

    useEffect(() => {
        if (!isRecording) {
            onChange?.(hotKeys.join('+'))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hotKeys, isRecording])

    useEffect(() => {
        const stopRecording = () => {
            if (isRecording) {
                stop()
                onBlur?.()
            }
        }
        document.addEventListener('click', stopRecording)
        return () => {
            document.removeEventListener('click', stopRecording)
        }
    }, [isRecording, onBlur, stop])

    function clearHotkey() {
        onChange?.('')
        setHotKeys([])
    }

    return (
        <div>
            <div
                onClick={(e) => {
                    e.stopPropagation()
                    e.currentTarget.focus()
                    if (!isRecording) {
                        start()
                    } else {
                        stop()
                    }
                }}
                data-testid={testId}
                className={clsx(styles.hotkeyRecorder, {
                    [styles.recording]: isRecording,
                })}
            >
                {hotKeys.join(' + ')}
                {!isRecording && hotKeys.length > 0 ? (
                    <IoCloseCircle
                        className={styles.clearHotkey}
                        onClick={(e: React.MouseEvent<SVGElement>) => {
                            e.stopPropagation()
                            clearHotkey()
                        }}
                    />
                ) : null}
            </div>
            <div className={styles.caption}>
                {isRecording ? t('Please press the hotkey you want to set.') : t('Click above to set hotkeys.')}
            </div>
        </div>
    )
}

function ProviderSelector({ value, onChange }: IProviderSelectorProps) {
    const options = utils.isDesktopApp()
        ? ([
              { label: 'OpenAI', id: 'OpenAI' },
              { label: 'Azure', id: 'Azure' },
          ] as {
              label: string
              id: Provider
          }[])
        : ([
              { label: 'OpenAI', id: 'OpenAI' },
              { label: 'ChatGPT (Web)', id: 'ChatGPT' },
              { label: 'Azure', id: 'Azure' },
          ] as {
              label: string
              id: Provider
          }[])

    return (
        <Select
            size='compact'
            searchable={false}
            clearable={false}
            value={
                value && [
                    {
                        id: value,
                    },
                ]
            }
            onChange={(params) => {
                onChange?.(params.value[0].id as Provider | 'OpenAI')
            }}
            options={options}
        />
    )
}

const { Form, FormItem, useForm } = createForm<ISettings>()

interface IInnerSettingsProps {
    onSave?: (oldSettings: ISettings) => void
}

interface ISettingsProps extends IInnerSettingsProps {
    engine: Styletron
}

export function Settings({ engine, ...props }: ISettingsProps) {
    const { theme } = useTheme()
    return (
        <StyletronProvider value={engine}>
            <BaseProvider theme={theme}>
                <GlobalSuspense>
                    <InnerSettings {...props} />
                </GlobalSuspense>
            </BaseProvider>
        </StyletronProvider>
    )
}

export function InnerSettings({ onSave }: IInnerSettingsProps) {
    const { theme } = useTheme()
    const tokenRegenerateEvent = new Event('tokenRegenerate')
    const { setThemeType } = useThemeType()

    const { t } = useTranslation()

    const isTauri = utils.isTauri()

    const [loading, setLoading] = useState(false)
    const [values, setValues] = useState<ISettings>({
        chatgptArkoseReqUrl: '',
        chatgptArkoseReqForm: '',
        apiKeys: '',
        apiURL: utils.defaultAPIURL,
        apiURLPath: utils.defaultAPIURLPath,
        apiModel: utils.defaultAPIModel,
        provider: utils.defaultProvider,
        autoTranslate: utils.defaultAutoTranslate,
        chatContext: utils.defaultChatContext,
        defaultTranslateMode: 'translate',
        defaultYouglishLanguage: utils.defaultYouglishLanguage,
        defaultSourceLanguage: utils.defaultSourceLanguage,
        defaultTargetLanguage: utils.defaultTargetLanguage,
        alwaysShowIcons: !isTauri,
        hotkey: '',
        i18n: utils.defaulti18n,
        restorePreviousPosition: false,
        selectInputElementsText: utils.defaultSelectInputElementsText,
        runAtStartup: false,
    })
    const [prevValues, setPrevValues] = useState<ISettings>(values)

    const [form] = useForm()

    useEffect(() => {
        form.setFieldsValue(values)
    }, [form, values])

    const { settings, setSettings } = useSettings()

    useEffect(() => {
        if (settings) {
            ;(async () => {
                setValues(settings)
                setPrevValues(settings)
            })()
        }
    }, [isTauri, settings])

    const onChange = useCallback((_changes: Partial<ISettings>, values_: ISettings) => {
        setValues(values_)
    }, [])

    const onSubmit = useCallback(
        async (data: ISettings) => {
            if (data.apiModel === 'gpt-4') {
                localStorage.setItem('apiModel', 'gpt-4')
                document.dispatchEvent(tokenRegenerateEvent)
            }
            if (data.themeType) {
                setThemeType(data.themeType)
            }
            setLoading(true)
            const oldSettings = await utils.getSettings()
            await utils.setSettings(data)

            toast(t('Saved'), {
                icon: '👍',
                duration: 3000,
            })
            setLoading(false)
            setSettings(data)
            onSave?.(oldSettings)
        },
        [isTauri, onSave, setSettings, setThemeType, t]
    )

    const onBlur = useCallback(async () => {
        if (values.apiKeys && !_.isEqual(values, prevValues)) {
            await utils.setSettings(values)
            setPrevValues(values)
        }
    }, [prevValues, values])

    const isDesktopApp = utils.isDesktopApp()
    const isMacOS = navigator.userAgent.includes('Mac OS X')
    const [showBuyMeACoffee, setShowBuyMeACoffee] = useState(false)
    return (
        <div
            style={{
                paddingTop: isDesktopApp ? '98px' : undefined,
                paddingBottom: isDesktopApp ? '32px' : undefined,
                background: theme.colors.backgroundPrimary,
                minWidth: isDesktopApp ? 450 : 400,
            }}
            data-testid='settings-container'
        >
            <nav
                style={{
                    position: isDesktopApp ? 'fixed' : undefined,
                    left: isDesktopApp ? 0 : undefined,
                    top: isDesktopApp ? 0 : undefined,
                    zIndex: 1,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: '15px 25px',
                    color: '#333',
                    background: `url(${beams}) no-repeat center center`,
                    gap: 10,
                    boxSizing: 'border-box',
                }}
            >
                <img width='22' src={icon} alt='logo' />
                <h2>
                    GPT Tutor
                    {AppConfig?.version ? (
                        <a
                            href='https://github.com/yetone/openai-translator/releases'
                            target='_blank'
                            rel='noreferrer'
                            style={{
                                fontSize: '0.65em',
                                marginLeft: '5px',
                                color: 'unset',
                                textDecoration: 'none',
                            }}
                        >
                            {AppConfig.version}
                        </a>
                    ) : null}
                </h2>
                <div
                    style={{
                        flexGrow: 1,
                    }}
                />
                <div>
                    <Button
                        kind='secondary'
                        size='mini'
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowBuyMeACoffee(true)
                        }}
                    >
                        {'❤️  ' + t('Buy me a coffee')}
                    </Button>
                </div>
            </nav>
            <Form
                form={form}
                style={{
                    padding: '20px 25px',
                }}
                onFinish={onSubmit}
                initialValues={values}
                onValuesChange={onChange}
            >
                <FormItem name='provider' label={t('Default Service Provider')} required>
                    <ProviderSelector />
                </FormItem>
                {values.provider !== 'ChatGPT' && (
                    <FormItem
                        required
                        name='apiKeys'
                        label={t('API Key')}
                        caption={
                            <div>
                                {t('Go to the')}{' '}
                                {values.provider === 'Azure' ? (
                                    <a
                                        target='_blank'
                                        href='https://learn.microsoft.com/en-us/azure/cognitive-services/openai/chatgpt-quickstart?tabs=command-line&pivots=rest-api#retrieve-key-and-endpoint'
                                        rel='noreferrer'
                                    >
                                        {t('Azure OpenAI Service page')}
                                    </a>
                                ) : (
                                    <a
                                        target='_blank'
                                        href='https://platform.openai.com/account/api-keys'
                                        rel='noreferrer'
                                    >
                                        {t('OpenAI page')}
                                    </a>
                                )}{' '}
                                {t(
                                    'to get your API Key. You can separate multiple API Keys with English commas to achieve quota doubling and load balancing.'
                                )}
                            </div>
                        }
                    >
                        <Input autoFocus type='password' size='compact' name='apiKey' onBlur={onBlur} />
                    </FormItem>
                )}
                {values.provider !== 'Azure' && (
                    <FormItem name='apiModel' label={t('API Model')} required>
                        <APIModelSelector provider={values.provider} onBlur={onBlur} />
                    </FormItem>
                )}
                {values.provider !== 'ChatGPT' && (
                    <>
                        <FormItem required name='apiURL' label={t('API URL')}>
                            <Input size='compact' onBlur={onBlur} />
                        </FormItem>
                        <FormItem required name='apiURLPath' label={t('API URL Path')}>
                            <Input size='compact' />
                        </FormItem>
                    </>
                )}
                <FormItem name='defaultTranslateMode' label={t('Default Action')}>
                    <TranslateModeSelector onBlur={onBlur} />
                </FormItem>
                <FormItem
                    name='alwaysShowIcons'
                    label={t('Show icon when text is selected')}
                    caption={
                        isDesktopApp && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                {t('It is highly recommended to disable this feature and use the Clip Extension')}
                                <a
                                    href='https://github.com/openai-translator/openai-translator/blob/main/CLIP-EXTENSIONS.md'
                                    target='_blank'
                                    rel='noreferrer'
                                >
                                    {t('Clip Extension')}
                                </a>
                            </div>
                        )
                    }
                >
                    <AlwaysShowIconsCheckbox onBlur={onBlur} />
                </FormItem>
                <FormItem
                    style={{
                        display: isDesktopApp && isMacOS ? 'block' : 'none',
                    }}
                    name='allowUsingClipboardWhenSelectedTextNotAvailable'
                    label={t('Using clipboard')}
                    caption={t(
                        'Allow using the clipboard to get the selected text when the selected text is not available'
                    )}
                >
                    <MyCheckbox onBlur={onBlur} />
                </FormItem>
                <FormItem name='chatContext' label={t('Save Conversation')}>
                    <ChatContextCheckbox onBlur={onBlur} />
                </FormItem>
                <FormItem name='autoTranslate' label={t('Auto Translate')}>
                    <AutoTranslateCheckbox onBlur={onBlur} />
                </FormItem>
                <FormItem name='restorePreviousPosition' label={t('Restore Previous Position')}>
                    <RestorePreviousPositionCheckbox onBlur={onBlur} />
                </FormItem>
                <FormItem name='selectInputElementsText' label={t('Select Input Elements Text')}>
                    <SelectInputElementsCheckbox onBlur={onBlur} />
                </FormItem>
                {isTauri && (
                    <FormItem name='runAtStartup' label={t('Run at Startup')}>
                        <RunAtStartupCheckbox onBlur={onBlur} />
                    </FormItem>
                )}
                <FormItem name='defaultYouglishLanguage' label={t('Youglish Language')}>
                    <YouglishLanguageSelector onBlur={onBlur} />
                </FormItem>
                <FormItem name='defaultSourceLanguage' label={t('The Language You Want To Study')}>
                    <LanguageSelector onBlur={onBlur} />
                </FormItem>
                <FormItem name='defaultTargetLanguage' label={t('The Language You are Using')}>
                    <LanguageSelector onBlur={onBlur} />
                </FormItem>
                <FormItem name='themeType' label={t('Theme')}>
                    <ThemeTypeSelector onBlur={onBlur} />
                </FormItem>
                <FormItem name='i18n' label={t('i18n')}>
                    <Ii18nSelector onBlur={onBlur} />
                </FormItem>
                <FormItem name='tts' label={t('TTS')}>
                    <TTSVoicesSettings onBlur={onBlur} />
                </FormItem>
                <FormItem name='hotkey' label={t('Hotkey')}>
                    <HotkeyRecorder onBlur={onBlur} testId='hotkey-recorder' />
                </FormItem>
                <FormItem name='ocrHotkey' label={t('OCR Hotkey')}>
                    <HotkeyRecorder onBlur={onBlur} testId='ocr-hotkey-recorder' />
                </FormItem>
                <FormItem
                    style={{
                        display: isDesktopApp ? 'block' : 'none',
                    }}
                    name='disableCollectingStatistics'
                    label={t('disable collecting statistics')}
                >
                    <MyCheckbox onBlur={onBlur} />
                </FormItem>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'row',
                        gap: 10,
                    }}
                >
                    <div
                        style={{
                            marginRight: 'auto',
                        }}
                    />
                    <Button isLoading={loading} size='compact'>
                        {t('Save')}
                    </Button>
                </div>
                <Toaster />
            </Form>
            <Modal
                isOpen={showBuyMeACoffee}
                onClose={() => setShowBuyMeACoffee(false)}
                closeable
                size='auto'
                autoFocus
                animate
            >
                <ModalHeader
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    {'❤️  ' + t('Buy me a coffee')}
                </ModalHeader>
                <ModalBody>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <div>{t('If you find this tool helpful, you can buy me a cup of coffee.')}</div>
                        <div>
                            <img width='330' src={wechat} />
                        </div>
                        <div>
                            <img width='330' src={alipay} />
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    )
}
