import { defineConfig, devices } from '@playwright/test'

// Browser tests against the production build served by `vite preview` (the offline build we demo from).
// Set E2E_DEV=1 to run against `npm run dev` on 5173 instead.
const dev = !!process.env.E2E_DEV
const port = dev ? 5173 : 4173
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: dev ? `npm run dev -- --port ${port} --strictPort` : `npm run build && npm run preview -- --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
