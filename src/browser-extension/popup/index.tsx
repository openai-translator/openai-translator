import React from 'react'
import { createRoot } from 'react-dom/client'
import { Translator } from '../../common/components/Translator'
import { Client as Styletron } from 'styletron-engine-atomic'
import '../../common/i18n.js'
import './index.css'
import { PREFIX } from '../../common/constants'

const engine = new Styletron({
    prefix: `${PREFIX}-styletron-`,
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
            <Translator showSettings defaultShowSettings text='' engine={engine} autoFocus />
        </div>
    </React.StrictMode>
)
