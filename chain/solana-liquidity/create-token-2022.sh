#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

TOKEN_2022_PROGRAM_ID="TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"

require() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Required value is empty: $name" >&2
    exit 1
  fi
}

for cmd in solana spl-token awk grep mkdir; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing command: $cmd" >&2; exit 1; }
done

for key in RPC_URL KEYPAIR OPERATOR_PUBLIC_ADDRESS TOKEN_NAME TOKEN_SYMBOL TOKEN_DECIMALS TOKEN_SUPPLY METADATA_URI; do
  require "$key"
done

if [[ "${CONFIRM_CREATE_TOKEN:-}" != "CREATE_REAL_SOLANA_TOKEN" ]]; then
  echo "Refusing to create a real token. Set CONFIRM_CREATE_TOKEN=CREATE_REAL_SOLANA_TOKEN only after reviewing identity, supply and authorities." >&2
  exit 2
fi

if [[ ! -f "$KEYPAIR" ]]; then
  echo "KEYPAIR must be an existing local file path. Never place the keypair in the repository." >&2
  exit 1
fi

if [[ ! "$TOKEN_DECIMALS" =~ ^[0-9]+$ ]] || (( TOKEN_DECIMALS < 0 || TOKEN_DECIMALS > 18 )); then
  echo "TOKEN_DECIMALS must be an integer from 0 to 18." >&2
  exit 1
fi

if [[ ! "$TOKEN_SUPPLY" =~ ^[0-9]+([.][0-9]+)?$ ]] || [[ "$TOKEN_SUPPLY" == "0" ]]; then
  echo "TOKEN_SUPPLY must be a positive human-readable amount." >&2
  exit 1
fi

if [[ ! "$METADATA_URI" =~ ^https:// ]]; then
  echo "METADATA_URI must be HTTPS and publicly retrievable." >&2
  exit 1
fi

OWNER="$(solana address --keypair "$KEYPAIR")"
if [[ "$OWNER" != "$OPERATOR_PUBLIC_ADDRESS" ]]; then
  echo "Signer mismatch: expected $OPERATOR_PUBLIC_ADDRESS but keypair resolves to $OWNER. Refusing token creation." >&2
  exit 3
fi

echo "Signer: $OWNER"
echo "RPC: $RPC_URL"
solana balance "$OWNER" --url "$RPC_URL"

mkdir -p artifacts

CREATE_OUTPUT="$(
  spl-token \
    --url "$RPC_URL" \
    --owner "$KEYPAIR" \
    --fee-payer "$KEYPAIR" \
    --program-id "$TOKEN_2022_PROGRAM_ID" \
    create-token \
    --enable-metadata \
    --decimals "$TOKEN_DECIMALS"
)"
printf '%s\n' "$CREATE_OUTPUT"

MINT="$(printf '%s\n' "$CREATE_OUTPUT" | awk '/Address:/ {print $2; exit}')"
if [[ -z "$MINT" ]]; then
  MINT="$(printf '%s\n' "$CREATE_OUTPUT" | awk '/Creating token/ {print $3; exit}')"
fi
if [[ -z "$MINT" ]]; then
  echo "Could not parse mint address. Stop before minting supply." >&2
  exit 1
fi

echo "Created mint: $MINT"

spl-token \
  --url "$RPC_URL" \
  --owner "$KEYPAIR" \
  --fee-payer "$KEYPAIR" \
  --program-id "$TOKEN_2022_PROGRAM_ID" \
  initialize-metadata "$MINT" "$TOKEN_NAME" "$TOKEN_SYMBOL" "$METADATA_URI"

spl-token \
  --url "$RPC_URL" \
  --owner "$KEYPAIR" \
  --fee-payer "$KEYPAIR" \
  --program-id "$TOKEN_2022_PROGRAM_ID" \
  create-account "$MINT"

spl-token \
  --url "$RPC_URL" \
  --owner "$KEYPAIR" \
  --fee-payer "$KEYPAIR" \
  --program-id "$TOKEN_2022_PROGRAM_ID" \
  mint "$MINT" "$TOKEN_SUPPLY"

echo "=== ON-CHAIN MINT STATE ==="
spl-token --url "$RPC_URL" --program-id "$TOKEN_2022_PROGRAM_ID" display "$MINT"

cat > artifacts/solana-token.env <<EOF
TOKEN_MINT=$MINT
TOKEN_NAME=$TOKEN_NAME
TOKEN_SYMBOL=$TOKEN_SYMBOL
TOKEN_DECIMALS=$TOKEN_DECIMALS
TOKEN_SUPPLY=$TOKEN_SUPPLY
OWNER=$OWNER
EOF

cat > artifacts/solana-token-summary.json <<EOF
{
  "network": "solana-mainnet-beta",
  "mint": "$MINT",
  "name": "$TOKEN_NAME",
  "symbol": "$TOKEN_SYMBOL",
  "decimals": $TOKEN_DECIMALS,
  "declaredInitialSupply": "$TOKEN_SUPPLY",
  "metadataUri": "$METADATA_URI",
  "owner": "$OWNER",
  "authorityRevocationPerformed": false
}
EOF

echo "Token created. Non-secret evidence written to artifacts/."
echo "Authority revocation is intentionally NOT automatic. Review mint/freeze/update authority state separately before any public claim."
