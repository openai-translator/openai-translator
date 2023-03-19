import archiver from 'archiver'
import esbuild from 'esbuild'
import fs from 'fs-extra'
import inlineImportPlugin from 'esbuild-plugin-inline-import'

const browserExtensionOutDir = 'dist/browser-extension'
const userscriptOutDir = 'dist/userscript'

async function esbuildBrowserExtension() {
    await esbuild.build({
        target: ['es2015', 'safari11'],
        entryPoints: [
            'src/content_script/index.tsx',
            'src/background/index.ts',
            'src/options/index.tsx',
            'src/popup/index.tsx',
        ],
        bundle: true,
        outdir: browserExtensionOutDir,
        treeShaking: true,
        minify: true,
        legalComments: 'none',
        sourcemap: true,
        loader: {
            '.png': 'dataurl',
            '.jpg': 'dataurl',
            '.gif': 'dataurl',
        },
        plugins: [
            inlineImportPlugin(),
        ],
    })
}

async function zipFolder(dir) {
    const output = fs.createWriteStream(`${dir}.zip`)
    const archive = archiver('zip', {
        zlib: { level: 9 },
    })
    archive.pipe(output)
    archive.directory(dir, false)
    await archive.finalize()
}

async function copyFiles(entryPoints, targetDir) {
    await fs.ensureDir(targetDir)
    await Promise.all(
        entryPoints.map(async (entryPoint) => {
            await fs.copy(entryPoint.src, `${targetDir}/${entryPoint.dst}`)
        })
    )
}

async function build() {
    await esbuildBrowserExtension()

    const commonFiles = [
        { src: `${browserExtensionOutDir}/content_script/index.js`, dst: 'js/content_script.js' },
        { src: `${browserExtensionOutDir}/content_script/index.js.map`, dst: 'js/content_script.js.map' },
        { src: `${browserExtensionOutDir}/content_script/index.css`, dst: 'css/content_script.css' },
        { src: `${browserExtensionOutDir}/background/index.js`, dst: 'js/background.js' },
        { src: `${browserExtensionOutDir}/options/index.js`, dst: 'js/options.js' },
        { src: `${browserExtensionOutDir}/options/index.css`, dst: 'css/options.css' },
        { src: 'public/options.html', dst: 'options.html' },
        { src: `${browserExtensionOutDir}/popup/index.js`, dst: 'js/popup.js' },
        { src: `${browserExtensionOutDir}/popup/index.css`, dst: 'css/popup.css' },
        { src: 'public/popup.html', dst: 'popup.html' },
        { src: 'public/icon.png', dst: 'icon.png' },
    ]

    // chromium
    await copyFiles(
        [...commonFiles, { src: 'public/manifest.json', dst: 'manifest.json' }],
        `./${browserExtensionOutDir}/chromium`
    )

    await zipFolder(`./${browserExtensionOutDir}/chromium`)

    // firefox
    await copyFiles(
        [...commonFiles, { src: 'public/manifest.firefox.json', dst: 'manifest.json' }],
        `./${browserExtensionOutDir}/firefox`
    )

    await zipFolder(`./${browserExtensionOutDir}/firefox`)

    // userscript
    await copyFiles(
        [
            { src: `${browserExtensionOutDir}/content_script/index.js`, dst: 'index.js' },
            { src: `${browserExtensionOutDir}/content_script/index.css`, dst: 'index.css' },
        ],
        `./${userscriptOutDir}`
    )

    console.log('Build success.')
}

build()
