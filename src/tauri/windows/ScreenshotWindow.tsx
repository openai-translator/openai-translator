import { trackEvent } from '@aptabase/tauri'
import { appCacheDir, join } from '@tauri-apps/api/path'
import { convertFileSrc } from '@tauri-apps/api/core'
import { getCurrent } from '@tauri-apps/api/webviewWindow'
import { currentMonitor } from '@tauri-apps/api/window'
import { useEffect, useRef, useState } from 'react'
import { createUseStyles } from 'react-jss'
import { commands } from '../bindings'

const useStyles = createUseStyles({
    selectNone: {
        'user-select': 'none',
        '-webkit-user-select': 'none',
        '-moz-user-select': 'none',
    },
})

export function ScreenshotWindow() {
    const styles = useStyles()
    const [imgURL, setImgURL] = useState<string>('')
    const [isMoved, setIsMoved] = useState(false)
    const [isDown, setIsDown] = useState(false)
    const [mouseDownX, setMouseDownX] = useState(0)
    const [mouseDownY, setMouseDownY] = useState(0)
    const [mouseMoveX, setMouseMoveX] = useState(0)
    const [mouseMoveY, setMouseMoveY] = useState(0)
    const imgRef = useRef<HTMLImageElement>(null)
    const appWindow = getCurrent()

    useEffect(() => {
        trackEvent('screen_view', { name: 'Screenshot' })
    }, [])

    useEffect(() => {
        currentMonitor().then((monitor) => {
            if (!monitor) {
                return
            }

            const position = monitor.position

            commands.screenshot(position.x, position.y).then(() => {
                appCacheDir().then((dir) => {
                    join(dir, 'ocr_images', 'fullscreen.png').then((path) => {
                        setImgURL(convertFileSrc(path))
                    })
                })
            })
        })
    }, [])

    return (
        <>
            <img
                ref={imgRef}
                className={styles.selectNone}
                src={imgURL}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                }}
                onLoad={() => {
                    if (imgURL !== '' && imgRef.current?.complete) {
                        void appWindow.show()
                        void appWindow.setFocus()
                        void appWindow.setResizable(false)
                    }
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    border: '1px solid #2080f0',
                    backgroundColor: '#2080f020',
                    visibility: isMoved ? 'visible' : 'hidden',
                    top: Math.min(mouseDownY, mouseMoveY),
                    left: Math.min(mouseDownX, mouseMoveX),
                    bottom: screen.height - Math.max(mouseDownY, mouseMoveY),
                    right: screen.width - Math.max(mouseDownX, mouseMoveX),
                }}
            />
            <div
                className={styles.selectNone}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    cursor: 'crosshair',
                }}
                onMouseDown={async (e) => {
                    if (e.buttons === 1) {
                        setIsDown(true)
                        setMouseDownX(e.clientX)
                        setMouseDownY(e.clientY)
                    } else {
                        await appWindow.close()
                    }
                }}
                onMouseMove={(e) => {
                    if (isDown) {
                        setIsMoved(true)
                        setMouseMoveX(e.clientX)
                        setMouseMoveY(e.clientY)
                    }
                }}
                onMouseUp={async (e) => {
                    appWindow.hide()
                    setIsDown(false)
                    setIsMoved(false)
                    if (!imgRef.current) {
                        return
                    }
                    const imgWidth = imgRef.current.naturalWidth
                    const dpi = imgWidth / screen.width
                    const left = Math.floor(Math.min(mouseDownX, e.clientX) * dpi)
                    const top = Math.floor(Math.min(mouseDownY, e.clientY) * dpi)
                    const right = Math.floor(Math.max(mouseDownX, e.clientX) * dpi)
                    const bottom = Math.floor(Math.max(mouseDownY, e.clientY) * dpi)
                    const width = right - left
                    const height = bottom - top
                    if (width <= 0 || height <= 0) {
                        await appWindow.close()
                    } else {
                        await commands.cutImage(left, top, width, height)
                        await commands.finishOcr()
                        await appWindow.close()
                    }
                }}
            />
        </>
    )
}
