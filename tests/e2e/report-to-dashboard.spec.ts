import { expect, test } from '@playwright/test'
import { SAMPLE_COVERED } from '../../src/shared/seed'
import { freshStart, submitReport } from './helpers'

// ACCEPTANCE: a report submitted in the reporter appears on the dashboard in under 3 seconds (two windows).
test('a report submitted on the phone reaches the claims dashboard within 3 s', async ({ context, page }) => {
  await freshStart(page, '/?view=claims')
  await expect(page.getByText(/CL-0418/).first()).toBeVisible() // seed claim proves the dashboard rendered

  const phone = await context.newPage()
  await phone.goto('/?view=reporter')

  const { claimRef, submittedAt } = await submitReport(phone, SAMPLE_COVERED)

  await expect(page.getByText(claimRef).first()).toBeVisible({ timeout: 3_000 })
  const elapsed = Date.now() - submittedAt
  expect(elapsed, `claim ${claimRef} took ${elapsed} ms to appear`).toBeLessThan(3_000)
  await expect(page.getByText(/notified|card verified/i).first()).toBeVisible()
})

