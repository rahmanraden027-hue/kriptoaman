#!/usr/bin/env bash
set -Eeuo pipefail

BASE="${ZVQ_INDEXER_BASE:-http://127.0.0.1:8765}"

first="$(curl -fsS --max-time 5 "$BASE/v1/discovery")"
[[ "$(jq -r '.status' <<<"$first")" == live ]]
[[ "$(jq -r '.websocketSubscribed' <<<"$first")" == true ]]
first_head="$(jq -r '.head.number // -1' <<<"$first")"
[[ "$first_head" =~ ^[0-9]+$ ]]

latest="$first"
for _ in 1 2 3 4 5 6; do
  sleep 5
  latest="$(curl -fsS --max-time 5 "$BASE/v1/discovery")"
  latest_head="$(jq -r '.head.number // -1' <<<"$latest")"
  if [[ "$latest_head" =~ ^[0-9]+$ ]] && (( latest_head > first_head )); then
    break
  fi
done

latest_head="$(jq -r '.head.number // -1' <<<"$latest")"
[[ "$latest_head" =~ ^[0-9]+$ ]]
(( latest_head > first_head ))

samples="$(jq -r '.latency.samples // 0' <<<"$latest")"
p95="$(jq -r '.latency.p95Ms // empty' <<<"$latest")"
[[ "$samples" =~ ^[0-9]+$ ]]
(( samples >= 1 ))
[[ "$p95" =~ ^[0-9]+([.][0-9]+)?$ ]]

radar="$(curl -fsS --max-time 5 "$BASE/v1/radar")"
[[ "$(jq -r '.provenance.ownership' <<<"$radar")" == first-party ]]
[[ "$(jq -r '.provenance.externalMarketProviderUsed' <<<"$radar")" == false ]]
[[ "$(jq -r '.product' <<<"$radar")" == "QoryVEx New Contract Radar" ]]

jq -cn \
  --argjson first "$first_head" \
  --argjson latest "$latest_head" \
  --argjson samples "$samples" \
  --argjson p95 "$p95" \
  '{gate:"PASS",firstHead:$first,latestHead:$latest,indexLatencySamples:$samples,indexP95Ms:$p95,source:"first-party ZEVARYQ WebSocket"}'
