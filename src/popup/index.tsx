import React from 'react'
import { createRoot } from 'react-dom/client'
import { Settings } from './Settings'

const root = createRoot(document.getElementById('root') as HTMLElement)

root.render(
    <React.StrictMode>
        <Settings />
    </React.StrictMode>
)
