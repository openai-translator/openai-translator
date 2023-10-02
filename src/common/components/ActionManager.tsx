import { useLiveQuery } from 'dexie-react-hooks'
import icon from '../assets/images/icon.png'
import { actionService } from '../services/action'
import { FiEdit } from 'react-icons/fi'
import { createUseStyles } from 'react-jss'
import { IThemedStyleProps } from '../types'
import { useTheme } from '../hooks/useTheme'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Button } from 'baseui-sd/button'
import { List, arrayMove } from 'baseui-sd/dnd-list'
import { RiDeleteBinLine } from 'react-icons/ri'
import { createElement, useReducer, useRef, useState } from 'react'
import * as mdIcons from 'react-icons/md'
import { Action } from '../internal-services/db'
import { Modal, ModalBody, ModalButton, ModalFooter, ModalHeader } from 'baseui-sd/modal'
import { ActionForm } from './ActionForm'
import { IconType } from 'react-icons'
import { isDesktopApp, exportToCsv, csvToActions } from '../utils'
import { MdArrowDownward, MdArrowUpward } from 'react-icons/md'

const useStyles = createUseStyles({
    root: () => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isDesktopApp() ? '40px 20px 20px 20px' : 0,
        boxSizing: 'border-box',
        width: isDesktopApp() ? '100%' : '600px',
    }),
    header: (props: IThemedStyleProps) => ({
        width: '100%',
        color: props.theme.colors.contentPrimary,
        padding: isDesktopApp() ? '40px 20px 20px 20px' : 20,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        position: isDesktopApp() ? 'fixed' : 'block',
        backdropFilter: 'blur(10px)',
        zIndex: 1,
        left: 0,
        top: 0,
        background: props.themeType === 'dark' ? 'rgba(31, 31, 31, 0.5)' : 'rgba(255, 255, 255, 0.5)',
        flexFlow: 'row nowrap',
        cursor: 'move',
        borderBottom: `1px solid ${props.theme.colors.borderTransparent}`,
    }),
    iconContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
        marginRight: 'auto',
    },
    icon: {
        'display': 'block',
        'width': '16px',
        'height': '16px',
        '-ms-user-select': 'none',
        '-webkit-user-select': 'none',
        'user-select': 'none',
    },
    iconText: (props: IThemedStyleProps) => ({
        'color': props.themeType === 'dark' ? props.theme.colors.contentSecondary : props.theme.colors.contentPrimary,
        'fontSize': '14px',
        'fontWeight': 600,
        'cursor': 'unset',
        '@media screen and (max-width: 570px)': {
            display: props.isDesktopApp ? 'none' : undefined,
        },
    }),
    operationList: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    actionList: () => ({
        paddingTop: isDesktopApp() ? 70 : 0,
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

export interface IActionManagerProps {
    draggable?: boolean
}

export function ActionManager({ draggable = true }: IActionManagerProps) {
    const [refreshActionsFlag, refreshActions] = useReducer((x: number) => x + 1, 0)
    const { t } = useTranslation()
    const { theme, themeType } = useTheme()
    const styles = useStyles({ theme, themeType })
    const actions = useLiveQuery(() => actionService.list(), [refreshActionsFlag])
    const [showActionForm, setShowActionForm] = useState(false)
    const [updatingAction, setUpdatingAction] = useState<Action>()
    const [deletingAction, setDeletingAction] = useState<Action>()
    const [openGroups, setOpenGroups] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    if (!actions) {
        // Return a default value or do nothing
        return null
    }
    const actionGroups = actions.reduce((groups: { [key: string]: Action[] }, action) => {
        const group = action.group || 'default'
        if (!groups[group]) {
            groups[group] = []
        }
        groups[group].push(action)
        return groups
    }, {})
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (event.target.files) {
                const file = event.target.files[0]
                if (file) {
                    const importActions = await csvToActions(file)
                    await actionService.bulkPut(importActions)
                    refreshActions()
                }
            }
        } catch (error) {
            console.error('Error handling file change:', error)
            // Optionally, show an error message to the user
        }
    }

    const onCsvExportActions = async (group: string) => {
        try {
            const filteredActions = actions.filter((action) => {
                return action.group === group
            })
            await exportToCsv<Action>(group + `-${new Date().valueOf()}`, filteredActions)
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div
            className={styles.root}
            style={{
                width: !draggable ? '800px' : undefined,
            }}
        >
            <div className={styles.header} data-tauri-drag-region>
                <div className={styles.iconContainer}>
                    <img data-tauri-drag-region className={styles.icon} src={icon} />
                    <div className={styles.iconText}>{t('Action Manager')}</div>
                </div>
                <div
                    style={{
                        marginRight: 'auto',
                    }}
                />
                <div className={styles.operationList}>
                    <Button
                        size='mini'
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setUpdatingAction(undefined)
                            setShowActionForm(true)
                        }}
                    >
                        {t('Create')}
                    </Button>
                    <Button
                        size='mini'
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (fileInputRef.current) {
                                fileInputRef.current.click()
                            }
                        }}
                    >
                        {t('Import')}
                    </Button>
                </div>
            </div>
            <input type='file' ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
            <div className={styles.actionList}>
                {Object.keys(actionGroups).map((group) => (
                    <div key={group}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    if (openGroups.includes(group)) {
                                        setOpenGroups(openGroups.filter((g) => g !== group))
                                    } else {
                                        setOpenGroups([...openGroups, group])
                                    }
                                }}
                            >
                                {group}
                            </h3>
                            <Button
                                size='mini'
                                onClick={() => {
                                    onCsvExportActions(group)
                                }}
                            >
                                {t('Export')}
                            </Button>
                        </div>
                        {openGroups.includes(group) && (
                            <List
                                onChange={async ({ oldIndex, newIndex }) => {
                                    const groupActions = actionGroups[group]
                                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                    const newActions = arrayMove(groupActions!, oldIndex, newIndex)
                                    await actionService.bulkPut(
                                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                        newActions.map((a, idx) => {
                                            return {
                                                ...a,
                                                idx,
                                            }
                                        })
                                    )
                                    if (!isDesktopApp()) {
                                        refreshActions()
                                    }
                                }}
                                items={actionGroups[group]?.map((action, idx) => (
                                    <div key={action.id} className={styles.actionItem}>
                                        <div className={styles.actionContent}>
                                            <div className={styles.name}>
                                                {action.icon &&
                                                    createElement((mdIcons as Record<string, IconType>)[action.icon], {
                                                        size: 16,
                                                    })}
                                                {action.mode ? t(action.name) : action.name}
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
                                                    {t('Created At')}{' '}
                                                    {format(+action?.createdAt, 'yyyy-MM-dd HH:mm:ss')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.actionOperation}>
                                            {!draggable && (
                                                <>
                                                    <Button
                                                        size='mini'
                                                        disabled={idx === 0}
                                                        onClick={async (e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            const newActions = arrayMove(actions, idx, idx - 1)
                                                            await actionService.bulkPut(
                                                                newActions.map((a, idx) => {
                                                                    return {
                                                                        ...a,
                                                                        idx,
                                                                    }
                                                                })
                                                            )
                                                            if (!isDesktopApp()) {
                                                                refreshActions()
                                                            }
                                                        }}
                                                    >
                                                        <MdArrowUpward size={12} />
                                                    </Button>
                                                    <Button
                                                        size='mini'
                                                        disabled={idx === actions.length - 1}
                                                        onClick={async (e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            const newActions = arrayMove(actions, idx, idx + 1)
                                                            await actionService.bulkPut(
                                                                newActions.map((a, idx) => {
                                                                    return {
                                                                        ...a,
                                                                        idx,
                                                                    }
                                                                })
                                                            )
                                                            if (!isDesktopApp()) {
                                                                refreshActions()
                                                            }
                                                        }}
                                                    >
                                                        <MdArrowDownward size={12} />
                                                    </Button>
                                                </>
                                            )}
                                            <Button
                                                size='mini'
                                                startEnhancer={<FiEdit size={12} />}
                                                disabled={!!action.mode}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
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
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    setDeletingAction(action)
                                                }}
                                            >
                                                {t('Delete')}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            />
                        )}
                    </div>
                ))}
                <Modal
                    isOpen={showActionForm}
                    onClose={() => {
                        setShowActionForm(false)
                        setUpdatingAction(undefined)
                    }}
                    closeable
                    size='default'
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
                                if (!isDesktopApp()) {
                                    refreshActions()
                                }
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
                    <ModalBody>
                        {t('Are you sure to delete sth?', [`${t('Action')} ${deletingAction?.name}`])}
                    </ModalBody>
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
                            onClick={async () => {
                                await actionService.delete(deletingAction?.id as number)
                                if (!isDesktopApp()) {
                                    refreshActions()
                                }
                                setDeletingAction(undefined)
                            }}
                        >
                            {t('Ok')}
                        </ModalButton>
                    </ModalFooter>
                </Modal>
            </div>
        </div>
    )
}
