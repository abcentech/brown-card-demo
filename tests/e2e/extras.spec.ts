import { expect, test } from '@playwright/test'
import { freshStart } from './helpers'

test('allocation, four verification outcomes, anonymisation, CSV and reset', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await freshStart(page)
  await page.getByRole('button', { name: 'Issue policy and allocate card', exact: true }).click()
  await expect(page.getByTestId('allocated-card')).toContainText(/NG-26-[0-9A-F]{4}-[0-9A-F]{4}-\d/)
  for (const [sample, status] of [['Covered', 'COVERED'], ['Lapsed', 'LAPSED'], ['Not found', 'NOT FOUND'], ['Invalid', 'INVALID NUMBER']]) {
    await page.getByRole('button', { name: sample, exact: false }).first().click()
    await page.getByRole('button', { name: 'Verify card', exact: true }).click()
    await expect(page.getByTestId('ussd-screen')).toContainText(`Status: ${status}`)
  }
  await page.getByRole('button', { name: 'Covered', exact: false }).first().click()
  await page.getByRole('button', { name: 'Verify card', exact: true }).click()
  await expect(page.getByTestId('ussd-screen')).toContainText('Sample holder')
  await expect(page.getByTestId('ussd-screen')).toContainText('Sample vehicle')
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: /Download quarterly return|Download NAICOM return/ }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toBe('quarterly_return.csv')
  const stream = await download.createReadStream()
  expect(stream).not.toBeNull()
  let csv = ''
  for await (const chunk of stream!) csv += chunk.toString()
  expect(csv.trim().split(/\r?\n/)).toHaveLength(13)
  expect(csv).toContain('Insurer A')
  expect(csv).toContain('Insurer L')
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click()
  await expect(page.getByTestId('card-allocation')).toContainText('Issued this session (0)')
  await expect(page.getByTestId('allocated-card')).not.toContainText(/NG-26-[0-9A-F]{4}-[0-9A-F]{4}-\d/)
  await expect(page.getByTestId('ussd-screen')).toContainText('Dial *000#')
  expect(errors).toEqual([])
})

