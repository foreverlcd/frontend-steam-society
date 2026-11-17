#!/usr/bin/env bash
# One command = every quality check (see ../backend-steam-society/docs/HARNESS.md).
#   scripts/gate.sh   boundaries, lint, format, unit tests, build, secret scan
set -uo pipefail
cd "$(dirname "$0")/.."
LOG_DIR="$(mktemp -d)"
FAILED=0

step() {
  local name="$1"; shift
  local log="$LOG_DIR/$name.log"
  local start=$SECONDS
  if "$@" >"$log" 2>&1; then
    printf '  ok    %-12s %3ss\n' "$name" $((SECONDS - start))
  else
    printf '  FAIL  %-12s %3ss\n' "$name" $((SECONDS - start))
    echo "----- $name (last 40 lines) -----"; tail -n 40 "$log"; echo "-----"
    FAILED=1
  fi
}

secret_scan() {
  local base; base="$(git merge-base HEAD origin/main 2>/dev/null || echo HEAD)"
  local hits
  hits="$( { git diff "$base"; git diff HEAD; } | grep -E '^\+' \
    | grep -inE "(password|secret|token|api[_-]?key)[\"']?\s*[:=]\s*[\"'][^\"'\$<{]{8,}|BEGIN [A-Z ]*PRIVATE KEY" \
    | grep -vE "example|placeholder|changeme|test-only" || true)"
  if git ls-files | grep -qE '^\.env($|\.local$)'; then echo ".env file is tracked by git"; return 1; fi
  [ -z "$hits" ] || { echo "$hits"; return 1; }
}

echo "gate web"
step boundaries node scripts/check-boundaries.mjs
step lint       pnpm -s exec eslint
step format     pnpm -s exec prettier --check src scripts
step unit       pnpm -s test
step build      pnpm -s build
step secrets    secret_scan
rm -rf "$LOG_DIR"
[ "$FAILED" = 0 ] && echo "GATE PASSED" || { echo "GATE FAILED"; exit 1; }
