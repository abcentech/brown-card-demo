import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { CLAIM_REF, freshStart, prepareReport, readPct, STARTING_PCT } from './helpers'

/**
 * Full rehearsal of the 30-minute storyline (docs/DEMO_SCRIPT.md) in one browser context, driven exactly as the
 * presenter would: Reset demo, then steps 1 to 5 from the stepper, with the claims dashboard open in a second window.
 * Records the wall time of each step, saves projector-size screenshots to docs/screenshots, and fails if any request
 * leaves the local origin.
 */

const CARD = /NG-26-[0-9A-F]{4}-[0-9A-F]{4}-\d/
// Relative to the repo root (Playwright runs with the config's directory as cwd); no Node typings needed.
const SHOTS = 'docs/screenshots'

/** Tick the first open batches in view. Resolved rows keep a disabled box, so only enabled ones count. */
async function selectOpenRows(page: Page, count: number) {
  const boxes = page.getByRole('checkbox', { name: /^Select EX-/ }).and(page.locator(':enabled'))
  await expect(boxes.first()).toBeVisible()
  const n = Math.min(count, await boxes.count())
  for (let i = 0; i < n; i++) await boxes.nth(i).check()
}

test.use({ viewport: { width: 1366, height: 768 } })
test.setTimeout(60_000)

