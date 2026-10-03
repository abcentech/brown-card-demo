import { defineConfig, devices } from '@playwright/test'

// Browser tests against the production build served by `vite preview` (the offline build we demo from).
// Set E2E_DEV=1 to run against `npm run dev` on 5173 instead.
// Set E2E_PREBUILT=1 to serve an existing dist/ without rebuilding (e.g. after `npx vite build`).
// Set E2E_PORT to move the test server when 4173 (or 5173) is already taken.
const dev = !!process.env.E2E_DEV
const prebuilt = !!process.env.E2E_PREBUILT
const port = Number(process.env.E2E_PORT) || (dev ? 5173 : 4173)
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: dev
      ? `npm run dev -- --port ${port} --strictPort`
      : `${prebuilt ? '' : 'npm run build && '}npm run preview -- --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
