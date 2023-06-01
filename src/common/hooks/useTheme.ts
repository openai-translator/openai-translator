import { DarkTheme, LightTheme } from 'baseui-sd/themes'
import { useCurrentThemeType } from './useCurrentThemeType'
import { useMemo } from 'react'

export const useTheme = () => {
    const themeType = useCurrentThemeType()
    const theme = useMemo(() => (themeType === 'light' ? LightTheme : DarkTheme), [themeType])
    return { theme, themeType }
}
