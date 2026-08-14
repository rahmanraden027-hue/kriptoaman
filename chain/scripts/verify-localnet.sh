#!/usr/bin/env bash
set -euo pipefail

: "${RPC_URL:?Set RPC_URL to the KriptoAman localnet EVM RPC endpoint}"

rpc() {
  local method="$1"
  curl --fail --silent --show-error \
    -H 'content-type: application/json' \
    --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"${method}\",\"params\":[]}" \
    "$RPC_URL"
  printf '\n'
}

echo '== KriptoAman Localnet RPC Check =='
echo 'Client:'
rpc web3_clientVersion

echo 'Chain ID:'
rpc eth_chainId

echo 'Latest block:'
rpc eth_blockNumber

echo 'Gas price:'
rpc eth_gasPrice

echo 'RPC verification completed.'
