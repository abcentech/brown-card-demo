# The Brown Card as a service: Monday demo (ArkBuilders Consulting)

A front-end-only demo for the meeting with the Nigerian National Bureau of the ECOWAS Brown Card scheme. It tells one
story, a single accident, in five steps over about 30 minutes, and it runs from a laptop with the network off. All data
is illustrative. The operators' platform is represented by a labelled mock until they confirm their API.

Stack: Vite, React, TypeScript, Tailwind v4, Zustand. No backend. Rules for contributors are in `AGENTS.md`.

## The five steps

The presenter drives the demo from the stepper at the top; keys **1** to **5** also jump, **Shift+R** resets. Open the
claims dashboard in a second window with `/?view=claims`; it updates live. Full storyline: `docs/DEMO_SCRIPT.md`.

| Step | Screen | What it shows |
| --- | --- | --- |
| 1 | Platform stand-in | Issue a motor policy; a Brown Card number is allocated with a check digit; a short-code simulator verifies a card (covered, lapsed, not found, invalid); download the quarterly return as CSV |
| 2 | Incident reporter (phone) | Card number checked live; pick the border crossing; add parties, injuries and photos; submit; a reference and an SMS preview appear. Works offline and queues the report until the phone is back online |
| 3 | Claims dashboard stand-in | The new claim appears as **Notified** within seconds; handling and issuing bureau handshake; the insurer's turnaround clock; stage tracker, escalation |
| 4 | Compliance console | Compliance reads 93.4% against the 90 to 95% band; exception list by insurer and channel; back-fill, reminders and assignments clear the gaps and the figure climbs; download the NAICOM return |
| 5 | Close | What we need from the operators, the proposed pilot corridor (Nigeria to Benin through Seme), the working group |

Standalone views for a second window or a phone: `/?view=reporter`, `/?view=claims`, `/?view=compliance`.

## Commands

```
npm install
npm run dev            # http://localhost:5173 (bound to all interfaces)
npm run typecheck      # tsc --noEmit
npm test               # unit tests (vitest): card numbers, seed data, mock platform, compliance, reporter, CSV
npm run test:e2e       # Playwright: builds, serves dist/ on 4173, runs the 14 acceptance tests in tests/e2e
npm run build          # typecheck + production build into dist/ (relative asset paths)
npm run preview        # serve dist/ on http://localhost:4173; add -- --host for the phone on the same Wi-Fi
```

Package the offline copy for the meeting room (zip with `dist/`, `START.txt` and `serve.sh` / `serve.ps1`):

```
bash scripts/package-offline.sh                                       # Mac, Linux, Git Bash
powershell -ExecutionPolicy Bypass -File scripts\package-offline.ps1  # Windows
```

End-to-end test switches (see `tests/e2e/README.md`): `E2E_PORT=<n>` moves the test server when 4173 is busy,
`E2E_PREBUILT=1` serves the existing `dist/` without rebuilding, `E2E_DEV=1` targets `npm run dev` on 5173.
Example on Windows PowerShell: `$env:E2E_PORT=4300; npm run test:e2e`.

Presenter's one-page guide (serve, two windows, phone, reset, troubleshooting): `docs/OFFLINE.md`.

## Folder map

```
src/
  App.tsx                 routes the five steps and the ?view= pages (frozen)
  index.css               Tailwind theme tokens: ink, paper, stone, brown, gold, mint, clay, muted, line (frozen)
  shared/                 types, deterministic seed data, card-number logic, selectors (frozen)
  platform/               the adapter: platform.ts (interface), platform.mock.ts (Monday), platform.live.ts (stub)
  state/store.ts          persisted Zustand store, cross-window sync, reset (frozen)
  features/
    shell/                presenter shell: banner, stepper, reset, keyboard shortcuts, phone frame
    extras/               step 1: card allocation, short-code simulator, quarterly CSV
    reporter/             step 2: the phone flow, offline queue
    claims/               step 3: dashboard stand-in, handshake, turnaround clock
    compliance/           step 4: headline, bars, exception list, return table
    close/                step 5
tests/                    vitest unit tests
tests/e2e/                Playwright acceptance tests (+ a portable runner, run.mjs)
scripts/                  package-offline.sh / .ps1, setup-worktrees.sh
docs/                     DEMO_SCRIPT, CONTRACT, ACCEPTANCE, CHANGE_REQUESTS, OFFLINE, RUNBOOK
```

Each lane folder has a `LANE.md` with its brief.

## The platform adapter and the contract

Screens never talk to a backend directly. Everything goes through one interface, `src/platform/platform.ts`
(`verifyCard`, `createIncident`, `listClaims`, `listMissingCardPolicies`, `applyExceptionAction`, `getQuarterlyReturn`,
`issuePolicy`, `advanceClaim`, `escalateClaim`). On Monday the mock implementation answers from the seed data in the
browser; `platform.live.ts` is the empty slot for the operators' real API. `docs/CONTRACT.md` maps each method to the
HTTP call we assume and lists the questions for the operators. The card-number format (`NG-26-XXXX-XXXX-C`) is a
placeholder until the real one is known.

State lives in the browser (`localStorage`), synced between windows of the same browser with `BroadcastChannel`. That
is what makes the live "report appears on the dashboard" moment work offline. It also means a phone on the Wi-Fi gets
its own copy of the state: good for showing the hand-held flow, but its reports do not reach the laptop's dashboard.

## Illustrative data

All data is invented and anonymised: insurers are **Insurer A to L**, people are "Sample holder N", plates are
"SAMPLE-00N", and the "Illustrative data" banner stays visible on every screen (including the `?view=` pages). No real
insurer names, people or figures may be added. Amounts between bureaux are in FCFA; naira only where a screen needs it.
The build has no CDNs, web fonts or remote images.

## Status

- `docs/ACCEPTANCE.md`: the checklist, with what is covered by `npm run test:e2e` and what still needs a human
  rehearsal (the full run-through under 25 minutes).
- `docs/RUNBOOK.md`: how to run the meeting and what to do when something goes wrong.
- `docs/CHANGE_REQUESTS.md`: requests against frozen files and the architect's decisions on them.

## How it was built

Four lanes (reporter, claims, compliance, extras) were built in parallel by separate agents, each in its own git
worktree created with `bash scripts/setup-worktrees.sh` (always run it through `bash` on Windows Git Bash; the
executable bit is often lost on checkout). Shared files were frozen; lanes could only edit their own folder and had to
file a change request for anything else. Lanes were merged reporter and claims first, then compliance and extras, with a
short review against `docs/ACCEPTANCE.md` at each merge.
