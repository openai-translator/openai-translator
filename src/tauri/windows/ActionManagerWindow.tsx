import { useEffect } from 'react'
import { ActionManager } from '../../common/components/ActionManager'
import { Window } from '../components/Window'
import { trackEvent } from '@aptabase/tauri'

export function ActionManagerWindow() {
    useEffect(() => {
        trackEvent('screen_view', { name: 'ActionManager' })
    }, [])

    return (
        <Window>
            <ActionManager />
        </Window>
    )
}
