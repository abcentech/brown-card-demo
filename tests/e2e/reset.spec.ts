import { expect, test } from '@playwright/test'
import { backfillAndExpectClimb, freshStart, readPct, selectSomeRows, STARTING_PCT } from './helpers'

// ACCEPTANCE: Reset returns the app to the starting state (compliance back at 93.4%).
test.describe('reset demo', () => {
  test('Shift+R on the main page restores 93.4%', async ({ page }) => {
    await freshStart(page, '/')
    await page.getByRole('button', { name: /compliance/i }).first().click()
    const start = await readPct(page)
    expect(start).toBe(93.4)

    await selectSomeRows(page)
    await backfillAndExpectClimb(page, start)

    await page.locator('body').click({ position: { x: 5, y: 5 } }) // make sure no input has focus
    await page.keyboard.press('Shift+R')
    await page.getByRole('button', { name: /compliance/i }).first().click()
    await expect(page.getByText(STARTING_PCT).first()).toBeVisible()
    expect(await readPct(page)).toBe(93.4)
  })

  test('the Reset demo button restores 93.4%', async ({ page }) => {
    await freshStart(page, '/')
    await page.getByRole('button', { name: /compliance/i }).first().click()
    const start = await readPct(page)
    await selectSomeRows(page)
    await backfillAndExpectClimb(page, start)

    await page.getByRole('button', { name: /reset demo/i }).click()
    await page.getByRole('button', { name: /compliance/i }).first().click()
    await expect(page.getByText(STARTING_PCT).first()).toBeVisible()
    expect(await readPct(page)).toBe(93.4)
  })
})
