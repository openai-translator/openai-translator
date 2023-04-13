import { useCallback, useEffect, useState } from 'react'
import _ from 'underscore'
import icon from './assets/images/icon.png'
import beams from './assets/images/beams.jpg'
import toast, { Toaster } from 'react-hot-toast'
import * as utils from '../common/utils'
import { Client as Styletron } from 'styletron-engine-atomic'
import { Provider as StyletronProvider } from 'styletron-react'
import { BaseProvider } from 'baseui-sd'
import { Input } from 'baseui-sd/input'
import { createForm } from '../components/Form'
import formStyles from 'inline:../components/Form/index.module.css'
import { Button } from 'baseui-sd/button'
import './index.css'
import { TranslateMode, Provider, APIModel } from '../content_script/translate'
import { Select, Value, Option } from 'baseui-sd/select'
import { Checkbox } from 'baseui-sd/checkbox'
import { supportLanguages } from '../content_script/lang'
import { useRecordHotkeys } from 'react-hotkeys-hook'
import { createUseStyles } from 'react-jss'
import clsx from 'clsx'
import { ISettings, IThemedStyleProps, ThemeType } from '../common/types'
import { useTheme } from '../common/hooks/useTheme'
import { IoCloseCircle } from 'react-icons/io5'
import { useTranslation } from 'react-i18next'
import AppConfig from '../../package.json'
import { useSettings } from '../common/hooks/useSettings'
import { langCode2TTSLang } from '../common/tts'
import { RiDeleteBin5Line } from 'react-icons/ri'
import { IoMdAdd } from 'react-icons/io'

