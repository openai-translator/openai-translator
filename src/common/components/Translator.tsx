import React, { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast, { Toaster } from 'react-hot-toast'
import { Client as Styletron } from 'styletron-engine-atomic'
import { Provider as StyletronProvider } from 'styletron-react'
import { BaseProvider } from 'baseui-sd'
import { Textarea } from 'baseui-sd/textarea'
import { createUseStyles } from 'react-jss'
import { AiOutlineTranslation, AiOutlineLock, AiOutlinePlusSquare } from 'react-icons/ai'
import { IoSettingsOutline } from 'react-icons/io5'
import * as mdIcons from 'react-icons/md'
import { StatefulTooltip } from 'baseui-sd/tooltip'
import { detectLang, getLangConfig, sourceLanguages, targetLanguages, LangCode } from './lang/lang'
import { WebAPI, TranslateMode } from '../translate'
import { Select, Value, Option } from 'baseui-sd/select'
import { RxEraser, RxReload, RxSpeakerLoud } from 'react-icons/rx'
import { RiSpeakerFill } from 'react-icons/ri'
import { calculateMaxXY, queryPopupCardElement } from '../../browser-extension/content_script/utils'
import { clsx } from 'clsx'
import { Button } from 'baseui-sd/button'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '../components/ErrorFallback'
import { defaultAPIURL, getSettings, isDesktopApp, isTauri } from '../utils'
import { InnerSettings } from './Settings'
import { documentPadding } from '../../browser-extension/content_script/consts'
import Dropzone from 'react-dropzone'
import { addNewNote, isConnected } from '../anki/anki-connect'
import actionsData from '../services/prompts.json'
import SpeakerMotion from '../components/SpeakerMotion'
import IpLocationNotification from '../components/IpLocationNotification'
import { HighlightInTextarea } from '../highlight-in-textarea'
import LRUCache from 'lru-cache'
import { ISettings, IThemedStyleProps } from '../types'
import { useTheme } from '../hooks/useTheme'
import { speak } from '../tts'
import { Tooltip } from './Tooltip'
import { useSettings } from '../hooks/useSettings'
import { Modal, ModalBody, ModalHeader } from 'baseui-sd/modal'
import { setupAnalysis } from '../analysis'
import { Action } from '../internal-services/db'
import { CopyButton } from './CopyButton'
import { useLiveQuery } from 'dexie-react-hooks'
import { actionService } from '../services/action'
import { ActionManager } from './ActionManager'
import { GrMoreVertical } from 'react-icons/gr'
import { StatefulPopover } from 'baseui-sd/popover'
import { StatefulMenu } from 'baseui-sd/menu'
import { IconType } from 'react-icons'
import { GiPlatform } from 'react-icons/gi'
import { IoIosRocket } from 'react-icons/io'
import 'katex/dist/katex.min.css'
import Latex from 'react-latex-next'
import { Markdown } from './Markdown'
import useResizeObserver from 'use-resize-observer'
import _ from 'underscore'
import { GlobalSuspense } from './GlobalSuspense'
import YouGlishComponent from '../youglish/youglish'
import { LANG_CONFIGS } from '../components/lang/data'

const cache = new LRUCache({
    max: 500,
    maxSize: 5000,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sizeCalculation: (_value, _key) => {
        return 1
    },
})

function genLangOptions(langs: [LangCode, string][]): Value {
    return langs.reduce((acc, [id, label]) => {
        return [
            ...acc,
            {
                id,
                label,
            } as Option,
        ]
    }, [] as Value)
}
const sourceLangOptions = genLangOptions(sourceLanguages)
const targetLangOptions = genLangOptions(targetLanguages)


const useStyles = createUseStyles({
    'popupCard': {
        height: '100%',
        boxSizing: 'border-box',
    },
    'footer': (props: IThemedStyleProps) =>
        props.isDesktopApp
            ? {
                  color: props.theme.colors.contentSecondary,
                  position: 'fixed',
                  width: '100%',
                  height: '42px',
                  cursor: 'pointer',
                  left: '0',
                  bottom: '0',
                  paddingLeft: '16px',
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
                  left: '16px',
                  lineHeight: '1',
              },
    'popupCardHeaderContainer': (props: IThemedStyleProps) =>
        props.isDesktopApp
            ? {
                  'position': 'fixed',
                  'backdropFilter': 'blur(10px)',
                  'zIndex': 1,
                  'left': 0,
                  'top': 0,
                  'width': '100%',
                  'boxSizing': 'border-box',
                  'padding': '30px 16px 8px',
                  'background': props.themeType === 'dark' ? 'rgba(31, 31, 31, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                  'display': 'flex',
                  'flexDirection': 'row',
                  'flexFlow': 'row nowrap',
                  'cursor': 'move',
                  'alignItems': 'center',
                  'borderBottom': `1px solid ${props.theme.colors.borderTransparent}`,
                  '-ms-user-select': 'none',
                  '-webkit-user-select': 'none',
                  'user-select': 'none',
              }
            : {
                  'display': 'flex',
                  'flexDirection': 'row',
                  'cursor': 'move',
                  'alignItems': 'center',
                  'padding': '6px 14px',
                  'borderBottom': `1px solid ${props.theme.colors.borderTransparent}`,
                  'minWidth': '270px',
                  '-ms-user-select': 'none',
                  '-webkit-user-select': 'none',
                  'user-select': 'none',
              },
    'iconContainer': {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
        marginRight: 'auto',
    },
    'icon': {
        'display': 'block',
        'width': '16px',
        'height': '16px',
        '-ms-user-select': 'none',
        '-webkit-user-select': 'none',
        'user-select': 'none',
    },
    'iconText': (props: IThemedStyleProps) => ({
        color: props.themeType === 'dark' ? props.theme.colors.contentSecondary : props.theme.colors.contentPrimary,
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'unset',
    }),
    'paragraph': {
        'margin': '0.5em 0',
        '-ms-user-select': 'text',
        '-webkit-user-select': 'text',
        'user-select': 'text',
    },
    'popupCardHeaderButtonGroup': (props: IThemedStyleProps) => ({
        'display': 'flex',
        'flexDirection': 'row',
        'alignItems': 'center',
        'gap': '5px',
        'marginLeft': '10px',
        '@media screen and (max-width: 460px)': {
            marginLeft: props.isDesktopApp ? '5px' : undefined,
        },
    }),
    'popupCardHeaderMoreActionsContainer': () => ({
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 5,
    }),
    'popupCardHeaderMoreActionsBtn': (props: IThemedStyleProps) => ({
        'cursor': 'pointer',
        '& *': {
            fill: props.theme.colors.contentPrimary,
            color: props.theme.colors.contentPrimary,
            stroke: props.theme.colors.contentPrimary,
        },
    }),
    'popupCardHeaderActionsContainer': (props: IThemedStyleProps) => ({
        'box-sizing': 'border-box',
        'display': 'flex',
        'flexShrink': 0,
        'flexDirection': 'row',
        'alignItems': 'center',
        'padding': '5px 10px',
        'gap': '10px',
        '@media screen and (max-width: 460px)': {
            padding: props.isDesktopApp ? '5px 0' : undefined,
            gap: props.isDesktopApp ? '5px' : undefined,
        },
    }),
    'from': {
        display: 'flex',
        color: '#999',
        fontSize: '12px',
        flexShrink: 0,
    },
    'arrow': {
        display: 'flex',
        color: '#999',
        cursor: 'pointer',
    },
    'to': {
        display: 'flex',
        color: '#999',
        fontSize: '12px',
        flexShrink: 0,
    },
    'popupCardContentContainer': (props: IThemedStyleProps) => ({
        paddingTop: props.isDesktopApp ? '52px' : undefined,
        display: 'flex',
        flexDirection: 'column',
    }),
    'loadingContainer': {
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '10px',
    },
    'popupCardEditorContainer': {
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
    },
    'popupCardTranslatedContainer': (props: IThemedStyleProps) => ({
        'position': 'relative',
        'padding': '26px 16px 16px 16px',
        'border-top': `1px solid ${props.theme.colors.borderTransparent}`,
        '-ms-user-select': 'none',
        '-webkit-user-select': 'none',
        'user-select': 'none',
    }),
    'actionStr': (props: IThemedStyleProps) => ({
        position: 'absolute',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '6px',
        top: '0',
        left: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
        fontSize: '10px',
        padding: '2px 12px',
        borderRadius: '4px',
        background: props.theme.colors.backgroundTertiary,
        color: props.theme.colors.contentSecondary,
    }),
    'error': {
        background: '#f8d7da',
    },
    'caret': {
        marginLeft: '4px',
        borderRight: '0.2em solid #777',
        animation: '$caret 500ms steps(44) infinite',
    },
    '@keyframes caret': {
        '50%': {
            borderColor: 'transparent',
        },
    },
    'popupCardTranslatedContentContainer': (props: IThemedStyleProps) => ({
        fontSize: '15px',
        marginTop: '-14px',
        display: 'flex',
        overflowY: 'auto',
        color: props.themeType === 'dark' ? props.theme.colors.contentSecondary : props.theme.colors.contentPrimary,
    }),
    'errorMessage': {
        display: 'flex',
        color: 'red',
        alignItems: 'center',
        gap: '4px',
    },
    'actionButtonsContainer': {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '12px',
    },
    'actionButton': (props: IThemedStyleProps) => ({
        color: props.theme.colors.contentSecondary,
        cursor: 'pointer',
        display: 'flex',
        paddingTop: '6px',
        paddingBottom: '6px',
    }),
    'actionButtonDisabled': (props: IThemedStyleProps) => ({
        color: props.theme.colors.buttonDisabledText,
        cursor: 'default',
        display: 'flex',
        paddingTop: '6px',
        paddingBottom: '6px',
    }),
    'writing': {
        'marginLeft': '3px',
        'width': '10px',
        '&::after': {
            content: '"✍️"',
            animation: '$writing 1.3s infinite',
        },
    },
    '@keyframes writing': {
        '50%': {
            marginLeft: '-3px',
            marginBottom: '-3px',
        },
    },
    'dropZone': (props: IThemedStyleProps) => ({
        'display': 'flex',
        'flexDirection': 'column',
        'alignItems': 'center',
        'justifyContent': 'center',
        'padding-left': '3px',
        'padding-right': '3px',
        'borderRadius': '0.75rem',
        'cursor': 'pointer',
        '-ms-user-select': 'none',
        '-webkit-user-select': 'none',
        'user-select': 'none',
        'border': `1px dashed ${props.theme.colors.borderTransparent}`,
        'background': props.theme.colors.backgroundTertiary,
        'color': props.theme.colors.contentSecondary,
    }),
    'fileDragArea': (props: IThemedStyleProps) => ({
        padding: '10px',
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '10px',
        fontSize: '11px',
        border: `2px dashed ${props.theme.colors.borderTransparent}`,
        background: props.theme.colors.backgroundTertiary,
        color: props.theme.colors.contentSecondary,
    }),
    'OCRStatusBar': (props: IThemedStyleProps) => ({
        color: props.theme.colors.contentSecondary,
    }),
})

interface IActionStrItem {
    beforeStr: string
    afterStr: string
}

const actionStrItems: Record<TranslateMode, IActionStrItem> = {
    'analyze': {
        beforeStr: 'Analyzing...',
        afterStr: 'Analyzed',
    },
    'polishing': {
        beforeStr: 'Polishing...',
        afterStr: 'Polished',
    },
    'translate': {
        beforeStr: 'Translating...',
        afterStr: 'Translated',
    },
    'summarize': {
        beforeStr: 'Summarizing...',
        afterStr: 'Summarized',
    },
    'explain-code': {
        beforeStr: 'Explaining...',
        afterStr: 'Explained',
    },
    'big-bang': {
        beforeStr: 'Writing...',
        afterStr: 'Written',
    },
}

export interface MovementXY {
    x: number
    y: number
}

export interface IInnerTranslatorProps {
    uuid?: string
    text: string
    autoFocus?: boolean
    showSettings?: boolean
    defaultShowSettings?: boolean
    containerStyle?: React.CSSProperties
    editorRows?: number
    onSettingsSave?: (oldSettings: ISettings) => void
}

export interface ITranslatorProps extends IInnerTranslatorProps {
    engine: Styletron
}

export function Translator(props: ITranslatorProps) {
    const { theme } = useTheme()

    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <div>
                <StyletronProvider value={props.engine}>
                    <BaseProvider theme={theme}>
                        <GlobalSuspense>
                            <InnerTranslator {...props} />
                        </GlobalSuspense>
                    </BaseProvider>
                </StyletronProvider>
            </div>
        </ErrorBoundary>
    )
}

