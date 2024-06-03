import { useCallback, useEffect } from 'react'
import { isTauri } from '../utils'
import { useGlobalState } from './global'
import { events } from '@/tauri/bindings'

export function usePinned() {
    const [pinned, setPinned_] = useGlobalState('pinned')

    useEffect(() => {
        if (!isTauri()) {
            return
        }
        let unlisten: () => void | undefined
        events.pinnedFromTrayEvent
            .listen((event) => {
                setPinned_(event.payload.pinned)
            })
            .then((unlistenFn) => {
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
                events.pinnedFromWindowEvent.emit({ pinned: next })
                return next
            })
        },
        [setPinned_]
    )

    return { pinned, setPinned }
}
