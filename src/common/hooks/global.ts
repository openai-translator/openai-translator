import { createGlobalState } from 'react-hooks-global-state'
import { ThemeType } from '../types'

const initialState = {
    collectedWordTotal: 0,
    themeType: 'light' as ThemeType,
    promotionShowed: true,
}
export const { useGlobalState } = createGlobalState(initialState)
