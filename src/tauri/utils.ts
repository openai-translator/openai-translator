import { isRegistered, register, unregister } from '@tauri-apps/plugin-global-shortcut'
import { invoke } from '@tauri-apps/api/core'
import { getSettings } from '../common/utils'

export async function bindHotkey(oldHotKey?: string) {
    if (oldHotKey && (await isRegistered(oldHotKey))) {
        await unregister(oldHotKey)
    }
    const settings = await getSettings()
    if (!settings.hotkey) return
    if (await isRegistered(settings.hotkey)) {
        await unregister(settings.hotkey)
    }
    await register(settings.hotkey, () => {
        invoke('show_translator_window_with_selected_text_command')
    }).then(() => {
        console.log('register hotkey success')
    })
}

export async function bindDisplayWindowHotkey(oldHotKey?: string) {
    if (oldHotKey && (await isRegistered(oldHotKey))) {
        await unregister(oldHotKey)
    }
    const settings = await getSettings()
    if (!settings.displayWindowHotkey) return
    if (await isRegistered(settings.displayWindowHotkey)) {
        await unregister(settings.displayWindowHotkey)
    }
    await register(settings.displayWindowHotkey, () => {
        invoke('show_translator_window_command')
    }).then(() => {
        console.log('register display window hotkey success')
    })
}

export async function bindOCRHotkey(oldOCRHotKey?: string) {
    if (oldOCRHotKey && (await isRegistered(oldOCRHotKey))) {
        await unregister(oldOCRHotKey)
    }
    const settings = await getSettings()
    if (!settings.ocrHotkey) return
    if (await isRegistered(settings.ocrHotkey)) {
        await unregister(settings.ocrHotkey)
    }
    await register(settings.ocrHotkey, () => {
        invoke('ocr_command')
    }).then(() => {
        console.log('OCR hotkey registered')
    })
}

export async function bindWritingHotkey(oldWritingHotKey?: string) {
    if (oldWritingHotKey && (await isRegistered(oldWritingHotKey))) {
        await unregister(oldWritingHotKey)
    }
    const settings = await getSettings()
    if (!settings.writingHotkey) return
    if (await isRegistered(settings.writingHotkey)) {
        await unregister(settings.writingHotkey)
    }
    await register(settings.writingHotkey, () => {
        invoke('writing_command')
    }).then(() => {
        console.log('writing hotkey registered')
    })
}
