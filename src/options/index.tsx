import React from 'react'
import { createRoot } from 'react-dom/client'
import { Popup } from '../popup'

const Options = () => {
  return <Popup />
}

const root = createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
)
