#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${1:-.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  echo "Copy config.example.env to .env and set KEYPAIR to the local operator keypair path." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

EXPECTED_OPERATOR="5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK"
EXPECTED_NAME="Solana KAM"
EXPECTED_SYMBOL="sKAM"
EXPECTED_DECIMALS="9"
EXPECTED_SUPPLY="1000000000"
EXPECTED_METADATA_URI="https://kriptoaman.com/token/skam.json"
EXPECTED_WSOL="So11111111111111111111111111111111111111112"
EXPECTED_POOL_BASE="1000000"
EXPECTED_POOL_QUOTE="0.20"
DEFAULT_SMOKE_INPUT_UI="0.001"
MAX_SMOKE_INPUT_UI="0.005"
DEXSCREENER_MAX_ATTEMPTS="${DEXSCREENER_MAX_ATTEMPTS:-20}"
DEXSCREENER_RETRY_SECONDS="${DEXSCREENER_RETRY_SECONDS:-15}"

require() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Required value is empty: $name" >&2
    exit 1
  fi
}

assert_equal() {
  local label="$1"
  local actual="$2"
  local expected="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "$label mismatch. Expected '$expected', got '$actual'. Refusing mainnet launch." >&2
    exit 2
  fi
}

set_env_value() {
  local key="$1"
  local value="$2"
  local tmp="${ENV_FILE}.tmp.$$"
  awk -v key="$key" -v value="$value" '
    BEGIN { found = 0 }
    index($0, key "=") == 1 { print key "=" value; found = 1; next }
    { print }
    END { if (!found) print key "=" value }
  ' "$ENV_FILE" > "$tmp"
  mv "$tmp" "$ENV_FILE"
  export "$key=$value"
}

for cmd in bash node npm awk grep mv sleep date; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing command: $cmd" >&2; exit 1; }
done

for key in RPC_URL KEYPAIR OPERATOR_PUBLIC_ADDRESS TOKEN_NAME TOKEN_SYMBOL TOKEN_DECIMALS TOKEN_SUPPLY METADATA_URI QUOTE_MINT QUOTE_SYMBOL POOL_BASE_UI POOL_QUOTE_UI; do
  require "$key"
done

if [[ "${CONFIRM_FULL_SKAM_LAUNCH:-}" != "LAUNCH_REAL_SKAM_MAINNET" ]]; then
  echo "Refusing end-to-end mainnet launch. Set CONFIRM_FULL_SKAM_LAUNCH=LAUNCH_REAL_SKAM_MAINNET only when the operator is ready for irreversible transactions." >&2
  exit 2
fi
if [[ "${CONFIRM_CREATE_TOKEN:-}" != "CREATE_REAL_SOLANA_TOKEN" ]]; then
  echo "CONFIRM_CREATE_TOKEN must equal CREATE_REAL_SOLANA_TOKEN." >&2
  exit 2
fi
if [[ "${CONFIRM_CREATE_POOL:-}" != "CREATE_REAL_RAYDIUM_POOL" ]]; then
  echo "CONFIRM_CREATE_POOL must equal CREATE_REAL_RAYDIUM_POOL." >&2
  exit 2
fi
if [[ "${CONFIRM_SMOKE_SWAP:-}" != "EXECUTE_ONE_REAL_SMOKE_SWAP" ]]; then
  echo "CONFIRM_SMOKE_SWAP must equal EXECUTE_ONE_REAL_SMOKE_SWAP." >&2
  exit 2
fi

assert_equal "Operator" "$OPERATOR_PUBLIC_ADDRESS" "$EXPECTED_OPERATOR"
assert_equal "Token name" "$TOKEN_NAME" "$EXPECTED_NAME"
assert_equal "Token symbol" "$TOKEN_SYMBOL" "$EXPECTED_SYMBOL"
assert_equal "Decimals" "$TOKEN_DECIMALS" "$EXPECTED_DECIMALS"
assert_equal "Supply" "$TOKEN_SUPPLY" "$EXPECTED_SUPPLY"
assert_equal "Metadata URI" "$METADATA_URI" "$EXPECTED_METADATA_URI"
assert_equal "Quote mint" "$QUOTE_MINT" "$EXPECTED_WSOL"
assert_equal "Pool token reserve" "$POOL_BASE_UI" "$EXPECTED_POOL_BASE"
assert_equal "Pool SOL reserve" "$POOL_QUOTE_UI" "$EXPECTED_POOL_QUOTE"

if [[ ! -f "$KEYPAIR" ]]; then
  echo "KEYPAIR must be an existing local JSON keypair file. Never copy a seed phrase/private key into chat, GitHub, or this repository." >&2
  exit 1
