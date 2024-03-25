import { defineConfig } from 'vite'
import webExtension from '@samrum/vite-plugin-web-extension'
import manifest from './src/browser-extension/manifest.json'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

const isDev = process.env.NODE_ENV === 'development'

export default defineConfig({
    plugins: [
        tsconfigPaths(),
        react(),
        webExtension({
            manifest: manifest as chrome.runtime.Manifest,
        }),
    ],
    build: {
        assetsInlineLimit: 1024 * 1024, // 1mb
        minify: !isDev,
        sourcemap: isDev,
        target: 'chrome105',
        rollupOptions: {
            output: {
                dir: 'dist/browser-extension/chromium',
            },
        },
    },
    define: {
        'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_CLERK_PUBLISHABLE_KEY),
    },
})
