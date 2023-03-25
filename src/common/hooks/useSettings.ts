import { useEffect, useState } from 'react'
import { ISettings } from '../types'
import { getSettings } from '../utils'

export function useSettings() {
    const [settings, setSettings] = useState<ISettings>()

    useEffect(() => {
        ;(async () => {
            const settings = await getSettings()
            setSettings(settings)
        })()
    }, [])

    return {
        settings,
        setSettings,
    }
}
