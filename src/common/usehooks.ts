import { DependencyList, EffectCallback, useCallback, useEffect, useRef } from 'react'
import debounce from 'lodash.debounce'

export function useLazyEffect(effect: EffectCallback, deps: DependencyList = [], wait = 250) {
    const cleanUp = useRef<void | (() => void)>()
    const effectRef = useRef<EffectCallback>()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    effectRef.current = useCallback(effect, deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const lazyEffect = useCallback(
        debounce(() => {
            if (cleanUp.current instanceof Function) {
                cleanUp.current()
            }
            cleanUp.current = effectRef.current?.()
        }, wait),
        []
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(lazyEffect, deps)
    useEffect(() => {
        return () => (cleanUp.current instanceof Function ? cleanUp.current() : undefined)
    }, [])
}
