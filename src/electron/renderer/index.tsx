/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

import '../../common/i18n.js'

const root = createRoot(document.getElementById('root')!)

root.render(<App />)
