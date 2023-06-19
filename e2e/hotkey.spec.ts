import path from 'node:path'
import { getOptionsPageUrl, selectExampleText } from './common'
import { expect, test } from './fixtures'
import { containerID, popupCardID } from '../src/browser-extension/content_script/consts'

test.fixme('hotkey should work', async ({ page, extensionId }) => {
    await page.goto(getOptionsPageUrl(extensionId))
    const input = page.locator('input[name="apiKey"]')
    await input.fill('fake-api-key')
    await page.getByTestId('hotkey-recorder').click()
    await page.keyboard.down('Alt')
    await page.keyboard.down('x')
    await page.keyboard.up('Alt')
    await page.keyboard.up('x')
    await page.getByText('Save').click()

    await page.goto(`file:${path.join(__dirname, 'test.html')}`)
    await selectExampleText(page)

    await page.keyboard.down('Alt')
    await page.keyboard.down('x')
    await page.keyboard.up('Alt')
    await page.keyboard.up('x')

    const container = page.locator(`#${containerID}`)
    await expect(container).toBeVisible()
    const popupCard = container.locator(`#${popupCardID}`)
    await expect(popupCard).toBeVisible()
})
