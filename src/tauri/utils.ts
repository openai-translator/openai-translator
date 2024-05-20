import { isRegistered, register, unregister } from '@tauri-apps/plugin-global-shortcut'
import { invoke } from '@tauri-apps/api/core'
import { getSettings } from '@/common/utils'
import { sendNotification } from '@tauri-apps/plugin-notification'

const modifierKeys = [
    'OPTION',
    'ALT',
    'CONTROL',
    'CTRL',
    'COMMAND',
    'CMD',
    'SUPER',
    'SHIFT',
    'COMMANDORCONTROL',
    'COMMANDORCTRL',
    'CMDORCTRL',
    'CMDORCONTROL',
]

const isModifierKey = (key: string): boolean => {
    return modifierKeys.includes(key.toUpperCase())
}

export function isMissingNormalKey(hotkey: string): boolean {
    const tokens = hotkey.split('+').map((token) => token.trim().toUpperCase())
    return tokens.every((token) => isModifierKey(token))
}

export async function bindHotkey(oldHotKey?: string) {
    if (oldHotKey && !isMissingNormalKey(oldHotKey) && (await isRegistered(oldHotKey))) {
        await unregister(oldHotKey)
    }
    const settings = await getSettings()
    if (!settings.hotkey) return
    if (isMissingNormalKey(settings.hotkey)) {
        sendNotification({
            title: 'Cannot bind hotkey',
            body: `Hotkey must contain at least one normal key: ${settings.hotkey}`,
        })
        return
    }
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
    if (oldHotKey && !isMissingNormalKey(oldHotKey) && (await isRegistered(oldHotKey))) {
        await unregister(oldHotKey)
    }
    const settings = await getSettings()
    if (!settings.displayWindowHotkey) return
    if (isMissingNormalKey(settings.displayWindowHotkey)) {
        sendNotification({
            title: 'Cannot bind hotkey',
            body: `Hotkey must contain at least one normal key: ${settings.displayWindowHotkey}`,
        })
        return
    }
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
    if (oldOCRHotKey && !isMissingNormalKey(oldOCRHotKey) && (await isRegistered(oldOCRHotKey))) {
        await unregister(oldOCRHotKey)
    }
    const settings = await getSettings()
    if (!settings.ocrHotkey) return
    if (isMissingNormalKey(settings.ocrHotkey)) {
        sendNotification({
            title: 'Cannot bind hotkey',
            body: `Hotkey must contain at least one normal key: ${settings.ocrHotkey}`,
        })
        return
    }
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
    if (oldWritingHotKey && !isMissingNormalKey(oldWritingHotKey) && (await isRegistered(oldWritingHotKey))) {
        await unregister(oldWritingHotKey)
    }
    const settings = await getSettings()
    if (!settings.writingHotkey) return
    if (isMissingNormalKey(settings.writingHotkey)) {
        sendNotification({
            title: 'Cannot bind hotkey',
            body: `Hotkey must contain at least one normal key: ${settings.writingHotkey}`,
        })
        return
    }
    if (await isRegistered(settings.writingHotkey)) {
        await unregister(settings.writingHotkey)
    }
    await register(settings.writingHotkey, () => {
        invoke('writing_command')
    }).then(() => {
        console.log('writing hotkey registered')
    })
}
