/* eslint-disable @typescript-eslint/no-explicit-any */
import { event } from '@tauri-apps/api'
import { getCurrent } from '@tauri-apps/api/window'
import { restoreStateCurrent, saveWindowState, StateFlags } from '@tauri-apps/plugin-window-state'
import { useEffect } from 'react'

export type WindowMemoProps = {
    size: boolean
    position: boolean
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
                    restoreStateCurrent(StateFlags.POSITION)
                }
                if (props.size) {
                    restoreStateCurrent(StateFlags.SIZE)
                }
            } catch (e) {
                console.error(e)
            } finally {
                await appWindow.unminimize()
                await appWindow.setFocus()
                await appWindow.show()
            }
        }
        initWindow()
    }, [props.position, props.size])

    useEffect(() => {
        let unListenMove: (() => void) | undefined
        let unListenResize: (() => void) | undefined
        event
            .listen(event.TauriEvent.WINDOW_MOVED, () => {
                saveWindowState(StateFlags.ALL)
            })
            .then((unListen) => {
                unListenMove = unListen
            })
        event
            .listen(event.TauriEvent.WINDOW_RESIZED, () => {
                saveWindowState(StateFlags.ALL)
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
