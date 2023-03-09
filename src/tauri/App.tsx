import React from 'react'
import { PopupCard } from '../content_script/PopupCard'
import { Client as Styletron } from 'styletron-engine-atomic'

const engine = new Styletron({
    prefix: '__yetone-openai-translator-styletron-',
})

export function App() {
    const isWindows = navigator.userAgent.indexOf('Windows') !== -1

    return (
        <div
            style={{
                font: '14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
                height: '100%',
            }}
        >
            <div className='draggable' data-tauri-drag-region />
            <PopupCard
                text=''
                engine={engine}
                showSettings
                autoFocus
                defaultShowSettings
                containerStyle={{
                    paddingTop: isWindows ? '30px' : '20px',
                }}
            />
        </div>
    )
}
