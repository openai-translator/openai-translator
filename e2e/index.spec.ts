import { expect, test } from './fixtures'
import { containerID, popupThumbID, popupCardID } from '../src/browser-extension/content_script/consts'

test('popup card should be visible', async ({ page }) => {
    await page.goto('https://example.com')
    const textLocator = page.locator('h1')
    const boundingBox = await textLocator.boundingBox()
    if (boundingBox) {
        // select text
        await page.mouse.move(boundingBox.x, boundingBox.y)
        await page.mouse.down()
        await page.mouse.move(boundingBox.x + boundingBox.width, boundingBox.y + boundingBox.height)
        await page.mouse.up()
    }
    const container = page.locator(`#${containerID}`)
    const thumb = container.locator(`#${popupThumbID}`)
    await expect(thumb).toBeVisible()
    await thumb.click()
    const popupCard = container.locator(`#${popupCardID}`)
    await expect(popupCard).toBeVisible()
})

test('popup page should be opened', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/src/browser-extension/popup/index.html`)
    await expect(page.getByTestId('popup-container')).toBeVisible()
})

test('options page should be opened', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/src/browser-extension/options/index.html`)
    await expect(page.getByTestId('settings-container')).toBeVisible()
})
