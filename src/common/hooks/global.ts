import { createGlobalState } from 'react-hooks-global-state'
import { ThemeType } from '../types'

const initialState = {
    collectedWordTotal: 0,
    themeType: 'light' as ThemeType,
    promotionShowedMap: {} as Record<string, boolean>,
    promotionNeverDisplayMap: {} as Record<string, boolean>,
    pinned: false,
}

export const { useGlobalState } = createGlobalState(initialState)
