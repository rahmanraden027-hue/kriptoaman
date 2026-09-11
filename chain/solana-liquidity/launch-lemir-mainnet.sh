#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

EXPECTED_OPERATOR="5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK"
EXPECTED_NAME="LEMIRMEN"
EXPECTED_SYMBOL="LEMIR"
EXPECTED_DECIMALS="6"
EXPECTED_SUPPLY="1000000000"
EXPECTED_METADATA_URI="https://kriptoaman.com/token/lemir.json"
EXPECTED_IMAGE_URI="https://kriptoaman.com/token/lemir-logo.png"
EXPECTED_WSOL="So11111111111111111111111111111111111111112"
EXPECTED_POOL_BASE="100000000"
EXPECTED_POOL_QUOTE="0.20"
DEFAULT_SMOKE_INPUT_UI="0.001"
STATE_FILE="artifacts/lemir-mainnet.env"

if [[ "${CONFIRM_FULL_LEMIR_LAUNCH:-}" != "LAUNCH_REAL_LEMIR_MAINNET" ]]; then
  echo "Refusing real LEMIR mainnet launch. Re-run with CONFIRM_FULL_LEMIR_LAUNCH=LAUNCH_REAL_LEMIR_MAINNET after reviewing the values below." >&2
  echo "Token: ${EXPECTED_NAME} (${EXPECTED_SYMBOL}) · supply ${EXPECTED_SUPPLY} · decimals ${EXPECTED_DECIMALS}" >&2
  echo "Pool: ${EXPECTED_POOL_BASE} ${EXPECTED_SYMBOL} + ${EXPECTED_POOL_QUOTE} SOL" >&2
  exit 2
fi

: "${KEYPAIR:?Set KEYPAIR to the local 64-byte Solana JSON keypair for ${EXPECTED_OPERATOR}. Never paste the private key into chat or GitHub.}"
if [[ ! -f "$KEYPAIR" ]]; then
  echo "KEYPAIR does not exist: $KEYPAIR" >&2
  exit 1
fi

export RPC_URL="${RPC_URL:-https://solana-rpc.publicnode.com}"
export OPERATOR_PUBLIC_ADDRESS="$EXPECTED_OPERATOR"
export TOKEN_NAME="$EXPECTED_NAME"
export TOKEN_SYMBOL="$EXPECTED_SYMBOL"
export TOKEN_DECIMALS="$EXPECTED_DECIMALS"
export TOKEN_SUPPLY="$EXPECTED_SUPPLY"
export METADATA_URI="$EXPECTED_METADATA_URI"
export QUOTE_MINT="$EXPECTED_WSOL"
export QUOTE_SYMBOL="SOL"
export POOL_BASE_UI="$EXPECTED_POOL_BASE"
export POOL_QUOTE_UI="$EXPECTED_POOL_QUOTE"
export SMOKE_INPUT_UI="${SMOKE_INPUT_UI:-$DEFAULT_SMOKE_INPUT_UI}"
export CONFIRM_CREATE_TOKEN="CREATE_REAL_SOLANA_TOKEN"
export CONFIRM_CREATE_POOL="CREATE_REAL_RAYDIUM_POOL"
export CONFIRM_SMOKE_SWAP="EXECUTE_ONE_REAL_SMOKE_SWAP"

