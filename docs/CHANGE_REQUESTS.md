# Change requests to frozen files

Add one line each: lane, file, what you need, why.

- All lanes, `src/shared/seed.ts`: replace realistic personal names and vehicle plates with explicit sample identities; screens mask these fields, but frozen persisted registry still contains them.
- Reporter/claims, `src/platform/platform.mock.ts`: create every claim at stage 0 (Notified) as CONTRACT.md requires; covered reports currently start at stage 1 and existing tests assert that behavior.
- All lanes, `src/platform/platform.mock.ts` and `src/state/store.ts`: add reset generation/cancellation so requests already in flight cannot mutate the newly reset demo; lane UI guards cannot cancel adapter mutations.
- Claims, `src/platform/platform.ts`: expose escalation and bureau acknowledgement methods; the claim escalation control is explicitly a local demo flag until these exist.
- Compliance, `src/platform/platform.ts` and `src/shared/types.ts`: accept and persist an assignment contact; the adapter currently records only assigned status, so the UI labels Sample contact A as a demo contact.
- Extras/tests, `package.json`: optionally add a test:e2e script after approval; portable runner in tests/e2e uses the bundled Playwright runtime without changing dependencies.
- extras / package.json: add `"test:e2e": "playwright test"` to scripts (and `@playwright/test` is now in devDependencies, approved) so the browser tests in tests/e2e run with `npm run test:e2e`.
- extras / vite.config.ts: add `test.exclude: ['tests/e2e/**', 'node_modules/**']` so vitest never picks up the Playwright specs (they are named *.spec.ts today, so the current include pattern skips them, but the exclude makes it safe if that changes).
