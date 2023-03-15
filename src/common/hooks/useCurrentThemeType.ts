import { BaseThemeType } from '../types'
import { useThemeDetector } from './useThemeDetector'
import { useThemeType } from './useThemeType'

export const useCurrentThemeType = (): BaseThemeType => {
    const { themeType } = useThemeType()

    const systemIsDark = useThemeDetector()

    if (themeType === 'followTheSystem') {
        if (systemIsDark) {
            return 'dark'
        }
        return 'light'
    }

    return themeType
}
