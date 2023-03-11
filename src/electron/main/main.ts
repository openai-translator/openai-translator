/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as path from 'path'
import { format } from 'url'
import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import { is } from 'electron-util'
import Store from 'electron-store'
import { IpcMainInvokeEvent } from 'electron/main'

const store = new Store()

async function storeGets(_event: IpcMainInvokeEvent, keys: string[]): Promise<Record<string, any>> {
    return keys.reduce((acc, key) => {
        return { ...acc, [key]: store.get(key) }
    }, {})
}

async function storeSets(_event: IpcMainInvokeEvent, obj: Record<string, any>): Promise<void> {
    store.set(obj)
}

let win: BrowserWindow | null = null

async function createWindow() {
    win = new BrowserWindow({
        width: 600,
        height: 800,
        minHeight: 600,
        minWidth: 560,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        show: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: true,
    })

    const isDev = is.development

    if (isDev) {
        // this is the default port electron-esbuild is using
        win.loadURL('http://localhost:9080')
    } else {
        win.loadURL(
            format({
                pathname: path.join(__dirname, 'index.html'),
                protocol: 'file',
                slashes: true,
            })
        )
    }

    win.on('closed', () => {
        win = null
    })

    win.webContents.on('devtools-opened', () => {
        win!.focus()
    })

    win.on('ready-to-show', () => {
        win!.show()
        win!.focus()

        if (isDev) {
            win!.webContents.openDevTools({ mode: 'bottom' })
        }
    })
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

app.on('ready', () => {
    ipcMain.handle('store:gets', storeGets)
    ipcMain.handle('store:sets', storeSets)
    createWindow()
})

app.on('window-all-closed', () => {
    if (!is.macos) {
        app.quit()
    }
})

app.on('activate', () => {
    if (win === null && app.isReady()) {
        createWindow()
    }
})

const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Archivo',
      submenu: [
        { role: 'quit' },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
      ],
    },
    
    {
      label: 'Ayuda',
      submenu: [
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'Página del proyecto en Github',
          click: async () => {
            const { shell } = require('electron')
            await shell.openExternal('https://github.com/raulgonzalezdev/openai-translator')
          }
        },
        {
          label: 'Mostrar README',
          click: async () => {
            const { shell } = require('electron')
            await shell.openExternal('https://github.com/raulgonzalezdev/openai-translator/blob/main/README.md')
          }
        }
      ],
    },
  ];
  
