import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import fs from 'fs-extra'
import { type BrowserContext, test as base, chromium } from '@playwright/test'
import type { Manifest } from 'webextension-polyfill'

export { name } from '../package.json'

export const extensionPath = path.join(__dirname, '../dist')

export const test = base.extend<{
    context: BrowserContext
    extensionId: string
}>({
    context: async ({ headless }, use) => {
        const context = await chromium.launchPersistentContext('', {
            headless,
            args: [
                ...(headless ? ['--headless=new'] : []),
                `--disable-extensions-except=${extensionPath}`,
                `--load-extension=${extensionPath}`,
            ],
        })
        await use(context)
        await context.close()
    },
    extensionId: async ({ context }, use) => {
        // for manifest v3:
        let [background] = context.serviceWorkers()
        if (!background) background = await context.waitForEvent('serviceworker')

        const extensionId = background.url().split('/')[2]
        await use(extensionId)
    },
})

export const expect = test.expect

export function isDevArtifact() {
    const manifest: Manifest.WebExtensionManifest = fs.readJsonSync(path.resolve(extensionPath, 'manifest.json'))
    return Boolean(
        typeof manifest.content_security_policy === 'object' &&
            manifest.content_security_policy.extension_pages?.includes('localhost')
    )
}
