import { DarkTheme, LightTheme } from 'baseui/themes'
import { useCurrentThemeType } from './useCurrentThemeType'

export const useTheme = () => {
    const themeType = useCurrentThemeType()
    const theme = themeType === 'light' ? LightTheme : DarkTheme
    return { theme, themeType }
}
