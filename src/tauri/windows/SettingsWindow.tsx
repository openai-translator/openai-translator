import { InnerSettings } from '../../common/components/Settings'
import { Window } from '../components/Window'
import { onSettingsSave } from '../utils'

export function SettingsWindow() {
    return (
        <Window windowsTitlebarDisableDarkMode>
            <InnerSettings showFooter onSave={onSettingsSave} />
        </Window>
    )
}
