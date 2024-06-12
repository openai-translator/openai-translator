/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCurrent } from '@tauri-apps/api/webviewWindow'
import { PhysicalPosition, PhysicalSize } from '@tauri-apps/api/window'
import { useEffect } from 'react'

const positionKey = '_position'
const sizeKey = '_size'

export type WindowMemoProps = {
    size: boolean
    position: boolean
    show: boolean
}

/**
 * memorized window props
 */
export const useMemoWindow = (props: WindowMemoProps) => {
    useEffect(() => {
        const appWindow = getCurrent()
        const initWindow = async () => {
            try {
                if (props.position) {
                    const storagePosition = localStorage.getItem(positionKey)
                    if (storagePosition) {
                        const { x, y } = JSON.parse(storagePosition)
                        if (x < 0 || y < 0) {
                            await appWindow.center()
                        } else {
                            await appWindow.setPosition(new PhysicalPosition(x, y))
                        }
                    } else {
                        await appWindow.center()
                    }
                } else {
                    localStorage.removeItem(positionKey)
                }
                if (props.size) {
                    const storageSize = localStorage.getItem(sizeKey)
                    if (storageSize) {
                        let { height, width } = JSON.parse(storageSize)
                        height = Math.max(height, 800)
                        width = Math.max(width, 600)
                        await appWindow.setSize(new PhysicalSize(width, height))
                    }
                } else {
                    localStorage.removeItem(sizeKey)
                }
            } catch (e) {
                console.error(e)
            } finally {
                if (props.show) {
                    await appWindow.unminimize()
                    await appWindow.setFocus()
                    await appWindow.show()
                }
            }
        }
        initWindow()
    }, [props.position, props.size, props.show])

    useEffect(() => {
        const appWindow = getCurrent()
        let unListenMove: (() => void) | undefined
        let unListenResize: (() => void) | undefined
        appWindow
            .onMoved((event) => {
                localStorage.setItem(positionKey, JSON.stringify(event.payload))
            })
            .then((unListen) => {
                unListenMove = unListen
            })
        appWindow
            .onResized((event) => {
                localStorage.setItem(sizeKey, JSON.stringify(event.payload))
            })
            .then((unListen) => {
                unListenResize = unListen
            })
        return () => {
            unListenMove?.()
            unListenResize?.()
        }
    }, [])
}
