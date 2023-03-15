import { isRegistered, register, unregister } from '@tauri-apps/api/globalShortcut'
import { invoke } from '@tauri-apps/api/tauri'
import { getSettings } from '../common/utils'

export async function bindHotkey(oldHotKey?: string) {
    if (oldHotKey && (await isRegistered(oldHotKey))) {
        await unregister(oldHotKey)
    }
    const settings = await getSettings()
    if (!settings.hotkey) return
    await register(settings.hotkey, () => {
        invoke('show_main_window_with_selected_text')
    })
}
