import { useCallback, useEffect } from 'react'
import { useGlobalState } from './global'
import {
    IPromotionItem,
    isPromotionItemShowed,
    setPromotionItemShowed,
    unsetPromotionItemShowed,
} from '../services/promotion'

export function usePromotionShowed(item?: IPromotionItem) {
    const [promotionShowed, setPromotionShowed_] = useGlobalState('promotionShowed')

    const setPromotionShowed = useCallback(
        (showed: boolean) => {
            if (showed) {
                setPromotionItemShowed(item)
            } else {
                unsetPromotionItemShowed(item)
            }
            setPromotionShowed_(showed)
        },
        [item, setPromotionShowed_]
    )

    useEffect(() => {
        isPromotionItemShowed(item).then((showed) => {
            setPromotionShowed_(showed)
        })
    }, [item, setPromotionShowed_])

    return { promotionShowed, setPromotionShowed }
}
