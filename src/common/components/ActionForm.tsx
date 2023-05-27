import { useTranslation } from 'react-i18next'
import { ICreateActionOption } from '../internal-services/action'
import { Action } from '../internal-services/db'
import { createForm } from './Form'
import { Input } from 'baseui-sd/input'
import { Textarea } from 'baseui-sd/textarea'
import { Button } from 'baseui-sd/button'
import { useCallback, useState } from 'react'
import { actionService } from '../services/action'
import { createUseStyles } from 'react-jss'
import { IThemedStyleProps } from '../types'
import { useTheme } from '../hooks/useTheme'
import { IconPicker } from './IconPicker'

const useStyles = createUseStyles({
    placeholder: (props: IThemedStyleProps) => ({
        color: props.theme.colors.positive50,
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

    const placeholdersCaption = (
        <ul
            style={{
                listStyle: 'square',
                margin: 0,
                padding: 0,
                marginTop: 10,
                paddingLeft: 20,
            }}
        >
            <li>
                <span className={styles.placeholder}>{'${sourceLang}'}</span> {t('means the source language')}
            </li>
            <li>
                <span className={styles.placeholder}>{'${targetLang}'}</span> {t('means the target language')}
            </li>
        </ul>
    )

    const rolePromptCaption = (
        <div
            style={{
                lineHeight: 1.8,
            }}
        >
            <div>{t('Role prompt indicates what role the action represents.')}</div>
            <div>{t('Role prompt example: You are a translator.')}</div>
            <div>{t('Placeholders')}:</div>
            <div>{placeholdersCaption}</div>
        </div>
    )

    const commandPromptCaption = (
        <div
            style={{
                lineHeight: 1.8,
            }}
        >
            <div>
                {t(
                    'Command prompt indicates what command should be issued to the role represented by the action when the action is executed.'
                )}
            </div>
            <div>
                {t('Command prompt example: Please translate the following text from ${sourceLang} to ${targetLang}.')}
            </div>
            <div>{t('Placeholders')}:</div>
            <div>{placeholdersCaption}</div>
        </div>
    )

    return (
        <Form initialValues={props.action} onFinish={onSubmit}>
            <FormItem required name='name' label={t('Name')}>
                <Input size='compact' />
            </FormItem>
            <FormItem required name='icon' label={t('Icon')}>
                <IconPicker />
            </FormItem>
            <FormItem required name='rolePrompt' label={t('Role Prompt')} caption={rolePromptCaption}>
                <Textarea size='compact' />
            </FormItem>
            <FormItem required name='commandPrompt' label={t('Command Prompt')} caption={commandPromptCaption}>
                <Textarea size='compact' />
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
        </Form>
    )
}
