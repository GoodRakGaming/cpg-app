#!/usr/bin/env bash
set -euo pipefail
ROOT="$(dirname "$0")/.."
cd "$ROOT/frontend"

echo "Organizing frontend/..."
mkdir -p docs/phase_archive

DOCS=(PHASE_7.2_IMPLEMENTATION.md PHASE_7.2_PLAN.md PHASE_7.2_QUICK_START.md PHASE_7_STATUS.md README.md)

for f in "${DOCS[@]}"; do
  if [ -f "$f" ]; then
    mv "$f" docs/ || true
    echo "  moved $f -> docs/"
  fi
done

for f in PHASE_7*; do
  if [ -f "$f" ]; then
    mv "$f" docs/phase_archive/ || true
    echo "  archived $f -> docs/phase_archive/"
  fi
done

echo "Created frontend/docs with documentation; left runtime files (app, node_modules, package.json) in place."
ls -la | sed -n '1,200p'
