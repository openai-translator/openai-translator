import React from 'react'
import { createRoot } from 'react-dom/client'
import { PopupCard } from '../content_script/PopupCard'
import { Client as Styletron } from 'styletron-engine-atomic'
import '../i18n.js'

const engine = new Styletron({
    prefix: '__yetone-openai-translator-styletron-',
})

const root = createRoot(document.getElementById('root') as HTMLElement)

root.render(
    <React.StrictMode>
        <div
            style={{
                position: 'relative',
                minHeight: '100vh',
            }}
        >
            <PopupCard showSettings defaultShowSettings text='' engine={engine} autoFocus />
        </div>
    </React.StrictMode>
)
