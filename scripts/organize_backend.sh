#!/usr/bin/env bash
set -euo pipefail
ROOT="$(dirname "$0")/.."
cd "$ROOT/backend"

echo "Organizing backend/..."
mkdir -p docs/phase_archive scripts_windows

# Move markdown docs to docs/
DOCS=(API_TESTING_EXAMPLES.md PHASE_1_STATUS.md PHASE_2_COMPLETE.md PHASE_2_STATUS.md \
  PHASE_2_TEST_REPORT.md PHASE_3_COMPLETE.md PHASE_3_EXAMPLES.md PHASE_3_STATUS.md \
  PHASE_3_TEST_REPORT.md PHASE_4_COMPLETE.md PHASE_4_EXAMPLES.md PHASE_4_STATUS.md \
  PHASE_4_TEST_REPORT.md PHASE_5_COMPLETE.md PHASE_5_SUMMARY.md PHASE_5_TESTING.md \
  PHASE_5_TEST_REPORT.md PRE_PHASE_5_VERIFICATION.md PROJECT_OVERVIEW.md QUICK_REFERENCE.ps1 README.md)

for f in "${DOCS[@]}"; do
  if [ -f "$f" ]; then
    mv "$f" docs/ 2>/dev/null || mv "$f" scripts_windows/ 2>/dev/null || true
    echo "  moved $f -> docs/ or scripts_windows/"
  fi
done

# Archive PHASE_* into phase_archive
for f in PHASE_*; do
  if [ -f "$f" ]; then
    mv "$f" docs/phase_archive/ || true
    echo "  archived $f -> docs/phase_archive/"
  fi
done

echo "Created backend/docs with documentation; left runtime files (src, migrations, node_modules, .env, package.json) in place."
ls -la | sed -n '1,200p'