const langOptions: Value = supportLanguages.reduce((acc, [id, label]) => {
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

function LanguageSelector(props: ILanguageSelectorProps) {
    const { value, onChange, onBlur } = props

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

interface AlwaysShowIconsCheckboxProps {
    value?: boolean
    onChange?: (value: boolean) => void
    onBlur?: () => void
}

function AlwaysShowIconsCheckbox(props: AlwaysShowIconsCheckboxProps) {
    return (
        <Checkbox
            checkmarkType='toggle_round'
            checked={props.value}
            onChange={(e) => {
                props.onChange?.(e.target.checked)
                props.onBlur?.()
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

function TranslateModeSelector(props: ITranslateModeSelectorProps) {
    const { t } = useTranslation()

    return (
        <Select
            size='compact'
            onBlur={props.onBlur}
            searchable={false}
            clearable={false}
            value={
                props.value && [
                    {
                        id: props.value,
                    },
                ]
            }
            onChange={(params) => {
                props.onChange?.(params.value[0].id as TranslateMode | 'nop')
            }}
            options={
                [
                    { label: t('Translate'), id: 'translate' },
                    { label: t('Polishing'), id: 'polishing' },
                    { label: t('Summarize'), id: 'summarize' },
                    { label: t('Analyze'), id: 'analyze' },
                    { label: t('Explain Code'), id: 'explain-code' },
                    { label: t('Nop'), id: 'nop' },
                ] as {
                    label: string
                    id: TranslateMode
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

function ThemeTypeSelector(props: IThemeTypeSelectorProps) {
    const { t } = useTranslation()

    return (
        <Select
            size='compact'
            onBlur={props.onBlur}
            searchable={false}
            clearable={false}
            value={
                props.value
                    ? [
                          {
                              id: props.value,
                          },
                      ]
                    : []
            }
            onChange={(params) => {
                props.onChange?.(params.value[0].id as ThemeType)
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
        marginBottom: '4px',
    }),
    voiceSelector: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '10px',
    },
})

interface TTSVoicesSettingsProps {
    value?: ISettings['ttsVoices']
    onChange?: (value: ISettings['ttsVoices']) => void
    onBlur?: () => void
}

function TTSVoicesSettings(props: TTSVoicesSettingsProps) {
    const { theme, themeType } = useTheme()

    const styles = useTTSSettingsStyles({ theme, themeType, isDesktopApp: utils.isDesktopApp() })

    const [showLangSelector, setShowLangSelector] = useState(false)

    const supportVoices = window.speechSynthesis?.getVoices() ?? []

    const getLangOptions = useCallback(
        (lang: string) => {
            return supportLanguages.reduce((acc, [langCode, label]) => {
                const ttsLang = langCode2TTSLang[langCode]
                if (ttsLang && supportVoices.find((v) => v.lang === ttsLang)) {
                    if (props.value?.find((item) => item.lang === langCode) && langCode !== lang) {
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
        [props.value]
    )

    const getVoiceOptions = useCallback(
        (lang: string) => {
            const ttsLang = langCode2TTSLang[lang]
            return supportVoices
                .filter((v) => v.lang === ttsLang)
                .map((sv) => ({ id: sv.voiceURI, label: sv.name, lang: sv.lang }))
        },
        [props.value]
    )

    const handleDeleteLang = useCallback(
        (lang: string) => {
            const voices = props.value ?? []
            const newVoices = voices.filter((item) => {
                return item.lang !== lang
            })
            props.onChange?.(newVoices)
        },
        [props.value]
    )

    const handleChangeLang = useCallback(
        (prevLang: string, newLang: string) => {
            const voices = props.value ?? []
            const newVoices = voices.map((item) => {
                if (item.lang === prevLang) {
                    return {
                        ...item,
                        lang: newLang,
                    }
                }
                return item
            })
            props.onChange?.(newVoices)
        },
        [props.value]
    )

    const handleAddLang = useCallback(
        (lang: string) => {
            const voices = props.value ?? []
            props.onChange?.([
                ...voices,
                {
                    lang,
                    voice: '',
                },
            ])
            setShowLangSelector(false)
        },
        [props.value]
    )

    const handleChangeVoice = useCallback(
        (lang: string, voice: string) => {
            const voices = props.value ?? []
            const newVoices = voices.map((item) => {
                if (item.lang === lang) {
                    return {
                        ...item,
                        voice,
                    }
                }
                return item
            })
            props.onChange?.(newVoices)
        },
        [props.value]
    )

    return (
        <div>
            <div>
                <label className={styles.settingsLabel}>Voice</label>
                {(props.value ?? []).map(({ lang, voice }) => (
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
                            onBlur={props.onBlur}
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
                        Add
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

function Ii18nSelector(props: Ii18nSelectorProps) {
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
            onBlur={props.onBlur}
            searchable={false}
            clearable={false}
            value={
                props.value
                    ? [
                          {
                              id: props.value,
                              label: options.find((option) => option.id === props.value)?.label || 'en',
                          },
                      ]
                    : undefined
            }
            onChange={(params) => {
                props.onChange?.(params.value[0].id as string)
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

function APIModelSelector(props: APIModelSelectorProps) {
    const [options, setOptions] = useState<APIModelOption[]>([])
    useEffect(() => {
        if (props.provider === 'OpenAI') {
            setOptions([
                { label: 'gpt-3.5-turbo', id: 'gpt-3.5-turbo' },
                { label: 'gpt-3.5-turbo-0301', id: 'gpt-3.5-turbo-0301' },
                { label: 'gpt-4', id: 'gpt-4' },
                { label: 'gpt-4-0314', id: 'gpt-4-0314' },
                { label: 'gpt-4-32k', id: 'gpt-4-32k' },
                { label: 'gpt-4-32k-0314', id: 'gpt-4-32k-0314' },
            ])
        } else if (props.provider === 'ChatGPT') {
            fetch(utils.defaultChatGPTAPIAuthSession, { cache: 'no-cache' })
                .then((response) => response.json())
                .then((resp) => {
                    const headers: Record<string, string> = {
                        Authorization: `Bearer ${resp.accessToken}`,
                    }
                    return fetch(`${utils.defaultChatGPTWebAPI}/models`, {
                        cache: 'no-cache',
                        headers,
                    }).then((response) => response.json())
                })
                .then((models) => {
                    if (!models || !models.models) {
                        return
                    }
                    setOptions(models.models.map((model: any) => ({ label: model.title, id: model.slug })))
                })
                .catch((e) => {
                    console.error(e)
                })
        }
    }, [props.provider])

    return (
        <Select
            size='compact'
            onBlur={props.onBlur}
            searchable={false}
            clearable={false}
            value={
                props.value
                    ? [
                          {
                              id: props.value,
                          },
                      ]
                    : undefined
            }
            onChange={(params) => {
                props.onChange?.(params.value[0].id as APIModel)
            }}
            options={options}
        />
    )
}

interface AutoTranslateCheckboxProps {
    value?: boolean
    onChange?: (value: boolean) => void
    onBlur?: () => void
}

function AutoTranslateCheckbox(props: AutoTranslateCheckboxProps) {
    return (
        <Checkbox
            checkmarkType='toggle_round'
            checked={props.value}
            onChange={(e) => {
                props.onChange?.(e.target.checked)
                props.onBlur?.()
            }}
        />
    )
}

interface RestorePreviousPositionCheckboxProps {
    value?: boolean
    onChange?: (value: boolean) => void
    onBlur?: () => void
}

function RestorePreviousPositionCheckbox(props: RestorePreviousPositionCheckboxProps) {
    return (
        <Checkbox
            checkmarkType='toggle_round'
            checked={props.value}
            onChange={(e) => {
                props.onChange?.(e.target.checked)
                props.onBlur?.()
            }}
        />
    )
}
interface RunAtStartupCheckboxProps {
    value?: boolean
    onChange?: (value: boolean) => void
    onBlur?: () => void
}

function RunAtStartupCheckbox(props: RunAtStartupCheckboxProps) {
    return (
        <Checkbox
            checkmarkType='toggle_round'
            checked={props.value}
            onChange={(e) => {
                props.onChange?.(e.target.checked)
                props.onBlur?.()
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
}

function HotkeyRecorder(props: IHotkeyRecorderProps) {
    const { theme, themeType } = useTheme()

    const { t } = useTranslation()

    const styles = useHotkeyRecorderStyles({ themeType, theme })
    const [keys, { start, stop, isRecording }] = useRecordHotkeys()

    const [hotKeys, setHotKeys] = useState<string[]>([])
    useEffect(() => {
        if (props.value) {
            setHotKeys(
                props.value
                    .replace(/-/g, '+')
                    .split('+')
                    .map((k) => k.trim())
                    .filter(Boolean)
            )
        }
    }, [props.value])

    useEffect(() => {
        let keys_ = Array.from(keys)
        if (keys_ && keys_.length > 0) {
            keys_ = keys_.filter((k) => k.toLowerCase() !== 'meta')
            setHotKeys(keys_)
            props.onChange?.(keys_.join('+'))
        }
    }, [keys])

    useEffect(() => {
        if (!isRecording) {
            props.onChange?.(hotKeys.join('+'))
        }
    }, [isRecording])

    useEffect(() => {
        const stopRecording = () => {
            if (isRecording) {
                stop()
                props.onBlur?.()
            }
        }
        document.addEventListener('click', stopRecording)
        return () => {
            document.removeEventListener('click', stopRecording)
        }
    }, [isRecording, props.onBlur])

    function clearHotkey() {
        props.onChange?.('')
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
                className={clsx(styles.hotkeyRecorder, {
                    [styles.recording]: isRecording,
                })}
            >
                {hotKeys.join(' + ')}
                {!isRecording && hotKeys.length > 0 ? (
                    <IoCloseCircle
                        className={styles.clearHotkey}
                        onClick={(e) => {
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

function ProviderSelector(props: IProviderSelectorProps) {
    return (
        <Select
            size='compact'
            searchable={false}
            clearable={false}
            value={
                props.value && [
                    {
                        id: props.value,
                    },
                ]
            }
            onChange={(params) => {
                props.onChange?.(params.value[0].id as Provider | 'OpenAI')
            }}
            options={
                [
                    { label: 'OpenAI', id: 'OpenAI' },
                    { label: 'ChatGPT (Web)', id: 'ChatGPT' },
                    { label: 'Azure', id: 'Azure' },
                ] as {
                    label: string
                    id: Provider
                }[]
            }
        />
    )
}

const { Form, FormItem, useForm } = createForm<ISettings>()

interface IPopupProps {
    onSave?: (oldSettings: ISettings) => void
    engine: Styletron
}

export function Settings(props: IPopupProps) {
    const { theme } = useTheme()

    const { t } = useTranslation()

    const [loading, setLoading] = useState(false)
    const [values, setValues] = useState<ISettings>({
        apiKeys: '',
        apiURL: utils.defaultAPIURL,
        apiURLPath: utils.defaultAPIURLPath,
        apiModel: utils.defaultAPIModel,
        provider: utils.defaultProvider,
        autoTranslate: utils.defaultAutoTranslate,
        defaultTranslateMode: 'translate',
        defaultTargetLanguage: utils.defaultTargetLanguage,
        alwaysShowIcons: utils.defaultAlwaysShowIcons,
        hotkey: '',
        i18n: utils.defaulti18n,
        restorePreviousPosition: false,
        runAtStartup: false,
    })
    const [prevValues, setPrevValues] = useState<ISettings>(values)

    const [form] = useForm()

    useEffect(() => {
        form.setFieldsValue(values)
    }, [form, values])

    const { settings, setSettings } = useSettings()
    const isTauri = utils.isTauri()

    useEffect(() => {
        if (settings) {
            ;(async () => {
                if (isTauri) {
                    const { isEnabled: autostartIsEnabled } = await require('tauri-plugin-autostart-api')
                    settings.runAtStartup = await autostartIsEnabled()
                }
                setValues(settings)
                setPrevValues(settings)
            })()
        }
    }, [settings])

    const onChange = useCallback((_changes: Partial<ISettings>, values_: ISettings) => {
        setValues(values_)
    }, [])
    const onSubmit = useCallback(async (data: ISettings) => {
        setLoading(true)
        const oldSettings = await utils.getSettings()
        if (isTauri) {
            try {
                const {
                    enable: autostartEnable,
                    disable: autostartDisable,
                    isEnabled: autostartIsEnabled,
                } = await require('tauri-plugin-autostart-api')
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

        toast(t('Saved'), {
            icon: '👍',
            duration: 3000,
        })
        setLoading(false)
        setSettings(data)
        props.onSave?.(oldSettings)
    }, [])

    const onBlur = useCallback(async () => {
        if (values.apiKeys && !_.isEqual(values, prevValues)) {
            await utils.setSettings(values)
            setPrevValues(values)
        }
    }, [values])

    const isDesktopApp = utils.isDesktopApp()

    return (
        <div
            style={{
                paddingTop: isDesktopApp ? '98px' : undefined,
                paddingBottom: isDesktopApp ? '32px' : undefined,
                background: theme.colors.backgroundPrimary,
                minWidth: isDesktopApp ? 450 : 400,
            }}
        >
            <style>{formStyles}</style>
            <StyletronProvider value={props.engine}>
                <BaseProvider theme={theme}>
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
                        }}
                        data-tauri-drag-region
                    >
                        <img width='22' src={icon} alt='logo' />
                        <h2>
                            OpenAI Translator
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
                        <FormItem name='provider' label={t('Default Service Provider')}>
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
                                <Input autoFocus type='password' size='compact' onBlur={onBlur} />
                            </FormItem>
                        )}
                        {values.provider !== 'Azure' && (
                            <FormItem name='apiModel' label={t('API Model')}>
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
                        <FormItem name='defaultTranslateMode' label={t('Default Translate Mode')}>
                            <TranslateModeSelector onBlur={onBlur} />
                        </FormItem>
                        <FormItem name='alwaysShowIcons' label={t('Always show icons')}>
                            <AlwaysShowIconsCheckbox onBlur={onBlur} />
                        </FormItem>
                        <FormItem name='autoTranslate' label={t('Auto Translate')}>
                            <AutoTranslateCheckbox onBlur={onBlur} />
                        </FormItem>
                        <FormItem name='restorePreviousPosition' label={t('Restore Previous Position')}>
                            <RestorePreviousPositionCheckbox onBlur={onBlur} />
                        </FormItem>
                        {isTauri && (
                            <FormItem name='runAtStartup' label={t('Run at Startup')}>
                                <RunAtStartupCheckbox onBlur={onBlur} />
                            </FormItem>
                        )}
                        <FormItem name='defaultTargetLanguage' label={t('Default Target Language')}>
                            <LanguageSelector onBlur={onBlur} />
                        </FormItem>
                        <FormItem name='themeType' label={t('Theme')}>
                            <ThemeTypeSelector onBlur={onBlur} />
                        </FormItem>
                        <FormItem name='i18n' label={t('i18n')}>
                            <Ii18nSelector onBlur={onBlur} />
                        </FormItem>
                        <FormItem name='ttsVoices' label={t('TTS')}>
                            <TTSVoicesSettings onBlur={onBlur} />
                        </FormItem>
                        <FormItem name='hotkey' label={t('Hotkey')}>
                            <HotkeyRecorder onBlur={onBlur} />
                        </FormItem>
                        <FormItem name='ocrHotkey' label={t('OCR Hotkey')}>
                            <HotkeyRecorder onBlur={onBlur} />
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
                </BaseProvider>
            </StyletronProvider>
        </div>
    )
}
