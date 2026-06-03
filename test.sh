#!/usr/bin/env bash
set -euo pipefail

PASS=0
FAIL=0
ERRORS=()

# find all test files
TEST_FILES=$(find packages -name "*.test.ts" 2>/dev/null | sort)

if [ -z "$TEST_FILES" ]; then
    echo "no tests found"
    exit 0
fi

for file in $TEST_FILES; do
    if npx tsx "$file"; then
        PASS=$((PASS + 1))
    else
        FAIL=$((FAIL + 1))
        ERRORS+=("$file")
    fi
done

echo ""
echo "results: $PASS passed, $FAIL failed"

if [ ${#ERRORS[@]} -gt 0 ]; then
    echo ""
    echo "failed:"
    for f in "${ERRORS[@]}"; do
        echo "  $f"
    done
    exit 1
fi
