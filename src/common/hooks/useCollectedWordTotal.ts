import { useEffect } from 'react'
import { LocalDB } from '../db'
import { useGlobalState } from './global'

export function useCollectedWordTotal() {
    const [collectedWordTotal, setCollectedWordTotal] = useGlobalState('collectedWordTotal')

    useEffect(() => {
        LocalDB.vocabulary.count().then(setCollectedWordTotal)
    }, [])

    return { collectedWordTotal, setCollectedWordTotal }
}
