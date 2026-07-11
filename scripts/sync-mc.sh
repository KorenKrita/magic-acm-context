#!/usr/bin/env bash
# sync-mc.sh — Sync magic-context upstream into magic-acm-context.
#
# Copies upstream packages while preserving canonical ACM artifacts under
# src/acm/. Pi keeps its legacy injector. OMP integration is a reviewed patch
# that must apply cleanly or the sync aborts before publication.
#
# Usage: ./scripts/sync-mc.sh <path-to-magic-context>
# In CI:  ./scripts/sync-mc.sh /tmp/magic-context

set -euo pipefail

MC_ROOT="${1:?Usage: sync-mc.sh <path-to-magic-context>}"
ACM_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$ACM_ROOT/scripts"

echo "Syncing from: $MC_ROOT"
echo "Into:         $ACM_ROOT"

# --- 1. Sync packages/plugin (preserve package.json for workspace config) ---
echo "→ Syncing packages/plugin..."
rsync -a --delete \
  --exclude='node_modules/' \
  --exclude='package.json' \
  "$MC_ROOT/packages/plugin/" "$ACM_ROOT/packages/plugin/"

# --- 2. Sync packages/pi-plugin (preserve src/acm/) ---
echo "→ Syncing packages/pi-plugin..."
rsync -a --delete \
  --exclude='node_modules/' \
  --exclude='dist/' \
  --exclude='src/acm/' \
  --exclude='package.json' \
  "$MC_ROOT/packages/pi-plugin/" "$ACM_ROOT/packages/pi-plugin/"

# --- 3. Sync packages/omp-plugin (preserve src/acm/) ---
echo "→ Syncing packages/omp-plugin..."
rsync -a --delete \
  --exclude='node_modules/' \
  --exclude='dist/' \
  --exclude='src/acm/' \
  --exclude='package.json' \
  "$MC_ROOT/packages/omp-plugin/" "$ACM_ROOT/packages/omp-plugin/"

# --- 4. Sync upstream versions while preserving local manifest customizations ---
echo "→ Syncing package versions..."
MC_ROOT="$MC_ROOT" ACM_ROOT="$ACM_ROOT" node <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

for (const packageName of ["plugin", "pi-plugin", "omp-plugin"]) {
  const sourcePath = path.join(process.env.MC_ROOT, "packages", packageName, "package.json");
  const targetPath = path.join(process.env.ACM_ROOT, "packages", packageName, "package.json");
  const version = JSON.parse(fs.readFileSync(sourcePath, "utf8")).version;
  const target = fs.readFileSync(targetPath, "utf8");
  const updated = target.replace(
    /(\"version\"\s*:\s*\")[^\"]+(\")/,
    `$1${version}$2`,
  );
  if (updated === target && !target.includes(`\"version\": \"${version}\"`)) {
    throw new Error(`Could not update version in ${targetPath}`);
  }
  fs.writeFileSync(targetPath, updated);
}
NODE

# --- 5. Sync files required by upstream generators and test isolation ---
echo "→ Syncing schema, configuration reference, and CLI test preload config..."
mkdir -p \
  "$ACM_ROOT/assets" \
  "$ACM_ROOT/packages/docs/src/content/docs/reference" \
  "$ACM_ROOT/packages/cli"
cp "$MC_ROOT/assets/magic-context.schema.json" \
  "$ACM_ROOT/assets/magic-context.schema.json"
cp "$MC_ROOT/packages/docs/src/content/docs/reference/configuration.md" \
  "$ACM_ROOT/packages/docs/src/content/docs/reference/configuration.md"
cp "$MC_ROOT/packages/cli/bunfig.toml" \
  "$ACM_ROOT/packages/cli/bunfig.toml"

# --- 6. Restore consumer-owned integration seams ---
echo "→ Injecting Pi ACM glue..."
node "$SCRIPT_DIR/inject-pi-acm.mjs" \
  "$ACM_ROOT/packages/pi-plugin/src/index.ts" \
  "$ACM_ROOT/packages/pi-plugin/src/system-prompt.ts"

echo "→ Applying checked OMP integration overlay..."
git -C "$ACM_ROOT" apply --check "$SCRIPT_DIR/omp-integration.patch"
git -C "$ACM_ROOT" apply "$SCRIPT_DIR/omp-integration.patch"

echo "✓ Magic Context sync complete. OMP canonical artifacts must be published separately by omp-context sync:acm."
