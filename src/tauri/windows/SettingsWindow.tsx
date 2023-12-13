import { InnerSettings } from '../../common/components/Settings'
import { Window } from '../components/Window'

export function SettingsWindow() {
    return (
        <Window windowsTitlebarDisableDarkMode>
            <InnerSettings showFooter />
        </Window>
    )
}
