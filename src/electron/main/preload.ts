/* eslint-disable @typescript-eslint/no-explicit-any */
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    storeGets: (keys: string[]) => ipcRenderer.invoke('store:gets', keys),
    storeSets: (obj: Record<string, any>) => ipcRenderer.invoke('store:sets', obj),
})
