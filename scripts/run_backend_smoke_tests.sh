#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

BASE=http://localhost:3000

echo "== Health check =="
curl -sS "$BASE/health" | jq . || true

TS=$(date +%s)
EMAIL="smoke+${TS}@example.com"
PASSWORD="Test123!"

echo "\n== Register user: $EMAIL =="
REGISTER_RESP=$(curl -sS -X POST "$BASE/api/auth/register" -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"first_name\":\"Smoke\",\"last_name\":\"Test\"}") || true
echo "$REGISTER_RESP" | jq . || true

ACCESS_TOKEN=$(echo "$REGISTER_RESP" | python3 -c "import sys, json
try:
    data=json.load(sys.stdin)
    print(data.get('data',{}).get('access_token',''))
except:
    print('')")

if [ -z "$ACCESS_TOKEN" ]; then
  echo "\nRegister didn't return access token; trying login..."
  LOGIN_RESP=$(curl -sS -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}") || true
  echo "$LOGIN_RESP" | jq . || true
  ACCESS_TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys, json
try:
    data=json.load(sys.stdin)
    print(data.get('data',{}).get('access_token',''))
except:
    print('')")
fi

if [ -n "$ACCESS_TOKEN" ]; then
  echo "\n== Access token obtained (truncated) =="
  echo "${ACCESS_TOKEN:0:40}..."

  echo "\n== GET /api/templates (protected) =="
  curl -sS -H "Authorization: Bearer $ACCESS_TOKEN" "$BASE/api/templates" | jq . || true

  echo "\n== GET /api/proposals (protected) =="
  curl -sS -H "Authorization: Bearer $ACCESS_TOKEN" "$BASE/api/proposals" | jq . || true
else
  echo "\nERROR: No access token obtained; cannot run protected tests"
  exit 1
fi

echo "\n✅ Smoke tests finished"
