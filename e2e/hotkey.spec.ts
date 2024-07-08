import path from 'node:path'
import { getOptionsPageUrl, selectExampleText } from './common'
import { expect, test } from './fixtures'
import { containerID, popupCardID, popupCardInnerContainerId } from '../src/browser-extension/content_script/consts'

test('hotkey should work', async ({ page, extensionId }) => {
    await test.step('set hotkey', async () => {
        await page.goto(getOptionsPageUrl(extensionId))
        const input = page.locator('input[name="apiKey"]')
        await input.fill('fake-api-key')
        await page.getByTestId('shortcuts').click()
        await page.getByTestId('hotkey-recorder').click()
        await page.keyboard.down('Alt')
        await page.keyboard.down('x')
        await page.keyboard.up('Alt')
        await page.keyboard.up('x')
        await page.getByText('Save', { exact: true }).click()
    })

    const popupCard = await test.step('show popup card using hotkey', async () => {
        await page.goto(`file:${path.join(__dirname, 'test.html')}`)
        await selectExampleText(page)

        const container = page.locator(`#${containerID}`)
        await container.waitFor({ state: 'attached' })

        await page.keyboard.down('Alt')
        await page.keyboard.press('x')

        return container.locator(`#${popupCardID}`)
    })

    await expect(popupCard).toBeAttached()
    await expect(page.locator(`#${popupCardInnerContainerId}`)).toBeVisible()
})