mkdir -p artifacts
if [[ -f "$STATE_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$STATE_FILE"
fi

set_state() {
  local key="$1" value="$2" tmp="${STATE_FILE}.tmp.$$"
  touch "$STATE_FILE"
  awk -v key="$key" -v value="$value" '
    BEGIN { found=0 }
    index($0,key "=")==1 { print key "=" value; found=1; next }
    { print }
    END { if (!found) print key "=" value }
  ' "$STATE_FILE" > "$tmp"
  mv "$tmp" "$STATE_FILE"
  export "$key=$value"
}

for cmd in node npm awk grep mv date; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing command: $cmd" >&2; exit 1; }
done

# First gate: current SOL must cover 0.20 liquidity + Raydium fee/rent + a conservative ops buffer.
echo "=== LEMIR WALLET READINESS ==="
LIQUIDITY_SOL="$EXPECTED_POOL_QUOTE" \
POOL_CREATION_FEE_SOL="0.15" \
EST_POOL_RENT_SOL="0.04" \
OPS_BUFFER_SOL="0.05" \
node check-wallet-readiness.mjs

# Resolve tooling before irreversible writes.
echo "=== PRELOAD SOLANA + RAYDIUM TOOLING ==="
npm install --no-audit --no-fund
node --input-type=module <<'NODE'
await Promise.all([
  import('@raydium-io/raydium-sdk-v2'),
  import('@solana/web3.js'),
  import('@solana/spl-token'),
  import('@solana/spl-token-metadata'),
  import('bn.js'),
  import('decimal.js'),
]);
console.log('Solana/Token-2022/Raydium dependencies resolved.');
NODE

SIGNER="$(node --input-type=module <<'NODE'
import fs from 'node:fs';
import { Keypair } from '@solana/web3.js';
const secret = JSON.parse(fs.readFileSync(process.env.KEYPAIR, 'utf8'));
if (!Array.isArray(secret) || secret.length !== 64) throw new Error('KEYPAIR is not a standard 64-byte Solana JSON keypair.');
process.stdout.write(Keypair.fromSecretKey(Uint8Array.from(secret)).publicKey.toBase58());
NODE
)"
if [[ "$SIGNER" != "$EXPECTED_OPERATOR" ]]; then
  echo "Signer mismatch. Expected $EXPECTED_OPERATOR, got $SIGNER." >&2
  exit 3
fi

echo "Signer verified: $SIGNER"
echo "Token: $TOKEN_NAME ($TOKEN_SYMBOL)"
echo "Supply: $TOKEN_SUPPLY · decimals: $TOKEN_DECIMALS"
echo "Initial pool: $POOL_BASE_UI $TOKEN_SYMBOL + $POOL_QUOTE_UI SOL"

# Public identity must resolve before mint creation.
echo "=== VERIFY PUBLIC METADATA + LOGO ==="
node --input-type=module <<'NODE'
const metadataUrl = process.env.METADATA_URI;
const metadataResponse = await fetch(metadataUrl, { signal: AbortSignal.timeout(10000), headers: { accept: 'application/json' } });
if (!metadataResponse.ok) throw new Error(`Metadata HTTP ${metadataResponse.status}`);
const metadata = await metadataResponse.json();
if (metadata.name !== 'LEMIRMEN' || metadata.symbol !== 'LEMIR') throw new Error('Public metadata identity mismatch.');
if (metadata.image !== 'https://kriptoaman.com/token/lemir-logo.png') throw new Error('Public metadata image URI mismatch.');
const imageResponse = await fetch(metadata.image, { signal: AbortSignal.timeout(10000) });
if (!imageResponse.ok) throw new Error(`Logo HTTP ${imageResponse.status}`);
const type = imageResponse.headers.get('content-type') || '';
if (!type.startsWith('image/')) throw new Error(`Unexpected logo content type: ${type}`);
await imageResponse.body?.cancel();
console.log('LEMIR public metadata + logo verified.');
NODE

if [[ -z "${TOKEN_MINT:-}" ]]; then
  echo "=== CREATE LEMIR TOKEN-2022 MINT ==="
  node create-token-2022.mjs
  # shellcheck disable=SC1091
  source artifacts/solana-token.env
  : "${TOKEN_MINT:?Token creation did not produce TOKEN_MINT}"
  set_state TOKEN_MINT "$TOKEN_MINT"
else
  echo "Existing LEMIR mint state found; verifying instead of creating another token."
  node --input-type=module <<'NODE'
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getMint } from '@solana/spl-token';
const connection = new Connection(process.env.RPC_URL, 'confirmed');
const mintAddress = new PublicKey(process.env.TOKEN_MINT);
const mint = await getMint(connection, mintAddress, 'confirmed', TOKEN_2022_PROGRAM_ID);
const decimals = Number(process.env.TOKEN_DECIMALS);
const expectedRaw = BigInt(process.env.TOKEN_SUPPLY) * (10n ** BigInt(decimals));
if (mint.decimals !== decimals) throw new Error(`Decimals mismatch: ${mint.decimals}`);
if (mint.supply !== expectedRaw) throw new Error(`Supply mismatch: ${mint.supply.toString()}`);
console.log(JSON.stringify({ mint: mintAddress.toBase58(), decimals: mint.decimals, supply: mint.supply.toString() }, null, 2));
NODE
fi

