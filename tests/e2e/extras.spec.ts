import { expect, test } from './fixtures'
import { expectAnonymised, freshStart } from './helpers'

const CARD = /NG-26-[0-9A-F]{4}-[0-9A-F]{4}-\d/

// Step 1 of the storyline: issue a policy, verify cards by short code, download the NAICOM return, reset.
test.describe('platform stand-in (step 1)', () => {
  test('issues a policy and the new card verifies as covered by short code', async ({ page }) => {
    await freshStart(page)
    await page.getByRole('button', { name: 'Issue policy and allocate card', exact: true }).click()
    const allocated = page.getByTestId('allocated-card')
    await expect(allocated).toContainText(CARD)
    const card = CARD.exec((await allocated.textContent()) ?? '')![0]
    await expect(page.getByTestId('card-allocation')).toContainText('Issued this session (1)')

    // Dial the placeholder short code on the keypad, then verify the card just issued.
    for (const k of ['*', '0', '0', '0', '#']) await page.getByRole('button', { name: `Key ${k}`, exact: true }).click()
    await page.getByRole('button', { name: 'Call', exact: true }).click()
    const screen = page.getByTestId('ussd-screen')
    await expect(screen).toContainText('Enter the card number')
    const chip = page.getByRole('button', { name: 'Issued just now', exact: true })
    await expect(chip).toContainText(card)
    await chip.click()
    await page.getByRole('button', { name: 'Verify card', exact: true }).click()
    await expect(screen).toContainText('Status: COVERED')
    await expect(screen).toContainText(card)
  })

  test('the four sample cards give the four USSD outcomes', async ({ page }) => {
    await freshStart(page)
    const screen = page.getByTestId('ussd-screen')
    const cases: [string, string, string][] = [
      ['Covered', 'Status: COVERED', 'Active policy, Brown Card recorded.'],
      ['Lapsed', 'Status: LAPSED', 'A genuine card, but the policy has expired.'],
      ['Not found', 'Status: NOT FOUND', 'No card on the register. Refer for inspection.'],
      ['Invalid', 'Status: INVALID NUMBER', 'Not a valid Brown Card number.'],
    ]
    for (const [sample, status, message] of cases) {
      await page.getByRole('button', { name: sample, exact: true }).click()
      await page.getByRole('button', { name: 'Verify card', exact: true }).click()
      await expect(screen).toContainText(status)
      await expect(screen).toContainText(message)
    }
    // The covered reply shows anonymised policy details only.
    await page.getByRole('button', { name: 'Covered', exact: true }).click()
    await page.getByRole('button', { name: 'Verify card', exact: true }).click()
    await expect(screen).toContainText('Holder: Sample holder 1')
    await expect(screen).toContainText('SAMPLE-001')
    await expect(screen).toContainText('Insurer: Insurer A')
    await expectAnonymised(page)

    // End returns the phone to the dial screen.
    await page.getByRole('button', { name: 'End', exact: true }).click()
    await expect(screen).toContainText('Dial *000#')
  })

  test('downloads quarterly_return.csv with the twelve anonymised insurers', async ({ page }) => {
    await freshStart(page)
    const downloadEvent = page.waitForEvent('download')
    await page.getByRole('button', { name: /Download (quarterly|NAICOM) return/i }).click()
    const download = await downloadEvent
    expect(download.suggestedFilename()).toBe('quarterly_return.csv')
    let csv = ''
    for await (const chunk of (await download.createReadStream())!) csv += chunk.toString()
    const lines = csv.trim().split(/\r?\n/)
    expect(lines[0]).toBe('insurer_id,insurer_name,motor_policies,cards_generated,coverage_pct')
    expect(lines).toHaveLength(13)
    for (const id of 'ABCDEFGHIJKL') expect(csv).toContain(`${id},Insurer ${id},`)
    await expect(page.getByRole('status')).toContainText('quarterly_return.csv')
  })

  test('Reset demo clears the issued cards and the phone', async ({ page }) => {
    await freshStart(page)
    await page.getByRole('button', { name: 'Issue policy and allocate card', exact: true }).click()
    await expect(page.getByTestId('allocated-card')).toContainText(CARD)
    await page.getByRole('button', { name: 'Covered', exact: true }).click()
    await page.getByRole('button', { name: 'Verify card', exact: true }).click()
    await expect(page.getByTestId('ussd-screen')).toContainText('Status: COVERED')

    await page.getByRole('button', { name: 'Reset demo', exact: true }).click()
    await expect(page.getByTestId('card-allocation')).toContainText('Issued this session (0)')
    await expect(page.getByTestId('allocated-card')).not.toContainText(CARD)
    await expect(page.getByRole('button', { name: 'Issued just now', exact: true })).toHaveCount(0)
    await expect(page.getByTestId('ussd-screen')).toContainText('Dial *000#')
    await expect(page.getByLabel('Policyholder', { exact: true })).toHaveValue('Sample holder')
  })
})
