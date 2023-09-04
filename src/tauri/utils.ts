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

export async function bindOCRHotkey(oldOCRHotKey?: string) {
    if (oldOCRHotKey && (await isRegistered(oldOCRHotKey))) {
        await unregister(oldOCRHotKey)
    }
    const settings = await getSettings()
    if (!settings.ocrHotkey) return
    await register(settings.ocrHotkey, () => {
        invoke('ocr')
    })
}

export async function bindWritingHotkey(oldWritingHotKey?: string) {
    if (oldWritingHotKey && (await isRegistered(oldWritingHotKey))) {
        await unregister(oldWritingHotKey)
    }
    const settings = await getSettings()
    if (!settings.writingHotkey) return
    await register(settings.writingHotkey, () => {
        invoke('writing')
    })
}
