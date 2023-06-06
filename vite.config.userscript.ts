import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

const isDev = process.env.NODE_ENV === 'development'

export default defineConfig({
    plugins: [tsconfigPaths(), react()],
    build: {
        assetsInlineLimit: 1024 * 1024, // 1mb
        minify: !isDev,
        sourcemap: isDev,
        rollupOptions: {
            input: 'src/browser-extension/content_script/index.tsx',
            output: {
                entryFileNames: 'userscript/[name].js',
                format: 'iife',
            },
        },
    },
})
