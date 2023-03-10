import React, { useEffect, useRef } from 'react'
import { PopupCard } from '../content_script/PopupCard'
import { Client as Styletron } from 'styletron-engine-atomic'
import { appWindow } from '@tauri-apps/api/window'

const engine = new Styletron({
    prefix: '__yetone-openai-translator-styletron-',
})

export function App() {
    const isMacOS = navigator.userAgent.includes('Mac OS X')
    const isLinux = navigator.userAgent.includes('Linux')
    const minimizeIconRef = useRef<HTMLDivElement>(null)
    const maximizeIconRef = useRef<HTMLDivElement>(null)
    const closeIconRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isMacOS || isLinux) {
            return
        }
        function handleMinimize() {
            appWindow.minimize()
        }
        function handleMaximize() {
            appWindow.maximize()
        }
        function handleClose() {
            appWindow.close()
        }
        minimizeIconRef.current?.addEventListener('click', handleMinimize)
        maximizeIconRef.current?.addEventListener('click', handleMaximize)
        closeIconRef.current?.addEventListener('click', handleClose)
        return () => {
            minimizeIconRef.current?.removeEventListener('click', handleMinimize)
            maximizeIconRef.current?.removeEventListener('click', handleMaximize)
            closeIconRef.current?.removeEventListener('click', handleClose)
        }
    }, [])

    return (
        <div
            style={{
                font: '14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
                height: '100%',
            }}
        >
            <div className='titlebar' data-tauri-drag-region>
                {!isMacOS && !isLinux && (
                    <>
                        <div className='titlebar-button' id='titlebar-minimize' ref={minimizeIconRef}>
                            <img src='https://api.iconify.design/mdi:window-minimize.svg' alt='minimize' />
                        </div>
                        <div className='titlebar-button' id='titlebar-maximize' ref={maximizeIconRef}>
                            <img src='https://api.iconify.design/mdi:window-maximize.svg' alt='maximize' />
                        </div>
                        <div className='titlebar-button' id='titlebar-close' ref={closeIconRef}>
                            <img src='https://api.iconify.design/mdi:close.svg' alt='close' />
                        </div>
                    </>
                )}
            </div>
            <PopupCard
                text=''
                engine={engine}
                showSettings
                autoFocus
                defaultShowSettings
                editorRows={10}
                containerStyle={isLinux ? undefined : { paddingTop: '20px' }}
            />
        </div>
    )
}
