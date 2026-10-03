# Browser acceptance checks

The portable runner uses an installed Playwright package, or Codex's bundled Playwright runtime. It starts Chromium with the installed Chrome or Edge executable, without downloading dependencies or a browser.

With the built demo served by `npm run preview`:

```powershell
$env:DEMO_URL = 'http://127.0.0.1:4173'
node tests/e2e/run.mjs
```

Optional overrides: `PLAYWRIGHT_MODULE` points to a Playwright package; `BROWSER_EXECUTABLE` points to a Chromium executable. The runner defaults to the development origin at port 5173 when `DEMO_URL` is absent.

The formal Playwright suite is also available through `npm run test:e2e`. It covers the report-to-dashboard path, compliance baseline and progress, reset, offline behaviour and illustrative-data banners.

The portable runner additionally checks allocation, all four card verification statuses, quarterly CSV filename and twelve insurer rows, ending an in-flight short-code check, allocation reset, exception filters, reminders and assignments. External requests are blocked and treated as failures. Report arrival must take less than three seconds.

## Current handoff blocker

The standalone claims screen at `/?view=claims` does not show the required "Illustrative data" banner in the current merged implementation. The portable runner fails its final banner assertion on that screen. Keep this assertion enabled. The claims owner must restore the banner, then rerun against a fresh build. All earlier portable checks passed, including a 1,453 ms cross-window arrival and offline queued-report reconnect.

## Visual checks

`artifacts/extras-projector.png` shows the extras lane at 1280 px. `artifacts/extras-mobile.png` shows it at 360 px. The mobile cover and term controls stack to avoid overlap; browser measurements confirm viewport and document content are both 360 px wide.
