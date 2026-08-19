#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
GATEWAY_DIR="$ROOT/chain/kam-mainnet/public-rpc-gateway"
VERIFY="$ROOT/chain/kam-mainnet/scripts/verify-public-endpoints.mjs"

command -v npx >/dev/null 2>&1 || { echo 'npx is required'; exit 1; }
command -v node >/dev/null 2>&1 || { echo 'node is required'; exit 1; }

cd "$GATEWAY_DIR"

echo '== Cloudflare identity =='
npx wrangler whoami

echo '== Required secret check =='
SECRETS=$(npx wrangler secret list)
if ! printf '%s' "$SECRETS" | grep -q 'KAM_RPC_ORIGIN'; then
  echo 'Missing Worker secret KAM_RPC_ORIGIN.'
  echo 'Set it with: npx wrangler secret put KAM_RPC_ORIGIN'
  exit 2
fi

echo '== Candidate status guard =='
STATUS=$(node -e "const p=require('$ROOT/chain/kam-mainnet/network-profile.json'); process.stdout.write(p.status)")
if [[ "$STATUS" != 'mainnet-candidate-not-public' ]]; then
  echo "Refusing deployment: unexpected network status: $STATUS"
  exit 3
fi

echo '== Deploy RPC gateway =='
npx wrangler deploy

echo '== Health check =='
curl --fail --silent --show-error https://rpc.kriptoaman.com/health
printf '\n'

echo '== Public readiness verification =='
node "$VERIFY"

echo 'Deployment completed. Network remains candidate until Issue #115 activation gates are fully satisfied.'
