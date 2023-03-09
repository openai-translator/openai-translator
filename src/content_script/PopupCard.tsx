import React, { useCallback, useEffect, useRef, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { Client as Styletron } from 'styletron-engine-atomic'
import { Provider as StyletronProvider } from 'styletron-react'
import { LightTheme, BaseProvider } from 'baseui'
import { Textarea } from 'baseui/textarea'
import icon from './assets/images/icon.png'
import { createUseStyles } from 'react-jss'
import { AiOutlineTranslation } from 'react-icons/ai'
import { IoSettingsOutline, IoColorPaletteOutline } from 'react-icons/io5'
import { TbArrowsExchange } from 'react-icons/tb'
import { MdOutlineSummarize, MdCode } from 'react-icons/md'
import { StatefulTooltip } from 'baseui/tooltip'
import { detectLang, supportLanguages } from './lang'
import { translate, TranslateMode } from './translate'
import { Select, Value, Option } from 'baseui/select'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { RxCopy } from 'react-icons/rx'
import { HiOutlineSpeakerWave } from 'react-icons/hi2'
import { queryPopupCardElement } from './utils'
import { clsx } from 'clsx'
import { Button } from 'baseui/button'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '../components/ErrorFallback'
import { getBrowser, getSettings, isDesktopApp } from '../common/utils'
import { Settings } from '../popup/Settings'

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
        paddingBottom: '30px',
    },
    'settingsIcon': {
        position: 'absolute',
        cursor: 'pointer',
        bottom: '10px',
        right: '10px',
    },
    'popupCardHeaderContainer': {
        display: 'flex',
        flexDirection: 'row',
        cursor: 'move',
        alignItems: 'center',
        padding: '5px 10px',
        borderBottom: '1px solid #e8e8e8',
    },
    'iconContainer': {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
        marginRight: 'auto',
    },
    'icon': {
        display: 'block',
        width: '16px',
        height: '16px',
        userSelect: 'none',
    },
    'iconText': {
        fontSize: '12px',
        color: '#333',
        fontWeight: 500,
    },
    'paragraph': {
        margin: '14px 0',
    },
    'popupCardHeaderButtonGroup': {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '5px',
        marginLeft: '10px',
    },
    'popupCardHeaderActionsContainer': {
        display: 'flex',
        flexShrink: 0,
        flexDirection: 'row',
        cursor: 'move',
        alignItems: 'center',
        padding: '5px 10px',
        gap: '10px',
    },
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
    'popupCardContentContainer': {
        display: 'flex',
        flexDirection: 'column',
    },
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
        padding: '10px',
        borderBottom: '1px solid #e9e9e9',
    },
    'popupCardTranslatedContainer': {
        position: 'relative',
        display: 'flex',
        padding: '16px 10px 10px 10px',
    },
    'actionStr': {
        position: 'absolute',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '6px',
        top: '0',
        left: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
        fontSize: '10px',
        color: '#333',
        padding: '2px 12px',
        background: '#eee',
    },
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
    'popupCardTranslatedContentContainer': {
        marginTop: '-14px',
        padding: '4px 8px',
    },
    'errorMessage': {
        display: 'flex',
        color: 'red',
    },
    'actionButtonsContainer': {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '12px',
        marginTop: '10px',
    },
    'actionButton': {
        cursor: 'pointer',
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
})

export interface IPopupCardProps {
    text: string
    engine: Styletron
    autoFocus?: boolean
    showSettings?: boolean
    defaultShowSettings?: boolean
    containerStyle?: React.CSSProperties
    rows?: number
}

