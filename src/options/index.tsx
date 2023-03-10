import React from 'react'
import { createRoot } from 'react-dom/client'
import { Settings } from '../popup/Settings'

const Options = () => {
    return <Settings />
}

const root = createRoot(document.getElementById('root') as HTMLElement)

root.render(
    <React.StrictMode>
        <Options />
    </React.StrictMode>
)
