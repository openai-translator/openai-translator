import React, { useCallback, useEffect, useReducer, useState } from 'react'
import _ from 'underscore'
import { Tabs, Tab, StyledTabList, StyledTabPanel } from 'baseui-sd/tabs-motion'
import icon from '../assets/images/icon-large.png'
import beams from '../assets/images/beams.jpg'
import wechat from '../assets/images/wechat.png'
import alipay from '../assets/images/alipay.png'
import toast, { Toaster } from 'react-hot-toast'
import * as utils from '../utils'
import { Client as Styletron } from 'styletron-engine-atomic'
import { Provider as StyletronProvider } from 'styletron-react'
import { BaseProvider, LightTheme } from 'baseui-sd'
import { Input } from 'baseui-sd/input'
import { createForm } from './Form'
import { Button, ButtonProps } from 'baseui-sd/button'
import { TranslateMode, APIModel } from '../translate'
import { Select, Value, Option, SelectProps, Options } from 'baseui-sd/select'
import { Checkbox } from 'baseui-sd/checkbox'
import { LangCode, supportedLanguages } from '../lang'
import { useRecordHotkeys } from 'react-hotkeys-hook'
import { createUseStyles } from 'react-jss'
import clsx from 'clsx'
import { ISettings, IThemedStyleProps, LanguageDetectionEngine, ProxyProtocol, ThemeType } from '../types'
import { useTheme } from '../hooks/useTheme'
import { IoCloseCircle, IoRefreshSharp, IoSettingsOutline } from 'react-icons/io5'
import { useTranslation } from 'react-i18next'
import AppConfig from '../../../package.json'
import { useSettings } from '../hooks/useSettings'
import { defaultTTSProvider, langCode2TTSLang, ttsLangTestTextMap } from '../tts'
import { RiDeleteBin5Line } from 'react-icons/ri'
import { IoIosHelpCircleOutline, IoIosSave, IoMdAdd } from 'react-icons/io'
import { TTSProvider } from '../tts/types'
import { fetchEdgeVoices } from '../tts/edge-tts'
import { useThemeType } from '../hooks/useThemeType'
import { Slider } from 'baseui-sd/slider'
import { useLiveQuery } from 'dexie-react-hooks'
import { actionService } from '../services/action'
import { GlobalSuspense } from './GlobalSuspense'
import { Modal, ModalBody, ModalButton, ModalFooter, ModalHeader } from 'baseui-sd/modal'
import { Provider, engineIcons, getEngine } from '../engines'
import { IModel } from '../engines/interfaces'
import { PiTextbox } from 'react-icons/pi'
import { BsKeyboard } from 'react-icons/bs'
import { TbCloudNetwork } from 'react-icons/tb'
import { Cell, Grid } from 'baseui-sd/layout-grid'
import {
    II18nPromotionContent,
    IPromotionResponse,
    fetchPromotions,
    II18nPromotionContentItem,
    choicePromotionItem,
    IPromotionItem,
} from '../services/promotion'
import useSWR from 'swr'
import { Markdown } from './Markdown'
import { open } from '@tauri-apps/plugin-shell'
import { getCurrent } from '@tauri-apps/api/webviewWindow'
import { usePromotionShowed } from '../hooks/usePromotionShowed'
import { trackEvent } from '@aptabase/tauri'
import { Skeleton } from 'baseui-sd/skeleton'
import { SpeakerIcon } from './SpeakerIcon'
import { RxSpeakerLoud } from 'react-icons/rx'
import { Notification } from 'baseui-sd/notification'
import { usePromotionNeverDisplay } from '../hooks/usePromotionNeverDisplay'
import { Textarea } from 'baseui-sd/textarea'
import { ProxyTester } from './ProxyTester'
import { CUSTOM_MODEL_ID } from '../constants'
import { isMacOS } from '../utils'
import NumberInput from './NumberInput'
import { DurationPicker } from './DurationPicker'

const langOptions: Value = supportedLanguages.reduce((acc, [id, label]) => {
    return [
        ...acc,
        {
            id,
            label,
        } as Option,
    ]
}, [] as Value)

interface ILanguageSelectorProps {
    value?: string
    onChange?: (value: string) => void
    onBlur?: () => void
}

const linkStyle = {
    color: 'inherit',
    opacity: 0.8,
    cursor: 'pointer',
    outline: 'none',
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

interface ITranslateModeSelectorProps {
    value?: TranslateMode | 'nop'
    onChange?: (value: TranslateMode | 'nop') => void
    onBlur?: () => void
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

interface ILanguageDetectionEngineSelectorProps {
    value?: LanguageDetectionEngine
    onChange?: (value: LanguageDetectionEngine) => void
    onBlur?: () => void
}

function LanguageDetectionEngineSelector({ value, onChange, onBlur }: ILanguageDetectionEngineSelectorProps) {
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
                onChange?.(params.value[0].id as LanguageDetectionEngine)
            }}
            options={[
                { label: t('Baidu'), id: 'baidu' },
                { label: t('Google'), id: 'google' },
                { label: t('Bing'), id: 'bing' },
                { label: t('Local'), id: 'local' },
            ]}
        />
    )
}

const useTTSSettingsStyles = createUseStyles({
    label: (props: IThemedStyleProps) => ({
        color: props.theme.colors.contentPrimary,
        fontWeight: 500,
    }),
    voiceSelector: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        width: '100%',
    },
    formControl: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
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

interface ISpeakerButtonProps extends ButtonProps {
    iconSize?: number
    provider?: TTSProvider
    lang: LangCode
    voice: string
    rate?: number
    volume?: number
    text?: string
}

function SpeakerButton({
    iconSize = 13,
    provider,
    text: text_,
    lang,
    voice,
    rate,
    volume,
    ...buttonProps
}: ISpeakerButtonProps) {
    const text = text_ ?? ttsLangTestTextMap[lang]

    return (
        <Button
            shape='circle'
            size='mini'
            {...buttonProps}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const target = e.target as HTMLButtonElement
                target.querySelector('div')?.click()
            }}
        >
            <SpeakerIcon
                size={iconSize}
                provider={provider}
                text={text}
                lang={lang}
                voice={voice}
                rate={rate}
                volume={volume}
            />
        </Button>
    )
}

