#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Creating target directories..."
mkdir -p docs/phase_archive scripts/windows archive_misc

echo "Moving PowerShell scripts to scripts/windows/..."
for f in start-all.ps1 start-backend.ps1 start-frontend.ps1 test-api.ps1; do
  if [ -f "$f" ]; then
    mv "$f" scripts/windows/
    echo "  moved $f -> scripts/windows/"
  fi
done

echo "Moving docs to docs/..."
DOCS=(FEATURES_IMPLEMENTATION_LOG.md FEATURES_STATUS.md FINAL_REPORT.md MANIFEST.md \
  PHASE_7.2_PART_1_FINAL.md PHASE_7.2_PART_1_REPORT.md PHASE_7.2_TESTING_GUIDE.md \
  PHASE_7_ACTION_PLAN.md PHASE_7_COMPLETE_STATUS.md PORT_CONFLICT_EXPLANATION.md \
  QUICK_START.md QUICK_TEST_5_MIN.md README.txt SETUP_COMPLETE.md SUMMARY.md \
  TESTING_CHECKLIST.md TROUBLESHOOTING.md START_HERE.md commercial_proposal_generator.html)

for f in "${DOCS[@]}"; do
  if [ -f "$f" ]; then
    mv "$f" docs/ || true
    echo "  moved $f -> docs/"
  fi
done

echo "Archiving phase files into docs/phase_archive/..."
for f in PHASE_7_*.md PHASE_7.*.md; do
  if ls $f 1> /dev/null 2>&1; then
    mv $f docs/phase_archive/ || true
    echo "  archived $f -> docs/phase_archive/"
  fi
done

echo "Cleaning up stray editor files and tmp files..."
# no-op here: keep minimal

echo "Done. Summary of new layout:"
ls -la | sed -n '1,200p'

echo "Remember: important files left at root: backend/ frontend/ README_MAIN.md README.md plan.md LICENSE"
