import esbuild from 'esbuild'
import { copy } from 'esbuild-plugin-copy'
import fs from 'fs-extra'
import esbuildServer from 'esbuild-server'

const tauriOutDir = 'dist/tauri'

// eslint-disable-next-line no-undef
const enableWatch = process.argv.includes('--watch')
// eslint-disable-next-line no-undef
const enableServe = process.argv.includes('--serve')

const config = {
    entryPoints: ['src/tauri/index.tsx'],
    bundle: true,
    outdir: tauriOutDir,
    watch: enableWatch,
    treeShaking: true,
    minify: true,
    legalComments: 'none',
    sourcemap: true,
    loader: {
        '.png': 'dataurl',
        '.jpg': 'dataurl',
    },
    plugins: [
        copy({
            resolveFrom: 'cwd',
            assets: [
                {
                    from: 'src/tauri/index.html',
                    to: `${tauriOutDir}/index.html`,
                },
                {
                    from: 'src-tauri/get-selected-text.applescript',
                    to: `${tauriOutDir}/get-selected-text.applescript`,
                },
            ],
            watch: enableWatch,
        }),
    ],
}

async function esbuildTauri() {
    await fs.remove(tauriOutDir)
    await esbuild.build(config)
}

async function build() {
    await esbuildTauri()
}

async function serve() {
    await fs.remove(tauriOutDir)
    esbuildServer
        .createServer(config, {
            static: tauriOutDir,
            port: 3000,
        })
        .start()
}

if (enableServe) {
    serve()
} else {
    build()
}
