import Browser from 'webextension-polyfill'

class ArkoseTokenGenerator {
  constructor() {
    this.enforcement = undefined
    this.pendingPromises = []
    window.useArkoseSetupEnforcement = this.useArkoseSetupEnforcement.bind(this)
    this.injectScript()
  }

  useArkoseSetupEnforcement(enforcement) {
    this.enforcement = enforcement
    enforcement.setConfig({
      onCompleted: (r) => {
        console.debug('enforcement.onCompleted', r)
        this.pendingPromises.forEach((promise) => {
          promise.resolve(r.token)
        })
        this.pendingPromises = []
      },
      onReady: () => {
        console.debug('enforcement.onReady')
      },
      onError: (r) => {
        console.debug('enforcement.onError', r)
        this.pendingPromises.forEach((promise) => {
          promise.reject(new Error('Error generating arkose token'))
        })
      },
      onFailed: (r) => {
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
    script.setAttribute('data-callback', 'useArkoseSetupEnforcement')
    document.body.appendChild(script)
  }

  async generate() {
    if (!this.enforcement) {
      return
    }
    return new Promise((resolve, reject) => {
      this.pendingPromises = [{ resolve, reject }] // store only one promise for now.
      this.enforcement.run()
    })
  }
}

export const arkoseTokenGenerator = new ArkoseTokenGenerator()
