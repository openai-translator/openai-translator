import { useEffect, useState } from 'react'
import { ThemeType } from '../types'
import { useSettings } from './useSettings'

export const useThemeType = () => {
    const [themeType, setThemeType] = useState<ThemeType>('followTheSystem')

    const { settings } = useSettings()

    useEffect(() => {
        if (settings?.themeType) {
            setThemeType(settings.themeType)
        }
    }, [settings])

    return {
        themeType,
        setThemeType,
    }
}
