import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import toast, { Toaster } from 'react-hot-toast'
import { Client as Styletron } from 'styletron-engine-atomic'
import { Provider as StyletronProvider } from 'styletron-react'
import { BaseProvider } from 'baseui-sd'
import { Textarea } from 'baseui-sd/textarea'
import { createUseStyles } from 'react-jss'
import { AiOutlineTranslation, AiOutlineFileSync } from 'react-icons/ai'
import { IoSettingsOutline } from 'react-icons/io5'
import { TbArrowsExchange, TbCsv } from 'react-icons/tb'
import { MdOutlineGrade, MdGrade } from 'react-icons/md'
import * as mdIcons from 'react-icons/md'
import { StatefulTooltip } from 'baseui-sd/tooltip'
import { detectLang, getLangConfig, sourceLanguages, targetLanguages, LangCode } from './lang/lang'
import { translate, TranslateMode } from '../translate'
import { Select, Value, Option } from 'baseui-sd/select'
import { RxEraser, RxReload, RxSpeakerLoud } from 'react-icons/rx'
import { calculateMaxXY, queryPopupCardElement } from '../../browser-extension/content_script/utils'
import { clsx } from 'clsx'
import { Button } from 'baseui-sd/button'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '../components/ErrorFallback'
import { defaultAPIURL, exportToCsv, isDesktopApp, isTauri, isUserscript } from '../utils'
import { InnerSettings } from './Settings'
import { documentPadding } from '../../browser-extension/content_script/consts'
import Dropzone from 'react-dropzone'
import { RecognizeResult, createWorker } from 'tesseract.js'
import { BsTextareaT } from 'react-icons/bs'
import { FcIdea } from 'react-icons/fc'
import ReactMarkdown from 'react-markdown'
import icon from '../assets/images/icon.png'
import rocket from '../assets/images/rocket.gif'
import partyPopper from '../assets/images/party-popper.gif'
import { Event } from '@tauri-apps/api/event'
import SpeakerMotion from '../components/SpeakerMotion'
import IpLocationNotification from '../components/IpLocationNotification'
import { HighlightInTextarea } from '../highlight-in-textarea'
import LRUCache from 'lru-cache'
import { ISettings, IThemedStyleProps } from '../types'
import { useTheme } from '../hooks/useTheme'
import { speak } from '../tts'
import { Tooltip } from './Tooltip'
import { useSettings } from '../hooks/useSettings'
import Vocabulary from './Vocabulary'
import { useCollectedWordTotal } from '../hooks/useCollectedWordTotal'
import { Modal, ModalBody, ModalHeader } from 'baseui-sd/modal'
import { setupAnalysis } from '../analysis'
import { vocabularyService } from '../services/vocabulary'
import { Action, VocabularyItem } from '../internal-services/db'
import { CopyButton } from './CopyButton'
import { useLiveQuery } from 'dexie-react-hooks'
import { actionService } from '../services/action'
import { ActionManager } from './ActionManager'
import { invoke } from '@tauri-apps/api'
import { GrMoreVertical } from 'react-icons/gr'
import { StatefulPopover } from 'baseui-sd/popover'
import { StatefulMenu } from 'baseui-sd/menu'
import { IconType } from 'react-icons'
import { GiPlatform } from 'react-icons/gi'

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
                  'padding': '8px 16px',
                  'borderBottom': `1px solid ${props.theme.colors.borderTransparent}`,
                  'minWidth': '580px',
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
        'color': props.themeType === 'dark' ? props.theme.colors.contentSecondary : props.theme.colors.contentPrimary,
        'fontSize': '12px',
        'fontWeight': 600,
        'cursor': 'unset',
        '@media screen and (max-width: 570px)': {
            display: props.isDesktopApp ? 'none' : undefined,
        },
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
    'vocabulary': {
        position: 'fixed',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.3)',
    },
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

export interface TesseractResult extends RecognizeResult {
    text: string
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
            <StyletronProvider value={props.engine}>
                <BaseProvider theme={theme}>
                    <InnerTranslator {...props} />
                </BaseProvider>
            </StyletronProvider>
        </ErrorBoundary>
    )
}