interface ITTSVoicesSettingsProps {
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

function TTSVoicesSettings({ value, onChange, onBlur }: ITTSVoicesSettingsProps) {
    console.debug('render tts voices settings')

    const { t } = useTranslation()
    const { theme, themeType } = useTheme()

    const styles = useTTSSettingsStyles({ theme, themeType, isDesktopApp: utils.isDesktopApp() })

    const [showLangSelector, setShowLangSelector] = useState(false)

    const [supportedVoices, setSupportedVoices] = useState<SpeechSynthesisVoice[]>([])

    const provider = value?.provider ?? defaultTTSProvider

    const { data: edgeVoices, isLoading: isEdgeVoicesLoading } = useSWR(
        provider === 'EdgeTTS' ? 'edgeVoices' : null,
        fetchEdgeVoices
    )

    const { data: webSpeechVoices, isLoading: isWebSpeechVoicesLoading } = useSWR(
        provider === 'WebSpeech' ? 'webSpeechVoices' : null,
        async () => {
            return speechSynthesis.getVoices()
        }
    )

    const isVoicesLoading = isEdgeVoicesLoading || isWebSpeechVoicesLoading

    useEffect(() => {
        switch (provider) {
            case 'EdgeTTS':
                setSupportedVoices(edgeVoices ?? [])
                break
            case 'WebSpeech':
                setSupportedVoices(webSpeechVoices ?? [])
                break
            default:
                setSupportedVoices(edgeVoices ?? [])
                break
        }
    }, [edgeVoices, provider, webSpeechVoices])

    const getLangOptions = useCallback(
        (lang: string) => {
            return supportedLanguages.reduce((acc, [langCode, label]) => {
                const ttsLang = langCode2TTSLang[langCode]
                if (ttsLang && supportedVoices.find((v) => v.lang === ttsLang)) {
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
        [value?.voices, supportedVoices]
    )

    const getVoiceOptions = useCallback(
        (lang: LangCode) => {
            const ttsLang = langCode2TTSLang[lang]
            return supportedVoices
                .filter((v) => v.lang.split('-')[0] === lang || v.lang === ttsLang)
                .filter((v, idx, items) => items.findIndex((item) => item.name === v.name) === idx)
                .map((sv) => ({
                    id: sv.voiceURI,
                    label: (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                            }}
                            key={sv.voiceURI}
                        >
                            <SpeakerButton
                                shape='round'
                                kind='secondary'
                                iconSize={12}
                                overrides={{
                                    Root: {
                                        style: {
                                            padding: '4px',
                                        },
                                    },
                                }}
                                provider={value?.provider}
                                lang={lang}
                                voice={sv.voiceURI}
                                volume={value?.volume}
                                rate={value?.rate}
                            />
                            {sv.name}
                        </div>
                    ),
                    lang: sv.lang,
                }))
        },
        [supportedVoices, value?.provider, value?.rate, value?.volume]
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
        (prevLang: LangCode, newLang: LangCode) => {
            const voices = value?.voices ?? []
            const newVoices = voices.map((item) => {
                if (item.lang === prevLang) {
                    return {
                        lang: newLang,
                        voice: '',
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
        (lang: LangCode) => {
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
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                marginTop: 20,
            }}
        >
            <div className={styles.formControl}>
                <label className={styles.label}>{t('Provider')}</label>
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
            <div className={styles.formControl}>
                <label className={styles.label}>{t('Rate')}</label>
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
                <label className={styles.label}>{t('Volume')}</label>
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
                <label className={styles.label}>{t('Voice')}</label>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                    }}
                >
                    {isVoicesLoading && <Skeleton rows={6} height='300px' width='100%' animation />}
                    {!isVoicesLoading &&
                        (value?.voices ?? []).map(({ lang, voice }) => {
                            const langOptions = getLangOptions(lang)
                            const selectedLang = langOptions.find((opt) => opt.id === lang)
                            const voiceOptions = getVoiceOptions(lang)
                            const selectedVoice = voiceOptions.find((opt) => opt.id === voice)
                            return (
                                <div className={styles.voiceSelector} key={lang}>
                                    <Select
                                        key={`lang-${lang}`}
                                        size='mini'
                                        clearable={false}
                                        options={langOptions}
                                        placeholder={t('Please select a language')}
                                        overrides={{
                                            Root: {
                                                style: {
                                                    width: '115px',
                                                    flexShrink: 0,
                                                },
                                            },
                                        }}
                                        onChange={({ option }) => handleChangeLang(lang, option?.id as LangCode)}
                                        value={selectedLang ? [{ id: selectedLang.id }] : undefined}
                                    />
                                    <Select
                                        size='mini'
                                        options={voiceOptions}
                                        placeholder={t('Please select a voice')}
                                        overrides={{
                                            Root: {
                                                style: {
                                                    flexShrink: 1,
                                                    minWidth: '215px',
                                                },
                                            },
                                        }}
                                        value={selectedVoice ? [{ id: selectedVoice.id }] : undefined}
                                        onChange={({ option }) => handleChangeVoice(lang, option?.id as string)}
                                        clearable={false}
                                        onBlur={onBlur}
                                        autoFocus={!selectedVoice}
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
                                        <RiDeleteBin5Line size={12} />
                                    </Button>
                                </div>
                            )
                        })}
                </div>
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
                            placeholder={t('Please select a language')}
                            clearable={false}
                            options={getLangOptions('')}
                            onChange={({ option }) => handleAddLang(option?.id as LangCode)}
                            autoFocus
                        />
                    )}
                    <Button
                        size='mini'
                        overrides={{
                            Root: {
                                style: {
                                    flexShrink: 0,
                                },
                            },
                        }}
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

interface IProxyProtocolProps {
    value?: ProxyProtocol
    onChange?: (value: ProxyProtocol) => void
    onBlur?: () => void
}

function ProxyProtocolSelector({ value, onChange, onBlur }: IProxyProtocolProps) {
    const options = [
        { label: 'HTTP', id: 'HTTP' },
        { label: 'HTTPS', id: 'HTTPS' },
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
                              label: options.find((option) => option.id === value)?.label || 'HTTP',
                          },
                      ]
                    : undefined
            }
            onChange={(params) => {
                onChange?.(params.value[0].id as ProxyProtocol)
            }}
            options={options}
        />
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
        { label: 'Türkçe', id: 'tr' },
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
    currentProvider: Provider
    provider: Provider
    apiKey?: string
    value?: string
    onChange?: (value: string) => void
    onBlur?: () => void
}

interface APIModelOption {
    label: React.ReactNode
    id: string
}

function APIModelSelector({ currentProvider, provider, apiKey, value, onChange, onBlur }: APIModelSelectorProps) {
    const { t } = useTranslation()
    const [isLoading, setIsLoading] = useState(false)
    const [options, setOptions] = useState<APIModelOption[]>([])
    const [errMsg, setErrMsg] = useState<string>()
    const [isChatGPTNotLogin, setIsChatGPTNotLogin] = useState(false)
    const [refreshFlag, refresh] = useReducer((x: number) => x + 1, 0)
    const { theme } = useTheme()

    useEffect(() => {
        setIsChatGPTNotLogin(false)
        setErrMsg('')
        setOptions([])
        if (provider !== currentProvider) {
            return
        }
        const engine = getEngine(provider)
        setIsLoading(true)
        ;(async () => {
            try {
                const models = await engine.listModels(apiKey)
                setOptions([
                    ...models.map((model: IModel) => ({
                        label: (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 3,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '14px',
                                        color: theme.colors.contentPrimary,
                                    }}
                                >
                                    {model.name}
                                </div>
                                {model.description && (
                                    <div
                                        style={{
                                            fontSize: '12px',
                                            color: theme.colors.contentTertiary,
                                        }}
                                    >
                                        {model.description}
                                    </div>
                                )}
                            </div>
                        ),
                        id: model.id,
                    })),
                    ...(engine.supportCustomModel()
                        ? [
                              {
                                  id: CUSTOM_MODEL_ID,
                                  label: t('Custom'),
                              },
                          ]
                        : []),
                ])
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                if (
                    provider === 'ChatGPT' &&
                    e.message &&
                    (e.message.includes('not login') || e.message.includes('Forbidden'))
                ) {
                    setIsChatGPTNotLogin(true)
                }
                setErrMsg(e.message)
            } finally {
                setIsLoading(false)
            }
        })()
    }, [apiKey, currentProvider, provider, refreshFlag, t, theme.colors.contentPrimary, theme.colors.contentTertiary])

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                }}
            >
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
                <Button
                    size='compact'
                    kind='secondary'
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        refresh()
                    }}
                >
                    <IoRefreshSharp size={16} />
                </Button>
            </div>
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
                    <div
                        style={{
                            color: theme.colors.contentPrimary,
                        }}
                    >
                        <span>{t('Please login to ChatGPT Web')}: </span>
                        <a href='https://chat.openai.com' target='_blank' rel='noreferrer' style={linkStyle}>
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

interface ReadSelectedWordsFromInputElementsProps {
    value?: boolean
    onChange?: (value: boolean) => void
    onBlur?: () => void
}

