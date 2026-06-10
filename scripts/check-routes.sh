#!/usr/bin/env bash
# Parity matrix for the fctc.fun routing table.
#
# Asserts every URL that worked through the old Cloudflare Worker still works
# through the hub's vercel.json rewrites. Run it against a preview deploy
# BEFORE any DNS change, and against fctc.fun after cutover:
#
#   scripts/check-routes.sh https://fctc-site-<hash>.vercel.app
#   scripts/check-routes.sh https://fctc.fun
#
# Each route is fetched from BASE and from the upstream it should proxy to;
# the test passes when both return HTTP 200 and the same body hash. Routes
# marked "status" only compare status codes (HTML shells embed absolute URLs
# that legitimately differ per host).
set -euo pipefail

BASE="${1:?usage: check-routes.sh <base-url> (e.g. a preview deploy URL)}"
BASE="${BASE%/}"

DASH="https://fctc2025.cpd.dev"
CUP="https://fctc-cup-2026.vercel.app"

pass=0 fail=0

check() {
  local mode="$1" path="$2" upstream="$3"
  local got want body_a body_b
  got=$(curl -s -o /tmp/route_a -w '%{http_code}' "$BASE$path")
  want=$(curl -s -o /tmp/route_b -w '%{http_code}' "$upstream")

  if [[ "$got" != "200" || "$want" != "200" ]]; then
    printf 'FAIL %-28s hub=%s upstream=%s\n' "$path" "$got" "$want"
    fail=$((fail + 1))
    return
  fi

  if [[ "$mode" == "body" ]]; then
    body_a=$(shasum -a 256 /tmp/route_a | cut -d' ' -f1)
    body_b=$(shasum -a 256 /tmp/route_b | cut -d' ' -f1)
    if [[ "$body_a" != "$body_b" ]]; then
      printf 'FAIL %-28s body differs from upstream\n' "$path"
      fail=$((fail + 1))
      return
    fi
  fi

  printf 'ok   %-28s\n' "$path"
  pass=$((pass + 1))
}

# Hub-owned pages: just status checks against itself.
hub_check() {
  local path="$1" want="$2" got
  got=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$path")
  if [[ "$got" == "$want" ]]; then
    printf 'ok   %-28s (%s)\n' "$path" "$got"
    pass=$((pass + 1))
  else
    printf 'FAIL %-28s want=%s got=%s\n' "$path" "$want" "$got"
    fail=$((fail + 1))
  fi
}

echo "== hub pages =="
hub_check "/" 200
hub_check "/definitely-not-a-page" 404

echo "== dashboard =="
check status "/dashboard" "$DASH/"
check status "/dashboard/anything" "$DASH/anything" # SPA fallback
check body "/fctc_logo.jpeg" "$DASH/fctc_logo.jpeg"
check body "/coffee.svg" "$DASH/coffee.svg"

echo "== wrapped (path rename: /2025wrapped -> /wrapped) =="
check status "/2025wrapped" "$DASH/wrapped"
check status "/2025wrapped/ada" "$DASH/wrapped/ada" # member deep link

echo "== cup =="
check status "/cup" "$CUP/cup"
check body "/cup/replay.json" "$CUP/cup/replay.json"

# Root-namespace assets owned by the dashboard. Discover a real /assets and
# /data path from the dashboard's HTML rather than hardcoding hashed names.
echo "== reserved root namespaces =="
asset_path=$(curl -s "$DASH/" | grep -oE '/assets/[^"]+\.(js|css)' | head -1 || true)
if [[ -n "$asset_path" ]]; then
  check body "$asset_path" "$DASH$asset_path"
else
  echo 'warn /assets/* — no asset path found in dashboard HTML, check manually'
fi
data_path=$(curl -s "$DASH/" | grep -oE '/data/[^"]+' | head -1 || true)
if [[ -n "$data_path" ]]; then
  check body "$data_path" "$DASH$data_path"
else
  # the dashboard fetches /data/* at runtime, so it won't appear in the HTML;
  # spot-check one URL from the browser network tab when running this.
  echo 'warn /data/* — no data path in dashboard HTML, spot-check manually'
fi

echo
echo "passed=$pass failed=$fail"
[[ "$fail" -eq 0 ]]
