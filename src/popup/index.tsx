import React from 'react'
import { createRoot } from 'react-dom/client'
import { PopupCard } from '../content_script/PopupCard'
import { Client as Styletron } from 'styletron-engine-atomic'
import '../i18n.js'
import './index.css'

const engine = new Styletron({
    prefix: '__yetone-openai-translator-styletron-',
})

const root = createRoot(document.getElementById('root') as HTMLElement)

root.render(
    <React.StrictMode>
        <div
            className='popup'
            style={{
                position: 'relative',
            }}
        >
            <PopupCard showSettings defaultShowSettings text='' engine={engine} autoFocus />
        </div>
    </React.StrictMode>
)
