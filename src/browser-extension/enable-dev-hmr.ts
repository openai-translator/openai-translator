// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import RefreshRuntime from '/@react-refresh'

if (import.meta.hot) {
    RefreshRuntime.injectIntoGlobalHook(window)
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    window.$RefreshReg$ = () => {}
    window.$RefreshSig$ = () => (type) => type
    // eslint-disable-next-line camelcase
    window.__vite_plugin_react_preamble_installed__ = true
}
