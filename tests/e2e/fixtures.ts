import { expect, test as base, type Page } from '@playwright/test'

export { expect }

/**
 * Every test fails if any page in its context throws (pageerror) or logs a console error.
 * Applies to pages opened later too (the second "window" in the two-page tests).
 */
export const test = base.extend<{ errorGuard: void }>({
  errorGuard: [
    async ({ context }, use) => {
      const errors: string[] = []
      const attach = (page: Page) => {
        page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
        page.on('console', (m) => {
          if (m.type() === 'error') errors.push(`console.error: ${m.text()}`)
        })
      }
      context.pages().forEach(attach)
      context.on('page', attach)
      await use()
      expect(errors, 'no page errors or console errors during the test').toEqual([])
    },
    { auto: true },
  ],
})
