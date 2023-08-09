import React, { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
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
import { detectLang, getLangConfig, sourceLanguages, targetLanguages, LangCode } from '../lang'
import { translate, TranslateMode } from '../translate'
import { Select, Value, Option } from 'baseui-sd/select'
import { RxEraser, RxReload, RxSpeakerLoud, RxStop } from 'react-icons/rx'
import { LuStars, LuStarOff } from 'react-icons/lu'
import { clsx } from 'clsx'
import { Button } from 'baseui-sd/button'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '../components/ErrorFallback'
import { defaultAPIURL, exportToCsv, isDesktopApp, isTauri, getAssetUrl, isUserscript, setSettings } from '../utils'
import { InnerSettings } from './Settings'
import { containerID, popupCardInnerContainerId } from '../../browser-extension/content_script/consts'
import Dropzone from 'react-dropzone'
import { RecognizeResult, createWorker } from 'tesseract.js'
import { BsTextareaT } from 'react-icons/bs'
import { FcIdea } from 'react-icons/fc'
import rocket from '../assets/images/rocket.gif'
import partyPopper from '../assets/images/party-popper.gif'
import type { Event } from '@tauri-apps/api/event'
import SpeakerMotion from '../components/SpeakerMotion'
import IpLocationNotification from '../components/IpLocationNotification'
import { HighlightInTextarea } from '../highlight-in-textarea'
import { LRUCache } from 'lru-cache'
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
import { countTokens } from '../token'
import { useLazyEffect } from '../usehooks'
import LogoWithText, { type LogoWithTextRef } from './LogoWithText'
import { useTranslatorStore, setEditableText, setOriginalText, setDetectedOriginalText } from '../store'

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
                  'minWidth': '612px',
                  '-ms-user-select': 'none',
                  '-webkit-user-select': 'none',
                  'user-select': 'none',
              },
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
        'padding': props.showLogo ? '5px 10px' : '5px 10px 5px 0px',
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
    'tokenCount': {
        color: '#999',
        fontSize: '14px',
        fontFamily: 'monospace',
    },
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
        'fontSize': '15px',
        'marginTop': '-14px',
        'display': 'flex',
        'overflowY': 'auto',
        'color': props.themeType === 'dark' ? props.theme.colors.contentSecondary : props.theme.colors.contentPrimary,
        '& *': {
            '-ms-user-select': 'text',
            '-webkit-user-select': 'text',
            'user-select': 'text',
        },
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
    'enterHint': {
        color: '#999',
        fontSize: '14px',
        transform: 'scale(0.9)',
        marginRight: '-16px',
    },
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
    'flexPlaceHolder': {
        marginRight: 'auto',
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
    showLogo?: boolean
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

function InnerTranslator(props: IInnerTranslatorProps) {
    useEffect(() => {
        setupAnalysis()
    }, [])
    const [showSettings, setShowSettings] = useState(false)

    const { showLogo = true } = props

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

    const [activateAction, setActivateAction] = useState<Action>()

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
    const { width: headerWidth = 0 } = useResizeObserver<HTMLDivElement>({ ref: headerRef })

    const logoWithTextRef = useRef<LogoWithTextRef>(null)

    const languagesSelectorRef = useRef<HTMLDivElement>(null)

    const { width: languagesSelectorWidth = 0 } = useResizeObserver<HTMLDivElement>({ ref: languagesSelectorRef })

    const headerActionButtonsRef = useRef<HTMLDivElement>(null)

    const { width: headerActionButtonsWidth = 0 } = useResizeObserver<HTMLDivElement>({ ref: headerActionButtonsRef })

    const containerRef = useRef<HTMLDivElement>(null)
    const editorContainerRef = useRef<HTMLDivElement>(null)
    const translatedContainerRef = useRef<HTMLDivElement>(null)

    const translatedContentRef = useRef<HTMLDivElement>(null)

    const actionButtonsRef = useRef<HTMLDivElement>(null)

    const hasActivateAction = activateAction !== undefined
    const [displayedActionsMaxCount, setDisplayedActionsMaxCount] = useState(4)

    useLayoutEffect(() => {
        const handleResize = () => {
            const headerElem = headerRef.current
            if (!headerElem) {
                return
            }
            const logoWithTextElem = logoWithTextRef.current
            const activateActionElem = headerElem.querySelector('.__yetone-activate-action')
            if (hasActivateAction && !activateActionElem) {
                return
            }
            const paddingWidth = 32
            const logoWidth = showLogo ? 131 : 0
            const iconWidth = 32
            const iconWithTextWidth = activateActionElem ? activateActionElem.clientWidth : 105
            const iconGap = 5
            let count = Math.floor(
                (headerWidth -
                    paddingWidth -
                    logoWidth -
                    languagesSelectorWidth -
                    10 -
                    iconWithTextWidth * (hasActivateAction ? 1 : 0)) /
                    (iconGap + iconWidth)
            )
            count = hasActivateAction ? count + 1 : count
            if (count <= 0) {
                logoWithTextElem?.hideText()
            } else {
                logoWithTextElem?.showText()
            }
            setDisplayedActionsMaxCount(Math.min(Math.max(count, 1), 7))
        }

        const timer = setTimeout(() => handleResize(), 300)

        return () => {
            clearTimeout(timer)
        }
    }, [hasActivateAction, headerWidth, languagesSelectorWidth, headerActionButtonsWidth, showLogo])

    const actions = useLiveQuery(() => actionService.list(), [refreshActionsFlag])

    const [displayedActions, setDisplayedActions] = useState<Action[]>([])
    const [hiddenActions, setHiddenActions] = useState<Action[]>([])

    useEffect(() => {
        if (!actions) {
            setDisplayedActions([])
            setHiddenActions([])
            return
        }
        let displayedActions = actions.slice(0, displayedActionsMaxCount)
        let hiddenActions = actions.slice(displayedActionsMaxCount)
        if (!displayedActions.find((action) => action.id === activateAction?.id)) {
            const activatedAction = actions.find((a) => a.id === activateAction?.id)
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
    }, [actions, activateAction?.id, displayedActionsMaxCount])

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

    const styles = useStyles({ theme, themeType, isDesktopApp: isDesktopApp(), showLogo })
    const [isLoading, setIsLoading] = useState(false)
    const { editableText, originalText, detectedOriginalText } = useTranslatorStore()
    const [isSpeakingEditableText, setIsSpeakingEditableText] = useState(false)
    const [tokenCount, setTokenCount] = useState(0)
    const [translatedText, setTranslatedText] = useState('')
    const [translatedLines, setTranslatedLines] = useState<string[]>([])
    const [isWordMode, setIsWordMode] = useState(false)
    const [isCollectedWord, setIsCollectedWord] = useState(false)
    const [isAutoCollectOn, setIsAutoCollectOn] = useState(
        settings?.autoCollect === undefined ? false : settings.autoCollect
    )

    useEffect(() => {
        setOriginalText(props.text)
    }, [props.text, props.uuid])

    useEffect(() => {
        setEditableText(detectedOriginalText)
    }, [detectedOriginalText])

    useLazyEffect(
        () => {
            setTokenCount(countTokens(editableText, settings?.apiModel))
        },
        [editableText],
        500
    )

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
                    if (settings?.defaultTargetLanguage) {
                        return settings.defaultTargetLanguage as LangCode
                    }
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

    const translatedLanguageDirection = useMemo(() => getLangConfig(sourceLang).direction, [sourceLang])

    const { collectedWordTotal, setCollectedWordTotal } = useCollectedWordTotal()

    useEffect(() => {
        const popupCardInnerContainer: HTMLDivElement | null | undefined = document
            .querySelector(`#${containerID}`)
            ?.shadowRoot?.querySelector(`#${popupCardInnerContainerId}`)

        if (!popupCardInnerContainer) {
            return
        }

        const calculateTranslatedContentMaxHeight = (): number => {
            const { innerHeight } = window
            const maxHeight = popupCardInnerContainer ? parseInt(popupCardInnerContainer.style.maxHeight) : innerHeight

            const editorHeight = editorContainerRef.current?.offsetHeight || 0
            const actionButtonsHeight = actionButtonsRef.current?.offsetHeight || 0
            const headerHeight = headerRef.current?.offsetHeight || 0
            const { paddingTop, paddingBottom } = getComputedStyle(translatedContainerRef.current as HTMLDivElement)
            const { paddingTop: containerPaddingTop, paddingBottom: containerPaddingBottom } = getComputedStyle(
                containerRef.current as HTMLDivElement
            )
            const paddingVertical =
                parseInt(paddingTop) +
                parseInt(paddingBottom) +
                parseInt(containerPaddingTop) +
                parseInt(containerPaddingBottom)

            return maxHeight - headerHeight - editorHeight - actionButtonsHeight - paddingVertical
        }

        const resizeHandle: ResizeObserverCallback = _.debounce(() => {
            // Listen for element height changes
            const $translatedContent = translatedContentRef.current
            if ($translatedContent) {
                const translatedContentMaxHeight = calculateTranslatedContentMaxHeight()
                $translatedContent.style.maxHeight = `${translatedContentMaxHeight}px`
            }
        }, 500)

        const observer = new ResizeObserver(resizeHandle)
        observer.observe(popupCardInnerContainer)
        return () => {
            observer.disconnect()
        }
    }, [showSettings])

    const [isNotLogin, setIsNotLogin] = useState(false)

    /**
     * Add or remove word from collection.
     * @param remove - Remove word from collection if true, otherwise add it to collection.
     */
    const onWordCollection = useCallback(
        async (remove: boolean) => {
            try {
                if (remove) {
                    const wordInfo = await vocabularyService.getItem(editableText.trim())
                    await vocabularyService.deleteItem(wordInfo?.word ?? '')
                    setCollectedWordTotal((t: number) => t - 1)
                    setIsCollectedWord(false)
                } else {
                    await vocabularyService.putItem({
                        word: editableText,
                        reviewCount: 1,
                        description: translatedText.slice(editableText.length + 1), // separate string after first '\n'
                        updatedAt: new Date().valueOf().toString(),
                        createdAt: new Date().valueOf().toString(),
                    })
                    setCollectedWordTotal((t: number) => t + 1)
                    setIsCollectedWord(true)
                }
            } catch (e) {
                console.error(e)
            }
        },
        [editableText, setCollectedWordTotal, translatedText]
    )

    useEffect(() => {
        setSettings({ autoCollect: isAutoCollectOn })
    }, [isAutoCollectOn])

    const autoCollect = useCallback(async () => {
        await checkWordCollection()
        if (isWordMode && isAutoCollectOn) {
            onWordCollection(false)
            console.info(`Auto collecting word: ${editableText}`)
        }
    }, [isWordMode, isAutoCollectOn, editableText, onWordCollection, checkWordCollection])
    const autoCollectRef = useRef(autoCollect)
    useEffect(() => {
        autoCollectRef.current = autoCollect
    }, [autoCollect])

    const translateText = useCallback(
        async (text: string, selectedWord: string, signal: AbortSignal) => {
            if (!text || !sourceLang || !targetLang || !activateAction?.id) {
                return
            }
            const action = await actionService.get(activateAction?.id)
            if (!action) {
                return
            }
            setShowWordbookButtons(false)
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
                        setActionStr((actionStr_) => {
                            setErrorMessage(`${actionStr_} failed: ${reason}`)
                            return 'Error'
                        })
                    }
                } else {
                    let actionStr = actionStrItem.afterStr
                    if (currentTranslateMode === 'translate' && sourceLang === targetLang) {
                        actionStr = 'Polished'
                    }
                    setActionStr(actionStr)
                    autoCollectRef.current()
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

    const translateControllerRef = useRef<AbortController | null>(null)
    useEffect(() => {
        if (editableText !== detectedOriginalText) {
            return
        }
        translateControllerRef.current = new AbortController()
        const { signal } = translateControllerRef.current
        translateText(detectedOriginalText, selectedWord, signal)
        return () => {
            translateControllerRef.current?.abort()
        }
    }, [translateText, editableText, detectedOriginalText, selectedWord])

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

    const onCsvExport = async () => {
        try {
            const words = await vocabularyService.listItems()
            await exportToCsv<VocabularyItem>(`openai-translator-collection-${new Date().valueOf()}`, words)
            if (isDesktopApp()) {
                toast(t('CSV file saved on Desktop'), {
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

    const handleStopGenerating = () => {
        translateControllerRef.current?.abort('stop')
        stopLoading()
        setActionStr('Stopped')
    }

    return (
        <div
            className={clsx(styles.popupCard, {
                'yetone-dark': themeType === 'dark',
            })}
            ref={containerRef}
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
                            cursor: isDesktopApp() ? 'default' : showLogo ? 'move' : 'default',
                        }}
                    >
                        {showLogo && <LogoWithText ref={logoWithTextRef} />}
                        <div className={styles.popupCardHeaderActionsContainer} ref={languagesSelectorRef}>
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
                                                if (action.mode === 'polishing') {
                                                    setTargetLang(sourceLang)
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
                                                        maxWidth: 100,
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
                        {props.showSettings && (
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
                        )}
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
                                                        <img
                                                            src={
                                                                isOCRProcessing
                                                                    ? getAssetUrl(rocket)
                                                                    : getAssetUrl(partyPopper)
                                                            }
                                                            width='20'
                                                        />{' '}
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
                                                        fontSize: '15px !important',
                                                        width: '100%',
                                                        borderRadius: '0px',
                                                    },
                                                },
                                                Input: {
                                                    style: {
                                                        fontSize: '15px !important',
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
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    if (!activateAction) {
                                                        setActivateAction(
                                                            actions?.find((action) => action.mode === 'translate')
                                                        )
                                                    }
                                                    setOriginalText(editableText)
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
                                            <div className={styles.tokenCount}> {tokenCount} </div>
                                            <div className={styles.flexPlaceHolder} />
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                }}
                                            >
                                                <div className={styles.enterHint}>
                                                    {'Press <Enter> to submit, <Shift+Enter> for a new line.'}
                                                </div>
                                                <Button
                                                    size='mini'
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        if (!activateAction) {
                                                            setActivateAction(
                                                                actions?.find((action) => action.mode === 'translate')
                                                            )
                                                        }
                                                        setOriginalText(editableText)
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
                                    <Tooltip content={t('Upload an image for OCR translation')} placement='bottom'>
                                        <div className={styles.actionButton}>
                                            <Dropzone onDrop={onDrop}>
                                                {({ getRootProps, getInputProps }) => (
                                                    <div {...getRootProps()} className={styles.actionButton}>
                                                        <input {...getInputProps({ multiple: false })} />
                                                        <BsTextareaT size={15} />
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
                                                <AiOutlineFileSync size={15} />
                                            </div>
                                        </StatefulTooltip>
                                    )}
                                    {showWordbookButtons && (
                                        <>
                                            <StatefulTooltip content={t('Collection Review')} showArrow placement='top'>
                                                <div className={styles.actionButton}>
                                                    <MdGrade
                                                        size={15}
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
                                                    <TbCsv size={15} />
                                                </div>
                                            </StatefulTooltip>
                                            <StatefulTooltip content='Big Bang' showArrow placement='top'>
                                                <div className={styles.actionButton}>
                                                    <FcIdea size={15} onClick={() => setVocabularyType('article')} />
                                                </div>
                                            </StatefulTooltip>
                                        </>
                                    )}
                                </>
                                <div style={{ marginLeft: 'auto' }}></div>
                                {!!editableText.length && (
                                    <>
                                        {isLoading && (
                                            <Tooltip content={t('Stop')} placement='bottom'>
                                                <div className={styles.actionButton} onClick={handleStopGenerating}>
                                                    <RxStop size={15} />
                                                </div>
                                            </Tooltip>
                                        )}
                                        <Tooltip content={t('Speak')} placement='bottom'>
                                            <div className={styles.actionButton} onClick={handleEditSpeakAction}>
                                                {isSpeakingEditableText ? (
                                                    <SpeakerMotion />
                                                ) : (
                                                    <RxSpeakerLoud size={15} />
                                                )}
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
                            <div
                                className={styles.popupCardTranslatedContainer}
                                ref={translatedContainerRef}
                                dir={translatedLanguageDirection}
                            >
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
                                        ) : translateControllerRef.current?.signal.aborted &&
                                          translateControllerRef.current?.signal.reason === 'stop' ? (
                                            <span key={'3'}>⏹️</span>
                                        ) : (
                                            <span key={'4'}>👍</span>
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
                                                            <div className={styles.paragraph} key={`p-${i}`}>
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
                                                                                    onClick={() =>
                                                                                        onWordCollection(
                                                                                            isCollectedWord
                                                                                        )
                                                                                    }
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
                                                            </div>
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
                                                {isWordMode && (
                                                    <Tooltip content={t('Auto collect')} placement='bottom'>
                                                        <div
                                                            className={styles.actionButton}
                                                            onClick={() => {
                                                                setIsAutoCollectOn((prevState) => !prevState)
                                                            }}
                                                        >
                                                            {isAutoCollectOn ? (
                                                                <LuStars size={15} />
                                                            ) : (
                                                                <LuStarOff size={15} />
                                                            )}
                                                        </div>
                                                    </Tooltip>
                                                )}
                                                <Tooltip content={t('Copy to clipboard')} placement='bottom'>
                                                    <div className={styles.actionButton}>
                                                        <CopyButton text={translatedText} styles={styles}></CopyButton>
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
                            setActivateAction(actions?.find((action) => action.mode === 'translate'))
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
        </div>
    )
}
