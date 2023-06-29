import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import monkey, { cdn } from 'vite-plugin-monkey'
import { visualizer } from 'rollup-plugin-visualizer'
import { version, license, name } from './package.json'
import wasm from 'vite-plugin-wasm'

const isDev = process.env.NODE_ENV === 'development'

export default defineConfig({
    plugins: [
        tsconfigPaths(),
        wasm(),
        react(),
        monkey({
            entry: 'src/browser-extension/content_script/index.tsx',
            userscript: {
                name,
                icon: 'https://cdn.jsdelivr.net/gh/openai-translator/openai-translator/public/icon.png',
                namespace: 'https://github.com/openai-translator/openai-translator',
                match: ['*://*/*'],
                author: 'https://github.com/openai-translator',
                license,
                description: {
                    '': '基于 ChatGPT API 的划词翻译浏览器插件和跨平台桌面端应用',
                    'en': 'Browser extension and cross-platform desktop application for translation based on ChatGPT API',
                },
                require: [
                    'https://cdn.jsdelivr.net/gh/openai-translator/openai-translator/public/cld-min.js',
                    'data:application/javascript,%3Bwindow.detectLanguage%3DdetectLanguage%3B',
                ],
                version,
            },
            build: {
                externalGlobals: {
                    'react': cdn.jsdelivr('React', 'umd/react.production.min.js'),
                    'react-dom': cdn.jsdelivr('ReactDOM', 'umd/react-dom.production.min.js'),
                    'dexie': cdn.jsdelivr('Dexie', 'dist/dexie.min.js'),
                },
            },
        }),
        visualizer({ filename: 'dist/stats.html' }),
    ],
    build: {
        assetsInlineLimit: 1024 * 1024, // 1mb
        minify: !isDev,
        sourcemap: isDev,
        emptyOutDir: false,
        rollupOptions: {},
    },
})
