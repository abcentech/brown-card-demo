# The Brown Card as a service: Monday demo (ArkBuilders Consulting)

Front-end-only demo on illustrative, anonymised data. The operators' platform is represented by a labelled mock
until they confirm their API. See `AGENTS.md` for the rules and `docs/` for the script, contract and checklist.

## Run
```
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests (card numbers, seed data, mock platform)
npm run build        # typecheck + production build into dist/
npm run preview      # serve the production build
```
Offline copy for the meeting: `npm run build`, then `python3 -m http.server -d dist 8080` (or `npm run preview`).
Open `/?view=reporter` (phone or second window) and `/?view=claims` to see live sync across windows.

## What is in the scaffold (the architect step, done)
- `src/shared`: types, deterministic seed data (Insurer A to L, 93.4% starting compliance, 150 exception rows, 6 claims), card-number logic, selectors
- `src/platform`: adapter interface, working mock, empty live stub
- `src/state/store.ts`: persisted store, cross-window sync, reset
- `src/features/*`: one placeholder screen per lane, each with a `LANE.md` brief
- `scripts/setup-worktrees.sh`: one git worktree per lane for parallel agents

## Parallel build
1. Commit the scaffold, then run `./scripts/setup-worktrees.sh`.
2. Open one agent per worktree: reporter (Sonnet), claims and shell (Gemini), compliance (Fable), extras and tests (Sol).
3. Each agent reads `AGENTS.md` and its `LANE.md`, builds its screen, and hands back when typecheck, tests and build pass.
4. Merge reporter and claims first (the live "report appears on the dashboard" moment), then compliance and extras. Run `docs/ACCEPTANCE.md`.
