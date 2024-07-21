import { useTranslation } from 'react-i18next'
import { ICreateActionOption } from '../internal-services/action'
import { Action } from '../internal-services/db'
import { createForm } from './Form'
import { Input } from 'baseui-sd/input'
import { Textarea } from 'baseui-sd/textarea'
import { Button } from 'baseui-sd/button'
import { useCallback, useEffect, useState } from 'react'
import { actionService } from '../services/action'
import { createUseStyles } from 'react-jss'
import { IThemedStyleProps } from '../types'
import { useTheme } from '../hooks/useTheme'
import { IconPicker } from './IconPicker'
import { RenderingFormatSelector } from './RenderingFormatSelector'

const useStyles = createUseStyles({
    placeholder: (props: IThemedStyleProps) => ({
        color: props.theme.colors.positive,
    }),
    promptCaptionContainer: () => ({
        'lineHeight': 1.8,
        '& *': {
            '-ms-user-select': 'text',
            '-webkit-user-select': 'text',
            'user-select': 'text',
        },
    }),
    placeholderCaptionContainer: () => ({
        listStyle: 'square',
        margin: 0,
        padding: 0,
        marginTop: 10,
        paddingLeft: 20,
    }),
})

export interface IActionFormProps {
    action?: Action
    onSubmit: (action: Action) => void
}

const { Form, FormItem } = createForm<ICreateActionOption>()

export function ActionForm(props: IActionFormProps) {
    const { theme, themeType } = useTheme()
    const styles = useStyles({ theme, themeType })

    const { t } = useTranslation()

    const [loading, setLoading] = useState(false)

    const onSubmit = useCallback(
        async (values: ICreateActionOption) => {
            setLoading(true)
            let action: Action
            if (props.action) {
                action = await actionService.update(props.action, values)
            } else {
                action = await actionService.create(values)
            }
            props.onSubmit(action)
            setLoading(false)
        },
        [props]
    )

    const rolePlaceholdersCaption = (
        <ul className={styles.placeholderCaptionContainer}>
            <li>
                <span className={styles.placeholder}>{'${sourceLang}'}</span> {t('represents the source language')}
            </li>
            <li>
                <span className={styles.placeholder}>{'${targetLang}'}</span> {t('represents the target language')}
            </li>
        </ul>
    )

    const commandPlaceholdersCaption = (
        <ul className={styles.placeholderCaptionContainer}>
            <li>
                <span className={styles.placeholder}>{'${sourceLang}'}</span> {t('represents the source language')}
            </li>
            <li>
                <span className={styles.placeholder}>{'${targetLang}'}</span> {t('represents the target language')}
            </li>
            <li>
                <span className={styles.placeholder}>{'${text}'}</span>{' '}
                {t(
                    'represents the original text, which is usually not needed inside the prompt because it is automatically injected'
                )}
            </li>
        </ul>
    )

    const rolePromptCaption = (
        <div className={styles.promptCaptionContainer}>
            <div>{t('Role prompt indicates what role the action represents.')}</div>
            <div>{t('Role prompt example: You are a translator.')}</div>
            <div>{t('Placeholders')}:</div>
            <div>{rolePlaceholdersCaption}</div>
        </div>
    )

    const commandPromptCaption = (
        <div className={styles.promptCaptionContainer}>
            <div>
                {t(
                    'Command prompt indicates what command should be issued to the role represented by the action when the action is executed.'
                )}
            </div>
            <div>
                {t('Command prompt example: Please translate the following text from ${sourceLang} to ${targetLang}.')}
            </div>
            <div>{t('Placeholders')}:</div>
            <div>{commandPlaceholdersCaption}</div>
        </div>
    )

    const [values, setValues] = useState<ICreateActionOption | undefined>(props.action)
    useEffect(() => {
        setValues(props.action)
    }, [props.action])

    const handleValuesChange = useCallback((_changes: Partial<ICreateActionOption>, values: ICreateActionOption) => {
        setValues(values)
    }, [])

    return (
        <Form initialValues={values} onValuesChange={handleValuesChange} onFinish={onSubmit}>
            <FormItem required name='name' label={t('Name')}>
                <Input size='compact' />
            </FormItem>
            <FormItem required name='icon' label={t('Icon')}>
                <IconPicker />
            </FormItem>
            <FormItem name='rolePrompt' label={`${t('Role Prompt')} (Optional)`} caption={rolePromptCaption}>
                <Textarea
                    rows={4}
                    overrides={{
                        Root: {
                            style: {
                                width: '100%',
                            },
                        },
                    }}
                    size='compact'
                    resize='vertical'
                />
            </FormItem>
            <FormItem required name='commandPrompt' label={t('Command Prompt')} caption={commandPromptCaption}>
                <Textarea
                    rows={4}
                    overrides={{
                        Root: {
                            style: {
                                width: '100%',
                            },
                        },
                    }}
                    size='compact'
                    resize='vertical'
                />
            </FormItem>
            <FormItem name='outputRenderingFormat' label={t('Output rendering format')}>
                <RenderingFormatSelector />
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
                    {t('Submit')}
                </Button>
            </div>
        </Form>
    )
}
