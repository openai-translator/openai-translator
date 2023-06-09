import { defineConfig } from 'vite'
import webExtension from '@samrum/vite-plugin-web-extension'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { getManifest } from './src/browser-extension/manifest'
import { copyFile } from 'node:fs/promises'
import { setTimeout } from 'node:timers/promises'

const isDev = process.env.NODE_ENV === 'development'

export default defineConfig({
    plugins: [
        tsconfigPaths(),
        react(),
        webExtension({
            manifest: getManifest('chromium'),
        }),
        {
            name: 'cld-min-restore',
            enforce: 'post',
            apply: 'serve',
            configureServer(server) {
                server.httpServer?.once('listening', async () => {
                    // workaround to wait for the completion of webExtension dev build.
                    await setTimeout(3000)
                    copyFile('public/cld-min.js', 'dist/cld-min.js')
                })
            },
        },
    ],
    build: {
        minify: !isDev,
        sourcemap: isDev,
        target: 'chrome105',
        copyPublicDir: false,
        rollupOptions: {
            output: {
                dir: 'dist/browser-extension/chromium',
            },
        },
    },
})
