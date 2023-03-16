/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

import '@/src/i18n'

const root = createRoot(document.getElementById('root')!)

root.render(<App />)
