import { useEffect } from 'react'
import { vocabularyService } from '../services/vocabulary'
import { useGlobalState } from './global'

export function useCollectedWordTotal() {
    const [collectedWordTotal, setCollectedWordTotal] = useGlobalState('collectedWordTotal')

    useEffect(() => {
        vocabularyService.countItems().then(setCollectedWordTotal)
    }, [setCollectedWordTotal])

    return { collectedWordTotal, setCollectedWordTotal }
}
