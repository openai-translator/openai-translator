import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Window } from './Window'
import { Update, check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { Button } from 'baseui-sd/button'
import { invoke } from '@tauri-apps/api/primitives'
import { useTheme } from '../common/hooks/useTheme'
import monkey from '../common/assets/images/monkey.gif'
import icon from '../common/assets/images/icon.png'
import { getAssetUrl } from '../common/utils'
import { ProgressBarRounded } from 'baseui-sd/progress-bar'
import { createUseStyles } from 'react-jss'
import { MdBrowserUpdated } from 'react-icons/md'
import { IoIosCloseCircleOutline } from 'react-icons/io'

const useStyles = createUseStyles({
    icon: {
        'display': 'block',
        'width': '20px',
        'height': '20px',
        '-ms-user-select': 'none',
        '-webkit-user-select': 'none',
        'user-select': 'none',
        'pointerEvents': 'none',
    },
})

export function UpdaterWindow() {
    const styles = useStyles()
    const [isChecking, setIsChecking] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [checkResult, setCheckResult] = useState<Update | null>(null)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        setIsChecking(true)
        check()
            .then((result) => {
                setCheckResult(result)
            })
            .finally(() => {
                setIsChecking(false)
            })
    }, [])

    const { theme, themeType } = useTheme()

    return (
        <Window>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100vh',
                }}
            >
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        background: themeType === 'dark' ? 'rgba(31, 31, 31, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                        borderBottom: `1px solid ${theme.colors.borderTransparent}`,
                        backdropFilter: 'blur(10px)',
                        gap: '10px',
                        zIndex: 1,
                    }}
                >
                    <img data-tauri-drag-region className={styles.icon} src={getAssetUrl(icon)} />
                    OpenAI Translator Updater
                </div>
                <div
                    style={{
                        height: '80px',
                        width: '100%',
                        flexShrink: 0,
                    }}
                />
                <div
                    style={{
                        flexGrow: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        padding: '0px 20px 20px 20px',
                    }}
                >
                    {isChecking && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '10px',
                            }}
                        >
                            <img src={getAssetUrl(monkey)} width='40px' />
                            Checking for the latest version ...
                        </div>
                    )}
                    {!isChecking && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '16px',
                                    lineHeight: '1.6',
                                }}
                            >
                                {!checkResult ? (
                                    <div>Congratulations! You are now using the latest version!</div>
                                ) : (
                                    <div>
                                        <p>
                                            <span
                                                style={{
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                A new version is available!
                                            </span>{' '}
                                            The current version is <span>{checkResult.currentVersion}</span>, and the
                                            latest version is{' '}
                                            <span
                                                style={{
                                                    color: theme.colors.positive,
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {checkResult.version}
                                            </span>
                                            .
                                        </p>
                                        <p>The release content:</p>
                                    </div>
                                )}
                            </div>
                            {checkResult && checkResult.body && (
                                <ul
                                    style={{
                                        fontSize: '16px',
                                        lineHeight: '1.8',
                                        listStyleType: 'square',
                                        margin: '0px',
                                        marginLeft: '40px',
                                        padding: '0px',
                                    }}
                                >
                                    {checkResult.body
                                        .split('\n')
                                        .filter((line) => !!line.trim())
                                        .map((line, idx) => {
                                            return <li key={idx}>{line}</li>
                                        })}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
                <div
                    style={{
                        height: '77px',
                        width: '100%',
                        flexShrink: 0,
                    }}
                />
                <div
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        right: 0,
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        background: themeType === 'dark' ? 'rgba(31, 31, 31, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                        borderTop: `1px solid ${theme.colors.borderTransparent}`,
                        backdropFilter: 'blur(10px)',
                        padding: '20px',
                        zIndex: 1,
                    }}
                >
                    <div
                        style={{
                            flexGrow: 1,
                        }}
                    />
                    <div
                        style={{
                            display: 'flex',
                            flexShrink: 0,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '20px',
                        }}
                    >
                        <Button
                            size='compact'
                            kind='secondary'
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                invoke('close_updater_window')
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                <IoIosCloseCircleOutline size={12} />
                                Close
                            </div>
                        </Button>
                        {checkResult &&
                            (isDownloading ? (
                                <ProgressBarRounded progress={progress} />
                            ) : (
                                <Button
                                    size='compact'
                                    onClick={async (e) => {
                                        e.stopPropagation()
                                        e.preventDefault()
                                        setIsDownloading(true)
                                        try {
                                            const id = window.setInterval(() => {
                                                setProgress((progress) => {
                                                    const v = progress + 0.1
                                                    if (v >= 1) {
                                                        window.clearInterval(id)
                                                        return 0.9
                                                    }
                                                    return v
                                                })
                                            }, 1000)
                                            const update = await check()
                                            await update?.downloadAndInstall((progress) => {
                                                if (progress.event === 'Finished') {
                                                    window.clearInterval(id)
                                                    setProgress(1)
                                                }
                                            })
                                            await relaunch()
                                        } finally {
                                            setIsDownloading(false)
                                        }
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: '6px',
                                        }}
                                    >
                                        <MdBrowserUpdated size={12} />
                                        Upgrade
                                    </div>
                                </Button>
                            ))}
                    </div>
                </div>
            </div>
        </Window>
    )
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById('root')!)

root.render(<UpdaterWindow />)
