/* eslint-disable @typescript-eslint/no-explicit-any */
import { event } from '@tauri-apps/api'
import { saveWindowState, StateFlags } from '@tauri-apps/plugin-window-state'
import { useEffect } from 'react'
import _ from 'underscore'

export const useMemoWindow = () => {
    useEffect(() => {
        let unListenMove: (() => void) | undefined
        let unListenResize: (() => void) | undefined
        const cb = _.debounce(() => {
            saveWindowState(StateFlags.ALL)
        }, 3000)
        event.listen(event.TauriEvent.WINDOW_MOVED, cb).then((unListen) => {
            unListenMove = unListen
        })
        event.listen(event.TauriEvent.WINDOW_RESIZED, cb).then((unListen) => {
            unListenResize = unListen
        })
        return () => {
            unListenMove?.()
            unListenResize?.()
        }
    }, [])
}
