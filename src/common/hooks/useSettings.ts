import useSWR from 'swr'

import { ISettings } from '../types'
import { getSettings, setSettings as saveSettings } from '../utils'
import { useCallback } from 'react'

export function useSettings() {
    const { data: settings, mutate } = useSWR<ISettings>(['settings', getSettings], getSettings, { suspense: true })

    const setSettings = useCallback(
        async (newSettings: ISettings) => {
            await saveSettings(newSettings)
            mutate(newSettings, {
                optimisticData: newSettings,
            })
        },
        [mutate]
    )

    return {
        settings,
        setSettings,
    }
}
