#!/usr/bin/env bash
# sync-mc.sh — Sync magic-context upstream into magic-acm-context.
#
# Copies packages/plugin, packages/pi-plugin, packages/omp-plugin from
# magic-context, preserving ACM-only files (src/acm/), then injects
# the minimal ACM glue into index.ts and system-prompt.ts.
#
# Usage: ./scripts/sync-mc.sh <path-to-magic-context>
# In CI:  ./scripts/sync-mc.sh /tmp/magic-context

set -euo pipefail

MC_ROOT="${1:?Usage: sync-mc.sh <path-to-magic-context>}"
ACM_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$ACM_ROOT/scripts"

echo "Syncing from: $MC_ROOT"
echo "Into:         $ACM_ROOT"

# --- 1. Sync packages/plugin (no ACM modifications, straight copy) ---
echo "→ Syncing packages/plugin..."
rsync -a --delete \
  --exclude='node_modules/' \
  "$MC_ROOT/packages/plugin/" "$ACM_ROOT/packages/plugin/"

# --- 2. Sync packages/pi-plugin (preserve src/acm/) ---
echo "→ Syncing packages/pi-plugin..."
rsync -a --delete \
  --exclude='node_modules/' \
  --exclude='src/acm/' \
  --exclude='package.json' \
  "$MC_ROOT/packages/pi-plugin/" "$ACM_ROOT/packages/pi-plugin/"

# --- 3. Sync packages/omp-plugin (preserve src/acm/) ---
echo "→ Syncing packages/omp-plugin..."
rsync -a --delete \
  --exclude='node_modules/' \
  --exclude='src/acm/' \
  --exclude='package.json' \
  "$MC_ROOT/packages/omp-plugin/" "$ACM_ROOT/packages/omp-plugin/"

# --- 4. Inject ACM glue ---
echo "→ Injecting ACM glue into pi-plugin..."
node "$SCRIPT_DIR/inject-acm.mjs" \
  "$ACM_ROOT/packages/pi-plugin/src/index.ts" \
  "$ACM_ROOT/packages/pi-plugin/src/system-prompt.ts"

echo "→ Injecting ACM glue into omp-plugin..."
node "$SCRIPT_DIR/inject-acm.mjs" \
  "$ACM_ROOT/packages/omp-plugin/src/index.ts" \
  "$ACM_ROOT/packages/omp-plugin/src/system-prompt.ts"

echo "✓ Sync complete. Review changes with: git diff"
