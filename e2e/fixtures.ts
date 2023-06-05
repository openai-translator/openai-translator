import path from 'node:path'
import { type BrowserContext, test as base, chromium } from '@playwright/test'

export const extensionPath = path.join(__dirname, '../dist/browser-extension/chromium')

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
