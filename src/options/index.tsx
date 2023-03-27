import React from 'react'
import { createRoot } from 'react-dom/client'
import { Settings } from '../popup/Settings'
import { Client as Styletron } from 'styletron-engine-atomic'

const engine = new Styletron()

const Options = () => {
    return <Settings engine={engine} />
}

const root = createRoot(document.getElementById('root') as HTMLElement)

root.render(
    <React.StrictMode>
        <Options />
    </React.StrictMode>
)
