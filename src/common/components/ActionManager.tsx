import { useLiveQuery } from 'dexie-react-hooks'
import { actionService } from '../services/action'
import { FiEdit } from 'react-icons/fi'
import { createUseStyles } from 'react-jss'
import { IThemedStyleProps } from '../types'
import { useTheme } from '../hooks/useTheme'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Button } from 'baseui-sd/button'
import { List } from 'baseui-sd/dnd-list'
import { RiDeleteBinLine } from 'react-icons/ri'
import { GrFormAdd } from 'react-icons/gr'
import { createElement, useState } from 'react'
import * as mdIcons from 'react-icons/md'
import { Action } from '../internal-services/db'
import { Modal, ModalBody, ModalButton, ModalFooter, ModalHeader } from 'baseui-sd/modal'
import { ActionForm } from './ActionForm'
import { IconType } from 'react-icons'

const useStyles = createUseStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px 20px 20px',
        boxSizing: 'border-box',
        width: '100%',
    },
    operationListConainer: (props: IThemedStyleProps) => ({
        width: '100%',
        padding: '30px 16px 16px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        position: 'fixed',
        backdropFilter: 'blur(10px)',
        zIndex: 1,
        left: 0,
        top: 0,
        background: props.themeType === 'dark' ? 'rgba(31, 31, 31, 0.5)' : 'rgba(255, 255, 255, 0.5)',
        flexFlow: 'row nowrap',
        cursor: 'move',
        borderBottom: `1px solid ${props.theme.colors.borderTransparent}`,
    }),
    operationList: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    actionList: () => ({
        paddingTop: 70,
        width: '100%',
    }),
    actionItem: () => ({
        'width': '100%',
        'display': 'flex',
        'flexDirection': 'row',
        'alignItems': 'center',
        'gap': '20px',
        '&:hover $actionOperation': {
            display: 'flex',
        },
    }),
    actionContent: () => ({
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        width: '100%',
        overflow: 'hidden',
    }),
    actionOperation: {
        flexShrink: 0,
        display: 'none',
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        gap: 10,
    },
    name: {
        fontSize: '16px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    prompts: (props: IThemedStyleProps) => ({
        'color': props.theme.colors.contentSecondary,
        'fontSize': '12px',
        'display': 'flex',
        'flexDirection': 'column',
        'gap': '3px',
        '& > div': {
            'display': '-webkit-box',
            'overflow': 'hidden',
            'lineHeight': '1.5',
            'maxWidth': '400px',
            'textOverflow': 'ellipsis',
            '-webkit-line-clamp': 2,
            '-webkit-box-orient': 'vertical',
        },
    }),
    metadata: (props: IThemedStyleProps) => ({
        color: props.theme.colors.contentSecondary,
        fontSize: '12px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '6px',
    }),
})

export function ActionManager() {
    const { t } = useTranslation()
    const { theme, themeType } = useTheme()
    const styles = useStyles({ theme, themeType })
    const actions = useLiveQuery(() => actionService.list(), [])
    const [showActionForm, setShowActionForm] = useState(false)
    const [updatingAction, setUpdatingAction] = useState<Action>()
    const [deletingAction, setDeletingAction] = useState<Action>()

    return (
        <div className={styles.root}>
            <div className={styles.operationListConainer} data-tauri-drag-region>
                <div
                    style={{
                        marginRight: 'auto',
                    }}
                />
                <div className={styles.operationList}>
                    <Button
                        size='mini'
                        startEnhancer={<GrFormAdd size={12} />}
                        onClick={() => {
                            setUpdatingAction(undefined)
                            setShowActionForm(true)
                        }}
                    >
                        {t('Create')}
                    </Button>
                </div>
            </div>
            <div className={styles.actionList}>
                <List
                    onChange={({ oldIndex, newIndex }) => {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        const action = actions![oldIndex]
                        actionService.update(action, {
                            idx: newIndex,
                        })
                    }}
                    items={actions?.map((action) => (
                        <div key={action.id} className={styles.actionItem}>
                            <div className={styles.actionContent}>
                                <div className={styles.name}>
                                    {action.icon &&
                                        createElement((mdIcons as Record<string, IconType>)[action.icon], { size: 16 })}
                                    {action.name}
                                    {action.mode && (
                                        <div
                                            style={{
                                                display: 'inline-block',
                                                fontSize: '12px',
                                                background: theme.colors.backgroundTertiary,
                                                padding: '1px 4px',
                                                borderRadius: '2px',
                                            }}
                                        >
                                            {t('built-in')}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.prompts}>
                                    <div>{action.rolePrompt}</div>
                                    <div>{action.commandPrompt}</div>
                                </div>
                                <div className={styles.metadata}>
                                    <div>
                                        {t('Created At')} {format(+action?.createdAt, 'yyyy-MM-dd HH:mm:ss')}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.actionOperation}>
                                <Button
                                    size='mini'
                                    startEnhancer={<FiEdit size={12} />}
                                    disabled={!!action.mode}
                                    onClick={() => {
                                        setUpdatingAction(action)
                                        setShowActionForm(true)
                                    }}
                                >
                                    {t('Update')}
                                </Button>
                                <Button
                                    size='mini'
                                    startEnhancer={<RiDeleteBinLine size={12} />}
                                    disabled={!!action.mode}
                                    onClick={() => {
                                        setDeletingAction(action)
                                    }}
                                >
                                    {t('Delete')}
                                </Button>
                            </div>
                        </div>
                    ))}
                />
            </div>
            <Modal
                isOpen={showActionForm}
                onClose={() => {
                    setShowActionForm(false)
                    setUpdatingAction(undefined)
                }}
                closeable
                size='auto'
                autoFocus
                animate
                role='dialog'
            >
                <ModalHeader>
                    {updatingAction ? t('Update sth', [t('Action')]) : t('Create sth', [t('Action')])}
                </ModalHeader>
                <ModalBody>
                    <ActionForm
                        action={updatingAction}
                        onSubmit={() => {
                            setShowActionForm(false)
                        }}
                    />
                </ModalBody>
            </Modal>
            <Modal
                isOpen={!!deletingAction}
                onClose={() => {
                    setDeletingAction(undefined)
                }}
                closeable
                size='default'
                autoFocus
                animate
                role='dialog'
            >
                <ModalHeader>{t('Delete sth', [t('Action')])}</ModalHeader>
                <ModalBody>{t('Are you sure to delete sth?', [`${t('Action')} ${deletingAction?.name}`])}</ModalBody>
                <ModalFooter>
                    <ModalButton
                        size='compact'
                        kind='tertiary'
                        onClick={() => {
                            setDeletingAction(undefined)
                        }}
                    >
                        {t('Cancel')}
                    </ModalButton>
                    <ModalButton
                        size='compact'
                        onClick={() => {
                            actionService.delete(deletingAction?.id as number)
                            setDeletingAction(undefined)
                        }}
                    >
                        {t('Ok')}
                    </ModalButton>
                </ModalFooter>
            </Modal>
        </div>
    )
}
