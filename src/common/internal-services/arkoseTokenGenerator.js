import * as utils from '../utils'

class ArkoseTokenGenerator {
    constructor() {
        this.enforcement = undefined
        /**
         * @type {{ resolve: (value: any) => void; reject: (reason?: any) => void; }[]}
         */
        this.pendingPromise = new Promise((resolve) => {
            this.resolve = resolve
        })
        this.scriptLoaded = false
        window.addEventListener(
            'message',
            (evt) => {
                if (evt.data.type === 'arkoseToken') {
                    this.resolve(evt.data.token)
                }
            },
            false
        )
        this.injectScript()
    }

    async injectScript() {
        const browser = await utils.getBrowser()
        const script = document.createElement('script')
        script.src = browser.runtime.getURL('/js/v2/35536E1E-65B4-4D96-9D97-6ADB7EFF8147/api.js')
        script.async = true
        script.defer = true
        script.setAttribute('data-callback', 'useUniqueArkoseSetupEnforcement')
        script.onload = () => {
            console.log('Arkose API script loaded')
        }
        script.onerror = () => {
            console.error('Failed to load Arkose API script')
        }
        document.body.appendChild(script)
    }
    async generate() {
        return this.pendingPromise
    }
}

export const arkoseTokenGenerator = new ArkoseTokenGenerator()
