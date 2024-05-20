/* eslint-disable camelcase */
import { version } from '../../package.json'

export function getManifest(browser: 'firefox' | 'chromium') {
    const manifest: chrome.runtime.Manifest = {
        manifest_version: 3,

        name: 'OpenAI Translator',
        description: `OpenAI-Translator is a browser extension that uses the ChatGPT API for translation.`,
        version: version,

        icons: {
            '16': 'icon.png',
            '32': 'icon.png',
            '48': 'icon.png',
            '128': 'icon.png',
        },

        options_ui: {
            page: 'src/browser-extension/options/index.html',
            open_in_tab: true,
        },

        action: {
            default_icon: 'icon.png',
            default_popup: 'src/browser-extension/popup/index.html',
        },

        content_scripts: [
            {
                matches: ['<all_urls>'],
                all_frames: true,
                match_about_blank: true,
                js: ['src/browser-extension/content_script/index.tsx'],
            },
        ],

        background: {
            service_worker: 'src/browser-extension/background/index.ts',
        },

        permissions: ['storage', 'contextMenus', 'webRequest'],

        commands: {
            'open-popup': {
                suggested_key: {
                    default: 'Ctrl+Shift+Y',
                    mac: 'Command+Shift+Y',
                },
                description: 'Open the popup',
            },
        },

        host_permissions: [
            'https://*.openai.com/',
            'https://*.openai.azure.com/',
            'https://*.ingest.sentry.io/',
            '*://speech.platform.bing.com/',
            'https://*.googletagmanager.com/',
            'https://*.google-analytics.com/',
            'https://*.minimax.chat/',
            'https://*.githubusercontent.com/',
            'https://*.baidu.com/',
            'https://api-edge.cognitive.microsofttranslator.com/',
            'https://*.microsoft.com/',
            'https://*.google.com/',
            'https://*.googleapis.com/',
            'https://*.moonshot.cn/',
            'https://*.volces.com/',
            'https://*.chatglm.cn/',
            'https://*.cohere.ai/',
            'https://*.deepseek.com/',
        ],
    }

    if (browser === 'firefox') {
        manifest.browser_specific_settings = {
            gecko: {
                id: 'openaitranslator@gmail.com',
            },
        }
        manifest.background = {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            scripts: ['src/browser-extension/background/index.ts'],
        }
    }
    return manifest
}
