import { createRoot } from 'react-dom/client'
import { App } from './App'

import '../common/i18n.js'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById('root')!)

root.render(<App />)
