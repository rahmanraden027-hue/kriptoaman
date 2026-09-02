#!/usr/bin/env bash
set -euo pipefail

ROOT="${KAM_FORENSIC_ROOT:-/opt/kam-forensic}"
BESU_BIN="${BESU_BIN:-/opt/besu/bin/besu}"
GENESIS="$ROOT/genesis.json"
BOOTNODES_FILE="$ROOT/bootnodes.txt"
DATA_DIR="$ROOT/data"
RPC_PORT="${KAM_FORENSIC_RPC_PORT:-8650}"
P2P_PORT="${KAM_FORENSIC_P2P_PORT:-30410}"
NETWORK_ID="22028"

fail() { echo "ERROR: $*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "run as root on the dedicated forensic host"
[ -x "$BESU_BIN" ] || fail "Besu binary not found at $BESU_BIN"
[ -f "$GENESIS" ] || fail "missing $GENESIS"
[ -f "$BOOTNODES_FILE" ] || fail "missing $BOOTNODES_FILE"

python3 - "$GENESIS" <<'PY'
import json,sys
p=sys.argv[1]
g=json.load(open(p))
c=g.get('config',{})
chain=c.get('chainId', c.get('chainid'))
if chain != 22028:
    raise SystemExit(f'wrong chainId in genesis: {chain!r}')
if c.get('berlinBlock') != 0 or c.get('londonBlock') != 0:
    raise SystemExit('unexpected fork schedule; refusing forensic start')
print('Genesis verified: chainId=22028, berlinBlock=0, londonBlock=0')
PY

if find "$ROOT" -maxdepth 2 -type f \( -name 'key' -o -name 'keyfile' -o -name '*.key' \) -print -quit | grep -q .; then
  fail "validator/private key-like file found under $ROOT; forensic host must not use production validator keys"
fi

BOOTNODES="$(grep -E '^enode://[0-9a-fA-F]+@[^[:space:]]+:[0-9]+$' "$BOOTNODES_FILE" | paste -sd, -)"
[ -n "$BOOTNODES" ] || fail "no valid public enode entries found in $BOOTNODES_FILE"

mkdir -p "$DATA_DIR" "$ROOT/logs"

if ss -lntup | grep -Eq ":(${RPC_PORT}|${P2P_PORT})\\b"; then
  fail "requested forensic port already in use"
fi

if pgrep -af 'org.hyperledger.besu|/besu ' | grep -q "$DATA_DIR"; then
  fail "forensic Besu process already running for $DATA_DIR"
fi

cat > "$ROOT/forensic-start-summary.txt" <<EOF
mode=non-validator-forensic-replay
network_id=$NETWORK_ID
rpc=http://127.0.0.1:$RPC_PORT
p2p_port=$P2P_PORT
data_dir=$DATA_DIR
genesis=$GENESIS
bootnode_count=$(grep -c '^enode://' "$BOOTNODES_FILE" || true)
EOF

exec "$BESU_BIN" \
  --data-path="$DATA_DIR" \
  --genesis-file="$GENESIS" \
  --network-id="$NETWORK_ID" \
  --sync-mode=FULL \
  --bootnodes="$BOOTNODES" \
  --p2p-port="$P2P_PORT" \
  --rpc-http-enabled=true \
  --rpc-http-host=127.0.0.1 \
  --rpc-http-port="$RPC_PORT" \
  --rpc-http-api=ETH,NET,WEB3 \
  --host-allowlist=localhost,127.0.0.1 \
  --min-gas-price=0
