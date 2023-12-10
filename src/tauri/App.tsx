/* eslint-disable camelcase */
import React from 'react'
import { getCurrent } from '@tauri-apps/api/window'
import { TranslatorWindow } from './windows/TranslatorWindow'
import { SettingsWindow } from './windows/SettingsWindow'
import { ActionManagerWindow } from './windows/ActionManagerWindow'
import { ThumbWindow } from './windows/ThumbWindow'
import { UpdaterWindow } from './windows/UpdaterWindow'

const windowsMap: Record<string, typeof TranslatorWindow> = {
    translator: TranslatorWindow,
    action_manager: ActionManagerWindow,
    settings: SettingsWindow,
    thumb: ThumbWindow,
    updater: UpdaterWindow,
}

export function App() {
    const appWindow = getCurrent()
    return <>{windowsMap[appWindow.label]()}</>
}
