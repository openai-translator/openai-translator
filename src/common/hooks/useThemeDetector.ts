import { useCallback, useEffect, useState } from 'react'

export const useThemeDetector = () => {
    const getCurrentTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches
    const [isDarkTheme, setIsDarkTheme] = useState(getCurrentTheme)
    const mqListener = useCallback((e: { matches: boolean | ((prevState: boolean) => boolean) }) => {
        setIsDarkTheme(e.matches)
    }, [])

    useEffect(() => {
        const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)')
        if (typeof darkThemeMq.addEventListener === 'function') {
            darkThemeMq.addEventListener('change', mqListener)
            return () => darkThemeMq.removeEventListener('change', mqListener)
        }
    }, [mqListener])

    return isDarkTheme
}
