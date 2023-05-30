import { useEffect } from 'react'
import { useGlobalState } from './global'
import { useSettings } from './useSettings'

export const useThemeType = () => {
    const [themeType, setThemeType] = useGlobalState('themeType')

    const { settings } = useSettings()

    useEffect(() => {
        if (settings?.themeType) {
            setThemeType(settings.themeType)
        }
    }, [setThemeType, settings?.themeType])

    return {
        themeType,
        setThemeType,
    }
}
