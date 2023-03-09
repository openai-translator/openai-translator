import { BuildOptions } from 'esbuild'
import * as path from 'path'

const config: BuildOptions = {
    platform: 'browser',
    entryPoints: [path.resolve('src/electron/renderer/index.tsx')],
    bundle: true,
    target: 'chrome108', // electron version target
    loader: {
        '.png': 'dataurl',
        '.jpg': 'dataurl',
    },
}

export default config
