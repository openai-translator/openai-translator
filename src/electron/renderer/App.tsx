import React from 'react'
import { PopupCard } from '../../content_script/PopupCard'
import { Client as Styletron } from 'styletron-engine-atomic'

const engine = new Styletron({
    prefix: '__yetone-openai-translator-styletron-',
})

export function App() {
    return (
        <div
            style={{
                font: '14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
                height: '100%',
            }}
        >
            <div className='draggable' />
            <PopupCard
                text=''
                engine={engine}
                showSettings
                autoFocus
                defaultShowSettings
                containerStyle={{
                    paddingTop: '20px',
                }}
            />
        </div>
    )
}
