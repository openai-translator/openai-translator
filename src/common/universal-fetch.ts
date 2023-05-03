import { backgroundFetch } from './background/fetch'
import { userscriptFetch } from './polyfills/userscript'
import { isDesktopApp, isUserscript } from './utils'

export function getUniversalFetch() {
    return isUserscript() ? userscriptFetch : !isDesktopApp() ? backgroundFetch : window.fetch
}
