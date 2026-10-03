# Lane: extras and tests  (agent: Sol; runs on high reasoning, not max)

Folder: `src/features/extras/` and `tests/e2e/`. Default export `ExtrasScreen` from `index.tsx`.
These are the should-have items; if your allowance runs out, the demo still works without them.

## Build (in this order)
1. **Card allocation (step 1)**: a form (holder, vehicle, insurer A to L, cover, term) calling `platform.issuePolicy`; show the allocated card number and the policy summary.
2. **Short-code simulator**: a phone-style screen where the user "dials" a placeholder short code (show `*000#` as a clearly labelled placeholder) and enters a card number; call `platform.verifyCard` and show a compact text result as a USSD screen would. Offer the sample cards as chips.
3. **NAICOM return download**: export a `quarterly_return.csv` from `platform.getQuarterlyReturn()` (insurer, motor policies, cards generated, coverage percent). Expose it as a small exported function and button the compliance lane can use (`export function downloadReturnCsv()`).
4. **Browser tests** (`tests/e2e/`): you may add Playwright as a dev dependency. Cover the acceptance checklist in `docs/ACCEPTANCE.md`: report-to-dashboard under 3 seconds across two pages, compliance starts at 93.4% and climbs, reset restores it, works offline. Add an `npm run test:e2e` script by asking the architect (package.json is frozen).

## Do not
Edit outside `src/features/extras/` and `tests/e2e/`, write to the store directly, or use remote assets.

## Done when
Items 1 to 3 work from a fresh reset and the tests in item 4 pass on the merged build.
