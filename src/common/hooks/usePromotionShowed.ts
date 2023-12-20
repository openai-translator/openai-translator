import { useCallback, useEffect, useState } from 'react'
import { useGlobalState } from './global'
import {
    IPromotionItem,
    isPromotionItemShowed,
    setPromotionItemShowed,
    unsetPromotionItemShowed,
} from '../services/promotion'

export function usePromotionShowed(item?: IPromotionItem) {
    const [promotionShowedMap, setPromotionShowedMap] = useGlobalState('promotionShowedMap')
    const [promotionShowed, setPromotionShowed_] = useState(promotionShowedMap[item?.id ?? ''] ?? false)

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

    useEffect(() => {
        if (!item?.id) {
            return
        }
        setPromotionShowedMap((map) => {
            return {
                ...map,
                [item.id]: promotionShowed,
            }
        })
    }, [item, promotionShowed, setPromotionShowedMap])

    return { promotionShowed, setPromotionShowed }
}
