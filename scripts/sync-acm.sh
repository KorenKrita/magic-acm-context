#!/usr/bin/env bash
# sync-acm.sh — Sync ACM code from pi-context and omp-context into magic-acm-context.
#
# File mapping (rename on copy):
#   pi-context/src/index.ts  → packages/pi-plugin/src/acm/tools.ts
#   pi-context/src/lib.ts    → packages/pi-plugin/src/acm/lib.ts
#   omp-context/src/index.ts → packages/omp-plugin/src/acm/tools.ts
#   omp-context/src/lib.ts   → packages/omp-plugin/src/acm/lib.ts
#
# prompt.ts is magic-acm-context's own integration glue — NOT synced from upstream.
#
# Usage:
#   ./scripts/sync-acm.sh <path-to-pi-context>
#   ./scripts/sync-acm.sh <path-to-pi-context> <path-to-omp-context>
# In CI:  ./scripts/sync-acm.sh /tmp/pi-context /tmp/omp-context

set -euo pipefail

PI_CTX="${1:?Usage: sync-acm.sh <path-to-pi-context> [path-to-omp-context]}"
OMP_CTX="${2:-}"
ACM_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Syncing ACM from:"
echo "  pi-context:  $PI_CTX"
if [[ -n "$OMP_CTX" ]]; then
  echo "  omp-context: $OMP_CTX"
else
  echo "  omp-context: skipped"
fi
echo "Into: $ACM_ROOT"

# --- pi-plugin ACM ---
echo "→ Syncing pi-context → packages/pi-plugin/src/acm/"
cp "$PI_CTX/src/index.ts" "$ACM_ROOT/packages/pi-plugin/src/acm/tools.ts"
cp "$PI_CTX/src/lib.ts" "$ACM_ROOT/packages/pi-plugin/src/acm/lib.ts"

# --- omp-plugin ACM (optional) ---
if [[ -n "$OMP_CTX" ]]; then
  echo "→ Syncing omp-context → packages/omp-plugin/src/acm/"
  cp "$OMP_CTX/src/index.ts" "$ACM_ROOT/packages/omp-plugin/src/acm/tools.ts"
  cp "$OMP_CTX/src/lib.ts" "$ACM_ROOT/packages/omp-plugin/src/acm/lib.ts"
fi

echo "✓ ACM sync complete. prompt.ts is preserved (not synced from upstream)."
echo "  Review changes with: git diff packages/*/src/acm/"
