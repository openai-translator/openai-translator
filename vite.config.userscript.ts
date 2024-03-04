import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import monkey, { cdn } from 'vite-plugin-monkey'
import { visualizer } from 'rollup-plugin-visualizer'
import svgr from 'vite-plugin-svgr'
import { fileURLToPath, URL } from 'url'
import { version, license, name } from './package.json'

const isDev = process.env.NODE_ENV === 'development'

export default defineConfig({
    plugins: [
        tsconfigPaths(),
        react(),
        svgr(),
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
    resolve: {
        alias: [{ find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) }],
    },
    build: {
        minify: !isDev,
        sourcemap: isDev,
        emptyOutDir: false,
        rollupOptions: {},
    },
})
