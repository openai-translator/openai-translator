import { useCallback, useEffect, useState } from 'react'
import { useGlobalState } from './global'
import {
    IPromotionItem,
    isPromotionItemNeverDisplay,
    setPromotionItemNeverDisplay,
    unsetPromotionItemNeverDisplay,
} from '../services/promotion'

export function usePromotionNeverDisplay(item?: IPromotionItem) {
    const [promotionNeverDisplayMap, setPromotionNeverDisplayMap] = useGlobalState('promotionNeverDisplayMap')
    const [promotionNeverDisplay, setPromotionNeverDisplay_] = useState(
        promotionNeverDisplayMap[item?.id ?? ''] ?? false
    )

    const setPromotionNeverDisplay = useCallback(
        (showed: boolean) => {
            if (showed) {
                setPromotionItemNeverDisplay(item)
            } else {
                unsetPromotionItemNeverDisplay(item)
            }
            setPromotionNeverDisplay_(showed)
        },
        [item, setPromotionNeverDisplay_]
    )

    useEffect(() => {
        isPromotionItemNeverDisplay(item).then((showed) => {
            setPromotionNeverDisplay_(showed)
        })
    }, [item, setPromotionNeverDisplay_])

    useEffect(() => {
        if (!item?.id) {
            return
        }
        setPromotionNeverDisplayMap((map) => {
            return {
                ...map,
                [item.id]: promotionNeverDisplay,
            }
        })
    }, [item, promotionNeverDisplay, setPromotionNeverDisplayMap])

    return { promotionNeverDisplay, setPromotionNeverDisplay }
}
