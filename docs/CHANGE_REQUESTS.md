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

## Architect decisions (3 Oct 2026)
- Seed names and plates: DONE. Registry now uses "Sample holder N" and "SAMPLE-00N" identities.
- New claims start at stage 0 (Notified): DONE in the mock; test updated. Covered cards still show as verified on the reporter result.
- Reset generation: DONE. `getResetGeneration()` in the store; the mock drops createIncident, applyExceptionAction and issuePolicy results that were in flight across a reset.
- Escalation: DONE. `platform.escalateClaim(ref)` sets the claim's `escalated` flag. Claims lane: use it instead of the local note.
- Assignment contact: DONE. `applyExceptionAction(ids, 'assign', assignee?)` persists `ExceptionRow.assignee`. Compliance lane: pass the contact and show it from the row.
- test:e2e script and vitest exclude: DONE.
