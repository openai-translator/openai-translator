import { backgroundFetch } from './background/fetch'
import { userscriptFetch } from './polyfills/userscript'
import { isDesktopApp, isUserscript } from './utils'
import { fetch } from '@tauri-apps/plugin-http'

export function getUniversalFetch() {
    return isUserscript() ? userscriptFetch : isDesktopApp() ? fetch : backgroundFetch
}
