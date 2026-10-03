#!/usr/bin/env bash
# One git worktree and branch per lane, so parallel agents never touch each other's files.
# Usage: ./scripts/setup-worktrees.sh   (run from the repo root, after the scaffold is committed)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PARENT="$(dirname "$ROOT")"
NAME="$(basename "$ROOT")"
for lane in reporter claims compliance extras; do
  dir="$PARENT/$NAME-$lane"
  if [ -d "$dir" ]; then echo "exists: $dir"; continue; fi
  git -C "$ROOT" worktree add -b "lane/$lane" "$dir"
  (cd "$dir" && npm install --silent) || true
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
