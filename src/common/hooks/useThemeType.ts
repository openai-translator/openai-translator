import { useEffect, useState } from 'react'
import { ThemeType } from '../types'
import { getSettings, setSettings } from '../utils'

export const useThemeType = () => {
    const [themeType, setThemeType_] = useState<ThemeType>('followTheSystem')

    const setThemeType = async (themeType_: ThemeType) => {
        await setSettings({ themeType: themeType_ })
        setThemeType_(themeType_)
    }

    useEffect(() => {
        ;(async () => {
            const settings = await getSettings()
            if (settings.themeType) {
                setThemeType_(settings.themeType)
            }
        })()
    }, [setThemeType_])

    return {
        themeType,
        setThemeType,
    }
}
