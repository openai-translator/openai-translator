import { DarkTheme, LightTheme } from 'baseui-sd/themes'
import { useCurrentThemeType } from './useCurrentThemeType'

export const useTheme = () => {
    const themeType = useCurrentThemeType()
    const theme = themeType === 'light' ? LightTheme : DarkTheme
    return { theme, themeType }
}
