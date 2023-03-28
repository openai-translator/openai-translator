import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import toast, { Toaster } from 'react-hot-toast'
import { Client as Styletron } from 'styletron-engine-atomic'
import { Provider as StyletronProvider } from 'styletron-react'
import { BaseProvider, Theme } from 'baseui-sd'
import { Textarea } from 'baseui-sd/textarea'
import icon from './assets/images/icon.png'
import { createUseStyles } from 'react-jss'
import { AiOutlineTranslation, AiOutlineFileSync } from 'react-icons/ai'
import { IoSettingsOutline, IoColorPaletteOutline } from 'react-icons/io5'
import { TbArrowsExchange, TbCsv } from 'react-icons/tb'
import { MdOutlineSummarize, MdOutlineAnalytics, MdCode, MdOutlineGrade, MdGrade } from 'react-icons/md'
import { StatefulTooltip } from 'baseui-sd/tooltip'
import { detectLang, supportLanguages } from './lang'
import { translate, TranslateMode } from './translate'
import { Select, Value, Option } from 'baseui-sd/select'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { RxCopy, RxEraser, RxReload, RxSpeakerLoud } from 'react-icons/rx'
import { calculateMaxXY, exportToCsv, LocalDB, queryPopupCardElement, VocabularyItem } from './utils'
import { clsx } from 'clsx'
import { Button } from 'baseui-sd/button'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '../components/ErrorFallback'
import { defaultAPIURL, isDesktopApp, isTauri } from '../common/utils'
import { Settings } from '../popup/Settings'
import { documentPadding } from './consts'
import Dropzone from 'react-dropzone'
import { RecognizeResult, createWorker } from 'tesseract.js'
import { BsTextareaT } from 'react-icons/bs'
import { FcIdea } from 'react-icons/fc'
import rocket from './assets/images/rocket.gif'
import partyPopper from './assets/images/party-popper.gif'
import { Event } from '@tauri-apps/api/event'
import SpeakerMotion from '../components/SpeakerMotion'
import IpLocationNotification from '../components/IpLocationNotification'
import { HighlightInTextarea } from '../common/highlight-in-textarea'
import LRUCache from 'lru-cache'
import { ISettings, IThemedStyleProps } from '../common/types'
import { useTheme } from '../common/hooks/useTheme'
import { speak } from '../common/tts'
import { Tooltip } from '../components/Tooltip'
import { useSettings } from '../common/hooks/useSettings'
import Vocabulary from './vocalulary'

const cache = new LRUCache({
    max: 500,
    maxSize: 5000,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sizeCalculation: (_value, _key) => {
        return 1
    },
})

const langOptions: Value = supportLanguages.reduce((acc, [id, label]) => {
    return [
        ...acc,
        {
            id,
            label,
        } as Option,
    ]
}, [] as Value)