echo "Confirmed TOKEN_MINT=$TOKEN_MINT"

POOL_TOKEN_AMOUNT="$POOL_BASE_UI" \
POOL_QUOTE_AMOUNT="$POOL_QUOTE_UI" \
QUOTE_SYMBOL="$QUOTE_SYMBOL" \
TOKEN_TOTAL_SUPPLY="$TOKEN_SUPPLY" \
node preview-pool-economics.mjs

if [[ -z "${POOL_ID:-}" ]]; then
  echo "=== CREATE RAYDIUM CPMM ==="
  node create-raydium-pool.mjs
  POOL_ID="$(node --input-type=module -e "import fs from 'node:fs'; const p=JSON.parse(fs.readFileSync('artifacts/raydium-pool.json','utf8')); if(!p.poolId) process.exit(1); process.stdout.write(p.poolId);")"
  : "${POOL_ID:?Pool creation did not produce POOL_ID}"
  set_state POOL_ID "$POOL_ID"
else
  echo "Existing POOL_ID found; skipping duplicate pool creation: $POOL_ID"
fi

if [[ "${SMOKE_SWAP_DONE:-0}" != "1" ]]; then
  echo "=== EXECUTE ONE REAL FUNCTIONAL SWAP ==="
  SMOKE_DIRECTION="quote-to-token" node smoke-swap.mjs
  set_state SMOKE_SWAP_DONE "1"
else
  echo "Functional smoke swap already recorded; refusing duplicate smoke volume."
fi

# Read-only DEX Screener verification. A later retry does not repeat the swap.
echo "=== VERIFY DEX SCREENER ==="
if node verify-dexscreener.mjs; then
  set_state DEXSCREENER_VERIFIED "1"
  cat > artifacts/lemir-mainnet-launch-summary.json <<EOF_SUMMARY
{
  "network": "solana-mainnet-beta",
  "token": "LEMIRMEN",
  "symbol": "LEMIR",
  "tokenMint": "$TOKEN_MINT",
  "poolId": "$POOL_ID",
  "operator": "$SIGNER",
  "declaredSupply": "$TOKEN_SUPPLY",
  "decimals": "$TOKEN_DECIMALS",
  "initialPoolTokenUi": "$POOL_BASE_UI",
  "initialPoolSolUi": "$POOL_QUOTE_UI",
  "dexScreenerVerified": true,
  "dexScreenerUrl": "https://dexscreener.com/solana/$POOL_ID",
  "completedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF_SUMMARY
  echo "=== LEMIR LAUNCH VERIFIED ==="
  echo "Mint: $TOKEN_MINT"
  echo "Raydium CPMM: $POOL_ID"
  echo "DEX Screener: https://dexscreener.com/solana/$POOL_ID"
else
  status=$?
  echo "Pool/smoke transaction may already be complete, but DEX Screener is not yet verifiable (status $status)." >&2
  echo "Do not create another pool or repeat the smoke swap. Re-run this same command later; state prevents duplicate writes." >&2
  exit "$status"
fi
