import { backgroundFetch } from './background/fetch'
import { tauriFetch } from './polyfills/tauri'
import { userscriptFetch } from './polyfills/userscript'
import { isDesktopApp, isUserscript } from './utils'

export function getUniversalFetch() {
    return isUserscript() ? userscriptFetch : isDesktopApp() ? tauriFetch : backgroundFetch
}
