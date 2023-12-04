import { createRoot } from 'react-dom/client'
import { InnerSettings } from '../common/components/Settings'
import { Window } from './Window'

export function SettingsWindow() {
    return (
        <Window windowsTitlebarDisableDarkMode>
            <InnerSettings showFooter />
        </Window>
    )
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById('root')!)

root.render(<SettingsWindow />)
