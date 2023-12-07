import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { Translator } from '../common/components/Translator'
import { Client as Styletron } from 'styletron-engine-atomic'
import { listen, Event } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/primitives'
import { bindDisplayWindowHotkey, bindHotkey, bindOCRHotkey, bindWritingHotkey } from './utils'
import { useMemoWindow } from '../common/hooks/useMemoWindow'
import { v4 as uuidv4 } from 'uuid'
import { PREFIX } from '../common/constants'
import { translate } from '../common/translate'
import { detectLang, intoLangCode } from '../common/lang'
import { useSettings } from '../common/hooks/useSettings'
import { setupAnalysis } from '../common/analysis'
import { Window } from './Window'

const engine = new Styletron({
    prefix: `${PREFIX}-styletron-`,
})

export function App() {
    const [text, setText] = useState('')
    const [uuid, setUUID] = useState('')
    const [showSettings, setShowSettings] = useState(false)
    const writingQueue = useRef<Array<string | number>>([])
    const isWriting = useRef(false)

    const [writingFlag, writing] = useReducer((x: number) => x + 1, 0)

    useEffect(() => {
        if (isWriting.current) {
            return
        }
        isWriting.current = true
        ;(async () => {
            while (writingQueue.current.length > 0) {
                const text = writingQueue.current.shift()
                try {
                    if (typeof text === 'number') {
                        await invoke('finish_writing')
                    } else {
                        await invoke('write_to_input', {
                            text,
                        })
                    }
                } catch (e) {
                    console.error(e)
                }
            }
            isWriting.current = false
            writing()
        })()
    }, [writingFlag])

    useMemoWindow({ size: true, position: false })

    useEffect(() => {
        setupAnalysis()
    }, [])

    useEffect(() => {
        let unlisten: (() => void) | undefined = undefined
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
        return () => {
            unlisten?.()
        }
    }, [])

    useEffect(() => {
        let unlisten: (() => void) | undefined = undefined
        ;(async () => {
            unlisten = await listen('show-settings', async () => {
                const uuid_ = uuidv4().replace(/-/g, '').slice(0, 6)
                setShowSettings(true)
                setUUID(uuid_)
            })
        })()
        return () => {
            unlisten?.()
        }
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
                        onMessage: async (message) => {
                            if (!message.content) {
                                return
                            }
                            writingQueue.current.push(message.content)
                            writing()
                        },
                        onFinish: () => {
                            writingQueue.current.push(0)
                            writing()
                        },
                        onError: () => {
                            writingQueue.current.push(0)
                            writing()
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
        bindDisplayWindowHotkey()
        bindOCRHotkey()
        bindWritingHotkey()
    }, [])

    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const onSettingsShow = useCallback((isShow: boolean) => {
        setIsSettingsOpen(isShow)
    }, [])

    return (
        <Window isMainWindow windowsTitlebarDisableDarkMode={isSettingsOpen}>
            <Translator
                uuid={uuid}
                text={text}
                engine={engine}
                showSettingsIcon
                showSettings={showSettings}
                autoFocus
                defaultShowSettings
                editorRows={10}
                containerStyle={{ paddingTop: '26px' }}
                onSettingsSave={(oldSettings) => {
                    invoke('clear_config_cache')
                    bindHotkey(oldSettings.hotkey)
                    bindDisplayWindowHotkey(oldSettings.displayWindowHotkey)
                    bindOCRHotkey(oldSettings.ocrHotkey)
                    bindWritingHotkey(oldSettings.writingHotkey)
                }}
                onSettingsShow={onSettingsShow}
            />
        </Window>
    )
}