const useStyles = createUseStyles({
    'popupCard': {
        height: '100%',
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
                  background: props.theme.colors.backgroundPrimary,
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
        'display': 'flex',
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
}

export interface TesseractResult extends RecognizeResult {
    text: string
}

export interface IPopupCardProps {
    text: string
    engine: Styletron
    autoFocus?: boolean
    showSettings?: boolean
    defaultShowSettings?: boolean
    containerStyle?: React.CSSProperties
    editorRows?: number
    onSettingsSave?: (oldSettings: ISettings) => void
}

export interface MovementXY {
    x: number
    y: number
}

export function PopupCard(props: IPopupCardProps) {
    const [translationFlag, forceTranslate] = useReducer((x: number) => x + 1, 0)

    const editorRef = useRef<HTMLTextAreaElement>(null)
    const isCompositing = useRef(false)
    const [selectedWord, setSelectedWord] = useState('')
    const [vocabularyType, setVocabularyType] = useState<'hide' | 'vocabulary' | 'article'>('hide')
    const highlightRef = useRef<HighlightInTextarea | null>(null)
    const [showMoreBtn, setShowMore] = useState<boolean>(false)
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
        if (!highlightRef.current?.highlight) {
            return
        }
        highlightRef.current.highlight.highlight = selectedWord
        highlightRef.current.handleInput()
    }, [selectedWord])

    const [translateMode, setTranslateMode] = useState<TranslateMode | ''>('')
    useEffect(() => {
        if (settings && settings.defaultTranslateMode !== 'nop') {
            setTranslateMode(settings.defaultTranslateMode)
        }
    }, [settings])
    const isTranslate = translateMode === 'translate'
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
            const selectedWord_ = editor.value.substring(editor.selectionStart, editor.selectionEnd).trim()
            setSelectedWord(selectedWord_)
        }
        const onBlur = () => {
            const selectedWord_ = editor.value.substring(editor.selectionStart, editor.selectionEnd).trim()
            setSelectedWord(selectedWord_)
        }

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
    const [translatedText, setTranslatedText] = useState('')
    const [translatedLines, setTranslatedLines] = useState<string[]>([])
    const [wordMode, setWordMode] = useState<boolean>(false)
    const [collectd, setColleced] = useState<boolean>(false)
    const [collectTotal, updateTotal] = useState<number>(0)
    const checkCollection = useCallback(async () => {
        try {
            const arr = await LocalDB.vocabulary.where('word').equals(editableText).toArray()
            if (arr.length > 0) {
                await LocalDB.vocabulary.put({
                    ...arr[0],
                    count: arr[0].count + 1,
                })
                setColleced(true)
            } else {
                setColleced(false)
            }
        } catch (e) {
            console.error(e)
        }
    }, [editableText])
    useEffect(() => {
        if (wordMode && !isLoading) {
            checkCollection()
        }
    }, [wordMode, editableText, isLoading])
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
    useEffect(() => {
        setOriginalText(props.text)
    }, [props.text])
    useEffect(() => {
        setEditableText(originalText)
        setSelectedWord('')
    }, [originalText])
    const [detectFrom, setDetectFrom] = useState('')
    const [detectTo, setDetectTo] = useState('')
    const stopAutomaticallyChangeDetectTo = useRef(false)
    useEffect(() => {
        ;(async () => {
            const from = (await detectLang(originalText)) ?? 'en'
            setDetectFrom(from)
            if (
                (translateMode === 'translate' || translateMode === 'analyze') &&
                !stopAutomaticallyChangeDetectTo.current
            ) {
                setDetectTo(from === 'zh-Hans' || from === 'zh-Hant' ? 'en' : settings?.defaultTargetLanguage ?? 'en')
            }
        })()
    }, [originalText, translateMode, settings])

    const [actionStr, setActionStr] = useState('')

    useEffect(() => {
        const editor = editorRef.current
        if (!editor) return
        editor.dir = ['ar', 'fa', 'he', 'ug', 'ur'].includes(detectFrom) ? 'rtl' : 'ltr'
    }, [detectFrom, actionStr])
    const [translatedLanguageDirection, setTranslatedLanguageDirection] = useState<Theme['direction']>('ltr')
    useEffect(() => {
        setTranslatedLanguageDirection(['ar', 'fa', 'he', 'ug', 'ur'].includes(detectTo) ? 'rtl' : 'ltr')
    }, [detectTo])

    const headerRef = useRef<HTMLDivElement>(null)

    const editorContainerRef = useRef<HTMLDivElement>(null)

    const translatedContentRef = useRef<HTMLDivElement>(null)

    const actionButtonsRef = useRef<HTMLDivElement>(null)

    const scrollYRef = useRef<number>(0)

    // Reposition the popup card to prevent it from extending beyond the screen.
    useEffect(() => {
        const initCollectionTotal = async () => {
            try {
                const total = await LocalDB.vocabulary.count()
                updateTotal(total)
            } catch (e) {
                console.error(e)
            }
        }
        initCollectionTotal()
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

    const translateText = useCallback(
        async (text: string, selectedWord: string, signal: AbortSignal) => {
            setShowMore(false)
            if (!text || !detectFrom || !detectTo || !translateMode) {
                return
            }
            const actionStrItem = actionStrItems[translateMode]
            const beforeTranslate = () => {
                let actionStr = actionStrItem.beforeStr
                if (translateMode === 'translate' && detectFrom == detectTo) {
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
                    if (reason == 'length') {
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
                    if (translateMode === 'translate' && detectFrom == detectTo) {
                        actionStr = 'Polished'
                    }
                    setActionStr(actionStr)
                }
            }
            beforeTranslate()
            const cachedKey = `translate:${translateMode}:${detectFrom}:${detectTo}:${text}:${selectedWord}`
            const cachedValue = cache.get(cachedKey)
            if (cachedValue) {
                afterTranslate('stop')
                setTranslatedText(cachedValue as string)
                return
            }
            let isStopped = false
            try {
                await translate({
                    mode: translateMode,
                    signal,
                    text,
                    selectedWord,
                    detectFrom,
                    detectTo,
                    onMessage: (message) => {
                        if (message.role) {
                            return
                        }
                        setWordMode(message.wordMode)
                        setTranslatedText((translatedText) => {
                            return translatedText + message.content
                        })
                    },
                    onFinish: (reason) => {
                        afterTranslate(reason)
                        setTranslatedText((translatedText) => {
                            let result = translatedText
                            if (
                                translatedText &&
                                ['”', '"', '」'].indexOf(translatedText[translatedText.length - 1]) >= 0
                            ) {
                                result = translatedText.slice(0, -1)
                            }
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
        [translateMode, detectFrom, detectTo]
    )

    useEffect(() => {
        const controller = new AbortController()
        const { signal } = controller
        translateText(originalText, selectedWord, signal)
        return () => {
            controller.abort()
        }
    }, [translateText, originalText, selectedWord, translationFlag])

    const handleSpeakDone = () => {
        setIsSpeakingEditableText(false)
        setIsSpeakingTranslatedText(false)
    }

    const [showSettings, setShowSettings] = useState(false)
    useEffect(() => {
        if (!props.defaultShowSettings) {
            return
        }
        if (settings && !settings.apiKeys) {
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
            const { listen } = await require('@tauri-apps/api/event')
            const { fs } = await require('@tauri-apps/api')
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

                const worker = createWorker({
                    // logger: (m) => console.log(m),
                })

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
        const worker = createWorker({
            // logger: (m) => console.log(m),
        })

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
            if (collectd) {
                const wordInfo = await LocalDB.vocabulary.get(editableText)
                await LocalDB.vocabulary.delete(wordInfo?.word ?? '')
                setColleced(false)
                updateTotal((t) => t - 1)
            } else {
                await LocalDB.vocabulary.put({
                    word: editableText,
                    count: 1,
                    description: translatedText.substr(editableText.length + 1), // seperate string after first '\n'
                    updateAt: new Date().valueOf().toString(),
                })
                setColleced(true)
                updateTotal((t) => t + 1)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const onCsvExport = async () => {
        try {
            const arr = await LocalDB.vocabulary.toArray()
            console.log('arr==', arr)
            await exportToCsv<VocabularyItem>(`openai-translator-collection-${new Date().valueOf()}`, arr)
            if (isDesktopApp()) {
                toast(t('Csv saved on Desktop'), {
                    duration: 5000,
                    icon: '👏',
                })
            }
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <StyletronProvider value={props.engine}>
                <BaseProvider theme={theme}>
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
                        {showSettings ? (
                            <Settings
                                onSave={(oldSettings) => {
                                    setShowSettings(false)
                                    props.onSettingsSave?.(oldSettings)
                                }}
                                engine={props.engine}
                            />
                        ) : (
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
                                                disabled={translateMode === 'explain-code'}
                                                size='mini'
                                                clearable={false}
                                                options={langOptions}
                                                value={[{ id: detectFrom }]}
                                                overrides={{
                                                    Root: {
                                                        style: {
                                                            minWidth: '110px',
                                                        },
                                                    },
                                                }}
                                                onChange={({ value }) => {
                                                    if (value.length > 0) {
                                                        setDetectFrom(value[0].id as string)
                                                    } else {
                                                        setDetectFrom(langOptions[0].id as string)
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div
                                            className={styles.arrow}
                                            onClick={() => {
                                                setOriginalText(translatedText)
                                                setDetectFrom(detectTo)
                                                setDetectTo(detectFrom)
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
                                                disabled={translateMode === 'polishing'}
                                                size='mini'
                                                clearable={false}
                                                options={langOptions}
                                                value={[{ id: detectTo }]}
                                                overrides={{
                                                    Root: {
                                                        style: {
                                                            minWidth: '110px',
                                                        },
                                                    },
                                                }}
                                                onChange={({ value }) => {
                                                    stopAutomaticallyChangeDetectTo.current = true
                                                    if (value.length > 0) {
                                                        setDetectTo(value[0].id as string)
                                                    } else {
                                                        setDetectTo(langOptions[0].id as string)
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.popupCardHeaderButtonGroup}>
                                        <Tooltip content={t('Translate')} placement={isDesktopApp() ? 'bottom' : 'top'}>
                                            <Button
                                                size='mini'
                                                kind={translateMode === 'translate' ? 'primary' : 'secondary'}
                                                onClick={() => setTranslateMode('translate')}
                                            >
                                                <AiOutlineTranslation />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content={t('Polishing')} placement={isDesktopApp() ? 'bottom' : 'top'}>
                                            <Button
                                                size='mini'
                                                kind={translateMode === 'polishing' ? 'primary' : 'secondary'}
                                                onClick={() => {
                                                    setTranslateMode('polishing')
                                                    setDetectTo(detectFrom)
                                                }}
                                            >
                                                <IoColorPaletteOutline />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content={t('Summarize')} placement={isDesktopApp() ? 'bottom' : 'top'}>
                                            <Button
                                                size='mini'
                                                kind={translateMode === 'summarize' ? 'primary' : 'secondary'}
                                                onClick={() => {
                                                    setTranslateMode('summarize')
                                                }}
                                            >
                                                <MdOutlineSummarize />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content={t('Analyze')} placement={isDesktopApp() ? 'bottom' : 'top'}>
                                            <Button
                                                size='mini'
                                                kind={translateMode === 'analyze' ? 'primary' : 'secondary'}
                                                onClick={() => setTranslateMode('analyze')}
                                            >
                                                <MdOutlineAnalytics />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip
                                            content={t('Explain Code')}
                                            placement={isDesktopApp() ? 'bottom' : 'top'}
                                        >
                                            <Button
                                                size='mini'
                                                kind={translateMode === 'explain-code' ? 'primary' : 'secondary'}
                                                onClick={() => {
                                                    setTranslateMode('explain-code')
                                                    // no need to change detectTo
                                                }}
                                            >
                                                <MdCode />
                                            </Button>
                                        </Tooltip>
                                    </div>
                                </div>
                                <div className={styles.popupCardContentContainer}>
                                    {settings?.apiURL === defaultAPIURL && (
                                        <div>
                                            <IpLocationNotification />
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
                                                                        src={isOCRProcessing ? rocket : partyPopper}
                                                                        width='20'
                                                                    />
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
                                                                        translateMode === 'explain-code'
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
                                                                : Math.min(
                                                                      Math.max(editableText.split('\n').length, 3),
                                                                      12
                                                                  )
                                                        }
                                                        onChange={(e) => setEditableText(e.target.value)}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                if (!e.shiftKey) {
                                                                    e.preventDefault()
                                                                    if (!translateMode) {
                                                                        setTranslateMode('translate')
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
                                                                editableText && editableText !== originalText ? 4 : 0,
                                                            height:
                                                                editableText && editableText !== originalText ? 18 : 0,
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
                                                            {`Please press <Enter> key to ${translateMode}. Press <Shift+Enter> to start a new line.`}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Dropzone>
                                        <div className={styles.actionButtonsContainer}>
                                            <>
                                                <StatefulTooltip
                                                    content={t('Upload an image for OCR translation')}
                                                    showArrow
                                                    placement='right'
                                                >
                                                    <div className={styles.actionButton}>
                                                        <Dropzone onDrop={onDrop}>
                                                            {({ getRootProps, getInputProps }) => (
                                                                <div
                                                                    {...getRootProps()}
                                                                    className={styles.actionButton}
                                                                >
                                                                    <input {...getInputProps({ multiple: false })} />
                                                                    <BsTextareaT size={13} />
                                                                </div>
                                                            )}
                                                        </Dropzone>
                                                    </div>
                                                </StatefulTooltip>
                                                {!!collectTotal && (
                                                    <StatefulTooltip
                                                        content={
                                                            <Trans
                                                                i18nKey='words are collected'
                                                                values={{
                                                                    collectTotal,
                                                                }}
                                                            />
                                                        }
                                                        showArrow
                                                        placement='top'
                                                    >
                                                        <div
                                                            className={styles.actionButton}
                                                            onClick={() => setShowMore((e) => !e)}
                                                        >
                                                            <AiOutlineFileSync size={13} />
                                                        </div>
                                                    </StatefulTooltip>
                                                )}
                                                {showMoreBtn && (
                                                    <>
                                                        <StatefulTooltip
                                                            content={t('Collection Review')}
                                                            showArrow
                                                            placement='top'
                                                        >
                                                            <div className={styles.actionButton}>
                                                                <MdGrade
                                                                    size={13}
                                                                    onClick={() => setVocabularyType('vocabulary')}
                                                                />
                                                            </div>
                                                        </StatefulTooltip>
                                                        <StatefulTooltip
                                                            content={t('Export csv of your collection')}
                                                            showArrow
                                                            placement='top'
                                                        >
                                                            <div className={styles.actionButton} onClick={onCsvExport}>
                                                                <TbCsv size={13} />
                                                            </div>
                                                        </StatefulTooltip>
                                                        <StatefulTooltip content='Big Bang' showArrow placement='top'>
                                                            <div className={styles.actionButton}>
                                                                <FcIdea
                                                                    size={13}
                                                                    onClick={() => setVocabularyType('article')}
                                                                />
                                                            </div>
                                                        </StatefulTooltip>
                                                    </>
                                                )}
                                            </>
                                            <div style={{ marginLeft: 'auto' }}></div>
                                            {!!editableText.length && (
                                                <>
                                                    <StatefulTooltip content={t('Speak')} showArrow placement='left'>
                                                        <div
                                                            className={styles.actionButton}
                                                            onClick={() => {
                                                                if (isSpeakingEditableText) {
                                                                    speechSynthesis.cancel()
                                                                    setIsSpeakingEditableText(false)
                                                                    return
                                                                }
                                                                setIsSpeakingEditableText(true)
                                                                speak({
                                                                    text: editableText,
                                                                    lang: detectFrom,
                                                                    onFinish: handleSpeakDone,
                                                                })
                                                            }}
                                                        >
                                                            {isSpeakingEditableText ? (
                                                                <SpeakerMotion />
                                                            ) : (
                                                                <RxSpeakerLoud size={13} />
                                                            )}
                                                        </div>
                                                    </StatefulTooltip>
                                                    <StatefulTooltip
                                                        content={t('Copy to clipboard')}
                                                        showArrow
                                                        placement='left'
                                                    >
                                                        <div>
                                                            <CopyToClipboard
                                                                text={editableText}
                                                                onCopy={() => {
                                                                    toast(t('Copy to clipboard'), {
                                                                        duration: 3000,
                                                                        icon: '👏',
                                                                    })
                                                                }}
                                                                options={{ format: 'text/plain' }}
                                                            >
                                                                <div className={styles.actionButton}>
                                                                    <RxCopy size={13} />
                                                                </div>
                                                            </CopyToClipboard>
                                                        </div>
                                                    </StatefulTooltip>
                                                    <StatefulTooltip
                                                        content={t('Clear input')}
                                                        showArrow
                                                        placement='left'
                                                    >
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
                                                    </StatefulTooltip>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {originalText !== '' && (
                                        <div
                                            className={styles.popupCardTranslatedContainer}
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
                                                    ) : (
                                                        <span key={'3'}>👍</span>
                                                    )}
                                                </div>
                                            )}
                                            {errorMessage ? (
                                                <div className={styles.errorMessage}>
                                                    <span>{errorMessage}</span>
                                                    <Tooltip content={t('Retry')} placement='bottom'>
                                                        <div
                                                            onClick={() => forceTranslate()}
                                                            className={styles.actionButton}
                                                        >
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
                                                            {translatedLines.map((line, i) => {
                                                                return (
                                                                    <p className={styles.paragraph} key={`p-${i}`}>
                                                                        {wordMode && i == 0 ? (
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
                                                                                            collectd
                                                                                                ? t(
                                                                                                      'Remove from collection'
                                                                                                  )
                                                                                                : t('Add to collection')
                                                                                        }
                                                                                        showArrow
                                                                                        placement='right'
                                                                                    >
                                                                                        <div
                                                                                            className={
                                                                                                styles.actionButton
                                                                                            }
                                                                                            onClick={onWordCollection}
                                                                                        >
                                                                                            {collectd ? (
                                                                                                <MdGrade size={15} />
                                                                                            ) : (
                                                                                                <MdOutlineGrade
                                                                                                    size={15}
                                                                                                />
                                                                                            )}
                                                                                        </div>
                                                                                    </StatefulTooltip>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            line
                                                                        )}
                                                                        {isLoading &&
                                                                            i === translatedLines.length - 1 && (
                                                                                <span className={styles.caret} />
                                                                            )}
                                                                    </p>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                    {translatedText && (
                                                        <div
                                                            ref={actionButtonsRef}
                                                            className={styles.actionButtonsContainer}
                                                        >
                                                            <div style={{ marginRight: 'auto' }} />
                                                            <Tooltip content={t('Speak')} placement='bottom'>
                                                                <div
                                                                    className={styles.actionButton}
                                                                    onClick={() => {
                                                                        if (isSpeakingTranslatedText) {
                                                                            speechSynthesis.cancel()
                                                                            setIsSpeakingTranslatedText(false)
                                                                            return
                                                                        }
                                                                        setIsSpeakingTranslatedText(true)
                                                                        speak({
                                                                            text: translatedText,
                                                                            lang: detectTo,
                                                                            onFinish: handleSpeakDone,
                                                                        })
                                                                    }}
                                                                >
                                                                    {isSpeakingTranslatedText ? (
                                                                        <SpeakerMotion />
                                                                    ) : (
                                                                        <RxSpeakerLoud size={13} />
                                                                    )}
                                                                </div>
                                                            </Tooltip>
                                                            <Tooltip
                                                                content={t('Copy to clipboard')}
                                                                placement='bottom'
                                                            >
                                                                <div>
                                                                    <CopyToClipboard
                                                                        text={translatedText}
                                                                        onCopy={() => {
                                                                            toast(t('Copy to clipboard'), {
                                                                                duration: 3000,
                                                                                icon: '👏',
                                                                            })
                                                                        }}
                                                                        options={{ format: 'text/plain' }}
                                                                    >
                                                                        <div className={styles.actionButton}>
                                                                            <RxCopy size={13} />
                                                                        </div>
                                                                    </CopyToClipboard>
                                                                </div>
                                                            </Tooltip>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {props.showSettings && (
                            <div className={styles.footer}>
                                <Tooltip
                                    content={showSettings ? t('Go to Translator') : t('Go to Settings')}
                                    placement='right'
                                >
                                    <div onClick={() => setShowSettings((s) => !s)}>
                                        {showSettings ? (
                                            <AiOutlineTranslation size='14' />
                                        ) : (
                                            <IoSettingsOutline size='14' />
                                        )}
                                    </div>
                                </Tooltip>
                            </div>
                        )}
                        {vocabularyType !== 'hide' && (
                            <div className={styles.vocabulary} onClick={() => setVocabularyType('hide')}>
                                <Vocabulary
                                    onCancel={() => setVocabularyType('hide')}
                                    type={vocabularyType}
                                    engine={props.engine}
                                />
                            </div>
                        )}
                        <Toaster />
                    </div>
                </BaseProvider>
            </StyletronProvider>
        </ErrorBoundary>
    )
}
