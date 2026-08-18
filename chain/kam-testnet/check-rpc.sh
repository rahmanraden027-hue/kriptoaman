#!/usr/bin/env bash
set -euo pipefail

RPC_URL="${1:-${KAM_TESTNET_RPC_URL:-}}"

if [[ -z "$RPC_URL" ]]; then
  echo "Usage: $0 https://your-testnet-rpc.example"
  echo "or set KAM_TESTNET_RPC_URL"
  exit 2
fi

rpc() {
  local method="$1"
  local params="${2:-[]}" 
  curl --fail --silent --show-error \
    -H 'content-type: application/json' \
    --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"${method}\",\"params\":${params}}" \
    "$RPC_URL"
}

echo "== KriptoAman Testnet RPC check =="
echo "RPC: $RPC_URL"

echo -n "Chain ID: "
CHAIN_RESPONSE="$(rpc eth_chainId)"
echo "$CHAIN_RESPONSE"

if [[ "$CHAIN_RESPONSE" != *'"0x560b"'* ]]; then
  echo "ERROR: expected Chain ID 22027 (0x560b)."
  exit 1
fi

echo -n "Latest block: "
rpc eth_blockNumber
echo

echo -n "Client: "
rpc web3_clientVersion
echo

echo "PASS: RPC responds as KriptoAman Testnet (Chain ID 22027)."
