import { expect, isDevArtifact, name, test } from './fixtures'
import { containerID } from '../src/browser-extension/content_script/consts'

test('example test', async ({ page }, testInfo) => {
    await page.goto('https://example.com')
    await page.locator(`body > div:nth-child(1) > h1`).dblclick()
    console.log(await page.locator(`body > div:nth-child(1) > h1`).textContent())
    console.log(await page.locator(`#${containerID}`).evaluate('node => node.shadowRoot.innerHTML'))
    // await expect(page.locator(`#${name} h1`)).toHaveText('Vitesse WebExt')
})

test('popup page', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/dist/popup/index.html`)
})

test('options page', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/dist/options/index.html`)
})
