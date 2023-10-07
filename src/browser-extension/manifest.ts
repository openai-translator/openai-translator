/* eslint-disable camelcase */
import { version } from '../../package.json'

export function getManifest(browser: 'firefox' | 'chromium'): chrome.runtime.Manifest {
    if (browser === 'chromium') {
        return {
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
                    js: ['src/browser-extension/content_script/index.tsx'],
                },
            ],

            background: {
                service_worker: 'src/browser-extension/background/index.ts',
            },

            permissions: ['storage', 'contextMenus'],

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
            ],
        }
    } else {
        return {
            manifest_version: 2,

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

            browser_action: {
                default_icon: 'icon.png',
                default_popup: 'src/browser-extension/popup/index.html',
            },

            content_scripts: [
                {
                    matches: ['<all_urls>'],
                    all_frames: true,
                    js: ['src/browser-extension/content_script/index.tsx'],
                },
            ],

            background: {
                scripts: ['src/browser-extension/background/index.ts'],
            },

            permissions: ['storage', 'contextMenus', '<all_urls>'],

            commands: {
                'open-popup': {
                    suggested_key: {
                        default: 'Ctrl+Shift+Y',
                        mac: 'Command+Shift+Y',
                    },
                    description: 'Open the popup',
                },
            },

            browser_specific_settings: {
                gecko: {
                    id: 'openaitranslator@gmail.com',
                },
            },
        }
    }
}
