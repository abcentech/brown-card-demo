# The Brown Card as a service: demo build rules

Front-end-only demo for a Monday meeting with the Nigerian National Bureau of the ECOWAS Brown Card scheme.
Built by ArkBuilders Consulting. Stack: Vite, React, TypeScript, Tailwind v4, Zustand. No backend.

## Read first
1. `docs/DEMO_SCRIPT.md` (the 30-minute storyline this app must support)
2. `docs/CONTRACT.md` (the API we assume from the operators)
3. Your lane brief: `src/features/<lane>/LANE.md`
4. `docs/ACCEPTANCE.md` (what "done" means)

## Commands
- `npm install` then `npm run dev` (open http://localhost:5173)
- `npm run typecheck`, `npm test`, `npm run build` must all pass before you hand back your lane
- `npm run build && npm run preview` to test the offline build

## The rules (non-negotiable)
- **One folder per lane.** Edit only `src/features/<your lane>/` (and `tests/e2e` for the extras lane).
- **Frozen files**: `src/shared/*`, `src/state/store.ts`, `src/platform/*`, `src/App.tsx`, `src/index.css`, `package.json`. Do not edit them. If you need a change, write it up in `docs/CHANGE_REQUESTS.md` and carry on with a workaround.
- **Talk to the operators' system only through `src/platform`** (`import { platform } from '../../platform'`). Read live data with `useDemo` selectors from `src/state/store`. Never write to the store directly.
- **No new dependencies** without approval (the extras lane may add Playwright). Everything must work offline: no CDNs, no web fonts, no remote images.
- **All data is illustrative and anonymised** (Insurer A to L). No real insurer names, people or numbers. Keep the "Illustrative data" banner visible.
- **Language**: plain English, short labels. Currency in FCFA for claims between bureaux and in naira only where a screen needs it.
- **Design**: use the Tailwind theme tokens in `src/index.css` (`ink`, `paper`, `stone`, `brown`, `gold`, `mint`, `clay`, `muted`, `line`). Mobile-first for the reporter; projector-readable (large type, high contrast) for the others. Minimum 16px body text on screens shown on a projector.
- **Small, finished steps.** Commit often on your branch. Paste errors verbatim when stuck. Do not reread the whole repo: you need the shared types, the platform interface and your folder.

## Definition of done for a lane
Typecheck, tests and build pass; your screen matches the brief; it works with the network off; it behaves after "Reset demo"; no console errors.

## Review
At each merge, another agent spends about 15 minutes reviewing the lane against its brief and `docs/ACCEPTANCE.md`.