function ReadSelectedWordsFromInputElementsCheckbox({
    value,
    onChange,
    onBlur,
}: ReadSelectedWordsFromInputElementsProps) {
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

const useStyles = createUseStyles({
    headerPromotion: (props: IThemedStyleProps) => {
        return {
            '& p': {
                margin: '1px 0',
            },
            '& a': {
                color: props.theme.colors.contentPrimary,
                textDecoration: 'underline',
            },
        }
    },
    promotion: (props: IThemedStyleProps) => {
        return {
            'display': 'flex',
            'flexDirection': 'column',
            'gap': '3px',
            'borderRadius': '0.31rem',
            'padding': '0.15rem 0.4rem',
            'color': props.themeType === 'dark' ? props.theme.colors.black : props.theme.colors.contentPrimary,
            'backgroundColor': props.theme.colors.warning100,
            '& p': {
                margin: '2px 0',
            },
            '& a': {
                color: props.themeType === 'dark' ? props.theme.colors.black : props.theme.colors.contentPrimary,
                textDecoration: 'underline',
            },
        }
    },
    disclaimer: (props: IThemedStyleProps) => {
        return {
            'color': props.theme.colors.contentPrimary,
            'lineHeight': 1.8,
            '& a': {
                color: props.theme.colors.contentPrimary,
                textDecoration: 'underline',
            },
        }
    },
    footer: (props: IThemedStyleProps) =>
        props.isDesktopApp
            ? {
                  zIndex: 999,
                  color: props.theme.colors.contentSecondary,
                  position: 'fixed',
                  width: '100%',
                  height: '42px',
                  cursor: 'pointer',
                  left: '0',
                  bottom: '0',
                  paddingLeft: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  background: props.themeType === 'dark' ? 'rgba(31, 31, 31, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(10px)',
              }
            : {
                  color: props.theme.colors.contentSecondary,
                  position: 'absolute',
                  cursor: 'pointer',
                  bottom: '16px',
                  left: '6px',
                  lineHeight: '1',
              },
})

const useHotkeyRecorderStyles = createUseStyles({
    'hotkeyRecorder': (props: IThemedStyleProps) => ({
        position: 'relative',
        height: '32px',
        lineHeight: '32px',
        padding: '0 14px',
        borderRadius: '4px',
        width: '300px',
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
            keys_ = keys_.map((k) => (k.toLowerCase() === 'meta' ? 'CommandOrControl' : k))
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

interface IAddProviderIconsProps {
    options: Options
    currentProvider?: Provider
    hasPromotion?: boolean
    theme: typeof LightTheme
}

const addProviderIcons = ({ options, currentProvider, hasPromotion, theme }: IAddProviderIconsProps) => {
    if (!Array.isArray(options)) {
        return options
    }
    return options.map((item) => {
        if (typeof item.label !== 'string') {
            return item
        }
        const icon = engineIcons[item.id as Provider]
        if (!icon) {
            return item
        }
        let label = (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                {React.createElement(icon, { size: 10 }, [])}
                {item.label}
            </div>
        )
        if (item.id === 'OpenAI') {
            label = (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    {label}
                    {hasPromotion && currentProvider !== 'OpenAI' && (
                        <div
                            style={{
                                width: '0.45rem',
                                height: '0.45rem',
                                borderRadius: '50%',
                                backgroundColor: theme.colors.warning300,
                            }}
                        />
                    )}
                </div>
            )
        }
        return {
            ...item,
            label,
        }
    })
}

interface IProviderSelectorProps {
    value?: Provider
    onChange?: (value: Provider) => void
    hasPromotion?: boolean
}

function ProviderSelector({ value, onChange, hasPromotion }: IProviderSelectorProps) {
    const { theme } = useTheme()
    const { t } = useTranslation()

    let overrides: SelectProps['overrides'] = undefined
    if (hasPromotion && value !== 'OpenAI') {
        overrides = {
            ControlContainer: {
                style: {
                    borderColor: theme.colors.warning300,
                },
            },
        }
    }

    const options = utils.isDesktopApp()
        ? ([
              { label: 'OpenAI', id: 'OpenAI' },
              { label: 'Claude', id: 'Claude' },
              { label: `Kimi (${t('Free')})`, id: 'Kimi' },
              { label: `${t('ChatGLM')} (${t('Free')})`, id: 'ChatGLM' },
              { label: 'Cohere', id: 'Cohere' },
              { label: `Ollama (${t('Local Model')})`, id: 'Ollama' },
              { label: 'Gemini', id: 'Gemini' },
              // { label: 'ChatGPT (Web)', id: 'ChatGPT' },
              { label: 'Azure', id: 'Azure' },
              { label: 'MiniMax', id: 'MiniMax' },
              { label: 'Moonshot', id: 'Moonshot' },
              { label: 'Groq', id: 'Groq' },
              { label: 'DeepSeek', id: 'DeepSeek' },
          ] as {
              label: string
              id: Provider
          }[])
        : ([
              { label: 'OpenAI', id: 'OpenAI' },
              { label: 'Claude', id: 'Claude' },
              { label: `Kimi (${t('Free')})`, id: 'Kimi' },
              { label: `${t('ChatGLM')} (${t('Free')})`, id: 'ChatGLM' },
              { label: 'ChatGPT (Web)', id: 'ChatGPT' },
              { label: 'Cohere', id: 'Cohere' },
              { label: 'Gemini', id: 'Gemini' },
              { label: 'Azure', id: 'Azure' },
              { label: 'MiniMax', id: 'MiniMax' },
              { label: 'Moonshot', id: 'Moonshot' },
              { label: 'Groq', id: 'Groq' },
              { label: 'DeepSeek', id: 'DeepSeek' },
          ] as {
              label: string
              id: Provider
          }[])

    return (
        <Select
            overrides={overrides}
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
            options={addProviderIcons({
                options,
                currentProvider: value,
                hasPromotion,
                theme,
            })}
        />
    )
}

const { Form, FormItem, useForm } = createForm<ISettings>()

interface IInnerSettingsProps {
    showFooter?: boolean
    onSave?: (oldSettings: ISettings) => void
    headerPromotionID?: string
    openaiAPIKeyPromotionID?: string
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

export function InnerSettings({
    onSave,
    showFooter = false,
    openaiAPIKeyPromotionID,
    headerPromotionID,
}: IInnerSettingsProps) {
    const { data: promotions, mutate: refetchPromotions } = useSWR<IPromotionResponse>('promotions', fetchPromotions)

    useEffect(() => {
        const timer = setInterval(
            () => {
                refetchPromotions()
            },
            1000 * 60 * 10
        )
        return () => {
            clearInterval(timer)
        }
    }, [refetchPromotions])

    const isTauri = utils.isTauri()

    useEffect(() => {
        if (!isTauri) {
            return undefined
        }
        let unlisten: (() => void) | undefined = undefined
        const appWindow = getCurrent()
        appWindow
            .listen('tauri://focus', () => {
                refetchPromotions()
            })
            .then((cb) => {
                unlisten = cb
            })
        return () => {
            unlisten?.()
        }
    }, [isTauri, refetchPromotions])

    useEffect(() => {
        if (!isTauri) {
            return
        }
        trackEvent('screen_view', { name: 'Settings' })
    }, [isTauri])

    const { theme, themeType } = useTheme()

    const { refreshThemeType } = useThemeType()

    const { t } = useTranslation()

    const [loading, setLoading] = useState(false)
    const { settings, setSettings } = useSettings()
    const [values, setValues] = useState<ISettings>(settings)
    const [prevValues, setPrevValues] = useState<ISettings>(values)

    const [form] = useForm()

    useEffect(() => {
        form.setFieldsValue(values)
    }, [form, values])

    useEffect(() => {
        if (settings) {
            ;(async () => {
                if (isTauri) {
                    const { isEnabled: autostartIsEnabled } = await import('@tauri-apps/plugin-autostart')
                    settings.runAtStartup = await autostartIsEnabled()
                }
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
            setLoading(true)
            const oldSettings = await utils.getSettings()
            if (isTauri) {
                try {
                    const {
                        enable: autostartEnable,
                        disable: autostartDisable,
                        isEnabled: autostartIsEnabled,
                    } = await import('@tauri-apps/plugin-autostart')
                    if (data.runAtStartup) {
                        await autostartEnable()
                    } else {
                        await autostartDisable()
                    }
                    data.runAtStartup = await autostartIsEnabled()
                } catch (e) {
                    console.log('err', e)
                }
            }
            await utils.setSettings(data)

            if (data.themeType) {
                refreshThemeType()
            }

            if (isTauri) {
                trackEvent('save_settings')
            }

            toast(t('Saved'), {
                icon: '👍',
                duration: 3000,
            })
            setLoading(false)
            setSettings(data)
            onSave?.(oldSettings)
        },
        [isTauri, onSave, setSettings, refreshThemeType, t]
    )

    const onBlur = useCallback(async () => {
        if (values.apiKeys && !_.isEqual(values, prevValues)) {
            await utils.setSettings(values)
            setPrevValues(values)
        }
    }, [prevValues, values])

    const isDesktopApp = utils.isDesktopApp()

    const styles = useStyles({ theme, themeType, isDesktopApp })

    const [isScrolledToBottom, setIsScrolledToBottom] = useState(false)

    useEffect(() => {
        if (!showFooter) {
            return undefined
        }
        const isOnBottom = () => {
            const scrollTop = document.documentElement.scrollTop

            const windowHeight = window.innerHeight

            const documentHeight = document.documentElement.scrollHeight

            return scrollTop + windowHeight >= documentHeight
        }

        setIsScrolledToBottom(isOnBottom())

        const onScroll = () => {
            setIsScrolledToBottom(isOnBottom())
        }

        window.addEventListener('scroll', onScroll)
        window.addEventListener('resize', onScroll)
        const observer = new MutationObserver(onScroll)
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        })
        return () => {
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('resize', onScroll)
            observer.disconnect()
        }
    }, [showFooter])

    const [showBuyMeACoffee, setShowBuyMeACoffee] = useState(false)

    const [activeTab, setActiveTab] = useState('general')

    const [isScrolled, setIsScrolled] = useState(window.scrollY > 0)

    useEffect(() => {
        const onScroll = () => {
            setIsScrolled(window.scrollY > 0)
        }
        window.addEventListener('scroll', onScroll)
        return () => {
            window.removeEventListener('scroll', onScroll)
        }
    }, [])

    const tabsOverrides = {
        Root: {
            style: {
                '& button:hover': {
                    background: 'transparent !important',
                },
            },
        },
        TabList: {
            style: () => ({}),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            component: function TabsListOverride(props: any) {
                return (
                    <Grid behavior='fluid'>
                        <Cell span={12}>
                            <StyledTabList {...props} />
                        </Cell>
                    </Grid>
                )
            },
        },
    }

    const tabOverrides = {
        TabPanel: {
            style: {
                padding: '0px',
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            component: function TabsListOverride(props: any) {
                return (
                    <Grid>
                        <Cell span={[1, 2, 3]}>
                            <StyledTabPanel {...props} />
                        </Cell>
                    </Grid>
                )
            },
        },
        Tab: {
            style: {
                'color': theme.colors.black,
                'background': 'transparent',
                ':hover': {
                    background: 'rgba(255, 255, 255, 0.35) !important',
                },
                ':active': {
                    background: 'rgba(255, 255, 255, 0.45) !important',
                },
            },
        },
    }

    const getI18nPromotionContent = (contentItem: II18nPromotionContentItem) => {
        let c =
            contentItem.content[
                (values.i18n as keyof II18nPromotionContent | undefined) ?? contentItem.fallback_language
            ]
        if (!c) {
            c = contentItem.content[contentItem.fallback_language]
        }
        return c
    }

    const renderI18nPromotionContent = (contentItem: II18nPromotionContentItem) => {
        if (contentItem.format === 'text') {
            return <span>{getI18nPromotionContent(contentItem)}</span>
        }

        if (contentItem.format === 'html') {
            return (
                <div
                    dangerouslySetInnerHTML={{
                        __html: getI18nPromotionContent(contentItem) ?? '',
                    }}
                />
            )
        }

        if (contentItem.format === 'markdown') {
            return <Markdown linkTarget='_blank'>{getI18nPromotionContent(contentItem) ?? ''}</Markdown>
        }

        return <div />
    }

    const [disclaimerAgreeLink, setDisclaimerAgreeLink] = useState<string>()
    const [disclaimerPromotion, setDisclaimerPromotion] = useState<IPromotionItem>()

    const [openaiAPIKeyPromotion, setOpenaiAPIKeyPromotion] = useState<IPromotionItem>()

    useEffect(() => {
        let unlisten: (() => void) | undefined = undefined
        if (openaiAPIKeyPromotionID) {
            setOpenaiAPIKeyPromotion(promotions?.openai_api_key?.find((item) => item.id === openaiAPIKeyPromotionID))
        } else {
            choicePromotionItem(promotions?.openai_api_key).then(setOpenaiAPIKeyPromotion)
            if (isTauri) {
                const appWindow = getCurrent()
                appWindow
                    .listen('tauri://focus', () => {
                        choicePromotionItem(promotions?.openai_api_key).then(setOpenaiAPIKeyPromotion)
                    })
                    .then((cb) => {
                        unlisten = cb
                    })
            }
        }
        return () => {
            unlisten?.()
        }
    }, [isTauri, openaiAPIKeyPromotionID, promotions?.openai_api_key])

    const [headerPromotion, setHeaderPromotion] = useState<IPromotionItem>()

    useEffect(() => {
        let unlisten: (() => void) | undefined = undefined
        if (headerPromotionID) {
            setHeaderPromotion(promotions?.settings_header?.find((item) => item.id === headerPromotionID))
        } else {
            choicePromotionItem(promotions?.settings_header).then(setHeaderPromotion)
            if (isTauri) {
                const appWindow = getCurrent()
                appWindow
                    .listen('tauri://focus', () => {
                        choicePromotionItem(promotions?.settings_header).then(setHeaderPromotion)
                    })
                    .then((cb) => {
                        unlisten = cb
                    })
            }
        }
        return () => {
            unlisten?.()
        }
    }, [headerPromotionID, isTauri, promotions?.settings_header])

    const { promotionShowed: openaiAPIKeyPromotionShowed, setPromotionShowed: setOpenaiAPIKeyPromotionShowed } =
        usePromotionShowed(openaiAPIKeyPromotion)

    const { setPromotionShowed: setHeaderPromotionShowed } = usePromotionShowed(headerPromotion)

    useEffect(() => {
        setHeaderPromotionShowed(true)
    }, [setHeaderPromotionShowed])

    const {
        promotionNeverDisplay: headerPromotionNeverDisplay,
        setPromotionNeverDisplay: setHeaderPromotionNeverDisplay,
    } = usePromotionNeverDisplay(headerPromotion)

    const isOpenAI = values.provider === 'OpenAI'

    useEffect(() => {
        if (isOpenAI) {
            setOpenaiAPIKeyPromotionShowed(true)
        }
    }, [setOpenaiAPIKeyPromotionShowed, isOpenAI])

    useEffect(() => {
        if (isOpenAI && openaiAPIKeyPromotion) {
            trackEvent('promotion_view', { id: openaiAPIKeyPromotion.id })
        }
    }, [isOpenAI, openaiAPIKeyPromotion])

    useEffect(() => {
        if (disclaimerPromotion?.id) {
            trackEvent('promotion_disclaimer_view', { id: disclaimerPromotion.id })
        }
    }, [disclaimerPromotion?.id])

    console.debug('render settings')

    return (
        <div
            style={{
                paddingTop: utils.isBrowserExtensionOptions() ? undefined : '136px',
                paddingBottom: utils.isBrowserExtensionOptions() ? undefined : '32px',
                background: isDesktopApp ? 'transparent' : theme.colors.backgroundPrimary,
                minWidth: isDesktopApp ? 450 : 400,
                maxHeight: utils.isUserscript() ? 'calc(100vh - 32px)' : undefined,
                overflow: utils.isUserscript() ? 'auto' : undefined,
            }}
            data-testid='settings-container'
        >
            <nav
                style={{
                    position: utils.isBrowserExtensionOptions() ? 'sticky' : 'fixed',
                    left: 0,
                    top: 0,
                    zIndex: 999,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: `url(${utils.getAssetUrl(beams)}) no-repeat center center`,
                    boxSizing: 'border-box',
                    boxShadow: isScrolled ? theme.lighting.shadow600 : undefined,
                }}
                data-tauri-drag-region
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        color: '#333',
                        gap: 10,
                        padding: '15px 25px 0 25px',
                    }}
                >
                    <img width='22' src={utils.getAssetUrl(icon)} alt='logo' />
                    <h2
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        OpenAI Translator
                        {AppConfig?.version ? (
                            <a
                                href='https://github.com/yetone/openai-translator/releases'
                                target='_blank'
                                rel='noreferrer'
                                style={linkStyle}
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
                                trackEvent('buy_me_a_coffee_clicked')
                            }}
                        >
                            {'❤️  ' + t('Buy me a coffee')}
                        </Button>
                    </div>
                </div>
                <Tabs
                    overrides={tabsOverrides}
                    activeKey={activeTab}
                    onChange={({ activeKey }) => {
                        setActiveTab(activeKey as string)
                    }}
                    fill='fixed'
                    renderAll
                >
                    <Tab
                        title={t('General')}
                        key='general'
                        artwork={() => {
                            return <IoSettingsOutline size={14} />
                        }}
                        overrides={tabOverrides}
                    />
                    {isTauri && (
                        <Tab
                            title={t('Proxy')}
                            key='proxy'
                            artwork={() => {
                                return <TbCloudNetwork size={14} />
                            }}
                            overrides={tabOverrides}
                        />
                    )}
                    <Tab
                        title={t('TTS')}
                        key='tts'
                        artwork={() => {
                            return <RxSpeakerLoud size={14} />
                        }}
                        overrides={tabOverrides}
                    />
                    <Tab
                        title={t('Writing')}
                        key='writing'
                        artwork={() => {
                            return <PiTextbox size={14} />
                        }}
                        overrides={tabOverrides}
                    />
                    <Tab
                        title={t('Shortcuts')}
                        key='shortcuts'
                        artwork={() => {
                            return <BsKeyboard size={14} />
                        }}
                        overrides={{
                            ...tabOverrides,
                            Tab: {
                                ...tabOverrides.Tab,
                                props: {
                                    'data-testid': 'shortcuts',
                                },
                            },
                        }}
                    />
                </Tabs>
            </nav>
            {headerPromotion && !headerPromotionNeverDisplay && (
                <div
                    className={styles.headerPromotion}
                    onClick={(e) => {
                        if ((e.target as HTMLElement).tagName === 'A') {
                            const href = (e.target as HTMLAnchorElement).href
                            if (href && href.startsWith('http')) {
                                e.preventDefault()
                                e.stopPropagation()
                                setDisclaimerPromotion(headerPromotion)
                                setDisclaimerAgreeLink(href)
                            }
                        }
                    }}
                >
                    <Notification
                        overrides={{
                            Body: {
                                style: {
                                    width: 'auto',
                                    fontSize: '12px',
                                    lineHeight: '1.6',
                                    marginTop: '10px',
                                    marginBottom: '0px',
                                    paddingLeft: '14px',
                                    paddingRight: '8px',
                                    paddingTop: '6px',
                                    paddingBottom: '6px',
                                    color: theme.colors.contentPrimary,
                                },
                            },
                        }}
                        closeable={headerPromotion.can_never_display}
                        onClose={() => {
                            setHeaderPromotionNeverDisplay(true)
                        }}
                    >
                        {renderI18nPromotionContent(headerPromotion.promotion)}
                    </Notification>
                </div>
            )}
            {!isDesktopApp && (
                <div
                    style={{
                        padding: '20px 25px 0px 25px',
                        color: theme.colors.contentPrimary,
                    }}
                >
                    {t(
                        'It is recommended to download the desktop application of OpenAI Translator to enjoy the wonderful experience of word translation in all software!'
                    )}{' '}
                    <a
                        target='_blank'
                        href={
                            values?.i18n?.toLowerCase().includes('zh')
                                ? 'https://github.com/openai-translator/openai-translator/blob/main/README-CN.md#%E5%AE%89%E8%A3%85'
                                : 'https://github.com/openai-translator/openai-translator#installation'
                        }
                        rel='noreferrer'
                        style={{
                            color: theme.colors.linkText,
                        }}
                    >
                        {t('Download Link')}
                    </a>
                </div>
            )}
            <Form
                autoComplete='off'
                autoCapitalize='off'
                form={form}
                style={{
                    padding: '20px 25px',
                    paddingBottom: utils.isBrowserExtensionOptions() ? 0 : undefined,
                }}
                onFinish={onSubmit}
                initialValues={values}
                onValuesChange={onChange}
            >
                <div>
                    <div
                        style={{
                            display: activeTab === 'general' ? 'block' : 'none',
                        }}
                    >
                        <FormItem name='i18n' label={t('i18n')}>
                            <Ii18nSelector onBlur={onBlur} />
                        </FormItem>
                        <FormItem
                            name='provider'
                            label={
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 10,
                                    }}
                                >
                                    {t('Default service provider')}
                                    {openaiAPIKeyPromotion !== undefined && !openaiAPIKeyPromotionShowed && (
                                        <div
                                            style={{
                                                width: '0.45rem',
                                                height: '0.45rem',
                                                borderRadius: '50%',
                                                backgroundColor: theme.colors.warning300,
                                            }}
                                        />
                                    )}
                                </div>
                            }
                            required
                            caption={
                                values.provider === 'Ollama' ? (
                                    <div>
                                        {t('Go to the')}{' '}
                                        <a
                                            target='_blank'
                                            href='https://github.com/ollama/ollama#ollama'
                                            rel='noreferrer'
                                            style={linkStyle}
                                        >
                                            Ollama Homepage
                                        </a>{' '}
                                        {t('to learn how to install and setup.')}
                                    </div>
                                ) : undefined
                            }
                        >
                            <ProviderSelector
                                hasPromotion={openaiAPIKeyPromotion !== undefined && !openaiAPIKeyPromotionShowed}
                            />
                        </FormItem>
                        <div
                            style={{
                                display: values.provider === 'Ollama' ? 'block' : 'none',
                            }}
                        >
                            <FormItem
                                name='ollamaAPIURL'
                                label={t('API URL')}
                                required={values.provider === 'Ollama'}
                                caption={t('Generally, there is no need to modify this item.')}
                            >
                                <Input size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem
                                name='ollamaModelLifetimeInMemory'
                                label={t('The survival time of the Ollama model in memory')}
                                required={values.provider === 'Ollama'}
                            >
                                <DurationPicker size='compact' />
                            </FormItem>
                            <FormItem
                                name='ollamaAPIModel'
                                label={t('API Model')}
                                required={values.provider === 'Ollama'}
                                caption={
                                    <div>
                                        <div>
                                            {t(
                                                'Model needs to first use the `ollama pull` command to download locally, please view all models from this page:'
                                            )}{' '}
                                            <a
                                                target='_blank'
                                                href='https://ollama.com/library'
                                                rel='noreferrer'
                                                style={linkStyle}
                                            >
                                                Models
                                            </a>
                                        </div>
                                    </div>
                                }
                            >
                                <APIModelSelector provider='Ollama' currentProvider={values.provider} onBlur={onBlur} />
                            </FormItem>
                            <div
                                style={{
                                    display: values.ollamaAPIModel === CUSTOM_MODEL_ID ? 'block' : 'none',
                                }}
                            >
                                <FormItem
                                    name='ollamaCustomModelName'
                                    label={t('Custom Model Name')}
                                    required={values.provider === 'Ollama' && values.ollamaAPIModel === CUSTOM_MODEL_ID}
                                >
                                    <Input autoComplete='off' size='compact' />
                                </FormItem>
                            </div>
                        </div>
                        <div
                            style={{
                                display: values.provider === 'Groq' ? 'block' : 'none',
                            }}
                        >
                            <FormItem
                                required={values.provider === 'Groq'}
                                name='groqAPIKey'
                                label='Groq API Key'
                                caption={
                                    <div>
                                        {t('Go to the')}{' '}
                                        <a
                                            target='_blank'
                                            href='https://console.groq.com/keys'
                                            rel='noreferrer'
                                            style={linkStyle}
                                        >
                                            GroqCloud
                                        </a>{' '}
                                        {t('to get your API Key.')}
                                    </div>
                                }
                            >
                                <Input autoFocus type='password' size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem name='groqAPIModel' label={t('API Model')} required={values.provider === 'Groq'}>
                                <APIModelSelector
                                    provider='Groq'
                                    currentProvider={values.provider}
                                    apiKey={values.groqAPIKey}
                                    onBlur={onBlur}
                                />
                            </FormItem>
                            <div
                                style={{
                                    display: values.groqAPIModel === CUSTOM_MODEL_ID ? 'block' : 'none',
                                }}
                            >
                                <FormItem
                                    name='groqCustomModelName'
                                    label={t('Custom Model Name')}
                                    required={values.provider === 'Groq' && values.groqAPIModel === CUSTOM_MODEL_ID}
                                >
                                    <Input autoComplete='off' size='compact' />
                                </FormItem>
                            </div>
                            <FormItem
                                name='groqAPIURL'
                                label={t('API URL')}
                                required={values.provider === 'Groq'}
                                caption={t('Generally, there is no need to modify this item.')}
                            >
                                <Input size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem
                                name='groqAPIURLPath'
                                label={t('API URL Path')}
                                required={values.provider === 'Groq'}
                                caption={t('Generally, there is no need to modify this item.')}
                            >
                                <Input size='compact' onBlur={onBlur} />
                            </FormItem>
                        </div>
                        <div
                            style={{
                                display: values.provider === 'Claude' ? 'block' : 'none',
                            }}
                        >
                            <FormItem
                                required={values.provider === 'Claude'}
                                name='claudeAPIKey'
                                label='Claude API Key'
                                caption={
                                    <div>
                                        {t('Go to the')}{' '}
                                        <a
                                            target='_blank'
                                            href='https://console.anthropic.com/settings/keys'
                                            rel='noreferrer'
                                            style={linkStyle}
                                        >
                                            Anthropic Console
                                        </a>{' '}
                                        {t('to get your API Key.')}
                                    </div>
                                }
                            >
                                <Input autoFocus type='password' size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem
                                name='claudeAPIModel'
                                label={t('API Model')}
                                required={values.provider === 'Claude'}
                            >
                                <APIModelSelector
                                    provider='Claude'
                                    currentProvider={values.provider}
                                    apiKey={values.claudeAPIKey}
                                    onBlur={onBlur}
                                />
                            </FormItem>
                            <div
                                style={{
                                    display: values.claudeAPIModel === CUSTOM_MODEL_ID ? 'block' : 'none',
                                }}
                            >
                                <FormItem
                                    name='claudeCustomModelName'
                                    label={t('Custom Model Name')}
                                    required={values.provider === 'Claude' && values.claudeAPIModel === CUSTOM_MODEL_ID}
                                >
                                    <Input autoComplete='off' size='compact' />
                                </FormItem>
                            </div>
                            <FormItem
                                name='claudeAPIURL'
                                label={t('API URL')}
                                required={values.provider === 'Claude'}
                                caption={t('Generally, there is no need to modify this item.')}
                            >
                                <Input size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem
                                name='claudeAPIURLPath'
                                label={t('API URL Path')}
                                required={values.provider === 'Claude'}
                                caption={t('Generally, there is no need to modify this item.')}
                            >
                                <Input size='compact' onBlur={onBlur} />
                            </FormItem>
                        </div>
                        <div
                            style={{
                                display: values.provider === 'Kimi' && utils.isDesktopApp() ? 'block' : 'none',
                            }}
                        >
                            <FormItem
                                required={values.provider === 'Kimi' && utils.isDesktopApp()}
                                name='kimiRefreshToken'
                                label='Kimi Refresh Token'
                                caption={
                                    <div>
                                        {t('Go to the')}{' '}
                                        <a
                                            target='_blank'
                                            href={
                                                values?.i18n?.toLowerCase().includes('zh')
                                                    ? 'https://github.com/openai-translator/openai-translator/blob/main/docs/kimi-cn.md'
                                                    : 'https://github.com/openai-translator/openai-translator/blob/main/docs/kimi.md'
                                            }
                                            rel='noreferrer'
                                            style={linkStyle}
                                        >
                                            Tutorial
                                        </a>{' '}
                                        {t('to get your refresh_token.')}
                                    </div>
                                }
                            >
                                <Input autoFocus type='password' size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem
                                required={values.provider === 'Kimi' && utils.isDesktopApp()}
                                name='kimiAccessToken'
                                label='Kimi Access Token'
                                caption={
                                    <div>
                                        {t('Go to the')}{' '}
                                        <a
                                            target='_blank'
                                            href={
                                                values?.i18n?.toLowerCase().includes('zh')
                                                    ? 'https://github.com/openai-translator/openai-translator/blob/main/docs/kimi-cn.md'
                                                    : 'https://github.com/openai-translator/openai-translator/blob/main/docs/kimi.md'
                                            }
                                            rel='noreferrer'
                                            style={linkStyle}
                                        >
                                            Tutorial
                                        </a>{' '}
                                        {t('to get your access_token.')}
                                    </div>
                                }
                            >
                                <Input autoFocus type='password' size='compact' onBlur={onBlur} />
                            </FormItem>
                        </div>
                        <div
                            style={{
                                display: values.provider === 'ChatGLM' && utils.isDesktopApp() ? 'block' : 'none',
                            }}
                        >
                            <FormItem
                                required={values.provider === 'ChatGLM' && utils.isDesktopApp()}
                                name='chatglmRefreshToken'
                                label={`${t('ChatGLM')} Refresh Token`}
                                caption={
                                    <div>
                                        {t('Go to the')}{' '}
                                        <a
                                            target='_blank'
                                            href={
                                                values?.i18n?.toLowerCase().includes('zh')
                                                    ? 'https://github.com/openai-translator/openai-translator/blob/main/docs/chatglm-cn.md'
                                                    : 'https://github.com/openai-translator/openai-translator/blob/main/docs/chatglm.md'
                                            }
                                            rel='noreferrer'
                                            style={linkStyle}
                                        >
                                            Tutorial
                                        </a>{' '}
                                        {t('to get your refresh_token.')}
                                    </div>
                                }
                            >
                                <Input autoFocus type='password' size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem
                                required={values.provider === 'ChatGLM' && utils.isDesktopApp()}
                                name='chatglmAccessToken'
                                label={`${t('ChatGLM')} Token`}
                                caption={
                                    <div>
                                        {t('Go to the')}{' '}
                                        <a
                                            target='_blank'
                                            href={
                                                values?.i18n?.toLowerCase().includes('zh')
                                                    ? 'https://github.com/openai-translator/openai-translator/blob/main/docs/chatglm-cn.md'
                                                    : 'https://github.com/openai-translator/openai-translator/blob/main/docs/chatglm.md'
                                            }
                                            rel='noreferrer'
                                            style={linkStyle}
                                        >
                                            Tutorial
                                        </a>{' '}
                                        {t('to get your token.')}
                                    </div>
                                }
                            >
                                <Input autoFocus type='password' size='compact' onBlur={onBlur} />
                            </FormItem>
                        </div>
                        <div
                            style={{
                                display: values.provider === 'Gemini' ? 'block' : 'none',
                            }}
                        >
                            <FormItem name='geminiAPIURL' label={t('API URL')} required={values.provider === 'Gemini'}>
                                <Input size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem
                                required={values.provider === 'Gemini'}
                                name='geminiAPIKey'
                                label='Gemini API Key'
                                caption={
                                    <div>
                                        {t('Go to the')}{' '}
                                        <a
                                            target='_blank'
                                            href='https://makersuite.google.com/app/apikey'
                                            rel='noreferrer'
                                            style={linkStyle}
                                        >
                                            Google AI Studio
                                        </a>{' '}
                                        {t('to get your API Key.')}
                                    </div>
                                }
                            >
                                <Input autoFocus type='password' size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem
                                name='geminiAPIModel'
                                label={t('API Model')}
                                required={values.provider === 'Gemini'}
                            >
                                <APIModelSelector
                                    provider='Gemini'
                                    currentProvider={values.provider}
                                    apiKey={values.geminiAPIKey}
                                    onBlur={onBlur}
                                />
                            </FormItem>
                        </div>
                        <div
                            style={{
                                display: values.provider === 'Cohere' ? 'block' : 'none',
                            }}
                        >
                            <FormItem
                                required={values.provider === 'Cohere'}
                                name='cohereAPIKey'
                                label='Cohere API Key'
                                caption={
                                    <div>
                                        {t('Go to the')}{' '}
                                        <a
                                            target='_blank'
                                            href='https://dashboard.cohere.com/api-keys'
                                            rel='noreferrer'
                                            style={linkStyle}
                                        >
                                            Cohere Dashboard
                                        </a>{' '}
                                        {t('to get your API Key.')}
                                    </div>
                                }
                            >
                                <Input autoFocus type='password' size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem
                                name='cohereAPIModel'
                                label={t('API Model')}
                                required={values.provider === 'Cohere'}
                            >
                                <APIModelSelector
                                    provider='Cohere'
                                    currentProvider={values.provider}
                                    apiKey={values.cohereAPIKey}
                                    onBlur={onBlur}
                                />
                            </FormItem>
                        </div>
                        <div
                            style={{
                                display: values.provider === 'DeepSeek' ? 'block' : 'none',
                            }}
                        >
                            <FormItem
                                required={values.provider === 'DeepSeek'}
                                name='deepSeekAPIKey'
                                label='DeepSeek API Key'
                                caption={
                                    <div>
                                        {t('Go to the')}{' '}
                                        <a
                                            target='_blank'
                                            href='https://platform.deepseek.com/api_keys'
                                            rel='noreferrer'
                                            style={linkStyle}
                                        >
                                            DeepSeek Dashboard
                                        </a>{' '}
                                        {t('to get your API Key.')}
                                    </div>
                                }
                            >
                                <Input autoFocus type='password' size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem
                                name='deepSeekAPIModel'
                                label={t('API Model')}
                                required={values.provider === 'DeepSeek'}
                            >
                                <APIModelSelector
                                    provider='DeepSeek'
                                    currentProvider={values.provider}
                                    apiKey={values.deepSeekAPIKey}
                                    onBlur={onBlur}
                                />
                            </FormItem>
                        </div>
                        <div
                            style={{
                                display: values.provider === 'OpenAI' ? 'block' : 'none',
                            }}
                        >
                            <FormItem
                                required={values.provider === 'OpenAI'}
                                name='apiKeys'
                                label={t('API Key')}
                                caption={
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 3,
                                        }}
                                    >
                                        <div>
                                            {t('Go to the')}{' '}
                                            <a
                                                target='_blank'
                                                href='https://platform.openai.com/account/api-keys'
                                                rel='noreferrer'
                                                style={linkStyle}
                                            >
                                                {t('OpenAI page')}
                                            </a>{' '}
                                            {t(
                                                'to get your API Key. You can separate multiple API Keys with English commas to achieve quota doubling and load balancing.'
                                            )}
                                        </div>
                                        {openaiAPIKeyPromotion && (
                                            <div className={styles.promotion}>
                                                <div
                                                    onClick={(e) => {
                                                        if ((e.target as HTMLElement).tagName === 'A') {
                                                            const href = (e.target as HTMLAnchorElement).href
                                                            if (href && href.startsWith('http')) {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                setDisclaimerPromotion(openaiAPIKeyPromotion)
                                                                setDisclaimerAgreeLink(href)
                                                            }
                                                        }
                                                    }}
                                                >
                                                    {renderI18nPromotionContent(openaiAPIKeyPromotion.promotion)}
                                                </div>
                                                {openaiAPIKeyPromotion.configuration_doc_link && (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 3,
                                                        }}
                                                    >
                                                        <IoIosHelpCircleOutline size={12} />
                                                        <a
                                                            href={openaiAPIKeyPromotion.configuration_doc_link}
                                                            target='_blank'
                                                            rel='noreferrer'
                                                        >
                                                            {t('How to Use')}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                }
                            >
                                <Input
                                    autoFocus={!openaiAPIKeyPromotion}
                                    type='password'
                                    size='compact'
                                    name='apiKey'
                                    onBlur={onBlur}
                                />
                            </FormItem>
                            <FormItem
                                name='noModelsAPISupport'
                                label={t('No models API support')}
                                caption={t(
                                    "Some providers claiming to be compatible with OpenAI's API do not actually support OpenAI's standard model API. Therefore, we have no choice but to offer this option. If you choose this option (and then need to click the save button), we will not attempt to dynamically fetch the latest model list from the model API, but will only use a fixed model list and custom models."
                                )}
                            >
                                <MyCheckbox onBlur={onBlur} />
                            </FormItem>
                            <FormItem name='apiModel' label={t('API Model')} required={values.provider === 'OpenAI'}>
                                <APIModelSelector
                                    provider='OpenAI'
                                    currentProvider={values.provider}
                                    apiKey={values.apiKeys}
                                    onBlur={onBlur}
                                />
                            </FormItem>
                            <div
                                style={{
                                    display: values.apiModel === CUSTOM_MODEL_ID ? 'block' : 'none',
                                }}
                            >
                                <FormItem
                                    name='customModelName'
                                    label={t('Custom Model Name')}
                                    required={values.provider === 'OpenAI' && values.apiModel === CUSTOM_MODEL_ID}
                                >
                                    <Input autoComplete='off' size='compact' />
                                </FormItem>
                            </div>
                            <FormItem name='apiURL' label={t('API URL')} required={values.provider === 'OpenAI'}>
                                <Input size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem
                                name='apiURLPath'
                                label={t('API URL Path')}
                                required={values.provider === 'OpenAI'}
                            >
                                <Input size='compact' />
                            </FormItem>
                        </div>
                        <div
                            style={{
                                display: values.provider === 'Azure' ? 'block' : 'none',
                            }}
                        >
                            <FormItem
                                required={values.provider === 'Azure'}
                                name='azureAPIKeys'
                                label={t('API Key')}
                                caption={
                                    <div>
                                        {t('Go to the')}{' '}
                                        <a
                                            target='_blank'
                                            href='https://learn.microsoft.com/en-us/azure/cognitive-services/openai/chatgpt-quickstart?tabs=command-line&pivots=rest-api#retrieve-key-and-endpoint'
                                            rel='noreferrer'
                                            style={linkStyle}
                                        >
                                            {t('Azure OpenAI Service page')}
                                        </a>{' '}
                                        {t(
                                            'to get your API Key. You can separate multiple API Keys with English commas to achieve quota doubling and load balancing.'
                                        )}
                                    </div>
                                }
                            >
                                <Input autoFocus type='password' size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem
                                name='azureAPIModel'
                                label={t('API Model')}
                                required={values.provider === 'Azure'}
                            >
                                <APIModelSelector
                                    provider='Azure'
                                    currentProvider={values.provider}
                                    apiKey={values.azureAPIKeys}
                                    onBlur={onBlur}
                                />
                            </FormItem>
                            <FormItem name='azureAPIURL' label={t('API URL')} required={values.provider === 'Azure'}>
                                <Input size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem
                                name='azureAPIURLPath'
                                label={t('API URL Path')}
                                required={values.provider === 'Azure'}
                            >
                                <Input size='compact' />
                            </FormItem>
                            <FormItem name='azMaxWords' label='Max Tokens' required={values.provider === 'Azure'}>
                                <NumberInput size='compact' />
                            </FormItem>
                        </div>
                        <div
                            style={{
                                display: values.provider === 'ChatGPT' ? 'block' : 'none',
                            }}
                        >
                            <FormItem
                                name='chatgptModel'
                                label={t('API Model')}
                                required={values.provider === 'ChatGPT'}
                            >
                                <APIModelSelector
                                    provider='ChatGPT'
                                    currentProvider={values.provider}
                                    onBlur={onBlur}
                                />
                            </FormItem>
                        </div>
                        <div
                            style={{
                                display: values.provider === 'MiniMax' ? 'block' : 'none',
                            }}
                        >
                            <FormItem
                                required={values.provider === 'MiniMax'}
                                name='miniMaxGroupID'
                                label='MiniMax Group ID'
                                caption={
                                    <div>
                                        {t('Go to the')}{' '}
                                        <a
                                            target='_blank'
                                            href='https://api.minimax.chat/user-center/basic-information'
                                            rel='noreferrer'
                                            style={linkStyle}
                                        >
                                            {t('MiniMax page')}
                                        </a>{' '}
                                        {t('to get your Group ID.')}
                                    </div>
                                }
                            >
                                <Input size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem
                                required={values.provider === 'MiniMax'}
                                name='miniMaxAPIKey'
                                label='MiniMax API Key'
                                caption={
                                    <div>
                                        {t('Go to the')}{' '}
                                        <a
                                            target='_blank'
                                            href='https://api.minimax.chat/user-center/basic-information/interface-key'
                                            rel='noreferrer'
                                            style={linkStyle}
                                        >
                                            {t('MiniMax page')}
                                        </a>{' '}
                                        {t('to get your API Key.')}
                                    </div>
                                }
                            >
                                <Input autoFocus type='password' size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem
                                name='miniMaxAPIModel'
                                label={t('API Model')}
                                required={values.provider === 'MiniMax'}
                            >
                                <APIModelSelector
                                    provider='MiniMax'
                                    currentProvider={values.provider}
                                    onBlur={onBlur}
                                    apiKey={values.miniMaxAPIKey}
                                />
                            </FormItem>
                        </div>
                        <div
                            style={{
                                display: values.provider === 'Moonshot' ? 'block' : 'none',
                            }}
                        >
                            <FormItem
                                required={values.provider === 'Moonshot'}
                                name='moonshotAPIKey'
                                label='Moonshot API Key'
                                caption={
                                    <div>
                                        {t('Go to the')}{' '}
                                        <a
                                            target='_blank'
                                            href='https://www.moonshot.cn/'
                                            rel='noreferrer'
                                            style={linkStyle}
                                        >
                                            Moonshot Page
                                        </a>{' '}
                                        {t('to get your API Key.')}
                                    </div>
                                }
                            >
                                <Input autoFocus type='password' size='compact' onBlur={onBlur} />
                            </FormItem>
                            <FormItem
                                name='moonshotAPIModel'
                                label={t('API Model')}
                                required={values.provider === 'Moonshot'}
                            >
                                <APIModelSelector
                                    provider='Moonshot'
                                    currentProvider={values.provider}
                                    onBlur={onBlur}
                                    apiKey={values.moonshotAPIKey}
                                />
                            </FormItem>
                        </div>
                        <FormItem name='defaultTranslateMode' label={t('Default Action')}>
                            <TranslateModeSelector onBlur={onBlur} />
                        </FormItem>
                        <FormItem name='defaultTargetLanguage' label={t('Default target language')}>
                            <LanguageSelector onBlur={onBlur} />
                        </FormItem>
                        <FormItem name='languageDetectionEngine' label={t('Language detection engine')}>
                            <LanguageDetectionEngineSelector onBlur={onBlur} />
                        </FormItem>
                        <FormItem name='themeType' label={t('Theme')}>
                            <ThemeTypeSelector onBlur={onBlur} />
                        </FormItem>
                        <FormItem
                            style={{
                                display: isDesktopApp ? 'block' : 'none',
                            }}
                            name='enableBackgroundBlur'
                            label={t('Window background blur')}
                            caption={t(
                                "If the window background blur effect is enabled, please ensure to set the 'Theme' to 'Follow the System', as it is currently not possible to manually switch between light and dark themes when the window background blur is active."
                            )}
                        >
                            <MyCheckbox onBlur={onBlur} />
                        </FormItem>
                        <FormItem name='fontSize' label={t('Font size')}>
                            <NumberInput />
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
                                        {t(
                                            'It is highly recommended to disable this feature and use the Clip Extension'
                                        )}
                                        <a
                                            href='https://github.com/openai-translator/openai-translator/blob/main/CLIP-EXTENSIONS.md'
                                            target='_blank'
                                            rel='noreferrer'
                                            style={linkStyle}
                                        >
                                            {t('Clip Extension')}
                                        </a>
                                    </div>
                                )
                            }
                        >
                            <MyCheckbox onBlur={onBlur} />
                        </FormItem>
                        <FormItem name='autoTranslate' label={t('Auto Translate')}>
                            <AutoTranslateCheckbox onBlur={onBlur} />
                        </FormItem>
                        <FormItem
                            style={{
                                display: isDesktopApp ? 'block' : 'none',
                            }}
                            name='restorePreviousPosition'
                            label={t('Fixed Position')}
                        >
                            <RestorePreviousPositionCheckbox onBlur={onBlur} />
                        </FormItem>
                        <FormItem name='selectInputElementsText' label={t('Word selection in input')}>
                            <SelectInputElementsCheckbox onBlur={onBlur} />
                        </FormItem>
                        {isTauri && (
                            <FormItem name='runAtStartup' label={t('Run at startup')}>
                                <RunAtStartupCheckbox onBlur={onBlur} />
                            </FormItem>
                        )}
                        <FormItem
                            style={{
                                display: isDesktopApp ? 'block' : 'none',
                            }}
                            name='hideTheIconInTheDock'
                            label={isMacOS ? t('Hide the icon in the Dock bar') : t('Hide the icon in the taskbar')}
                        >
                            <MyCheckbox onBlur={onBlur} />
                        </FormItem>
                        <FormItem
                            style={{
                                display: isDesktopApp ? 'block' : 'none',
                            }}
                            name='autoHideWindowWhenOutOfFocus'
                            label={t('Auto hide window when out of focus')}
                        >
                            <MyCheckbox onBlur={onBlur} />
                        </FormItem>
                        <FormItem
                            style={{
                                display: isDesktopApp ? 'block' : 'none',
                            }}
                            name='automaticCheckForUpdates'
                            label={t('Automatic check for updates')}
                        >
                            <MyCheckbox onBlur={onBlur} />
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
                    </div>
                    <div
                        style={{
                            display: isTauri && activeTab === 'proxy' ? 'block' : 'none',
                        }}
                    >
                        <FormItem name={['proxy', 'enabled']} label={t('Enabled')}>
                            <MyCheckbox />
                        </FormItem>
                        <FormItem name={['proxy', 'protocol']} label={t('Protocol')}>
                            <ProxyProtocolSelector />
                        </FormItem>
                        <FormItem name={['proxy', 'server']} label={t('Server')}>
                            <Input size='compact' />
                        </FormItem>
                        <FormItem name={['proxy', 'port']} label={t('Port')}>
                            <Input type='number' size='compact' />
                        </FormItem>
                        <FormItem name={['proxy', 'basicAuth', 'username']} label={t('Username')}>
                            <Input size='compact' />
                        </FormItem>
                        <FormItem name={['proxy', 'basicAuth', 'password']} label={t('Password')}>
                            <Input type='password' size='compact' />
                        </FormItem>
                        <FormItem name={['proxy', 'noProxy']} label={t('No proxy')}>
                            <Textarea size='compact' />
                        </FormItem>
                        <ProxyTester proxy={values.proxy} />
                    </div>
                    <div
                        style={{
                            display: activeTab === 'tts' ? 'block' : 'none',
                        }}
                    >
                        <FormItem
                            name='readSelectedWordsFromInputElementsText'
                            label={t('Read the selected words in input')}
                        >
                            <ReadSelectedWordsFromInputElementsCheckbox onBlur={onBlur} />
                        </FormItem>
                        <FormItem name='tts' label={t('TTS')}>
                            <TTSVoicesSettings onBlur={onBlur} />
                        </FormItem>
                    </div>
                    <div
                        style={{
                            display: activeTab === 'writing' ? 'block' : 'none',
                        }}
                    >
                        <FormItem
                            style={{
                                display: isDesktopApp ? 'block' : 'none',
                            }}
                            name='writingTargetLanguage'
                            label={t('Writing target language')}
                        >
                            <LanguageSelector onBlur={onBlur} />
                        </FormItem>
                        <FormItem
                            style={{
                                display: isDesktopApp ? 'block' : 'none',
                            }}
                            name='writingHotkey'
                            label={t('Writing Hotkey')}
                            caption={t(
                                'Press this shortcut key in the input box of any application, and the text already entered in the input box will be automatically translated into the writing target language.'
                            )}
                        >
                            <HotkeyRecorder onBlur={onBlur} testId='writing-hotkey-recorder' />
                        </FormItem>
                        <FormItem
                            style={{
                                display: isDesktopApp ? 'block' : 'none',
                            }}
                            name='writingNewlineHotkey'
                            label={t('Writing line break shortcut')}
                            caption={t('When writing, which key should be pressed when encountering a line break?')}
                        >
                            <HotkeyRecorder onBlur={onBlur} testId='writing-newline-hotkey-recorder' />
                        </FormItem>
                    </div>
                    <div
                        style={{
                            display: activeTab === 'shortcuts' ? 'block' : 'none',
                        }}
                    >
                        <FormItem name='hotkey' label={t('Hotkey')}>
                            <HotkeyRecorder onBlur={onBlur} testId='hotkey-recorder' />
                        </FormItem>
                        <FormItem name='displayWindowHotkey' label={t('Display window Hotkey')}>
                            <HotkeyRecorder onBlur={onBlur} testId='display-window-hotkey-recorder' />
                        </FormItem>
                        <FormItem
                            style={{
                                display: isDesktopApp ? 'block' : 'none',
                            }}
                            name='ocrHotkey'
                            label={t('OCR Hotkey')}
                        >
                            <HotkeyRecorder onBlur={onBlur} testId='ocr-hotkey-recorder' />
                        </FormItem>
                    </div>
                </div>
                <div
                    style={{
                        position: utils.isBrowserExtensionOptions() ? 'sticky' : 'fixed',
                        bottom: '7px',
                        right: '25px',
                        paddingBottom: utils.isBrowserExtensionOptions() ? '10px' : undefined,
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'row',
                        zIndex: 1000,
                        gap: 10,
                    }}
                >
                    <div
                        style={{
                            marginRight: 'auto',
                        }}
                    />
                    <Button isLoading={loading} size='mini' startEnhancer={<IoIosSave size={12} />}>
                        {t('Save')}
                    </Button>
                </div>
                <Toaster />
            </Form>
            {showFooter && (
                <div
                    className={styles.footer}
                    style={{
                        boxShadow: isScrolledToBottom ? undefined : theme.lighting.shadow700,
                    }}
                />
            )}
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
            <Modal
                isOpen={!!disclaimerPromotion}
                onClose={() => setDisclaimerPromotion(undefined)}
                closeable
                size='auto'
                autoFocus
                animate
            >
                <ModalHeader>{t('Disclaimer')}</ModalHeader>
                <ModalBody className={styles.disclaimer}>
                    {disclaimerPromotion ? renderI18nPromotionContent(disclaimerPromotion.disclaimer) : ''}
                </ModalBody>
                <ModalFooter>
                    <ModalButton
                        size='compact'
                        kind='tertiary'
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setDisclaimerPromotion(undefined)
                        }}
                    >
                        {t('Disagree')}
                    </ModalButton>
                    <ModalButton
                        size='compact'
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation()
                            e.preventDefault()
                            trackEvent('promotion_clicked', { id: openaiAPIKeyPromotion?.id ?? '' })
                            if (isTauri) {
                                if (disclaimerAgreeLink) {
                                    open(disclaimerAgreeLink)
                                }
                            } else {
                                window.open(disclaimerAgreeLink)
                            }
                        }}
                    >
                        {t('Agree and continue')}
                    </ModalButton>
                </ModalFooter>
            </Modal>
        </div>
    )
}
