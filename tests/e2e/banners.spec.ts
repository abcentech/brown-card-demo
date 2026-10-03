import { expect, test } from './fixtures'
import { expectAnonymised, expectBanner, freshStart } from './helpers'

// ACCEPTANCE: every screen shows the illustrative-data banner; no real insurer names, people or numbers appear anywhere.
test.describe('illustrative-data banner and anonymisation', () => {
  test('all five presenter steps', async ({ page }) => {
    await freshStart(page)
    const steps = page.getByRole('navigation', { name: 'Demo steps' }).getByRole('button')
    await expect(steps).toHaveCount(5)
    for (let i = 0; i < 5; i++) {
      await steps.nth(i).click()
      await expect(steps.nth(i)).toHaveAttribute('aria-current', 'step')
      await expectBanner(page)
      await expectAnonymised(page)
    }
  })

  for (const view of ['reporter', 'claims', 'compliance'] as const) {
    test(`standalone ?view=${view} page`, async ({ page }) => {
      await freshStart(page, `/?view=${view}`)
      await expectBanner(page)
      await expectAnonymised(page)
    })
  }
})
