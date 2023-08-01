import path from 'node:path'
import { expect, test } from './fixtures'
import { selectExampleText } from './common'
import { containerID, popupCardInnerContainerId, popupThumbID } from '../src/browser-extension/content_script/consts'

test.describe('titlebar', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`file:${path.join(__dirname, 'test.html')}`)
        await selectExampleText(page)
        const thumb = page.locator(`#${containerID} #${popupThumbID}`)
        await thumb.click()
    })

    test('pin/unpin should work', async ({ page }) => {
        const pinBtn = page.getByTestId('titlebar-pin-btn')
        // pin
        await pinBtn.click()
        await page.mouse.click(0, 0)
        await expect(page.locator(`#${popupCardInnerContainerId}`)).toBeVisible()

        // unpin
        await pinBtn.click()
        await page.mouse.click(0, 0)
        await expect(page.locator(`#${popupCardInnerContainerId}`)).not.toBeVisible()
    })

    test('close should work', async ({ page }) => {
        const pinBtn = page.getByTestId('titlebar-close-btn')
        await pinBtn.click()

        await expect(page.locator(`#${popupCardInnerContainerId}`)).not.toBeVisible()
    })
})
