import archiver from 'archiver'
import esbuild from 'esbuild'
import fs from 'fs-extra'

const outdir = 'dist'

async function runEsbuild() {
    await esbuild.build({
        entryPoints: [
            'src/content_script/index.tsx',
            'src/background/index.ts',
            'src/options/index.tsx',
            'src/popup/index.tsx',
        ],
        bundle: true,
        outdir: outdir,
        treeShaking: true,
        minify: true,
        legalComments: 'none',
        sourcemap: true,
        loader: {
            '.png': 'dataurl',
            '.jpg': 'dataurl',
        },
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
    await runEsbuild()

    const commonFiles = [
        { src: `${outdir}/content_script/index.js`, dst: 'js/content_script.js' },
        { src: `${outdir}/content_script/index.js.map`, dst: 'js/content_script.js.map' },
        { src: `${outdir}/background/index.js`, dst: 'js/background.js' },
        { src: `${outdir}/options/index.js`, dst: 'js/options.js' },
        { src: `${outdir}/options/index.css`, dst: 'css/options.css' },
        { src: 'public/options.html', dst: 'options.html' },
        { src: `${outdir}/popup/index.js`, dst: 'js/popup.js' },
        { src: `${outdir}/popup/index.css`, dst: 'css/popup.css' },
        { src: 'public/popup.html', dst: 'popup.html' },
        { src: 'public/icon.png', dst: 'icon.png' },
    ]

    // chromium
    await copyFiles([...commonFiles, { src: 'public/manifest.json', dst: 'manifest.json' }], `./${outdir}/chromium`)

    await zipFolder(`./${outdir}/chromium`)

    // firefox
    await copyFiles(
        [...commonFiles, { src: 'public/manifest.firefox.json', dst: 'manifest.json' }],
        `./${outdir}/firefox`
    )

    await zipFolder(`./${outdir}/firefox`)

    console.log('Build success.')
}

build()
