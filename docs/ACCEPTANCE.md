# Acceptance checklist (before we leave for the office)

Status on 3 Oct 2026 after the lane reviews. Automated items are covered by `npm run test:e2e` (14 tests).

- [ ] A full run-through from reset takes under 25 minutes without help (presenter to rehearse; not automatable)
- [x] A report submitted in the reporter appears on the dashboard in under 3 seconds (two windows on the same laptop) — e2e `report-to-dashboard.spec.ts`, measured about 1.4 s
- [x] The compliance figure starts at 93.4% and climbs when exceptions are cleared — e2e `compliance.spec.ts`
- [x] Everything works with the network switched off (`npm run build && npm run preview`, or `python3 -m http.server -d dist`) — e2e `offline.spec.ts`; no CDNs, fonts or remote images in the build
- [x] Reset returns the app to the starting state — e2e `reset.spec.ts` (Shift+R and the button); in-flight mock requests are dropped across a reset, in every window
- [x] Every screen shows the illustrative-data banner — e2e `banners.spec.ts` (steps 1 to 5 and the three `?view=` pages)
- [x] No real insurer names, people or numbers appear anywhere — Insurer A to L; registry uses "Sample holder N" and "SAMPLE-00N"; e2e asserts the old seed names are gone
- [x] Typecheck, unit tests and build pass — `npm run typecheck`, `npm test` (32), `npm run build`