fi

SMOKE_INPUT_UI="${SMOKE_INPUT_UI:-$DEFAULT_SMOKE_INPUT_UI}"
export SMOKE_INPUT_UI MAX_SMOKE_INPUT_UI
node - <<'NODE'
const value = Number(process.env.SMOKE_INPUT_UI);
const max = Number(process.env.MAX_SMOKE_INPUT_UI);
if (!Number.isFinite(value) || !Number.isFinite(max) || value <= 0 || value > max) {
  console.error(`SMOKE_INPUT_UI must be > 0 and <= ${max} SOL for this canary launch.`);
  process.exit(1);
}
NODE

if ! [[ "$DEXSCREENER_MAX_ATTEMPTS" =~ ^[0-9]+$ ]] || (( DEXSCREENER_MAX_ATTEMPTS < 1 || DEXSCREENER_MAX_ATTEMPTS > 60 )); then
  echo "DEXSCREENER_MAX_ATTEMPTS must be an integer from 1 to 60." >&2
  exit 1
fi
if ! [[ "$DEXSCREENER_RETRY_SECONDS" =~ ^[0-9]+$ ]] || (( DEXSCREENER_RETRY_SECONDS < 5 || DEXSCREENER_RETRY_SECONDS > 60 )); then
  echo "DEXSCREENER_RETRY_SECONDS must be an integer from 5 to 60." >&2
  exit 1
fi

# Install/resolve JavaScript tooling before the first irreversible blockchain write.
echo "=== PRELOAD NODE SOLANA + RAYDIUM TOOLING ==="
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
console.log('Node Solana/Token-2022/Raydium dependencies resolved.');
NODE
for script in create-token-2022.mjs create-raydium-pool.mjs smoke-swap.mjs verify-dexscreener.mjs; do
  node --check "$script"
done

# Resolve the local keypair to its public address using JS; no Solana CLI is required.
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

echo "=== sKAM MAINNET LAUNCH GATE ==="
echo "Signer: $SIGNER"
echo "Token: $TOKEN_NAME ($TOKEN_SYMBOL)"
echo "Supply: $TOKEN_SUPPLY"
echo "Pool seed: $POOL_BASE_UI sKAM + $POOL_QUOTE_UI SOL"
echo "Functional smoke input: $SMOKE_INPUT_UI SOL"
echo "Execution mode: Node.js only; solana/spl-token CLI are not required."
echo "No private key material will be printed or persisted by this launcher."

# Verify public metadata and image before any write.
node --input-type=module <<'NODE'
const metadataUrl = process.env.METADATA_URI;
const metadataResponse = await fetch(metadataUrl, { signal: AbortSignal.timeout(10000), headers: { accept: 'application/json' } });
if (!metadataResponse.ok) throw new Error(`Metadata HTTP ${metadataResponse.status}`);
const metadata = await metadataResponse.json();
if (metadata.name !== 'Solana KAM' || metadata.symbol !== 'sKAM') throw new Error('Public metadata identity mismatch.');
if (metadata.image !== 'https://kriptoaman.com/token/skam-logo.png') throw new Error('Public metadata image URI mismatch.');
const imageResponse = await fetch(metadata.image, { signal: AbortSignal.timeout(10000) });
if (!imageResponse.ok) throw new Error(`Logo HTTP ${imageResponse.status}`);
const contentType = imageResponse.headers.get('content-type') || '';
if (!contentType.startsWith('image/')) throw new Error(`Unexpected logo content type: ${contentType}`);
await imageResponse.body?.cancel();
console.log('Public metadata + logo verified.');
NODE

# Read-only balance gate. It exits non-zero if the approved budget is not available.
node check-wallet-readiness.mjs

mkdir -p artifacts

if [[ -z "${TOKEN_MINT:-}" ]]; then
  echo "=== CREATE TOKEN-2022 MINT (NODE) ==="
  node create-token-2022.mjs
  # shellcheck disable=SC1091
  source artifacts/solana-token.env
  require TOKEN_MINT
  set_env_value TOKEN_MINT "$TOKEN_MINT"
