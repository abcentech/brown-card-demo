import { expect, test } from '@playwright/test'
import { SAMPLE_COVERED } from '../../src/shared/seed'
import { freshStart, prepareReport } from './helpers'

test.describe('offline production demo', () => {
  test('all five steps and card issuance work without network access', async ({ context, page }) => {
    await freshStart(page)
    await context.setOffline(true)
    for (const name of [/incident report/i, /claims dashboard/i, /compliance console/i, /close/i, /issue and (short-code|check)/i]) {
      const btn = page.getByRole('navigation', { name: 'Demo steps' }).getByRole('button', { name }).first()
      await btn.click()
      await expect(btn).toHaveAttribute('aria-current', 'step')
      await expect(page.getByText(/illustrative data/i).first()).toBeVisible()
    }
    await page.getByRole('button', { name: /issue policy and allocate card/i }).click()
    await expect(page.getByTestId('allocated-card')).toContainText(/NG-26-[0-9A-F]{4}-[0-9A-F]{4}-\d/)
  })

  test('a queued report sends once when the connection returns', async ({ context, page }) => {
    await freshStart(page, '/?view=reporter')
    const dashboard = await context.newPage()
    await dashboard.goto('/?view=claims')
    const initial = await dashboard.getByRole('button', { name: /^CL-/ }).count()
    await context.setOffline(true)
    await prepareReport(page, SAMPLE_COVERED)
    await page.getByRole('button', { name: /^(Save report to send|Save and send when online)$/ }).click()
    await expect(page.getByRole('heading', { name: /^(Report queued|Saved on this phone)$/ })).toBeVisible()
    expect(await dashboard.getByRole('button', { name: /^CL-/ }).count()).toBe(initial)
    await context.setOffline(false)
    await expect(page.getByRole('heading', { name: 'Report received', exact: true })).toBeVisible({ timeout: 3000 })
    await expect(dashboard.getByRole('button', { name: /^CL-/ })).toHaveCount(initial + 1)
  })
})


