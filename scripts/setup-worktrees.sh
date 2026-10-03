#!/usr/bin/env bash
# One git worktree and branch per lane, so parallel agents never touch each other's files.
# Usage: bash scripts/setup-worktrees.sh   (run from the repo root, after the scaffold is committed)
#
# Always invoke it through `bash ...`: on Windows Git Bash the executable bit is often lost on checkout,
# so `./scripts/setup-worktrees.sh` fails with "Permission denied" while `bash scripts/...` works everywhere.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PARENT="$(dirname "$ROOT")"
NAME="$(basename "$ROOT")"
for lane in reporter claims compliance extras; do
  dir="$PARENT/$NAME-$lane"
  if [ -d "$dir" ]; then echo "exists: $dir"; continue; fi
  if git -C "$ROOT" show-ref --verify --quiet "refs/heads/lane/$lane"; then
    git -C "$ROOT" worktree add "$dir" "lane/$lane"          # branch already exists (e.g. re-run after a cleanup)
  else
    git -C "$ROOT" worktree add -b "lane/$lane" "$dir"
  fi
  (cd "$dir" && npm install --silent) || echo "note: npm install failed in $dir; run it by hand"
  echo "ready: $dir  (branch lane/$lane)"
done
echo
echo "Open one agent per folder:"
echo "  reporter   -> Sonnet   ($PARENT/$NAME-reporter)"
echo "  claims     -> Gemini   ($PARENT/$NAME-claims)"
echo "  compliance -> Fable    ($PARENT/$NAME-compliance)   [also merges]"
echo "  extras     -> Sol      ($PARENT/$NAME-extras)"
echo
echo "Merge with: git merge lane/reporter lane/claims   (then lane/compliance lane/extras)"