else
  echo "TOKEN_MINT already configured; verifying existing Token-2022 mint instead of creating a second token."
  node --input-type=module <<'NODE'
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getMint } from '@solana/spl-token';
const connection = new Connection(process.env.RPC_URL, 'confirmed');
const mintAddress = new PublicKey(process.env.TOKEN_MINT);
const mint = await getMint(connection, mintAddress, 'confirmed', TOKEN_2022_PROGRAM_ID);
const decimals = Number(process.env.TOKEN_DECIMALS);
const expectedRaw = BigInt(process.env.TOKEN_SUPPLY) * (10n ** BigInt(decimals));
if (mint.decimals !== decimals) throw new Error(`Existing TOKEN_MINT decimals mismatch: ${mint.decimals}`);
if (mint.supply !== expectedRaw) throw new Error(`Existing TOKEN_MINT raw supply mismatch: ${mint.supply.toString()}`);
const expectedAuthority = process.env.OPERATOR_PUBLIC_ADDRESS;
if (mint.mintAuthority?.toBase58() !== expectedAuthority) throw new Error('Existing TOKEN_MINT mint authority is not the approved operator.');
console.log(JSON.stringify({ mint: mintAddress.toBase58(), decimals: mint.decimals, rawSupply: mint.supply.toString(), mintAuthority: mint.mintAuthority?.toBase58() ?? null, freezeAuthority: mint.freezeAuthority?.toBase58() ?? null }, null, 2));
NODE
fi

echo "Confirmed TOKEN_MINT=$TOKEN_MINT"

# Mandatory read-only economics preview immediately before pool creation.
POOL_TOKEN_AMOUNT="$POOL_BASE_UI" \
POOL_QUOTE_AMOUNT="$POOL_QUOTE_UI" \
QUOTE_SYMBOL="$QUOTE_SYMBOL" \
TOKEN_TOTAL_SUPPLY="$TOKEN_SUPPLY" \
node preview-pool-economics.mjs

if [[ -z "${POOL_ID:-}" ]]; then
  echo "=== CREATE REAL RAYDIUM CPMM ==="
  node create-raydium-pool.mjs
  POOL_ID="$(node --input-type=module -e "import fs from 'node:fs'; const p=JSON.parse(fs.readFileSync('artifacts/raydium-pool.json','utf8')); if(!p.poolId) process.exit(1); process.stdout.write(p.poolId);")"
  require POOL_ID
  set_env_value POOL_ID "$POOL_ID"
else
  echo "POOL_ID already configured; skipping duplicate pool creation."
fi

echo "Confirmed POOL_ID=$POOL_ID"

# One and only one deliberately small functional buy; no loops or synthetic volume.
echo "=== EXECUTE ONE FUNCTIONAL SMOKE SWAP ==="
SMOKE_DIRECTION="quote-to-token" node smoke-swap.mjs

# DEX Screener indexing is asynchronous. Poll read-only until indexed or the bounded window expires.
echo "=== VERIFY DEX SCREENER INDEXING ==="
verified=0
for ((attempt=1; attempt<=DEXSCREENER_MAX_ATTEMPTS; attempt++)); do
  echo "DEX Screener verification attempt $attempt/$DEXSCREENER_MAX_ATTEMPTS"
  set +e
  output="$(node verify-dexscreener.mjs 2>&1)"
  status=$?
  set -e
  printf '%s\n' "$output"
  if (( status == 0 )); then
    verified=1
    printf '%s\n' "$output" > artifacts/dexscreener-verification.txt
    break
  fi
  if (( status != 3 && status != 4 )); then
    echo "DEX Screener verifier failed with non-indexing error status $status; refusing to hide the failure." >&2
    exit "$status"
  fi
  if (( attempt < DEXSCREENER_MAX_ATTEMPTS )); then
    sleep "$DEXSCREENER_RETRY_SECONDS"
  fi
done

if (( verified != 1 )); then
  echo "Pool and smoke transaction completed, but DEX Screener did not index within the bounded verification window." >&2
  echo "Do not claim DEX Screener readiness yet. Re-run: node verify-dexscreener.mjs" >&2
  exit 5
fi

cat > artifacts/skam-mainnet-launch-summary.json <<EOF
{
  "network": "solana-mainnet-beta",
  "tokenMint": "$TOKEN_MINT",
  "poolId": "$POOL_ID",
  "operator": "$SIGNER",
  "tokenSymbol": "$TOKEN_SYMBOL",
  "declaredSupply": "$TOKEN_SUPPLY",
  "initialPoolTokenUi": "$POOL_BASE_UI",
  "initialPoolSolUi": "$POOL_QUOTE_UI",
  "smokeDirection": "quote-to-token",
  "smokeInputSol": "$SMOKE_INPUT_UI",
  "dexScreenerVerified": true,
  "dexScreenerUrl": "https://dexscreener.com/solana/$POOL_ID",
  "completedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "=== sKAM MAINNET LAUNCH VERIFIED ==="
echo "Mint: $TOKEN_MINT"
echo "Raydium CPMM: $POOL_ID"
echo "DEX Screener: https://dexscreener.com/solana/$POOL_ID"
echo "Evidence: artifacts/skam-mainnet-launch-summary.json"
