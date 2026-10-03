import { expect, test } from '@playwright/test'
import { backfillAndExpectClimb, freshStart, readPct, selectSomeRows, STARTING_PCT } from './helpers'

// ACCEPTANCE: the compliance figure starts at 93.4% and climbs when exceptions are cleared.
test('compliance starts at 93.4% and climbs after a back-fill', async ({ page }) => {
  await freshStart(page, '/?view=compliance')
  await expect(page.getByText(STARTING_PCT).first()).toBeVisible()
  const start = await readPct(page)
  expect(start).toBe(93.4)

  await selectSomeRows(page)
  await backfillAndExpectClimb(page, start)
  await expect(page.getByText(STARTING_PCT)).toHaveCount(0)
})
