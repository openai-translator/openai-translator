import { DarkTheme, LightTheme } from 'baseui-sd/themes'
import { useEffect, useState } from 'react'
import { useCurrentThemeType } from './useCurrentThemeType'

export const useTheme = () => {
    const themeType = useCurrentThemeType()
    const [theme, setTheme] = useState(themeType === 'light' ? LightTheme : DarkTheme)

    useEffect(() => {
        setTheme(themeType === 'light' ? LightTheme : DarkTheme)
    }, [themeType])

    return { theme, themeType }
}
