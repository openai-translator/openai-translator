import { useMemo } from 'react'
import { BaseThemeType } from '../types'
import { useThemeDetector } from './useThemeDetector'
import { useThemeType } from './useThemeType'

export const useCurrentThemeType = (): BaseThemeType => {
    const { themeType: themeTypeSetting } = useThemeType()

    const systemIsDark = useThemeDetector()

    const themeType = useMemo(() => {
        if (themeTypeSetting === 'followTheSystem') {
            return systemIsDark ? 'dark' : 'light'
        }
        return themeTypeSetting
    }, [themeTypeSetting, systemIsDark])
    return themeType
}
