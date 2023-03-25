import { useEffect, useState } from 'react'
import { ThemeType } from '../types'
import { getSettings } from '../utils'

export const useThemeType = () => {
    const [themeType, setThemeType] = useState<ThemeType>('followTheSystem')

    useEffect(() => {
        ;(async () => {
            const settings = await getSettings()
            if (settings.themeType) {
                setThemeType(settings.themeType)
            }
        })()
    }, [])

    return {
        themeType,
        setThemeType,
    }
}