function InnerTranslator(props: IInnerTranslatorProps) {
    useEffect(() => {
        setupAnalysis()
    }, [])

    const [refreshActionsFlag, refreshActions] = useReducer((x: number) => x + 1, 0)

    const [showActionManager, setShowActionManager] = useState(false)

    const [translationFlag, forceTranslate] = useReducer((x: number) => x + 1, 0)

    const editorRef = useRef<HTMLTextAreaElement>(null)
    const isCompositing = useRef(false)
    const [selectedWord, setSelectedWord] = useState('')
    const [vocabularyType, setVocabularyType] = useState<'hide' | 'vocabulary' | 'article'>('hide')
    const highlightRef = useRef<HighlightInTextarea | null>(null)
    const [showWordbookButtons, setShowWordbookButtons] = useState(false)
    const { t, i18n } = useTranslation()
    const { settings } = useSettings()
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (settings?.i18n !== (i18n as any).language) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(i18n as any).changeLanguage(settings?.i18n)
        }
    }, [settings])

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

    const [activateActionID, setActivateActionID] = useState<number>()

    const currentTranslateMode = useLiveQuery(async () => {
        if (!activateActionID) {
            return undefined
        }
        const action = await actionService.get(activateActionID)
        return action?.mode
    }, [activateActionID])

    useLiveQuery(async () => {
        if (settings?.defaultTranslateMode && settings.defaultTranslateMode !== 'nop') {
            let action: Action | undefined
            const actionID = parseInt(settings.defaultTranslateMode, 10)
            if (isNaN(actionID)) {
                action = await actionService.getByMode(settings.defaultTranslateMode)
            } else {
                action = await actionService.get(actionID)
            }
            setActivateActionID(action?.id)
        }
    }, [settings?.defaultTranslateMode])

    const actions = useLiveQuery(() => actionService.list(), [refreshActionsFlag])

    const [displayedActions, setDisplayedActions] = useState<Action[]>([])
    const [hiddenActions, setHiddenActions] = useState<Action[]>([])

    useEffect(() => {
        if (!actions) {
            setDisplayedActions([])
            setHiddenActions([])
            return
        }
        const maxDisplayedActions = 4
        let displayedActions = actions.slice(0, maxDisplayedActions)
        let hiddenActions = actions.slice(maxDisplayedActions)
        if (!displayedActions.find((action) => action.id === activateActionID)) {
            const activatedAction = actions.find((a) => a.id === activateActionID)
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
    }, [actions, activateActionID])

    const isTranslate = currentTranslateMode === 'translate'
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
            editor.removeEventListener('compositionstart', onCompositionStart)
            editor.removeEventListener('compositionend', onCompositionEnd)
            editor.removeEventListener('mouseup', onMouseUp)
            editor.removeEventListener('blur', onBlur)
        }
    }, [isTranslate])

    const { theme, themeType } = useTheme()

    const styles = useStyles({ theme, themeType, isDesktopApp: isDesktopApp() })
    const [isLoading, setIsLoading] = useState(false)
    const [editableText, setEditableText] = useState(props.text)
    const [isSpeakingEditableText, setIsSpeakingEditableText] = useState(false)
    const [originalText, setOriginalText] = useState(props.text)
    const [detectedOriginalText, setDetectedOriginalText] = useState(props.text)
    const [translatedText, setTranslatedText] = useState('')
    const [translatedLines, setTranslatedLines] = useState<string[]>([])
    const [isWordMode, setIsWordMode] = useState(false)
    const [isCollectedWord, setIsCollectedWord] = useState(false)

    useEffect(() => {
        setOriginalText(props.text)
    }, [props.text, props.uuid])

    useEffect(() => {
        setEditableText(detectedOriginalText)
    }, [detectedOriginalText])

    const checkWordCollection = useCallback(async () => {
        try {
            const item = await vocabularyService.getItem(editableText.trim())
            if (item) {
                await vocabularyService.putItem({
                    ...item,
                    reviewCount: item.reviewCount + 1,
                })
                setIsCollectedWord(true)
            } else {
                setIsCollectedWord(false)
            }
        } catch (e) {
            console.error(e)
        }
    }, [editableText])

    useEffect(() => {
        if (isWordMode && !isLoading) {
            checkWordCollection()
        }
    }, [isWordMode, editableText, isLoading])

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
            const sourceLang_ = await detectLang(originalText)
            setSourceLang(sourceLang_)
            setTargetLang((targetLang_) => {
                if (isTranslate && (!stopAutomaticallyChangeTargetLang.current || sourceLang_ === targetLang_)) {
                    return (
                        (sourceLang_ === 'zh-Hans' || sourceLang_ === 'zh-Hant'
                            ? 'en'
                            : (settings?.defaultTargetLanguage as LangCode | undefined)) ?? 'en'
                    )
                }
                if (!targetLang_) {
                    return sourceLang_
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

    const translatedLanguageDirection = useMemo(() => getLangConfig(sourceLang).direction, [])

    const headerRef = useRef<HTMLDivElement>(null)

    const editorContainerRef = useRef<HTMLDivElement>(null)

    const translatedContentRef = useRef<HTMLDivElement>(null)

    const actionButtonsRef = useRef<HTMLDivElement>(null)

    const scrollYRef = useRef<number>(0)

    const { collectedWordTotal, setCollectedWordTotal } = useCollectedWordTotal()

    // Reposition the popup card to prevent it from extending beyond the screen.
    useEffect(() => {
        const calculateTranslatedContentMaxHeight = (): number => {
            const { innerHeight } = window
            const headerHeight = headerRef.current?.offsetHeight || 0
            const editorHeight = editorContainerRef.current?.offsetHeight || 0
            const actionButtonsHeight = actionButtonsRef.current?.offsetHeight || 0
            return innerHeight - headerHeight - editorHeight - actionButtonsHeight - documentPadding * 10
        }

        const resizeHandle: ResizeObserverCallback = (entries) => {
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
        }

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
    }, [])

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
            setShowWordbookButtons(false)
            if (!text || !sourceLang || !targetLang || !activateActionID) {
                return
            }
            const action = await actionService.get(activateActionID)
            if (!action) {
                return
            }
            const actionStrItem = currentTranslateMode
                ? actionStrItems[currentTranslateMode]
                : {
                      beforeStr: 'Processing...',
                      afterStr: 'Processed',
                  }
            const beforeTranslate = () => {
                let actionStr = actionStrItem.beforeStr
                if (currentTranslateMode === 'translate' && sourceLang === targetLang) {
                    actionStr = 'Polishing...'
                }
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
                        setActionStr('Error')
                        setErrorMessage(`${actionStr} failed: ${reason}`)
                    }
                } else {
                    let actionStr = actionStrItem.afterStr
                    if (currentTranslateMode === 'translate' && sourceLang === targetLang) {
                        actionStr = 'Polished'
                    }
                    setActionStr(actionStr)
                }
            }
            beforeTranslate()
            const cachedKey = `translate:${settings?.provider ?? ''}:${settings?.apiModel ?? ''}:${action.id}:${
                action.rolePrompt
            }:${action.commandPrompt}:${sourceLang}:${targetLang}:${text}:${selectedWord}:${translationFlag}`
            const cachedValue = cache.get(cachedKey)
            if (cachedValue) {
                afterTranslate('stop')
                setTranslatedText(cachedValue as string)
                return
            }
            let isStopped = false
            try {
                await translate({
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
                        setIsWordMode(message.isWordMode)
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
        [currentTranslateMode, activateActionID, sourceLang, targetLang, translationFlag]
    )

    useEffect(() => {
        const controller = new AbortController()
        const { signal } = controller
        translateText(detectedOriginalText, selectedWord, signal)
        return () => {
            controller.abort()
        }
    }, [translateText, detectedOriginalText, selectedWord])

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

    useEffect(() => {
        if (!isTauri()) {
            return
        }
        ;(async () => {
            const { listen } = await import('@tauri-apps/api/event')
            const { fs } = await import('@tauri-apps/api')
            listen('tauri://file-drop', async (e: Event<string>) => {
                if (e.payload.length !== 1) {
                    alert('Only one file can be uploaded at a time.')
                    return
                }

                const filePath = e.payload[0]

                if (!filePath) {
                    return
                }

                const fileExtension = filePath.split('.').pop()?.toLowerCase() || ''
                if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                    alert('invalid file type')
                    return
                }

                const worker = createWorker()

                const binaryFile = await fs.readBinaryFile(filePath)

                const file = new Blob([binaryFile.buffer], {
                    type: `image/${fileExtension}`,
                })

                const fileSize = file.size / 1024 / 1024
                if (fileSize > 1) {
                    alert('File size must be less than 1MB')
                    return
                }

                setOriginalText('')
                setIsOCRProcessing(true)

                await (await worker).loadLanguage('eng+chi_sim+chi_tra+jpn+rus+kor')
                await (await worker).initialize('eng+chi_sim+chi_tra+jpn+rus+kor')

                const { data } = await (await worker).recognize(file)

                setOriginalText(data.text)
                setIsOCRProcessing(false)

                await (await worker).terminate()
            })
        })()
    }, [])

    const onDrop = async (acceptedFiles: File[]) => {
        const worker = createWorker()

        setOriginalText('')
        setIsOCRProcessing(true)

        if (acceptedFiles.length !== 1) {
            alert('Only one file can be uploaded at a time.')
            return
        }

        const file = acceptedFiles[0]
        if (!file.type.startsWith('image/')) {
            alert('invalid file type')
            return
        }

        const fileSize = file.size / (1024 * 1024)
        if (fileSize > 1) {
            alert('File size must be less than 1MB')
            return
        }

        await (await worker).loadLanguage('eng+chi_sim+chi_tra+jpn+rus+kor')
        await (await worker).initialize('eng+chi_sim+chi_tra+jpn+rus+kor')

        const { data } = await (await worker).recognize(file)

        setOriginalText(data.text)
        setIsOCRProcessing(false)

        await (await worker).terminate()
    }

    const onWordCollection = async () => {
        try {
            if (isCollectedWord) {
                const wordInfo = await vocabularyService.getItem(editableText.trim())
                await vocabularyService.deleteItem(wordInfo?.word ?? '')
                setIsCollectedWord(false)
                setCollectedWordTotal((t: number) => t - 1)
            } else {
                await vocabularyService.putItem({
                    word: editableText,
                    reviewCount: 1,
                    description: translatedText.slice(editableText.length + 1), // separate string after first '\n'
                    updatedAt: new Date().valueOf().toString(),
                    createdAt: new Date().valueOf().toString(),
                })
                setIsCollectedWord(true)
                setCollectedWordTotal((t: number) => t + 1)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const onCsvExport = async () => {
        try {
            const words = await vocabularyService.listItems()
            await exportToCsv<VocabularyItem>(`openai-translator-collection-${new Date().valueOf()}`, words)
            if (isDesktopApp()) {
                toast(t('csv file saved on Desktop'), {
                    duration: 5000,
                    icon: '👏',
                })
            }
        } catch (e) {
            console.error(e)
        }
    }

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

    const enableVocabulary = !isUserscript()

    return (
        <div
            className={clsx(styles.popupCard, {
                'yetone-dark': themeType === 'dark',
            })}
            style={{
                minHeight: vocabularyType !== 'hide' ? '600px' : undefined,
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
                        <div data-tauri-drag-region className={styles.iconContainer}>
                            <img data-tauri-drag-region className={styles.icon} src={icon} />
                            <div data-tauri-drag-region className={styles.iconText}>
                                OpenAI Translator
                            </div>
                        </div>
                        <div className={styles.popupCardHeaderActionsContainer}>
                            <div className={styles.from}>
                                <Select
                                    disabled={currentTranslateMode === 'explain-code'}
                                    size='mini'
                                    clearable={false}
                                    options={sourceLangOptions}
                                    value={[{ id: sourceLang }]}
                                    overrides={{
                                        Root: {
                                            style: {
                                                minWidth: '110px',
                                            },
                                        },
                                    }}
                                    onChange={({ value }) => {
                                        const langId = value.length > 0 ? value[0].id : sourceLangOptions[0].id
                                        setSourceLang(langId as LangCode)
                                    }}
                                />
                            </div>
                            <div
                                className={styles.arrow}
                                onClick={() => {
                                    setDetectedOriginalText(translatedText)
                                    setSourceLang(targetLang ?? 'en')
                                    setTargetLang(sourceLang)
                                }}
                            >
                                <Tooltip content='Exchange' placement='top'>
                                    <div>
                                        <TbArrowsExchange />
                                    </div>
                                </Tooltip>
                            </div>
                            <div className={styles.to}>
                                <Select
                                    disabled={currentTranslateMode === 'polishing'}
                                    size='mini'
                                    clearable={false}
                                    options={targetLangOptions}
                                    value={[{ id: targetLang }]}
                                    overrides={{
                                        Root: {
                                            style: {
                                                minWidth: '110px',
                                            },
                                        },
                                    }}
                                    onChange={({ value }) => {
                                        stopAutomaticallyChangeTargetLang.current = true
                                        const langId = value.length > 0 ? value[0].id : targetLangOptions[0].id
                                        setTargetLang(langId as LangCode)
                                    }}
                                />
                            </div>
                        </div>
                        <div className={styles.popupCardHeaderButtonGroup}>
                            {displayedActions?.map((action) => {
                                return (
                                    <Tooltip
                                        key={action.id}
                                        content={action.mode ? t(action.name) : action.name}
                                        placement={isDesktopApp() ? 'bottom' : 'top'}
                                    >
                                        <Button
                                            size='mini'
                                            kind={action.id === activateActionID ? 'primary' : 'secondary'}
                                            onClick={() => {
                                                setActivateActionID(action.id)
                                                if (action.mode === 'polishing') {
                                                    setTargetLang(sourceLang)
                                                }
                                            }}
                                        >
                                            {action.icon &&
                                                React.createElement(mdIcons[action.icon as keyof typeof mdIcons], {})}
                                            {action.id === activateActionID && (
                                                <div style={{ marginLeft: 4, lineHeight: 1 }}>
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
                                                (action) => action.id === activateActionID
                                            ),
                                        }}
                                        onItemSelect={({ item }) => {
                                            const actionID = item.id
                                            if (actionID === '__manager__') {
                                                if (isTauri()) {
                                                    invoke('show_action_manager_window')
                                                } else {
                                                    setShowActionManager(true)
                                                }
                                                return
                                            }
                                            setActivateActionID(actionID as number)
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
                                                                      {}
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
                            <Dropzone onDrop={onDrop} noClick={true}>
                                {({ getRootProps, isDragActive }) => (
                                    <div {...getRootProps()}>
                                        {isDragActive ? (
                                            <div className={styles.fileDragArea}> Drop file below </div>
                                        ) : (
                                            <div
                                                className={styles.OCRStatusBar}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 8,
                                                    opacity: showOCRProcessing ? 1 : 0,
                                                    marginBottom: showOCRProcessing ? 10 : 0,
                                                    fontSize: '11px',
                                                    height: showOCRProcessing ? 26 : 0,
                                                    transition: 'all 0.3s linear',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    {isOCRProcessing ? 'OCR Processing...' : 'OCR Success'}
                                                </div>
                                                {showOCRProcessing && (
                                                    <div>
                                                        <img src={isOCRProcessing ? rocket : partyPopper} width='20' />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <Textarea
                                            inputRef={editorRef}
                                            autoFocus={autoFocus}
                                            overrides={{
                                                Root: {
                                                    style: {
                                                        width: '100%',
                                                        borderRadius: '0px',
                                                    },
                                                },
                                                Input: {
                                                    style: {
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
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (!e.shiftKey) {
                                                        e.preventDefault()
                                                        if (!activateActionID) {
                                                            setActivateActionID(
                                                                actions?.find((action) => action.mode === 'translate')
                                                                    ?.id
                                                            )
                                                        }
                                                        setOriginalText(editableText)
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
                                                    editableText && editableText !== detectedOriginalText ? 4 : 0,
                                                height: editableText && editableText !== detectedOriginalText ? 18 : 0,
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
                                                    color: '#999',
                                                    fontSize: '11px',
                                                    transform: 'scale(0.9)',
                                                    marginRight: '-20px',
                                                }}
                                            >
                                                {`Please press <Enter> key to ${currentTranslateMode}. Press <Shift+Enter> to start a new line.`}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Dropzone>
                            <div className={styles.actionButtonsContainer}>
                                <>
                                    <Tooltip content={t('Upload an image for OCR translation')} placement='bottom'>
                                        <div className={styles.actionButton}>
                                            <Dropzone onDrop={onDrop}>
                                                {({ getRootProps, getInputProps }) => (
                                                    <div {...getRootProps()} className={styles.actionButton}>
                                                        <input {...getInputProps({ multiple: false })} />
                                                        <BsTextareaT size={13} />
                                                    </div>
                                                )}
                                            </Dropzone>
                                        </div>
                                    </Tooltip>
                                    {enableVocabulary && (
                                        <StatefulTooltip
                                            content={
                                                <Trans
                                                    i18nKey='words are collected'
                                                    values={{
                                                        collectTotal: collectedWordTotal,
                                                    }}
                                                />
                                            }
                                            showArrow
                                            placement='top'
                                        >
                                            <div
                                                className={styles.actionButton}
                                                onClick={() => setShowWordbookButtons((e) => !e)}
                                            >
                                                <AiOutlineFileSync size={13} />
                                            </div>
                                        </StatefulTooltip>
                                    )}
                                    {showWordbookButtons && (
                                        <>
                                            <StatefulTooltip content={t('Collection Review')} showArrow placement='top'>
                                                <div className={styles.actionButton}>
                                                    <MdGrade
                                                        size={13}
                                                        onClick={() => setVocabularyType('vocabulary')}
                                                    />
                                                </div>
                                            </StatefulTooltip>
                                            <StatefulTooltip
                                                content={t('Export your collection as a csv file')}
                                                showArrow
                                                placement='top'
                                            >
                                                <div className={styles.actionButton} onClick={onCsvExport}>
                                                    <TbCsv size={13} />
                                                </div>
                                            </StatefulTooltip>
                                            <StatefulTooltip content='Big Bang' showArrow placement='top'>
                                                <div className={styles.actionButton}>
                                                    <FcIdea size={13} onClick={() => setVocabularyType('article')} />
                                                </div>
                                            </StatefulTooltip>
                                        </>
                                    )}
                                </>
                                <div style={{ marginLeft: 'auto' }}></div>
                                {!!editableText.length && (
                                    <>
                                        <Tooltip content={t('Speak')} placement='bottom'>
                                            <div className={styles.actionButton} onClick={handleEditSpeakAction}>
                                                {isSpeakingEditableText ? (
                                                    <SpeakerMotion />
                                                ) : (
                                                    <RxSpeakerLoud size={13} />
                                                )}
                                            </div>
                                        </Tooltip>
                                        <CopyButton text={editableText} styles={styles}></CopyButton>
                                        <Tooltip content={t('Clear input')} placement='bottom'>
                                            <div
                                                className={styles.actionButton}
                                                onClick={() => {
                                                    setEditableText('')
                                                    editorRef.current?.focus()
                                                }}
                                            >
                                                <div className={styles.actionButton}>
                                                    <RxEraser size={13} />
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
                                                <RxReload size={13} />
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
                                                {currentTranslateMode === 'explain-code' ? (
                                                    <>
                                                        <ReactMarkdown>{translatedText}</ReactMarkdown>
                                                        {isLoading && <span className={styles.caret} />}
                                                    </>
                                                ) : (
                                                    translatedLines.map((line, i) => {
                                                        return (
                                                            <p className={styles.paragraph} key={`p-${i}`}>
                                                                {isWordMode && i === 0 ? (
                                                                    <div
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '5px',
                                                                        }}
                                                                    >
                                                                        {line}
                                                                        {!isLoading && (
                                                                            <StatefulTooltip
                                                                                content={
                                                                                    isCollectedWord
                                                                                        ? t('Remove from collection')
                                                                                        : t('Add to collection')
                                                                                }
                                                                                showArrow
                                                                                placement='right'
                                                                            >
                                                                                <div
                                                                                    className={styles.actionButton}
                                                                                    onClick={onWordCollection}
                                                                                >
                                                                                    {isCollectedWord ? (
                                                                                        <MdGrade size={15} />
                                                                                    ) : (
                                                                                        <MdOutlineGrade size={15} />
                                                                                    )}
                                                                                </div>
                                                                            </StatefulTooltip>
                                                                        )}
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
                                                            <RxReload size={13} />
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
                                                            <RxSpeakerLoud size={13} />
                                                        )}
                                                    </div>
                                                </Tooltip>
                                                <CopyButton text={translatedText} styles={styles}></CopyButton>
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
                            {showSettings ? <AiOutlineTranslation size='14' /> : <IoSettingsOutline size='14' />}
                        </div>
                    </Tooltip>
                </div>
            )}
            {enableVocabulary && (
                <Modal
                    isOpen={vocabularyType !== 'hide'}
                    onClose={() => setVocabularyType('hide')}
                    closeable
                    overrides={{
                        Close: {
                            style: {
                                display: 'none',
                            },
                        },
                    }}
                    size='auto'
                    autoFocus
                    animate
                    role='dialog'
                >
                    <Vocabulary
                        onCancel={() => setVocabularyType('hide')}
                        onInsert={(content, highlightWords) => {
                            setEditableText(content)
                            setOriginalText(content)
                            setHighlightWords(highlightWords)
                            setSelectedWord('')
                            setActivateActionID(actions?.find((action) => action.mode === 'translate')?.id)
                            setVocabularyType('hide')
                        }}
                        type={vocabularyType as 'vocabulary' | 'article'}
                    />
                </Modal>
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
                <ModalHeader>{t('Action Manager')}</ModalHeader>
                <ModalBody>
                    <ActionManager />
                </ModalBody>
            </Modal>
            <Toaster />
        </div>
    )
}