const tokenRegenerateEvent = new Event('tokenRegenerate')

export async function initArkosetoken() {
    const settings = await getSettings()
    if (settings.apiModel.startsWith('gpt-4')) {
        document.dispatchEvent(tokenRegenerateEvent)
    } else if (localStorage.getItem('apiModel')) {
        localStorage.removeItem('apiModel')
    }
}

function InnerTranslator(props: IInnerTranslatorProps) {
    useEffect(() => {
        setupAnalysis()
        initArkosetoken()
    }, [])

    const [refreshActionsFlag, refreshActions] = useReducer((x: number) => x + 1, 0)

    const [showActionManager, setShowActionManager] = useState(false)

    const [translationFlag, forceTranslate] = useReducer((x: number) => x + 1, 0)

    const editorRef = useRef<HTMLTextAreaElement>(null)
    const isCompositing = useRef(false)
    const [selectedWord, setSelectedWord] = useState('')
    const highlightRef = useRef<HighlightInTextarea | null>(null)
    const { t, i18n } = useTranslation()
    const { settings } = useSettings()
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (settings?.i18n !== (i18n as any).language) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(i18n as any).changeLanguage(settings?.i18n)
        }
    }, [i18n, settings?.i18n])

    const [autoFocus, setAutoFocus] = useState(false)

    useEffect(() => {
        if (highlightRef.current) {
            if (props.autoFocus) {
                setAutoFocus(false)
                setTimeout(() => {
                    setAutoFocus(true)
                }, 500)
            }
            return
        }
        const editor = editorRef.current
        if (!editor) {
            return undefined
        }
        highlightRef.current = new HighlightInTextarea(editor, { highlight: '' })
        if (props.autoFocus) {
            editor.focus()
        }
    }, [props.autoFocus])

    useEffect(() => {
        const editor = editorRef.current
        if (!editor) {
            return undefined
        }
        editor.focus()
        editor.spellcheck = false
    }, [props.uuid])

    const [highlightWords, setHighlightWords] = useState<string[]>([])

    useEffect(() => {
        if (!highlightRef.current?.highlight) {
            return
        }
        if (selectedWord) {
            highlightRef.current.highlight.highlight = [selectedWord]
        } else {
            highlightRef.current.highlight.highlight = [...highlightWords]
        }
        highlightRef.current.handleInput()
    }, [selectedWord, highlightWords])

    const [activateAction, setActivateAction] = useState<Action | undefined>(() => {
        const savedAction = localStorage.getItem('savedAction')
        return savedAction ? JSON.parse(savedAction) : undefined
    })
    const currentTranslateMode = useMemo(() => {
        if (!activateAction) {
            return undefined
        }
        return activateAction.mode
    }, [activateAction])

    useLiveQuery(async () => {
        if (settings?.defaultTranslateMode && settings.defaultTranslateMode !== 'nop') {
            let action: Action | undefined
            const actionID = parseInt(settings.defaultTranslateMode, 10)
            if (isNaN(actionID)) {
                action = await actionService.getByMode(settings.defaultTranslateMode)
            } else {
                action = await actionService.get(actionID)
            }
            setActivateAction(action)
        }
    }, [settings?.defaultTranslateMode])

    const headerRef = useRef<HTMLDivElement>(null)
    const { width: headerWidth = 0, height: headerHeight = 0 } = useResizeObserver<HTMLDivElement>({ ref: headerRef })

    const languagesSelectorRef = useRef<HTMLDivElement>(null)

    const { width: languagesSelectorWidth = 0 } = useResizeObserver<HTMLDivElement>({ ref: languagesSelectorRef })

    const headerActionButtonsRef = useRef<HTMLDivElement>(null)

    const { width: headerActionButtonsWidth = 0 } = useResizeObserver<HTMLDivElement>({ ref: headerActionButtonsRef })

    const editorContainerRef = useRef<HTMLDivElement>(null)

    const translatedContentRef = useRef<HTMLDivElement>(null)

    const actionButtonsRef = useRef<HTMLDivElement>(null)

    const scrollYRef = useRef<number>(0)

    const hasActivateAction = activateAction !== undefined

    useLayoutEffect(() => {
        const handleResize = () => {
            const headerElem = headerRef.current
            if (!headerElem) {
                return
            }
            const activateActionElem = headerElem.querySelector('.__yetone-activate-action')
            if (hasActivateAction && !activateActionElem) {
                return
            }
            const paddingWidth = 32
            const iconWidth = 32
            const iconWithTextWidth = activateActionElem ? activateActionElem.clientWidth : 105
            const iconGap = 5
            let count = Math.floor(
                (headerWidth -
                    paddingWidth -
                    languagesSelectorWidth -
                    102 -
                    iconWithTextWidth * (hasActivateAction ? 1 : 0)) /
                    (iconGap + iconWidth)
            )
            count = hasActivateAction ? count + 1 : count
            setDisplayedActionsMaxCount(Math.min(Math.max(count, 1), 10))
        }

        const timer = setTimeout(() => handleResize(), 300)

        return () => {
            clearTimeout(timer)
        }
    }, [hasActivateAction, headerWidth, languagesSelectorWidth, headerActionButtonsWidth])

    const actions = useLiveQuery(() => actionService.list(), [refreshActionsFlag])
    const [selectedGroup, setSelectedGroup] = useState(localStorage.getItem('selectedGroup') || 'English Learning')
    const [displayedActions, setDisplayedActions] = useState<Action[]>([])
    const [hiddenActions, setHiddenActions] = useState<Action[]>([])
    const [displayedActionsMaxCount, setDisplayedActionsMaxCount] = useState(4)

    // 使用 reduce 方法创建分组
    const actionGroups = actions?.reduce<Record<string, Action[]>>((groups, action) => {
        const group = action.group || 'English Learning'
        groups[group] = groups[group] || []
        groups[group].push(action)
        return groups
    }, {})

    const promptsData = actionsData.map((item) => ({
        ...item,
        outputRenderingFormat: item.outputRenderingFormat as 'text' | 'markdown' | 'latex' | undefined,
        mode: item.mode as 'built-in',
    }))

    useEffect(() => {
        if (!actions) {
            actionService.bulkPut(promptsData)
            setDisplayedActions([])
            setHiddenActions([])
            refreshActions()
            return
        }

        const filteredActions = actions.filter((action) => {
            const group = action.group ?? 'English Learning'
            return group === selectedGroup
        })
        let displayedActions = filteredActions.slice(0, displayedActionsMaxCount)
        let hiddenActions = filteredActions.slice(displayedActionsMaxCount)
        if (!displayedActions.find((action) => action.id === activateAction?.id)) {
            const activatedAction = filteredActions.find((a) => a.id === activateAction?.id)
            if (activatedAction) {
                const lastDisplayedAction = displayedActions[displayedActions.length - 1]
                if (lastDisplayedAction) {
                    displayedActions = displayedActions.slice(0, displayedActions.length - 1)
                    hiddenActions = [lastDisplayedAction, ...hiddenActions]
                }
                displayedActions.push(activatedAction)
                hiddenActions = hiddenActions.filter((a) => a.id !== activatedAction.id)
            }
        }
        setDisplayedActions(displayedActions)
        setHiddenActions(hiddenActions)
    }, [actions, activateAction?.id, displayedActionsMaxCount, selectedGroup])

    const isTranslate = currentTranslateMode === 'translate'

    useEffect(() => {
        localStorage.setItem('selectedGroup', selectedGroup)
    }, [selectedGroup])

    useEffect(() => {
        const savedAction = localStorage.getItem('savedAction')
        if (savedAction) {
            setActivateAction(JSON.parse(savedAction))
        }
    }, [])

    useEffect(() => {
        if (!isTranslate) {
            setSelectedWord('')
            return undefined
        }
        const editor = editorRef.current
        if (!editor) {
            return undefined
        }
        const onCompositionStart = () => {
            isCompositing.current = true
        }
        const onCompositionEnd = () => {
            isCompositing.current = false
        }
        const onMouseUp = () => {
            if (editor.selectionStart === 0 && editor.selectionEnd === editor.value.length) {
                setSelectedWord('')
                return
            }
            const selectedWord_ = editor.value.substring(editor.selectionStart, editor.selectionEnd).trim()
            setSelectedWord(selectedWord_)
            if (selectedWord_) {
                setHighlightWords([])
            }
        }
        const onBlur = onMouseUp

        editor.addEventListener('compositionstart', onCompositionStart)
        editor.addEventListener('compositionend', onCompositionEnd)
        editor.addEventListener('mouseup', onMouseUp)
        editor.addEventListener('blur', onBlur)

        return () => {
            chrome.runtime.onMessage.removeListener(handleRuntimeMessage)
            editor.removeEventListener('compositionstart', onCompositionStart)
            editor.removeEventListener('compositionend', onCompositionEnd)
            editor.removeEventListener('mouseup', onMouseUp)
            editor.removeEventListener('blur', onBlur)
        }
    }, [isTranslate])

    const { theme, themeType } = useTheme()

    const styles = useStyles({ theme, themeType, isDesktopApp: isDesktopApp() })
    const [isLoading, setIsLoading] = useState(false)
    const [newYouGlish, setNewYouGlish] = useState(false)
    const [showYouGlish, setShowYouGlish] = useState(false)
    const [editableText, setEditableText] = useState(props.text)
    const [isSpeakingEditableText, setIsSpeakingEditableText] = useState(false)
    const [originalText, setOriginalText] = useState(props.text)
    const [detectedOriginalText, setDetectedOriginalText] = useState(props.text)
    const [translatedText, setTranslatedText] = useState('')
    const [translatedLines, setTranslatedLines] = useState<string[]>([])



    function handleRuntimeMessage(message: { type: string; text: any }) {
        if (message.type === 'Text') {
            const text = message.text
            setOriginalText(text)
        }
    }

    chrome.runtime.onMessage.addListener(handleRuntimeMessage)

    const webAPI = new WebAPI()
    useEffect(() => {
        setOriginalText(props.text)
    }, [props.text, props.uuid])

    useEffect(() => {
        setEditableText(detectedOriginalText)
    }, [detectedOriginalText])

    useEffect(() => {
        setTranslatedLines(translatedText.split('\n'))
    }, [translatedText])
    const [isSpeakingTranslatedText, setIsSpeakingTranslatedText] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const startLoading = useCallback(() => {
        setIsLoading(true)
    }, [])
    const stopLoading = useCallback(() => {
        setIsLoading(false)
    }, [])
    const [sourceLang, setSourceLang] = useState<LangCode>('en')
    const [targetLang, setTargetLang] = useState<LangCode>()
    const stopAutomaticallyChangeTargetLang = useRef(false)
    const settingsIsUndefined = settings === undefined

    useEffect(() => {
        if (settingsIsUndefined) {
            return
        }


        ;(async () => {
            setTargetLang((targetLang_) => {
                if (isTranslate && (!stopAutomaticallyChangeTargetLang.current || sourceLang === targetLang_)) {
                    return (
                        (sourceLang === 'zh-Hans' || sourceLang === 'zh-Hant'
                            ? 'en'
                            : (settings?.defaultTargetLanguage as LangCode | undefined)) ?? 'en'
                    )
                }
                if (!targetLang_) {
                    if (settings?.defaultTargetLanguage) {
                        return settings.defaultTargetLanguage as LangCode
                    }
                    return sourceLang
                }
                return targetLang_
            })
            setDetectedOriginalText(originalText)
        })()
    }, [originalText, isTranslate, settingsIsUndefined, settings?.defaultTargetLanguage, props.uuid])

    const [actionStr, setActionStr] = useState('')

    useEffect(() => {
        const editor = editorRef.current
        if (!editor) return
        editor.dir = getLangConfig(sourceLang).direction
    }, [sourceLang, actionStr])

    const translatedLanguageDirection = useMemo(() => getLangConfig(sourceLang).direction, [sourceLang])

    const addToAnki = async (deckname: string, front: string, back: any) => {
        const connected = await isConnected()

        if (connected) {
            try {
                await addNewNote(deckname, front, back)
                setActionStr('Note added successfully!')
            } catch (error) {
                console.error('Error adding note:', error)
                setErrorMessage(`Error: ${error}`)
            }
        } else {
            console.log('Not connected')
            setErrorMessage('Not connected to Anki!')
        }
    }

    // Reposition the popup card to prevent it from extending beyond the screen.
    useEffect(() => {
        const calculateTranslatedContentMaxHeight = (): number => {
            const { innerHeight } = window
            const editorHeight = editorContainerRef.current?.offsetHeight || 0
            const actionButtonsHeight = actionButtonsRef.current?.offsetHeight || 0
            return innerHeight - headerHeight - editorHeight - actionButtonsHeight - documentPadding * 10
        }

        const resizeHandle: ResizeObserverCallback = _.debounce((entries) => {
            // Listen for element height changes
            for (const entry of entries) {
                const $popupCard = entry.target as HTMLElement
                const [maxX, maxY] = calculateMaxXY($popupCard)
                const yList = [maxY, $popupCard.offsetTop].filter((item) => item > documentPadding)
                $popupCard.style.top = `${Math.min(...yList) || documentPadding}px`
                const xList = [maxX, $popupCard.offsetLeft].filter((item) => item > documentPadding)
                $popupCard.style.left = `${Math.min(...xList) || documentPadding}px`

                const $translatedContent = translatedContentRef.current
                if ($translatedContent) {
                    const translatedContentMaxHeight = calculateTranslatedContentMaxHeight()
                    $translatedContent.style.maxHeight = `${translatedContentMaxHeight}px`
                }
            }
        }, 500)

        const observer = new ResizeObserver(resizeHandle)
        queryPopupCardElement().then(($popupCard) => {
            if ($popupCard) {
                const rect = $popupCard.getBoundingClientRect()
                const x = Math.min(window.innerWidth - 600, rect.x)
                $popupCard.style.left = x + 'px'
                observer.observe($popupCard)
            }
        })
        return () => {
            queryPopupCardElement().then(($popupCard) => $popupCard && observer.unobserve($popupCard))
        }
    }, [headerHeight])

    useEffect(() => {
        if (isDesktopApp()) {
            return
        }
        const $header = headerRef.current
        if (!$header) {
            return undefined
        }

        let $popupCard: HTMLDivElement | null = null
        ;(async () => {
            $popupCard = await queryPopupCardElement()
            if (!$popupCard) {
                return
            }
        })()

        let closed = true

        const dragMouseDown = (e: MouseEvent) => {
            closed = false
            e = e || window.event
            e.preventDefault()
            $popupCard?.addEventListener('mouseup', closeDragElement)
            document.addEventListener('mousemove', elementDrag)
            document.addEventListener('mouseup', closeDragElement)
        }

        const elementDrag = async (e: MouseEvent) => {
            e.stopPropagation()
            if (closed || !$popupCard) {
                return
            }
            e = e || window.event
            e.preventDefault()
            const { movementX, movementY } = e
            const [l, t] = overflowCheck($popupCard, { x: movementX, y: movementY })
            $popupCard.style.top = `${t}px`
            $popupCard.style.left = `${l}px`
        }

        const overflowCheck = ($popupCard: HTMLDivElement, movementXY: MovementXY): number[] => {
            let { offsetTop: cardTop, offsetLeft: cardLeft } = $popupCard
            const rect = $popupCard.getBoundingClientRect()
            const { x: movementX, y: movementY } = movementXY
            if (
                rect.left + movementX > documentPadding &&
                rect.right + movementX < document.documentElement.clientWidth - documentPadding
            ) {
                cardLeft = $popupCard.offsetLeft + movementX
            }
            if (
                rect.top + movementY > documentPadding &&
                rect.bottom + movementY < document.documentElement.clientHeight - documentPadding
            ) {
                cardTop = $popupCard.offsetTop + movementY
            }
            return [cardLeft, cardTop]
        }

        const elementScroll = async (e: globalThis.Event) => {
            e.stopPropagation()
            if (closed || !$popupCard) {
                scrollYRef.current = window.scrollY
                return
            }
            e = e || window.event
            e.preventDefault()
            const { scrollY } = window
            const movementY = scrollY - scrollYRef.current
            const [l, t] = overflowCheck($popupCard, { x: 0, y: movementY })
            $popupCard.style.top = `${t}px`
            $popupCard.style.left = `${l}px`
            scrollYRef.current = scrollY
        }

        const closeDragElement = () => {
            closed = true
            $popupCard?.removeEventListener('mouseup', closeDragElement)
            document.removeEventListener('mousemove', elementDrag)
            document.removeEventListener('mouseup', closeDragElement)
        }

        $header.addEventListener('mousedown', dragMouseDown)
        $header.addEventListener('mouseup', closeDragElement)
        document.addEventListener('scroll', elementScroll)

        return () => {
            $header.removeEventListener('mousedown', dragMouseDown)
            $header.removeEventListener('mouseup', closeDragElement)
            document.removeEventListener('scroll', elementScroll)
            closeDragElement()
        }
    }, [headerRef])

    const [isNotLogin, setIsNotLogin] = useState(false)

    const translateText = useCallback(
        async (text: string, selectedWord: string, signal: AbortSignal) => {
            if (!text || !sourceLang || !targetLang || !activateAction?.id) {
                return
            }
            const action = await actionService.get(activateAction?.id)
            if (!action) {
                return
            }
            const beforeTranslate = () => {
                let actionStr = 'Processing...'
                setActionStr(actionStr)
                setTranslatedText('')
                setErrorMessage('')
                startLoading()
            }
            const afterTranslate = (reason: string) => {
                stopLoading()
                if (reason !== 'stop') {
                    if (reason === 'length' || reason === 'max_tokens') {
                        toast(t('Chars Limited'), {
                            duration: 5000,
                            icon: '😥',
                        })
                    } else {
                        setActionStr((actionStr_) => {
                            setErrorMessage(`${actionStr_} failed: ${reason}`)
                            return 'Error'
                        })
                    }
                } else {
                    let actionStr = 'Processed'
                    setActionStr(actionStr)
                    if (settings.apiModel.startsWith('gpt-4')) {
                        document.dispatchEvent(tokenRegenerateEvent)
                    }
                                                    
                }
            }
            beforeTranslate()
            const cachedKey = `translate:${settings?.provider ?? ''}:${settings?.apiModel ?? ''}:${action.id}:${
                action.rolePrompt
            }:${action.commandPrompt}:${
                action.outputRenderingFormat
            }:${sourceLang}:${targetLang}:${text}:${selectedWord}:${translationFlag}`
            const cachedValue = cache.get(cachedKey)
            if (cachedValue) {
                afterTranslate('stop')
                setTranslatedText(cachedValue as string)
                return
            }
            let isStopped = false
            try {
                await webAPI.translate({
                    action,
                    signal,
                    text,
                    selectedWord,
                    detectFrom: sourceLang,
                    detectTo: targetLang,
                    onStatusCode: (statusCode) => {
                        setIsNotLogin(statusCode === 401 || statusCode === 403)
                    },
                    onMessage: (message) => {
                        if (message.role) {
                            return
                        }
                        setTranslatedText((translatedText) => {
                            if (message.isFullText) {
                                return message.content
                            }
                            return translatedText + message.content
                        })
                    },
                    onFinish: (reason) => {
                        afterTranslate(reason)
                        setTranslatedText((translatedText) => {
                            const result = translatedText
                            cache.set(cachedKey, result)
                            return result
                        })
                        chrome.runtime.sendMessage({ type: 'refreshPage' })
                    },
                    onError: (error) => {
                        setActionStr('Error')
                        setErrorMessage(error)
                    },
                })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                // if error is a AbortError then ignore this error
                if (error.name === 'AbortError') {
                    isStopped = true
                    return
                }
                setActionStr('Error')
                setErrorMessage((error as Error).toString())
            } finally {
                if (!isStopped) {
                    stopLoading()
                    isStopped = true
                }
            }
        },
        [
            sourceLang,
            targetLang,
            activateAction?.id,
            currentTranslateMode,
            settings?.provider,
            settings?.apiModel,
            translationFlag,
            startLoading,
            stopLoading,
            t,
        ]
    )

    useEffect(() => {
        if (editableText !== detectedOriginalText) {
            return
        }
        const controller = new AbortController()
        const { signal } = controller
        translateText(detectedOriginalText, selectedWord, signal)
        return () => {
            controller.abort()
        }
    }, [translateText, editableText, detectedOriginalText, selectedWord])

    const [showSettings, setShowSettings] = useState(false)
    useEffect(() => {
        if (!props.defaultShowSettings) {
            return
        }
        if (
            settings &&
            ((settings.provider === 'ChatGPT' && !settings.apiModel) ||
                (settings.provider !== 'ChatGPT' && !settings.apiKeys))
        ) {
            setShowSettings(true)
        }
    }, [props.defaultShowSettings, settings])

    const [isOCRProcessing, setIsOCRProcessing] = useState(false)
    const [showOCRProcessing, setShowOCRProcessing] = useState(false)

    useEffect(() => {
        if (isOCRProcessing) {
            setShowOCRProcessing(true)
            return
        }
        const timer = setTimeout(() => {
            setShowOCRProcessing(false)
        }, 1500)
        return () => {
            clearTimeout(timer)
        }
    }, [isOCRProcessing])

    const editableStopSpeakRef = useRef<() => void>(() => null)
    const translatedStopSpeakRef = useRef<() => void>(() => null)
    useEffect(() => {
        return () => {
            editableStopSpeakRef.current()
            translatedStopSpeakRef.current()
        }
    }, [])
    const handleEditSpeakAction = async () => {
        if (isSpeakingEditableText) {
            editableStopSpeakRef.current()
            setIsSpeakingEditableText(false)
            return
        }
        setIsSpeakingEditableText(true)
        const { stopSpeak } = await speak({
            text: editableText,
            lang: sourceLang,
            onFinish: () => setIsSpeakingEditableText(false),
        })
        editableStopSpeakRef.current = stopSpeak
    }

    const handleYouglishSpeakAction =async() => {
        setNewYouGlish(true)
        if (!showYouGlish) {
            setShowYouGlish(true)
        }
        else{
            setShowYouGlish(false)
        }
    }



    const handleTranslatedSpeakAction = async () => {
        if (isSpeakingTranslatedText) {
            translatedStopSpeakRef.current()
            setIsSpeakingTranslatedText(false)
            return
        }
        setIsSpeakingTranslatedText(true)
        const { stopSpeak } = await speak({
            text: translatedText,
            lang: targetLang,
            onFinish: () => setIsSpeakingTranslatedText(false),
        })
        translatedStopSpeakRef.current = stopSpeak
    }

    const [conversationIds, setConversationIds] = useState([])

    const handleConversationClick = () => {
        chrome.storage.local.remove('conversationId', function () {
            setActionStr('ConversationId added successfully!')
        })
    }

    const tokenRegenerateEvent = new Event('tokenRegenerate')
    return (
        <div
            className={clsx(styles.popupCard, {
                'yetone-dark': themeType === 'dark',
            })}
            style={{
                minHeight: '600px',
                background: theme.colors.backgroundPrimary,
                paddingBottom: showSettings ? '0px' : '30px',
            }}
        >
            <div
                style={{
                    display: showSettings ? 'block' : 'none',
                }}
            >
                <InnerSettings
                    onSave={(oldSettings) => {
                        setShowSettings(false)
                        props.onSettingsSave?.(oldSettings)
                    }}
                />
            </div>
            <div
                style={{
                    display: !showSettings ? 'block' : 'none',
                }}
            >
                <div style={props.containerStyle}>
                    <div
                        ref={headerRef}
                        className={styles.popupCardHeaderContainer}
                        data-tauri-drag-region
                        style={{
                            cursor: isDesktopApp() ? 'default' : 'move',
                        }}
                    >
                        <Tooltip content={t('选择使用场景')} placement='bottom'>
                            <Select
                                size='mini'
                                options={[
                                    ...Object.keys(actionGroups || {}).map((key) => ({ id: key, label: key })),
                                    {
                                        id: 'unlock_features',
                                        label: (
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <AiOutlineLock style={{ marginRight: '5px' }} />
                                                解锁更多功能
                                            </div>
                                        ),
                                    }, // 新增的选项
                                ]}
                                value={[{ id: selectedGroup }]}
                                overrides={{
                                    Root: {
                                        style: {
                                            minWidth: '100px',
                                            width: '30%',
                                        },
                                    },
                                }}
                                onChange={({ value }) => {
                                    // 如果 actionGroups 是 undefined，则使用空对象作为默认值
                                    const groupId = value.length > 0 ? value[0].id : Object.keys(actionGroups || {})[0]

                                    if (groupId === 'unlock_features') {
                                        window.open('https://chatgpt-tutor.vercel.app/docs/purchase', '_blank') // 打开新网页
                                    } else {
                                        setSelectedGroup(groupId as string)
                                    }
                                }}
                            />
                        </Tooltip>
                        <div className={styles.popupCardHeaderButtonGroup} ref={headerActionButtonsRef}>
                            {displayedActions?.map((action) => {
                                return (
                                    <Tooltip
                                        key={action.id}
                                        content={action.mode ? t(action.name) : action.name}
                                        placement={isDesktopApp() ? 'bottom' : 'top'}
                                    >
                                        <Button
                                            size='mini'
                                            kind={action.id === activateAction?.id ? 'primary' : 'secondary'}
                                            className={
                                                action.id === activateAction?.id
                                                    ? '__yetone-activate-action'
                                                    : undefined
                                            }
                                            overrides={{
                                                Root: {
                                                    style: {
                                                        height: '27px',
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                    },
                                                },
                                            }}
                                            onClick={() => {
                                                setActivateAction(action)
                                                if (action) {
                                                    localStorage.setItem('savedAction', JSON.stringify(action))
                                                } else {
                                                    localStorage.removeItem('savedAction')
                                                }
                                            }}
                                        >
                                            {action.icon &&
                                                React.createElement(mdIcons[action.icon as keyof typeof mdIcons], {
                                                    size: 15,
                                                })}
                                            {action.id === activateAction?.id && (
                                                <div
                                                    style={{
                                                        maxWidth: 200,
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {action.mode ? t(action.name) : action.name}
                                                </div>
                                            )}
                                        </Button>
                                    </Tooltip>
                                )
                            })}
                        </div>
                        <div className={styles.popupCardHeaderMoreActionsContainer}>
                            <StatefulPopover
                                autoFocus={false}
                                triggerType='hover'
                                showArrow
                                placement='bottom'
                                content={
                                    <StatefulMenu
                                        initialState={{
                                            highlightedIndex: hiddenActions.findIndex(
                                                (action) => action.id === activateAction?.id
                                            ),
                                        }}
                                        onItemSelect={async ({ item }) => {
                                            const actionID = item.id
                                            if (actionID === '__manager__') {
                                                if (isTauri()) {
                                                    const { invoke } = await import('@tauri-apps/api')
                                                    if (!navigator.userAgent.includes('Windows')) {
                                                        await invoke('show_action_manager_window')
                                                    } else {
                                                        const { LogicalSize, WebviewWindow } = await import(
                                                            '@tauri-apps/api/window'
                                                        )
                                                        const windowLabel = 'action_manager'
                                                        let window = WebviewWindow.getByLabel(windowLabel)
                                                        if (!window) {
                                                            window = new WebviewWindow(windowLabel, {
                                                                url: 'src/tauri/action_manager.html',
                                                                decorations: false,
                                                                visible: true,
                                                                focus: true,
                                                            })
                                                        }
                                                        await window.setDecorations(false)
                                                        await window.setSize(new LogicalSize(600, 770))
                                                        await window.center()
                                                        await window.show()
                                                    }
                                                } else {
                                                    setShowActionManager(true)
                                                }
                                                return
                                            }
                                            setActivateAction(actions?.find((a) => a.id === (actionID as number)))
                                        }}
                                        items={[
                                            ...hiddenActions.map((action) => {
                                                return {
                                                    id: action.id,
                                                    label: (
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                            }}
                                                        >
                                                            {action.icon
                                                                ? React.createElement(
                                                                      (mdIcons as Record<string, IconType>)[
                                                                          action.icon
                                                                      ],
                                                                      { size: 15 }
                                                                  )
                                                                : undefined}
                                                            {action.mode ? t(action.name) : action.name}
                                                        </div>
                                                    ),
                                                }
                                            }),
                                            { divider: true },
                                            {
                                                id: '__manager__',
                                                label: (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        <GiPlatform />
                                                        {t('Action Manager')}
                                                    </div>
                                                ),
                                            },
                                        ]}
                                    />
                                }
                            >
                                <div className={styles.popupCardHeaderMoreActionsBtn}>
                                    <GrMoreVertical />
                                </div>
                            </StatefulPopover>
                        </div>
                    </div>
                    <div className={styles.popupCardContentContainer}>
                        {settings?.apiURL === defaultAPIURL && (
                            <div>
                                <IpLocationNotification showSettings={showSettings} />
                            </div>
                        )}
                        <div ref={editorContainerRef} className={styles.popupCardEditorContainer}>
                            <div
                                style={{
                                    height: 0,
                                    overflow: 'hidden',
                                }}
                            >
                                {editableText}
                            </div>
                            <Dropzone noClick={true}>
                                {({ getRootProps, isDragActive }) => (
                                    <div {...getRootProps()}>
                                        <Textarea
                                            inputRef={editorRef}
                                            autoFocus={autoFocus}
                                            overrides={{
                                                Root: {
                                                    style: {
                                                        fontSize: '15px',
                                                        width: '100%',
                                                        borderRadius: '0px',
                                                    },
                                                },
                                                Input: {
                                                    style: {
                                                        fontSize: '15px',
                                                        padding: '4px 8px',
                                                        color:
                                                            themeType === 'dark'
                                                                ? theme.colors.contentSecondary
                                                                : theme.colors.contentPrimary,
                                                        fontFamily:
                                                            currentTranslateMode === 'explain-code'
                                                                ? 'monospace'
                                                                : 'inherit',
                                                        textalign: 'start',
                                                    },
                                                },
                                            }}
                                            value={editableText}
                                            size='mini'
                                            resize='vertical'
                                            rows={
                                                props.editorRows
                                                    ? props.editorRows
                                                    : Math.min(Math.max(editableText.split('\n').length, 3), 12)
                                            }
                                            onChange={(e) => setEditableText(e.target.value)}
                                            onKeyPress={async (e) => {
                                                if (e.key === 'Enter') {
                                                    if (!e.shiftKey) {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        if (!activateAction) {
                                                            setActivateAction(
                                                                actions?.find((action) => action.mode === 'translate')
                                                            )
                                                        }
                                                        setOriginalText(editableText)
                                                        const settings = await getSettings()
                                                        if (settings.apiModel.startsWith('gpt-4')) {
                                                            document.dispatchEvent(tokenRegenerateEvent)
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingTop:
                                                    editableText && editableText !== detectedOriginalText ? 8 : 0,
                                                height: editableText && editableText !== detectedOriginalText ? 28 : 0,
                                                transition: 'all 0.3s linear',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    marginRight: 'auto',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        color: '#999',
                                                        fontSize: '12px',
                                                        transform: 'scale(0.9)',
                                                        marginRight: '-20px',
                                                    }}
                                                >
                                                    {
                                                        'Please press <Enter> to submit. Press <Shift+Enter> to start a new line.'
                                                    }
                                                </div>
                                                <Button
                                                    size='mini'
                                                    onClick={async (e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        if (!activateAction) {
                                                            setActivateAction(
                                                                actions?.find((action) => action.mode === 'translate')
                                                            )
                                                        }
                                                        setOriginalText(editableText)
                                                        const settings = await getSettings()
                                                        if (settings.apiModel.startsWith('gpt-4')) {
                                                            document.dispatchEvent(tokenRegenerateEvent)
                                                        }
                                                    }}
                                                    startEnhancer={<IoIosRocket size={13} />}
                                                    overrides={{
                                                        StartEnhancer: {
                                                            style: {
                                                                marginRight: '6px',
                                                            },
                                                        },
                                                        BaseButton: {
                                                            style: {
                                                                fontWeight: 'normal',
                                                                fontSize: '12px',
                                                                padding: '4px 8px',
                                                            },
                                                        },
                                                    }}
                                                >
                                                    {t('Submit')}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Dropzone>
                            <div className={styles.actionButtonsContainer}>
                                <>
                                    <StatefulTooltip content={t('Add new conversation')} showArrow placement='top'>
                                        <div className={styles.actionButton} onClick={() => handleConversationClick()}>
                                            <AiOutlinePlusSquare size={15} />
                                        </div>
                                    </StatefulTooltip>
                                </>
                                <div style={{ marginLeft: 'auto' }}></div>
                                {!!editableText.length && (
                                    <>
                                        <Tooltip content={t('Speak')} placement='bottom'>
                                            <div className={styles.actionButton} onClick={handleEditSpeakAction}>
                                                {isSpeakingEditableText ? (
                                                    <SpeakerMotion />
                                                ) : (
                                                    <RxSpeakerLoud size={15} />
                                                )}
                                            </div>
                                        </Tooltip>
                                        <Tooltip content={t('On/Off Youglish')} placement='bottom'>
                                            <div className={styles.actionButton} onClick={handleYouglishSpeakAction}>
                                                (
                                                    <RiSpeakerFill size={15} />
                                                )
                                            </div>
                                        </Tooltip>
                                        <Tooltip content={t('Copy to clipboard')} placement='bottom'>
                                            <div className={styles.actionButton}>
                                                <CopyButton text={editableText} styles={styles}></CopyButton>
                                            </div>
                                        </Tooltip>
                                        <Tooltip content={t('Clear input')} placement='bottom'>
                                            <div
                                                className={styles.actionButton}
                                                onClick={() => {
                                                    setEditableText('')
                                                    editorRef.current?.focus()
                                                }}
                                            >
                                                <div className={styles.actionButton}>
                                                    <RxEraser size={15} />
                                                </div>
                                            </div>
                                        </Tooltip>
                                    </>
                                )}
                            </div>
                        </div>
                        {detectedOriginalText !== '' && (
                            <div className={styles.popupCardTranslatedContainer} dir={translatedLanguageDirection}>
                                {actionStr && (
                                    <div
                                        className={clsx({
                                            [styles.actionStr]: true,
                                            [styles.error]: !!errorMessage,
                                        })}
                                    >
                                        <div>{actionStr}</div>
                                        {isLoading ? (
                                            <span className={styles.writing} key={'1'} />
                                        ) : errorMessage ? (
                                            <span key={'2'}>😢</span>
                                        ) : (
                                            <span key={'3'}>👍</span>
                                        )}
                                    </div>
                                )}
                                {errorMessage ? (
                                    <div className={styles.errorMessage}>
                                        <span>{errorMessage}</span>
                                        <Tooltip content={t('Retry')} placement='bottom'>
                                            <div onClick={() => forceTranslate()} className={styles.actionButton}>
                                                <RxReload size={15} />
                                            </div>
                                        </Tooltip>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            width: '100%',
                                        }}
                                    >
                                        <div
                                            ref={translatedContentRef}
                                            className={styles.popupCardTranslatedContentContainer}
                                        >
                                            <div>
                                                {currentTranslateMode === 'explain-code' ||
                                                activateAction?.outputRenderingFormat === 'markdown' ? (
                                                    <>
                                                        <Markdown>{translatedText}</Markdown>
                                                        {isLoading && <span className={styles.caret} />}
                                                    </>
                                                ) : activateAction?.outputRenderingFormat === 'latex' ? (
                                                    <>
                                                        <Latex>{translatedText}</Latex>
                                                        {isLoading && <span className={styles.caret} />}
                                                    </>
                                                ) : (
                                                    translatedLines.map((line, i) => {
                                                        return (
                                                            <p className={styles.paragraph} key={`p-${i}`}>
                                                                { i === 0 ? (
                                                                    <div
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '5px',
                                                                        }}
                                                                    >
                                                                        {line}
                                                                    </div>
                                                                ) : (
                                                                    line
                                                                )}
                                                                {isLoading && i === translatedLines.length - 1 && (
                                                                    <span className={styles.caret} />
                                                                )}
                                                            </p>
                                                        )
                                                    })
                                                )}
                                            </div>
                                        </div>
                                        {translatedText && (
                                            <div ref={actionButtonsRef} className={styles.actionButtonsContainer}>
                                                <div style={{ marginRight: 'auto' }} />
                                                {!isLoading && (
                                                    <Tooltip content={t('Retry')} placement='bottom'>
                                                        <div
                                                            onClick={() => forceTranslate()}
                                                            className={styles.actionButton}
                                                        >
                                                            <RxReload size={15} />
                                                        </div>
                                                    </Tooltip>
                                                )}
                                                <Tooltip content={t('Speak')} placement='bottom'>
                                                    <div
                                                        className={styles.actionButton}
                                                        onClick={handleTranslatedSpeakAction}
                                                    >
                                                        {isSpeakingTranslatedText ? (
                                                            <SpeakerMotion />
                                                        ) : (
                                                            <RxSpeakerLoud size={15} />
                                                        )}
                                                    </div>
                                                </Tooltip>
                                                <Tooltip content={t('Copy to clipboard')} placement='bottom'>
                                                    <div className={styles.actionButton}>
                                                        <CopyButton text={translatedText} styles={styles}></CopyButton>
                                                    </div>
                                                </Tooltip>
                                                <Tooltip content={t('Add to Anki')} placement='bottom'>
                                                    <div
                                                        onClick={() =>
                                                            addToAnki(
                                                                selectedGroup + ':' + activateAction?.name,
                                                                originalText,
                                                                translatedText
                                                            )
                                                        }
                                                        className={styles.actionButton}
                                                    >
                                                        <AiOutlinePlusSquare size={15} />
                                                    </div>
                                                </Tooltip>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {isNotLogin && settings?.provider === 'ChatGPT' && (
                                    <div
                                        style={{
                                            fontSize: '12px',
                                        }}
                                    >
                                        <span>{t('Please login to ChatGPT Web')}: </span>
                                        <a href='https://chat.openai.com' target='_blank' rel='noreferrer'>
                                            Login
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {props.showSettings && (
                <div className={styles.footer}>
                    <Tooltip content={showSettings ? t('Go to Translator') : t('Go to Settings')} placement='right'>
                        <div onClick={() => setShowSettings((s) => !s)}>
                            {showSettings ? <AiOutlineTranslation size={15} /> : <IoSettingsOutline size={15} />}
                        </div>
                    </Tooltip>
                </div>
            )}

            <Modal
                isOpen={!isDesktopApp() && showActionManager}
                onClose={() => {
                    setShowActionManager(false)
                    if (!isDesktopApp()) {
                        refreshActions()
                    }
                }}
                closeable
                size='auto'
                autoFocus
                animate
                role='dialog'
            >
                <ModalHeader>
                    <div
                        style={{
                            padding: 5,
                        }}
                    />
                </ModalHeader>
                <ModalBody>
                    <ActionManager draggable={props.showSettings} />
                </ModalBody>
            </Modal>
            <Toaster />
            <div style={{ display: showYouGlish ? 'block' : 'none' }}>
    <YouGlishComponent
        query={editableText}
        triggerYouGlish={showYouGlish}
        language={LANG_CONFIGS[settings?.defaultSourceLanguage].nameEn || 'English'}
        accent={LANG_CONFIGS[settings?.defaultSourceLanguage].accent || ''}
    />
</div>
        </div>
    )
}
