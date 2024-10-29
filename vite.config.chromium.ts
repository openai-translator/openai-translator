import { defineConfig } from 'vite'
import webExtension from '@samrum/vite-plugin-web-extension'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'
import { fileURLToPath, URL } from 'url'
import { getManifest } from './src/browser-extension/manifest'

const isDev = process.env.NODE_ENV === 'development'

export default defineConfig({
    plugins: [
        tsconfigPaths(),
        react(),
        svgr(),
        webExtension({
            manifest: getManifest('chromium'),
            useDynamicUrlWebAccessibleResources: false,
        }),
    ],
    resolve: {
        alias: [{ find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) }],
    },
    build: {
        minify: !isDev,
        sourcemap: isDev,
        target: 'chrome105',
        rollupOptions: {
            output: {
                dir: 'dist/browser-extension/chromium',
            },
        },
    },
})