export function PopupCard(props: IPopupCardProps) {
    const [translateMode, setTranslateMode] = useState<TranslateMode | ''>('')
    useEffect(() => {
        ;(async () => {
            const settings = await getSettings()
            if (settings.defaultTranslateMode !== 'nop') {
                setTranslateMode(settings.defaultTranslateMode)
            }
        })()
    }, [])
    const styles = useStyles()
    const [isLoading, setIsLoading] = useState(false)
    const [editableText, setEditableText] = useState(props.text)
    const [isSpeakingEditableText, setIsSpeakingEditableText] = useState(false)
    const [originalText, setOriginalText] = useState(props.text)
    const [translatedText, setTranslatedText] = useState('')
    const [translatedLines, setTranslatedLines] = useState<string[]>([])
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
        setEditableText(props.text)
        setOriginalText(props.text)
    }, [props.text])
    const [detectFrom, setDetectFrom] = useState('')
    const [detectTo, setDetectTo] = useState('')
    const stopAutomaticallyChangeDetectTo = useRef(false)
    useEffect(() => {
        ;(async () => {
            const from = (await detectLang(originalText)) ?? 'en'
            setDetectFrom(from)
            if (translateMode === 'translate' && !stopAutomaticallyChangeDetectTo.current) {
                const settings = await getSettings()
                setDetectTo(from === 'zh-Hans' || from === 'zh-Hant' ? 'en' : settings.defaultTargetLanguage)
            }
        })()
    }, [originalText, translateMode])

    const [actionStr, setActionStr] = useState('')

    const headerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isDesktopApp()) {
            return
        }

        const $header = headerRef.current
        if (!$header) {
            return undefined
        }

        let closed = true

        const dragMouseDown = (e: MouseEvent) => {
            closed = false
            e = e || window.event
            e.preventDefault()
            document.addEventListener('mouseup', closeDragElement)
            document.addEventListener('mousemove', elementDrag)
        }

        const elementDrag = async (e: MouseEvent) => {
            const $popupCard = await queryPopupCardElement()
            if (!$popupCard) {
                return
            }
            if (closed) {
                return
            }
            e = e || window.event
            e.preventDefault()
            $popupCard.style.top = $popupCard.offsetTop + e.movementY + 'px'
            $popupCard.style.left = $popupCard.offsetLeft + e.movementX + 'px'
        }

        const closeDragElement = () => {
            closed = true
            document.removeEventListener('mouseup', closeDragElement)
            document.removeEventListener('mousemove', elementDrag)
        }

        $header.addEventListener('mousedown', dragMouseDown)
        $header.addEventListener('mouseup', closeDragElement)

        return () => {
            $header.removeEventListener('mousedown', dragMouseDown)
            $header.removeEventListener('mouseup', closeDragElement)
            closeDragElement()
        }
    }, [headerRef])

    const translateText = useCallback(
        async (text: string, signal: AbortSignal) => {
            if (!text || !detectFrom || !detectTo || !translateMode) {
                return
            }
            startLoading()
            switch (translateMode) {
                case 'translate':
                    setActionStr(detectFrom === detectTo ? 'Polishing...' : 'Translating...')
                    break
                case 'polishing':
                    setActionStr('Polishing...')
                    break
                case 'summarize':
                    setActionStr('Summarizing...')
                    break
                case 'explain-code':
                    setActionStr('Explaining...')
                    break
            }
            let isStopped = false
            setTranslatedText('')
            setErrorMessage('')
            try {
                await translate({
                    mode: translateMode,
                    signal,
                    text,
                    detectFrom,
                    detectTo,
                    onMessage: (message) => {
                        if (message.role) {
                            return
                        }
                        setTranslatedText((translatedText) => {
                            return translatedText + message.content
                        })
                    },
                    onFinish: (reason) => {
                        stopLoading()
                        if (reason !== 'stop') {
                            setActionStr('Error')
                            setErrorMessage(`${actionStr} failed：${reason}`)
                        } else {
                            switch (translateMode) {
                                case 'translate':
                                    setActionStr(detectFrom === detectTo ? 'Polished' : 'Translated')
                                    break
                                case 'polishing':
                                    setActionStr('Polished')
                                    break
                                case 'summarize':
                                    setActionStr('Summarized')
                                    break
                            }
                        }
                        setTranslatedText((translatedText) => {
                            if (
                                translatedText &&
                                ['”', '"', '」'].indexOf(translatedText[translatedText.length - 1]) >= 0
                            ) {
                                return translatedText.slice(0, -1)
                            }
                            return translatedText
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
        translateText(originalText, signal)
        return () => {
            controller.abort()
        }
    }, [translateText, originalText])

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messageHandler = (request: any) => {
            if (request.type === 'speakDone') {
                setIsSpeakingEditableText(false)
                setIsSpeakingTranslatedText(false)
            }
        }
        ;(async () => {
            const browser = await getBrowser()
            browser.runtime.onMessage.addListener(messageHandler)
        })()
        return () => {
            ;(async () => {
                const browser = await getBrowser()
                browser.runtime.onMessage.removeListener(messageHandler)
            })()
        }
    }, [])

    const [showSettings, setShowSettings] = useState(false)
    useEffect(() => {
        if (!props.defaultShowSettings) {
            return
        }
        ;(async () => {
            const settings = await getSettings()
            if (!settings.apiKeys) {
                setShowSettings(true)
            }
        })()
    }, [props.defaultShowSettings])

    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <StyletronProvider value={props.engine}>
                <BaseProvider theme={LightTheme}>
                    <div className={styles.popupCard}>
                        {props.showSettings && (
                            <StatefulTooltip
                                content={showSettings ? 'Go to Translator' : 'Go to Settings'}
                                showArrow
                                placement='left'
                            >
                                <div className={styles.settingsIcon} onClick={() => setShowSettings((s) => !s)}>
                                    {showSettings ? (
                                        <AiOutlineTranslation size='14' />
                                    ) : (
                                        <IoSettingsOutline size='14' />
                                    )}
                                </div>
                            </StatefulTooltip>
                        )}
                        {showSettings ? (
                            <Settings onSave={() => setShowSettings(false)} />
                        ) : (
                            <div style={props.containerStyle}>
                                <div
                                    ref={headerRef}
                                    className={styles.popupCardHeaderContainer}
                                    style={{
                                        cursor: isDesktopApp() ? 'default' : 'move',
                                    }}
                                >
                                    <div className={styles.iconContainer}>
                                        <img className={styles.icon} src={icon} />
                                        <div className={styles.iconText}>OpenAI Translator</div>
                                    </div>
                                    <div className={styles.popupCardHeaderActionsContainer}>
                                        <div className={styles.from}>
                                            <Select
                                                disabled={translateMode === 'explain-code'}
                                                size='mini'
                                                clearable={false}
                                                searchable={false}
                                                options={langOptions}
                                                value={[{ id: detectFrom }]}
                                                overrides={{
                                                    Root: {
                                                        style: {
                                                            minWidth: '100px',
                                                        },
                                                    },
                                                }}
                                                onChange={({ value }) => setDetectFrom(value[0]?.id as string)}
                                            />
                                        </div>
                                        <div
                                            className={styles.arrow}
                                            onClick={() => {
                                                setEditableText(translatedText)
                                                setOriginalText(translatedText)
                                                setDetectFrom(detectTo)
                                                setDetectTo(detectFrom)
                                            }}
                                        >
                                            <StatefulTooltip content='Exchange' placement='top' showArrow>
                                                <div>
                                                    <TbArrowsExchange />
                                                </div>
                                            </StatefulTooltip>
                                        </div>
                                        <div className={styles.to}>
                                            <Select
                                                disabled={translateMode === 'polishing'}
                                                size='mini'
                                                clearable={false}
                                                searchable={false}
                                                options={langOptions}
                                                value={[{ id: detectTo }]}
                                                overrides={{
                                                    Root: {
                                                        style: {
                                                            minWidth: '100px',
                                                        },
                                                    },
                                                }}
                                                onChange={({ value }) => {
                                                    stopAutomaticallyChangeDetectTo.current = true
                                                    setDetectTo(value[0]?.id as string)
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.popupCardHeaderButtonGroup}>
                                        <StatefulTooltip content='Translate' placement='top' showArrow>
                                            <Button
                                                size='mini'
                                                kind={translateMode === 'translate' ? 'primary' : 'secondary'}
                                                onClick={() => setTranslateMode('translate')}
                                            >
                                                <AiOutlineTranslation />
                                            </Button>
                                        </StatefulTooltip>
                                        <StatefulTooltip content='Polishing' placement='top' showArrow>
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
                                        </StatefulTooltip>
                                        <StatefulTooltip content='Summarize' placement='top' showArrow>
                                            <Button
                                                size='mini'
                                                kind={translateMode === 'summarize' ? 'primary' : 'secondary'}
                                                onClick={() => {
                                                    setTranslateMode('summarize')
                                                    setDetectTo(detectFrom)
                                                }}
                                            >
                                                <MdOutlineSummarize />
                                            </Button>
                                        </StatefulTooltip>
                                        <StatefulTooltip content='Explain Code' placement='top' showArrow>
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
                                        </StatefulTooltip>
                                    </div>
                                </div>
                                <div className={styles.popupCardContentContainer}>
                                    <div className={styles.popupCardEditorContainer}>
                                        <div
                                            style={{
                                                height: 0,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {editableText}
                                        </div>
                                        <Textarea
                                            autoFocus={props.autoFocus}
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
                                                        fontFamily:
                                                            translateMode === 'explain-code' ? 'monospace' : 'inherit',
                                                    },
                                                },
                                            }}
                                            value={editableText}
                                            size='mini'
                                            resize='vertical'
                                            rows={
                                                props.rows
                                                    ? props.rows
                                                    : Math.min(Math.max(editableText.split('\n').length, 3), 12)
                                            }
                                            onChange={(e) => setEditableText(e.target.value)}
                                            onKeyDown={(e) => {
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
                                        <div className={styles.actionButtonsContainer}>
                                            <div style={{ marginRight: 'auto' }} />
                                            <div
                                                className={styles.actionButton}
                                                onClick={() => {
                                                    if (isSpeakingEditableText) {
                                                        ;(async () => {
                                                            const browser = await getBrowser()
                                                            browser.runtime.sendMessage({
                                                                type: 'stopSpeaking',
                                                            })
                                                            setIsSpeakingEditableText(false)
                                                        })()
                                                        return
                                                    }
                                                    ;(async () => {
                                                        const browser = await getBrowser()
                                                        setIsSpeakingEditableText(true)
                                                        browser.runtime.sendMessage({
                                                            type: 'speak',
                                                            text: editableText,
                                                            lang: detectFrom,
                                                        })
                                                    })()
                                                }}
                                            >
                                                <HiOutlineSpeakerWave size={13} />
                                            </div>
                                            <CopyToClipboard
                                                text={editableText}
                                                onCopy={() => {
                                                    toast('Copied to clipboard', {
                                                        duration: 3000,
                                                        icon: '👏',
                                                    })
                                                }}
                                            >
                                                <div className={styles.actionButton}>
                                                    <RxCopy size={13} />
                                                </div>
                                            </CopyToClipboard>
                                        </div>
                                    </div>
                                    <div className={styles.popupCardTranslatedContainer}>
                                        {actionStr && (
                                            <div
                                                className={clsx({
                                                    [styles.actionStr]: true,
                                                    [styles.error]: !!errorMessage,
                                                })}
                                            >
                                                <div>{actionStr}</div>
                                                {isLoading ? (
                                                    <span className={styles.writing} />
                                                ) : errorMessage ? (
                                                    <span>😢</span>
                                                ) : (
                                                    <span>👍</span>
                                                )}
                                            </div>
                                        )}
                                        {errorMessage ? (
                                            <div className={styles.errorMessage}>{errorMessage}</div>
                                        ) : (
                                            <div
                                                style={{
                                                    width: '100%',
                                                }}
                                            >
                                                <div className={styles.popupCardTranslatedContentContainer}>
                                                    <div>
                                                        {translatedLines.map((line, i) => {
                                                            return (
                                                                <p className={styles.paragraph} key={`p-${i}`}>
                                                                    {line}
                                                                    {isLoading && i === translatedLines.length - 1 && (
                                                                        <span className={styles.caret} />
                                                                    )}
                                                                </p>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                                {translatedText && (
                                                    <div className={styles.actionButtonsContainer}>
                                                        <div style={{ marginRight: 'auto' }} />
                                                        <div
                                                            className={styles.actionButton}
                                                            onClick={() => {
                                                                if (isSpeakingTranslatedText) {
                                                                    ;(async () => {
                                                                        const browser = await getBrowser()
                                                                        browser.runtime.sendMessage({
                                                                            type: 'stopSpeaking',
                                                                        })
                                                                        setIsSpeakingTranslatedText(false)
                                                                    })()
                                                                    return
                                                                }
                                                                ;(async () => {
                                                                    const browser = await getBrowser()
                                                                    setIsSpeakingTranslatedText(true)
                                                                    browser.runtime.sendMessage({
                                                                        type: 'speak',
                                                                        text: translatedText,
                                                                        lang: detectTo,
                                                                    })
                                                                })()
                                                            }}
                                                        >
                                                            <HiOutlineSpeakerWave size={13} />
                                                        </div>
                                                        <CopyToClipboard
                                                            text={translatedText}
                                                            onCopy={() => {
                                                                toast('Copied to clipboard', {
                                                                    duration: 3000,
                                                                    icon: '👏',
                                                                })
                                                            }}
                                                        >
                                                            <div className={styles.actionButton}>
                                                                <RxCopy size={13} />
                                                            </div>
                                                        </CopyToClipboard>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <Toaster />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </BaseProvider>
            </StyletronProvider>
        </ErrorBoundary>
    )
}