test('the whole storyline runs from Reset demo to the close screen', async ({ context, page, baseURL }, testInfo) => {
  const shot = (name: string) => `${SHOTS}/${name}.png`
  const localOrigin = new URL(baseURL ?? 'http://localhost').origin
  const external: string[] = []
  context.on('request', (req) => {
    const url = req.url()
    if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('about:')) return
    if (new URL(url).origin !== localOrigin) external.push(url)
  })

  const steps = page.getByRole('navigation', { name: 'Demo steps' })
  const go = (name: RegExp) => steps.getByRole('button', { name }).first().click()
  const timings: Record<string, number> = {}
  const runStart = Date.now()
  let t = runStart
  const lap = (label: string) => {
    const now = Date.now()
    timings[label] = now - t
    t = now
  }

  // Start exactly as the presenter does: open the laptop window and press Reset demo.
  await freshStart(page)
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click()
  // The opening title card is shown after every reset; the presenter starts from it.
  await page.getByRole('button', { name: 'Start the demo', exact: true }).click()
  await expect(page.getByTestId('card-allocation')).toContainText('Issued this session (0)')
  lap('reset')

  // Step 1: issue a policy, then verify the new card on the short-code simulator.
  await page.getByRole('button', { name: 'Issue policy and allocate card', exact: true }).click()
  const allocated = page.getByTestId('allocated-card')
  await expect(allocated).toContainText(CARD)
  const card = CARD.exec((await allocated.textContent()) ?? '')![0]
  await expect(page.getByTestId('card-allocation')).toContainText('Issued this session (1)')
  for (const k of ['*', '0', '0', '0', '#']) await page.getByRole('button', { name: `Key ${k}`, exact: true }).click()
  await page.getByRole('button', { name: 'Call', exact: true }).click()
  const ussd = page.getByTestId('ussd-screen')
  await expect(ussd).toContainText('Enter the card number')
  await page.getByRole('button', { name: 'Issued just now', exact: true }).click()
  await page.getByRole('button', { name: 'Verify card', exact: true }).click()
  await expect(ussd).toContainText('Status: COVERED')
  await expect(ussd).toContainText(card)
  await page.screenshot({ path: shot('step1'), fullPage: false })
  lap('step1')

  // Second window: the claims dashboard, opened before the report so the arrival is seen live.
  const claims = await context.newPage()
  await claims.goto('/?view=claims')
  await expect(claims.getByRole('button', { name: /^CL-/ }).first()).toBeVisible()

  // Step 2: the incident report in the phone frame, using the card issued in step 1.
  await go(/incident report/i)
  await prepareReport(page, card)
  const submittedAt = Date.now()
  await page.getByRole('button', { name: /^(Submit report|Send report)$/ }).click()
  await expect(page.getByRole('heading', { name: 'Report received', exact: true })).toBeVisible({ timeout: 2000 })
  const refText = await page.getByText(/^CL-\d{4}$/).first().textContent()
  const claimRef = CLAIM_REF.exec(refText ?? '')?.[0]
  if (!claimRef) throw new Error('No claim reference shown after submitting the report')
  await expect(page.getByText('Card verified. Claim opened.')).toBeVisible()
  await expect(page.getByText('Message to the reporter')).toBeVisible()
  await page.screenshot({ path: shot('step2'), fullPage: false })
  lap('step2')

  // Step 3a: the claim arrives on the dashboard window within 3 s.
  await expect(claims.getByRole('button', { name: claimRef, exact: true })).toBeVisible({ timeout: 3000 })
  timings.arrivalMs = Date.now() - submittedAt
  expect(timings.arrivalMs, `claim ${claimRef} took ${timings.arrivalMs} ms to appear`).toBeLessThan(3000)
  await expect(claims.getByText('New from reporter').first()).toBeVisible()
  await claims.screenshot({ path: shot('claims-arrival'), fullPage: false })

  // Step 3b: on the laptop, key 3 opens the dashboard; select the claim, move it a stage, escalate.
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('3')
  await expect(steps.getByRole('button', { name: /claims dashboard/i })).toHaveAttribute('aria-current', 'step')
  await page.getByRole('button', { name: claimRef, exact: true }).click()
  const panel = page.getByRole('complementary', { name: `Claim ${claimRef}` })
  await expect(panel).toContainText('Stage 1 of 5')
  await expect(panel).toContainText('Issuing bureau')
  await expect(panel).toContainText('Handling bureau')
  await panel.getByRole('button', { name: /^Move to next stage: Card verified$/ }).click()
  await expect(panel).toContainText('Stage 2 of 5')
  await panel.getByRole('button', { name: 'Escalate to the Council of Bureaux', exact: true }).click()
  await expect(panel).toContainText('Escalated. The Council is following this claim.')
  // The second window follows the change.
  const claimsRow = claims.getByRole('row').filter({ has: claims.getByRole('button', { name: claimRef, exact: true }) })
  await expect(claimsRow).toContainText('Escalated')
  await expect(claimsRow).toContainText('Stage 2 of 5')
  await page.screenshot({ path: shot('step3'), fullPage: false })
  lap('step3')

  // Step 4: compliance. Start at 93.4%, filter, select, back-fill, remind, assign, download the return.
  await go(/compliance console/i)
  await expect(page.getByText(STARTING_PCT).first()).toBeVisible()
  const start = await readPct(page)
  expect(start).toBe(93.4)
  const exceptions = page.getByRole('region', { name: /^Exception list/ })
  await exceptions.getByRole('combobox', { name: /^Channel/ }).selectOption('broker')
  await expect(page.getByText(/Showing \d+ of \d+ batches/)).toBeVisible()
  await selectOpenRows(page, 5)
  await page.getByRole('button', { name: 'Back-fill', exact: true }).click()
  await expect(page.getByRole('status')).toContainText(/^Cleared/)
  await expect.poll(() => readPct(page), { timeout: 3000 }).toBeGreaterThan(start)
  // The gauge counts up over about a second; wait until two reads 400 ms apart agree before recording it.
  const settledPct = async () => {
    let last = await readPct(page)
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(400)
      const next = await readPct(page)
      if (next === last) return next
      last = next
    }
    return last
  }
  const afterBackfill = await settledPct()
  await page.screenshot({ path: shot('compliance-after-backfill'), fullPage: false })
  await selectOpenRows(page, 3)
  await page.getByRole('button', { name: 'Remind', exact: true }).click()
  await expect(page.getByRole('status')).toContainText(/^Reminder sent/)
  const rows = exceptions.locator('tbody')
  await expect(rows.getByText('Reminded', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Assign', exact: true }).click()
  await expect(page.getByRole('status')).toContainText(/^Assigned/)
  await expect(rows.getByText(/Compliance desk, Insurer/).first()).toBeVisible()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download quarterly return', exact: true }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toBe('quarterly_return.csv')
  expect(afterBackfill).toBeGreaterThan(93.4)
  expect(await readPct(page)).toBe(afterBackfill)
  await page.screenshot({ path: shot('step4'), fullPage: false })
  lap('step4')

  // Step 5: the close screen.
  await go(/\bclose\b/i)
  await expect(page.getByRole('heading', { name: /Start with one corridor/ })).toBeVisible()
  await expect(page.getByText('Proposed pilot: Nigeria to Benin through Seme')).toBeVisible()
  await expect(page.getByText(/illustrative data/i).first()).toBeVisible()
  await page.screenshot({ path: shot('step5'), fullPage: false })
  lap('step5')

  timings.totalMs = Date.now() - runStart
  const summary = JSON.stringify({ claimRef, card, start, afterBackfill, externalRequests: external, ...timings }, null, 2)
  await testInfo.attach('full-run-timings', { body: summary, contentType: 'application/json' })
  console.log(`full-run timings ${summary}`)
  expect(timings.totalMs, 'the rehearsal should finish well inside a minute').toBeLessThan(60_000)
  expect(external, 'no request may leave the local origin during the run').toEqual([])
})
