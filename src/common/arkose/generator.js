import Browser from 'webextension-polyfill'
/* eslint-disable */
const openaiRegex = /^https?:\/\/([a-z0-9]+[.])*chat[.]openai[.]com\//
class ArkoseTokenGenerator {
    constructor() {
        if (openaiRegex.test(window.location.href)) {
            return;
        }
        this.injectScript()

    }


    injectScript() {
        if (window.location.href.startsWith('https://chat.openai.com/')) {
            return 
        }
        const script = document.createElement('script')
        script.src = Browser.runtime.getURL('/js/v2/35536E1E-65B4-4D96-9D97-6ADB7EFF8147/api.js')
        script.async = true
        script.defer = true
        script.setAttribute('data-callback', 'useArkoseSetupEnforcement')
        script.onload = () => {
            this.scriptLoaded = true
        }
        script.onerror = (e) => {
            console.error('Failed to load Arkose API script', e); // 增加更详细的错误信息
        }
        document.body.appendChild(script)
    }
    

    async generate() {
        console.log('等待生成中');
    }
}




export const arkoseTokenGenerator = new ArkoseTokenGenerator()

