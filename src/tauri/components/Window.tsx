import { useCallback, useEffect, useState } from 'react'
import { getCurrent } from '@tauri-apps/api/webviewWindow'
import { Effect } from '@tauri-apps/api/window'
import { useTheme } from '../../common/hooks/useTheme'
import { Provider as StyletronProvider } from 'styletron-react'
import { BaseProvider } from 'baseui-sd'
import { Client as Styletron } from 'styletron-engine-atomic'
import { PREFIX } from '../../common/constants'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '../../common/components/ErrorFallback'
import '../../common/i18n.js'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../common/hooks/useSettings'
import { IThemedStyleProps } from '../../common/types'
import { createUseStyles } from 'react-jss'
import { open } from '@tauri-apps/plugin-shell'
import { usePinned } from '../../common/hooks/usePinned'
import { isMacOS, isTauri, isWindows } from '@/common/utils'
import { useSetAtom } from 'jotai'

import { showSettingsAtom } from '@/common/store/setting'
import { commands } from '../bindings'
import { trackEvent } from '@aptabase/tauri'

addEventListener('unhandledrejection', (e) => {
    trackEvent('promise_rejected', {
        message: (e.reason?.message || e.reason || e).toString(),
    })
})

window.addEventListener('error', (e) => {
    trackEvent('js_error', {
        message: e.message,
    })
})

const engine = new Styletron({
    prefix: `${PREFIX}-styletron-`,
})

export interface IWindowProps {
    isTranslatorWindow?: boolean
    windowsTitlebarDisableDarkMode?: boolean
    children: React.ReactNode
}

export function Window(props: IWindowProps) {
    const { theme } = useTheme()

    const setShowSettings = useSetAtom(showSettingsAtom)

    useEffect(() => {
        async function handleKeyPress(event: KeyboardEvent) {
            if ((event.metaKey || event.ctrlKey) && event.key === ',') {
                event.preventDefault()
                if (isTauri()) {
                    setShowSettings((prevIsVisible) => !prevIsVisible)
                }
            }
        }

        document.addEventListener('keydown', handleKeyPress)

        return () => {
            document.removeEventListener('keydown', handleKeyPress)
        }
    }, [setShowSettings])

    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <StyletronProvider value={engine}>
                <BaseProvider theme={theme}>
                    <InnerWindow {...props} />
                </BaseProvider>
            </StyletronProvider>
        </ErrorBoundary>
    )
}

const useStyles = createUseStyles({
    titlebar: () => ({
        height: '30px',
        background: 'transparent',
        userSelect: 'none',
        display: 'flex',
        justifyContent: 'flex-end',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2147483647,
    }),
    titlebarButton: (props: IThemedStyleProps & { windowsTitlebarDisableDarkMode?: boolean }) => ({
        'display': 'inline-flex',
        'justifyContent': 'center',
        'alignItems': 'center',
        'width': '30px',
        'height': '30px',
        '&:hover': {
            background:
                props.windowsTitlebarDisableDarkMode !== true && props.themeType === 'dark' ? '#353535' : '#e9e9e9',
        },
    }),
})

interface ITitlebarContainerProps {
    children: React.ReactNode
    windowsTitlebarDisableDarkMode?: boolean
}

export function TitlebarContainer(props: ITitlebarContainerProps) {
    const { theme, themeType } = useTheme()
    const styles = useStyles({ theme, themeType, windowsTitlebarDisableDarkMode: props.windowsTitlebarDisableDarkMode })

    if (isMacOS) {
        return (
            <div className={styles.titlebar} data-tauri-drag-region>
                {props.children}
            </div>
        )
    }

    return <div className={styles.titlebar}>{props.children}</div>
}

export function InnerWindow(props: IWindowProps) {
    const { theme, themeType } = useTheme()
    const styles = useStyles({ theme, themeType, windowsTitlebarDisableDarkMode: props.windowsTitlebarDisableDarkMode })

    const { pinned, setPinned } = usePinned()
    const { i18n } = useTranslation()
    const { settings } = useSettings()

    const [backgroundBlur, setBackgroundBlur] = useState(false)
    useEffect(() => {
        const appWindow = getCurrent()
        if (settings.enableBackgroundBlur) {
            //  TODO: It currently seems that the light/dark mode of the mica cannot be manually adjusted.
            // link: https://beta.tauri.app/references/v2/js/core/namespacewindow/#mica
            if (isMacOS) {
                appWindow.setEffects({ effects: [Effect.WindowBackground] })
            } else if (isWindows) {
                appWindow.setEffects({ effects: [Effect.Mica] })
            }
            setBackgroundBlur(true)
        } else {
            if (isMacOS || isWindows) {
                appWindow.clearEffects()
            }
            setBackgroundBlur(false)
        }
    }, [settings.enableBackgroundBlur, settings.themeType])

    useEffect(() => {
        if (!props.isTranslatorWindow) {
            return
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        commands.getTranslatorWindowAlwaysOnTop().then((pinned: any) => {
            return setPinned(() => pinned)
        })
    }, [props.isTranslatorWindow, setPinned])

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (settings?.i18n !== (i18n as any).language) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(i18n as any).changeLanguage(settings?.i18n)
        }
    }, [i18n, settings])

    const handlePin = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            const appWindow = getCurrent()
            setPinned((prev) => {
                const isPinned_ = !prev
                appWindow.setAlwaysOnTop(isPinned_)
                return isPinned_
            })
        },
        [setPinned]
    )

    let svgPathColor = theme.colors.contentSecondary

    if (props.windowsTitlebarDisableDarkMode) {
        svgPathColor = '#555'
    }

    return (
        <div
            style={{
                position: 'relative',
                background: backgroundBlur ? 'transparent' : theme.colors.backgroundPrimary,
                font: '14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
                minHeight: '100vh',
            }}
            onClick={(e) => {
                // if e.target is a
                if ((e.target as HTMLElement).tagName === 'A') {
                    const href = (e.target as HTMLAnchorElement).href
                    if (href && href.startsWith('http')) {
                        e.preventDefault()
                        e.stopPropagation()
                        open(href)
                    }
                }
            }}
        >
            {isMacOS && (
                <TitlebarContainer windowsTitlebarDisableDarkMode={props.windowsTitlebarDisableDarkMode}>
                    <div className={styles.titlebarButton} onClick={handlePin}>
                        <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 28 28'>
                            {pinned ? (
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
                </TitlebarContainer>
            )}
            {props.children}
        </div>
    )
}
