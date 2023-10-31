// @ts-nocheck
import Browser from 'webextension-polyfill'

class ArkoseTokenGenerator {
    constructor() {
        this.enforcement = undefined
        /**
         * @type {{ resolve: (value: any) => void; reject: (reason?: any) => void; }[]}
         */
        this.pendingPromises = []
        this.scriptLoaded = false
        window.useUniqueArkoseSetupEnforcement = this.useArkoseSetupEnforcement.bind(this)
        this.injectScript()
    }

    /**
     * @param {{ setConfig: (arg0: { onCompleted: (r: any) => void; onReady: () => void; onError: (r: any) => void; onFailed: (r: any) => void; }) => void; }} enforcement
     */
    useArkoseSetupEnforcement(enforcement) {
        this.enforcement = enforcement
        console.log(this.enforcement)
        enforcement.setConfig({
            onCompleted: (/** @type {{ token: any; }} */ r) => {
                console.debug('enforcement.onCompleted', r)
                this.pendingPromises.forEach((promise) => {
                    promise.resolve(r.token)
                })
                this.pendingPromises = []
            },
            onReady: () => {
                console.debug('enforcement.onReady')
            },
            onError: (/** @type {{ message: any; }} */ r) => {
                console.debug('enforcement.onError', r)
                this.pendingPromises.forEach((promise) => {
                    promise.reject(new Error(`Error in enforcement: ${r.message}`))
                })
            },
            onFailed: (/** @type {any} */ r) => {
                console.debug('enforcement.onFailed', r)
                this.pendingPromises.forEach((promise) => {
                    promise.reject(new Error('Failed to generate arkose token'))
                })
            },
        })
    }

    injectScript() {
        const script = document.createElement('script')
        script.src = Browser.runtime.getURL('/js/v2/35536E1E-65B4-4D96-9D97-6ADB7EFF8147/api.js')
        script.async = true
        script.defer = true
        script.setAttribute('data-callback', 'useUniqueArkoseSetupEnforcement')
        script.onload = () => {
            this.scriptLoaded = true
            console.log('Arkose API script loaded')
        }
        script.onerror = () => {
            console.error('Failed to load Arkose API script')
        }
        document.body.appendChild(script)
    }

    /**
     * @param {{ (): void; (): void; }} callback
     */
    ensureScriptLoaded(callback) {
        if (this.scriptLoaded) {
            callback()
        } else {
            const checkScriptLoaded = setInterval(() => {
                if (this.scriptLoaded) {
                    clearInterval(checkScriptLoaded)
                    callback()
                }
            }, 100)
        }
    }

    async generate() {
        return new Promise((resolve, reject) => {
            this.ensureScriptLoaded(() => {
                if (!this.enforcement) {
                    
                  return undefined
                }
                this.pendingPromises.push({ resolve, reject }) // Allow multiple promises to be stored.
                this.enforcement.run()
            })
        })
    }
}


export const arkoseTokenGenerator = new ArkoseTokenGenerator()
