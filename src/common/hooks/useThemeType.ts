import useSWR from 'swr'
import { getSettings } from '../utils'

export const useThemeType = () => {
    const { data: themeType, mutate: refreshThemeType } = useSWR(
        'themeType',
        async () => {
            const settings = await getSettings()
            return settings.themeType
        },
        { suspense: true }
    )

    return {
        themeType: themeType ?? 'light',
        refreshThemeType,
    }
}
