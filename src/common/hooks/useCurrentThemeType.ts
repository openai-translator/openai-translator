import { useEffect, useState } from 'react'
import { BaseThemeType } from '../types'
import { useThemeDetector } from './useThemeDetector'
import { useThemeType } from './useThemeType'

export const useCurrentThemeType = (): BaseThemeType => {
    const { themeType: themeType_ } = useThemeType()

    const systemIsDark = useThemeDetector()

    const [themeType, setThemeType] = useState<BaseThemeType>(
        (() => {
            if (themeType_ === 'followTheSystem') {
                return systemIsDark ? 'dark' : 'light'
            }
            return themeType_
        })()
    )

    useEffect(() => {
        if (themeType_ === 'followTheSystem') {
            if (systemIsDark) {
                setThemeType('dark')
            } else {
                setThemeType('light')
            }
        } else {
            setThemeType(themeType_)
        }
    }, [themeType_, systemIsDark])

    return themeType
}
