import { useCallback, useEffect } from 'react'
import { isTauri } from '../utils'
import { useGlobalState } from './global'
import { listen, Event, emit } from '@tauri-apps/api/event'

export function usePinned() {
    const [pinned, setPinned_] = useGlobalState('pinned')

    useEffect(() => {
        if (!isTauri()) {
            return
        }
        let unlisten: () => void | undefined
        listen('pinned-from-tray', (event: Event<{ pinned: boolean }>) => {
            setPinned_(event.payload.pinned)
        }).then((unlistenFn) => {
            unlisten = unlistenFn
        })
        return () => {
            unlisten?.()
        }
    }, [setPinned_])

    const setPinned = useCallback(
        (cb: (p: boolean) => boolean) => {
            setPinned_((prev) => {
                const next = cb(prev)
                if (!isTauri()) {
                    return next
                }
                emit('pinned-from-window', { pinned: next })
                return next
            })
        },
        [setPinned_]
    )

    return { pinned, setPinned }
}
