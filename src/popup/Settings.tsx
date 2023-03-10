import React, { useCallback, useEffect, useState } from 'react'
import icon from './assets/images/icon.png'
import beams from './assets/images/beams.jpg'
import toast, { Toaster } from 'react-hot-toast'
import * as utils from '../common/utils'
import { Client as Styletron } from 'styletron-engine-atomic'
import { Provider as StyletronProvider } from 'styletron-react'
import { LightTheme, BaseProvider } from 'baseui'
import { Input } from 'baseui/input'
import { createForm } from '../components/Form'
import { Button } from 'baseui/button'
import './index.css'
import { TranslateMode } from '../content_script/translate'
import { Select, Value, Option } from 'baseui/select'
import { Checkbox } from 'baseui/checkbox'
import { supportLanguages } from '../content_script/lang'

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
}

function LanguageSelector(props: ILanguageSelectorProps) {
    const { value, onChange } = props

    return (
        <Select
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
}

interface AutoTranslateCheckboxProps {
    value?: boolean
    onChange?: (value: boolean) => void
}

function TranslateModeSelector(props: ITranslateModeSelectorProps) {
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
                props.onChange?.(params.value[0].id as TranslateMode | 'nop')
            }}
            options={
                [
                    { label: 'Translate', id: 'translate' },
                    { label: 'Polishing', id: 'polishing' },
                    { label: 'Summarize', id: 'summarize' },
                    { label: 'Analyze', id: 'analyze' },
                    { label: 'Explain Code', id: 'explain-code' },
                    { label: 'Nop', id: 'nop' },
                ] as {
                    label: string
                    id: TranslateMode
                }[]
            }
        />
    )
}

function AutoTranslateCheckbox(props: AutoTranslateCheckboxProps) {
    return (
        <Checkbox
            checkmarkType='toggle_round'
            checked={props.value}
            onChange={(e) => {
                props.onChange?.(e.target.checked)
            }}
        />
    )
}

const engine = new Styletron()

const { Form, FormItem, useForm } = createForm<utils.ISettings>()

interface IPopupProps {
    onSave?: (settings: utils.ISettings) => void
}

export function Settings(props: IPopupProps) {
    const [loading, setLoading] = useState(false)
    const [values, setValues] = useState<utils.ISettings>({
        apiKeys: '',
        apiURL: utils.defaultAPIURL,
        autoTranslate: utils.defaultAutoTranslate,
        defaultTranslateMode: 'translate',
        defaultTargetLanguage: utils.defaultTargetLanguage,
        hotkey: '',
    })

    const [form] = useForm()

    useEffect(() => {
        form.setFieldsValue(values)
    }, [form, values])

    useEffect(() => {
        !(async () => {
            const settings = await utils.getSettings()
            setValues(settings)
        })()
    }, [])

    const onChange = useCallback((_changes: Partial<utils.ISettings>, values_: utils.ISettings) => {
        setValues(values_)
    }, [])

    const onSubmmit = useCallback(async (data: utils.ISettings) => {
        setLoading(true)
        await utils.setSettings(data)
        toast('Saved', {
            icon: '👍',
            duration: 3000,
        })
        setLoading(false)
        props.onSave?.(data)
    }, [])

    return (
        <div
            style={{
                minWidth: 400,
            }}
        >
            <StyletronProvider value={engine}>
                <BaseProvider theme={LightTheme}>
                    <nav
                        style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: '15px 25px',
                            color: '#333',
                            background: `url(${beams}) no-repeat center center`,
                            gap: 10,
                        }}
                    >
                        <img width='22' src={icon} alt='logo' />
                        <h2>OpenAI Translator</h2>
                    </nav>
                    <Form
                        form={form}
                        style={{
                            padding: '20px 25px',
                        }}
                        onFinish={onSubmmit}
                        initialValues={values}
                        onValuesChange={onChange}
                    >
                        <FormItem
                            required
                            name='apiKeys'
                            label='API Key'
                            caption={
                                <div>
                                    Go to the{' '}
                                    <a
                                        target='_blank'
                                        href='https://platform.openai.com/account/api-keys'
                                        rel='noreferrer'
                                    >
                                        OpenAI page
                                    </a>{' '}
                                    to get your API Key. You can separate multiple API Keys with English commas to
                                    achieve quota doubling and load balancing.
                                </div>
                            }
                        >
                            <Input autoFocus type='password' size='compact' />
                        </FormItem>
                        <FormItem required name='apiURL' label='API URL'>
                            <Input size='compact' />
                        </FormItem>
                        <FormItem name='defaultTranslateMode' label='Default Translate Mode'>
                            <TranslateModeSelector />
                        </FormItem>
                        <FormItem name='autoTranslate' label='Auto Translate'>
                            <AutoTranslateCheckbox />
                        </FormItem>
                        <FormItem name='defaultTargetLanguage' label='Default Target Language'>
                            <LanguageSelector />
                        </FormItem>
                        <FormItem name='hotkey' label='Hotkey'>
                            <Input size='compact' />
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
                                Save
                            </Button>
                        </div>
                        <Toaster />
                    </Form>
                </BaseProvider>
            </StyletronProvider>
        </div>
    )
}
