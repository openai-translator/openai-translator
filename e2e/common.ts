import { Page } from '@playwright/test'

export function getOptionsPageUrl(extensionId: string) {
    return `chrome-extension://${extensionId}/src/browser-extension/options/index.html`
}

export function getPopupPageUrl(extensionId: string) {
    return `chrome-extension://${extensionId}/src/browser-extension/popup/index.html`
}

export async function selectExampleText(page: Page) {
    const textLocator = page.getByTestId('example-text')
    const boundingBox = await textLocator.boundingBox()
    if (boundingBox) {
        // select text
        await page.mouse.move(boundingBox.x, boundingBox.y)
        await page.mouse.down()
        await page.mouse.move(boundingBox.x + boundingBox.width, boundingBox.y + boundingBox.height)
        await page.mouse.up()
    }
}
