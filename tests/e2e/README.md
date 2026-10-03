# Browser acceptance checks

The portable runner uses an installed Playwright package, or Codex's bundled Playwright runtime. It starts Chromium with the installed Chrome or Edge executable, without downloading dependencies or a browser.

With the built demo served by `npm run preview`:

```powershell
$env:DEMO_URL = 'http://127.0.0.1:4173'
node tests/e2e/run.mjs
```

Optional overrides: `PLAYWRIGHT_MODULE` points to a Playwright package; `BROWSER_EXECUTABLE` points to a Chromium executable. The runner defaults to the development origin at port 5173 when `DEMO_URL` is absent.

The formal Playwright suite runs with `npm run test:e2e` (builds, then serves `dist/` on port 4173). It covers the
acceptance checklist: report-to-dashboard under 3 seconds across two pages, compliance starts at 93.4% and climbs,
Reset (button and Shift+R) restores the start state, offline use and the queued report, the illustrative-data banner
and anonymised text on all five steps and the three `?view=` pages, and step 1 (allocation, the four short-code
outcomes, the quarterly CSV, reset). Every test fails on any page error or console error (`fixtures.ts`), starts from a
cleared `localStorage`, and uses role or text selectors only. The whole run takes about a minute.

Environment switches for `playwright.config.ts`: `E2E_DEV=1` targets `npm run dev` on 5173; `E2E_PREBUILT=1` serves the
existing `dist/` without rebuilding; `E2E_PORT=<n>` moves the server when the default port is busy. The web server is
never reused and there are no retries, so a flaky test shows up as a failure.

The portable runner additionally checks ending an in-flight short-code check, exception filters, reminders and
assignments. External requests are blocked and treated as failures.

## Current handoff blocker

The standalone claims screen at `/?view=claims` does not show the required "Illustrative data" banner (the banner on
steps 1 to 5 comes from the presenter shell, which that page bypasses). `banners.spec.ts › standalone ?view=claims
page` fails on it. Keep this assertion enabled. The claims owner must add the banner inside `src/features/claims`,
then rerun against a fresh build.

## Visual checks

`artifacts/extras-projector.png` shows the extras lane at 1280 px. `artifacts/extras-mobile.png` shows it at 360 px. The mobile cover and term controls stack to avoid overlap; browser measurements confirm viewport and document content are both 360 px wide.
