import { useEffect, useRef, useState } from 'react'
import { Translator } from '../common/components/Translator'
import { Client as Styletron } from 'styletron-engine-atomic'
import { getCurrent } from '@tauri-apps/api/window'
import { listen, Event } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/primitives'
import { bindHotkey, bindOCRHotkey, bindWritingHotkey } from './utils'
import { useTheme } from '../common/hooks/useTheme'
import { useMemoWindow } from '../common/hooks/useMemoWindow'
import { v4 as uuidv4 } from 'uuid'
import { PREFIX } from '../common/constants'
import { translate } from '../common/translate'
import { detectLang, intoLangCode } from '../common/lang'
import { useSettings } from '../common/hooks/useSettings'
import { setupAnalysis } from '../common/analysis'

const engine = new Styletron({
    prefix: `${PREFIX}-styletron-`,
})

export function App() {
    const isMacOS = navigator.userAgent.includes('Mac OS X')
    const isLinux = navigator.userAgent.includes('Linux')
    const pinIconRef = useRef<HTMLDivElement>(null)
    const minimizeIconRef = useRef<HTMLDivElement>(null)
    const maximizeIconRef = useRef<HTMLDivElement>(null)
    const closeIconRef = useRef<HTMLDivElement>(null)
    const [text, setText] = useState('')
    const [uuid, setUUID] = useState('')
    const [isPinned, setPinned] = useState(false)

    useMemoWindow({ size: true, position: false })
    useEffect(() => {
        setupAnalysis()
    }, [])

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        invoke('get_main_window_always_on_top').then((pinned: any) => {
            return setPinned(pinned)
        })
    }, [])

    useEffect(() => {
        let unlisten
        ;(async () => {
            unlisten = await listen('change-text', async (event: Event<string>) => {
                const selectedText = event.payload
                if (selectedText) {
                    const uuid_ = uuidv4().replace(/-/g, '').slice(0, 6)
                    setUUID(uuid_)
                    setText(selectedText)
                }
            })
        })()
        return unlisten
    }, [])

    const { settings } = useSettings()

    useEffect(() => {
        if (!settings?.writingTargetLanguage) {
            return
        }
        let unlisten: () => void | undefined
        ;(async () => {
            unlisten = await listen('writing-text', async (event: Event<string>) => {
                const inputText = event.payload
                const { signal } = new AbortController()
                if (inputText) {
                    const sourceLang = await detectLang(inputText)
                    const targetLang = intoLangCode(settings.writingTargetLanguage)
                    await translate({
                        writing: true,
                        action: {
                            idx: 0,
                            name: 'writing',
                            mode: 'translate',
                            updatedAt: Date.now() + '',
                            createdAt: Date.now() + '',
                        },
                        signal,
                        text: inputText,
                        detectFrom: sourceLang,
                        detectTo: targetLang,
                        onMessage: (message) => {
                            if (!message.content) {
                                return
                            }
                            invoke('write_to_input', {
                                text: message.content,
                            })
                        },
                        onFinish: () => {
                            invoke('finish_writing')
                        },
                        onError: () => {
                            invoke('finish_writing')
                        },
                    })
                }
            })
        })()
        return () => {
            unlisten?.()
        }
    }, [settings?.writingTargetLanguage])

    useEffect(() => {
        let unlisten
        ;(async () => {
            unlisten = await listen('show', async () => {
                const uuid_ = uuidv4().replace(/-/g, '').slice(0, 6)
                setUUID(uuid_)
            })
        })()
        return unlisten
    }, [])

    useEffect(() => {
        bindHotkey()
        bindOCRHotkey()
        bindWritingHotkey()
    }, [])

    useEffect(() => {
        if (isMacOS || isLinux) {
            return
        }
        const appWindow = getCurrent()
        function handlePin() {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            invoke('set_main_window_always_on_top').then((pinned: any) => {
                setPinned(pinned)
            })
        }
        function handleMinimize() {
            appWindow.minimize()
        }
        async function handleMaximize() {
            if (await appWindow.isMaximized()) {
                await appWindow.unmaximize()
            } else {
                await appWindow.maximize()
            }
        }
        function handleClose() {
            appWindow.hide()
        }
        const pinIcon = pinIconRef.current
        const minimizeIcon = minimizeIconRef.current
        const maximizeIcon = maximizeIconRef.current
        const closeIcon = closeIconRef.current
        pinIcon?.addEventListener('click', handlePin)
        minimizeIcon?.addEventListener('click', handleMinimize)
        maximizeIcon?.addEventListener('click', handleMaximize)
        closeIcon?.addEventListener('click', handleClose)
        return () => {
            pinIcon?.removeEventListener('click', handlePin)
            minimizeIcon?.removeEventListener('click', handleMinimize)
            maximizeIcon?.removeEventListener('click', handleMaximize)
            closeIcon?.removeEventListener('click', handleClose)
        }
    }, [isLinux, isMacOS])

    const { theme, themeType } = useTheme()

    const svgPathColor = themeType === 'dark' ? '#fff' : '#000'

    return (
        <div
            style={{
                position: 'relative',
                background: theme.colors.backgroundPrimary,
                font: '14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
                minHeight: '100vh',
            }}
        >
            <div className='titlebar' data-tauri-drag-region>
                {!isMacOS && !isLinux && (
                    <>
                        <div className='titlebar-button' id='titlebar-pin' ref={pinIconRef}>
                            <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'>
                                {isPinned ? (
                                    <path
                                        fill={svgPathColor}
                                        fillRule='evenodd'
                                        d='M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1l1-1v-7H19v-2c-1.66 0-3-1.34-3-3z'
                                    />
                                ) : (
                                    <path
                                        fill={svgPathColor}
                                        d='M14 4v5c0 1.12.37 2.16 1 3H9c.65-.86 1-1.9 1-3V4h4m3-2H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1l1-1v-7H19v-2c-1.66 0-3-1.34-3-3V4h1c.55 0 1-.45 1-1s-.45-1-1-1z'
                                    />
                                )}
                            </svg>
                        </div>
                        <div className='titlebar-button' id='titlebar-minimize' ref={minimizeIconRef}>
                            <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'>
                                <path fill={svgPathColor} d='M20 14H4v-4h16' />
                            </svg>
                        </div>
                        <div className='titlebar-button' id='titlebar-maximize' ref={maximizeIconRef}>
                            <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'>
                                <path fill={svgPathColor} d='M4 4h16v16H4V4m2 4v10h12V8H6Z' />
                            </svg>
                        </div>
                        <div className='titlebar-button' id='titlebar-close' ref={closeIconRef}>
                            <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'>
                                <path
                                    fill={svgPathColor}
                                    d='M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z'
                                />
                            </svg>
                        </div>
                    </>
                )}
            </div>
            <Translator
                uuid={uuid}
                text={text}
                engine={engine}
                showSettings
                autoFocus
                defaultShowSettings
                editorRows={10}
                containerStyle={{ paddingTop: '26px' }}
                onSettingsSave={(oldSettings) => {
                    invoke('clear_config_cache')
                    bindHotkey(oldSettings.hotkey)
                    bindOCRHotkey(oldSettings.ocrHotkey)
                    bindWritingHotkey(oldSettings.writingHotkey)
                }}
            />
        </div>
    )
}
