import { expect, type Page } from '@playwright/test'

export const STARTING_PCT = /93\.4/
export const CLAIM_REF = /CL-\d{4}/
export const INCIDENT_REF = /IR-26-\d{5}/
export const PCT_TEXT = /(\d{2,3}\.\d)\s*%/

export async function freshStart(page: Page, path = '/') {
  await page.goto(path)
  await page.evaluate(() => { localStorage.removeItem('bcd-state-v1'); sessionStorage.removeItem('bcd-reporter-submission-v1') })
  await page.reload()
  // A fresh main window shows the opening card; the presenter presses Start the demo before step 1.
  const start = page.getByRole('button', { name: 'Start the demo', exact: true })
  if (await start.isVisible().catch(() => false)) await start.click()
}

export async function readPct(page: Page): Promise<number> {
  const el = page.getByTestId('compliance-pct').or(page.getByText(PCT_TEXT)).first()
  await expect(el).toBeVisible()
  const match = PCT_TEXT.exec((await el.textContent()) ?? '')
  if (!match) throw new Error('No percentage figure found on the page')
  return Number(match[1])
}

export async function selectSomeRows(page: Page, count = 5) {
  const boxes = page.getByRole('checkbox', { name: /^Select EX-/ })
  await expect(boxes.first()).toBeVisible()
  const n = Math.min(count, await boxes.count())
  for (let i = 0; i < n; i++) await boxes.nth(i).check()
}

export async function backfillAndExpectClimb(page: Page, from: number) {
  await page.getByRole('button', { name: /^back-?fill$/i }).click()
  await expect.poll(() => readPct(page), { timeout: 3000 }).toBeGreaterThan(from)
}

export async function prepareReport(page: Page, cardNumber: string) {
  await page.getByRole('textbox', { name: /Brown Card number/i }).fill(cardNumber)
  const next = page.getByRole('button', { name: /^(Next|Continue)$/ })
  await expect(next).toBeEnabled()
  await next.click()
  const crossing = page.getByRole('radiogroup', { name: 'Border crossing' })
  if (await crossing.isVisible()) await crossing.getByRole('radio', { name: 'Seme–Krake', exact: true }).click()
  else await page.getByLabel('Border crossing').selectOption('Seme–Krake')
  const country = page.getByRole('radiogroup', { name: 'Accident country' })
  if (await country.isVisible()) await country.getByRole('radio', { name: 'Benin', exact: true }).click()
  else await page.getByLabel('Accident country').selectOption('Benin')
  await next.click()
  const injuries = page.getByRole('radiogroup', { name: 'Injuries' })
  if (await injuries.isVisible()) await injuries.getByRole('radio', { name: /^No/ }).click()
  await page.getByRole('textbox', { name: /^(Short description|What happened\?)/ }).fill('Sample vehicles involved at the crossing. Illustrative report only.')
  await page.getByRole('button', { name: /^(Continue|Review)$/ }).click()
}

export async function submitReport(page: Page, cardNumber: string): Promise<{ claimRef: string; submittedAt: number }> {
  await prepareReport(page, cardNumber)
  const submittedAt = Date.now()
  await page.getByRole('button', { name: /^(Submit report|Send report)$/ }).click()
  await expect(page.getByRole('heading', { name: 'Report received', exact: true })).toBeVisible({ timeout: 2000 })
  const text = await page.getByText(/^CL-\d{4}$/).first().textContent()
  const claimRef = CLAIM_REF.exec(text ?? '')?.[0]
  if (!claimRef) throw new Error('No claim reference shown after submitting the report')
  return { claimRef, submittedAt }
}

/** Old seed identities that must never reappear (ACCEPTANCE: no real people or numbers). */
export const OLD_SEED_NAMES = /okafor|yusuf|bello|bakare/i

export async function expectBanner(page: Page) {
  await expect(page.getByText(/illustrative data/i).first()).toBeVisible()
}

export async function expectAnonymised(page: Page) {
  const text = await page.locator('body').innerText()
  expect(text, 'page text must not contain the old seed names').not.toMatch(OLD_SEED_NAMES)
}
