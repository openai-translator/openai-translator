import React, { useCallback, useEffect, useRef, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { Client as Styletron } from 'styletron-engine-atomic'
import { Provider as StyletronProvider } from 'styletron-react'
import { LightTheme, BaseProvider } from 'baseui'
import { Textarea } from 'baseui/textarea'
import icon from './assets/images/icon.png'
import { createUseStyles } from 'react-jss'
import { detectLang, supportLanguages } from './lang'
import { translate } from './translate'
import { popupCardID } from './consts'
import { Select, Value, Option } from 'baseui/select'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { RxCopy } from 'react-icons/rx'
import { HiOutlineSpeakerWave } from 'react-icons/hi2'
import { queryPopupCardElement } from './utils'

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
    popupCard: {},
    popupCardHeaderContainer: {
        display: 'flex',
        flexDirection: 'row',
        cursor: 'move',
        alignItems: 'center',
        padding: '5px 10px',
        borderBottom: '1px solid #e8e8e8',
    },
    iconContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
        marginRight: 'auto',
    },
    icon: {
        display: 'block',
        width: '16px',
        height: '16px',
    },
    iconText: {
        fontSize: '12px',
        color: '#333',
        fontWeight: 500,
    },
    popupCardHeaderActionsContainer: {
        display: 'flex',
        flexShrink: 0,
        flexDirection: 'row',
        cursor: 'move',
        alignItems: 'center',
        padding: '5px 10px',
        gap: '10px',
    },
    from: {
        display: 'flex',
        color: '#999',
        fontSize: '12px',
        flexShrink: 0,
    },
    arrow: {
        display: 'flex',
        color: '#999',
        cursor: 'pointer',
    },
    to: {
        display: 'flex',
        color: '#999',
        fontSize: '12px',
        flexShrink: 0,
    },
    popupCardContentContainer: {
        display: 'flex',
        flexDirection: 'column',
    },
    loadingContainer: {
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '10px',
    },
    popupCardEditorContainer: {
        display: 'flex',
        flexDirection: 'column',
        padding: '10px',
        borderBottom: '1px solid #e9e9e9',
    },
    popupCardTranslatedContainer: {
        display: 'flex',
        padding: '10px',
    },
    popupCardTranslatedContentContainer: {
        padding: '4px 8px',
    },
    error: {
        display: 'flex',
        color: 'red',
    },
    actionButtonsContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '12px',
        paddingTop: '10px',
    },
    actionButton: {
        cursor: 'pointer',
    },
})

export interface IPopupCardProps {
    text: string
    engine: Styletron
}

const loadingIcons = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘']

export function PopupCard(props: IPopupCardProps) {
    const styles = useStyles()
    const [isLoading, setIsLoading] = useState(false)
    const [editableText, setEditableText] = useState(props.text)
    const [isSpeakingEditableText, setIsSpeakingEditableText] = useState(false)
    const [originalText, setOriginalText] = useState(props.text)
    const [translatedText, setTranslatedText] = useState('')
    const [isSpeakingTranslatedText, setIsSpeakingTranslatedText] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    useEffect(() => {
        setEditableText(props.text)
        setOriginalText(props.text)
    }, [props.text])
    const [loadingIconIndex, setLoadingIconIndex] = useState(0)
    const loading = () => {
        setLoadingIconIndex((loadingIconIndex) => {
            return (loadingIconIndex + 1) % loadingIcons.length
        })
    }
    const loadingIntervalRef = useRef<NodeJS.Timeout>()
    const startLoading = useCallback(() => {
        setIsLoading(true)
        loadingIntervalRef.current = setInterval(loading, 100)
    }, [])
    const stopLoading = useCallback(() => {
        setIsLoading(false)
        clearInterval(loadingIntervalRef.current)
    }, [])
    const [detectFrom, setDetectFrom] = useState(detectLang(props.text) ?? 'en')
    const [detectTo, setDetectTo] = useState(detectFrom === 'zh' ? 'en' : 'zh')
    useEffect(() => {
        const from = detectLang(props.text) ?? 'en'
        setDetectFrom(from)
        setDetectTo(from === 'zh' ? 'en' : 'zh')
    }, [props.text])

    const headerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
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
        async (text) => {
            startLoading()
            try {
                const res = await translate({
                    text,
                    detectFrom,
                    detectTo,
                })
                if (res.error) {
                    setErrorMessage(res.error)
                    return
                }
                if (!res.text) {
                    setErrorMessage('No result')
                    return
                }
                setTranslatedText(res.text)
            } finally {
                stopLoading()
            }
        },
        [detectFrom, detectTo],
    )

    useEffect(() => {
        translateText(originalText)
    }, [translateText, originalText])

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messageHandler = (request: any) => {
            if (request.type === 'speakDone') {
                setIsSpeakingEditableText(false)
                setIsSpeakingTranslatedText(false)
            }
        }
        chrome.runtime.onMessage.addListener(messageHandler)
        return () => {
            chrome.runtime.onMessage.removeListener(messageHandler)
        }
    }, [])

    return (
        <StyletronProvider value={props.engine}>
            <BaseProvider theme={LightTheme}>
                <div className={styles.popupCard}>
                    <div>
                        <div ref={headerRef} className={styles.popupCardHeaderContainer}>
                            <div className={styles.iconContainer}>
                                <img className={styles.icon} src={icon} />
                                <div className={styles.iconText}>OpenAI Translator</div>
                            </div>
                            <div className={styles.popupCardHeaderActionsContainer}>
                                <div className={styles.from}>
                                    <Select
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
                                    ↔️
                                </div>
                                <div className={styles.to}>
                                    <Select
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
                                        onChange={({ value }) => setDetectTo(value[0]?.id as string)}
                                    />
                                </div>
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
                                            },
                                        },
                                    }}
                                    value={editableText}
                                    size='mini'
                                    resize='both'
                                    onChange={(e) => setEditableText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            if (!e.shiftKey) {
                                                e.preventDefault()
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
                                                chrome.runtime.sendMessage({
                                                    type: 'stopSpeaking',
                                                })
                                                setIsSpeakingEditableText(false)
                                                return
                                            }
                                            setIsSpeakingEditableText(true)
                                            chrome.runtime.sendMessage({
                                                type: 'speak',
                                                text: editableText,
                                            })
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
                                {isLoading ? (
                                    <div className={styles.loadingContainer}>
                                        <div>{loadingIcons[loadingIconIndex]}</div>
                                        <div>{detectFrom === detectTo ? 'Polishing' : 'Translating'}...</div>
                                    </div>
                                ) : errorMessage ? (
                                    <div className={styles.error}>{errorMessage}</div>
                                ) : (
                                    <div>
                                        <div className={styles.popupCardTranslatedContentContainer}>
                                            {translatedText}
                                        </div>
                                        <div className={styles.actionButtonsContainer}>
                                            <div style={{ marginRight: 'auto' }} />
                                            <div
                                                className={styles.actionButton}
                                                onClick={() => {
                                                    if (isSpeakingTranslatedText) {
                                                        chrome.runtime.sendMessage({
                                                            type: 'stopSpeaking',
                                                        })
                                                        setIsSpeakingTranslatedText(false)
                                                        return
                                                    }
                                                    setIsSpeakingTranslatedText(true)
                                                    chrome.runtime.sendMessage({
                                                        type: 'speak',
                                                        text: translatedText,
                                                    })
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
                                    </div>
                                )}
                                <Toaster />
                            </div>
                        </div>
                    </div>
                </div>
            </BaseProvider>
        </StyletronProvider>
    )
}
