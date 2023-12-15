import useSWR from 'swr'

import { ISettings } from '../types'
import { getSettings } from '../utils'
import { useCallback } from 'react'

export function useSettings(): {
    settings: ISettings
    isSettingsLoading: boolean
    setSettings: (settings: ISettings) => void
} {
    const { data: settings, isLoading, mutate } = useSWR<ISettings>('settings', getSettings, { suspense: true })

    const setSettings = useCallback(
        (newSettings: ISettings) => {
            mutate(newSettings, {
                optimisticData: newSettings,
                revalidate: false,
            })
        },
        [mutate]
    )

    return {
        settings: settings!,
        isSettingsLoading: isLoading,
        setSettings,
    }
}
