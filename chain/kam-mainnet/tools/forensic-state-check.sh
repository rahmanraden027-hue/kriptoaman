#!/usr/bin/env bash
set -euo pipefail

RPC="${KAM_FORENSIC_RPC:-http://127.0.0.1:8650}"
WKAM="0x0d8848CE88BB09a81a4248Efdd574d50B98b544A"
FACTORY="0x5024017B0496113269EB0817d9b0F11733AE6de2"
ROUTER="0x4a413674245EE095918360C4153e386C00409122"
DEPLOY_BLOCK="0x5de71"

rpc() {
  local method="$1" params="$2" id="$3"
  curl -fsS --connect-timeout 3 --max-time 10 -X POST "$RPC" \
    -H 'Content-Type: application/json' \
    --data "{\"jsonrpc\":\"2.0\",\"method\":\"$method\",\"params\":$params,\"id\":$id}"
}

CHAIN="$(rpc eth_chainId '[]' 1 | python3 -c 'import sys,json; print((json.load(sys.stdin).get("result") or ""))')"
[ "$CHAIN" = "0x560c" ] || { echo "wrong/unavailable chain id: $CHAIN" >&2; exit 1; }

HEAD_JSON="$(rpc eth_getBlockByNumber '["latest",false]' 2)"
HEAD_HEX="$(printf '%s' "$HEAD_JSON" | python3 -c 'import sys,json; print((json.load(sys.stdin).get("result") or {}).get("number") or "0x0")')"
HEAD_DEC=$((HEAD_HEX))
DEPLOY_DEC=$((DEPLOY_BLOCK))

echo "chainId=$CHAIN"
echo "head=$HEAD_HEX ($HEAD_DEC)"
if [ "$HEAD_DEC" -lt "$DEPLOY_DEC" ]; then
  echo "SYNCING: head has not reached deployment block $DEPLOY_BLOCK ($DEPLOY_DEC)"
  exit 2
fi

for ITEM in "WKAM:$WKAM" "FACTORY:$FACTORY" "ROUTER:$ROUTER"; do
  NAME="${ITEM%%:*}"
  ADDR="${ITEM#*:}"
  echo
  echo "===== $NAME ====="
  LATEST="$(rpc eth_getCode "[\"$ADDR\",\"latest\"]" 3 | python3 -c 'import sys,json; print(json.load(sys.stdin).get("result"))')"
  echo "latest_code_bytes=$(( (${#LATEST}-2)/2 ))"
  HIST="$(rpc eth_getCode "[\"$ADDR\",\"$DEPLOY_BLOCK\"]" 4 || true)"
  python3 - "$HIST" <<'PY'
import json,sys
try:
    x=json.loads(sys.argv[1]); print('deploy_block_result=', x.get('result')); print('deploy_block_error=', x.get('error'))
except Exception as e:
    print('deploy_block_parse_error=', e)
PY
  PROOF="$(rpc eth_getProof "[\"$ADDR\",[],\"latest\"]" 5 || true)"
  python3 - "$PROOF" <<'PY'
import json,sys
try:
    x=json.loads(sys.argv[1]); r=x.get('result') or {}
    print('nonce=',r.get('nonce'))
    print('balance=',r.get('balance'))
    print('codeHash=',r.get('codeHash'))
    print('storageHash=',r.get('storageHash'))
except Exception as e:
    print('proof_parse_error=', e)
PY
done

echo
rpc eth_getBlockByNumber "[\"$DEPLOY_BLOCK\",false]" 10 | python3 -c 'import sys,json; r=(json.load(sys.stdin).get("result") or {}); print("deploy_block_hash=",r.get("hash")); print("deploy_stateRoot=",r.get("stateRoot")); print("tx_count=",len(r.get("transactions",[])))'
