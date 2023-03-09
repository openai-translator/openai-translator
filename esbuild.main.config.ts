import { BuildOptions } from 'esbuild'
import * as path from 'path'

const config: BuildOptions = {
    platform: 'node',
    entryPoints: [path.resolve('src/electron/main/main.ts'), path.resolve('src/electron/main/preload.ts')],
    bundle: true,
    target: 'node16.15.0', // electron version target
    loader: {
        '.png': 'dataurl',
        '.jpg': 'dataurl',
    },
}

export default config
