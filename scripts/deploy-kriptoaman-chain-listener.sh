#!/usr/bin/env bash
set -euo pipefail

RUN_ID="${1:?run id required}"
ARCHIVE="${2:-/tmp/kriptoaman-chain-listener.tgz}"
APP_ROOT=/opt/kriptoaman-intelligence
RELEASE="$APP_ROOT/releases/$RUN_ID"
DATA_DIR=/var/lib/kriptoaman-intelligence
ENV_DIR=/etc/kriptoaman
ENV_FILE="$ENV_DIR/chain-listener.env"
IMAGE="kriptoaman-chain-listener:$RUN_ID"
NAME=ka-chain-listener
BACKUP_NAME="${NAME}-previous-${RUN_ID}"

fail() { echo "ERROR: $*" >&2; exit 1; }

test -s "$ARCHIVE" || fail "listener archive missing"

if ! command -v docker >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y --no-install-recommends docker.io ca-certificates curl jq
  systemctl enable --now docker
fi

install -d -m 0755 "$APP_ROOT/releases" "$RELEASE"
install -d -m 0750 "$DATA_DIR"
install -d -m 0750 "$ENV_DIR"
tar -xzf "$ARCHIVE" -C "$RELEASE" --strip-components=1

cat >"$ENV_FILE" <<'EOF'
CHAIN_NAME=ZEVARYQ Mainnet
CHAIN_ID=22028
CHAIN_ID_HEX=0x560c
RPC_HTTP_URL=https://206.189.36.15/
RPC_WS_URL=
POLL_INTERVAL_MS=1000
RPC_TIMEOUT_MS=8000
FINALITY_DEPTH=2
LISTEN_HOST=0.0.0.0
LISTEN_PORT=8790
DB_PATH=/data/zvq-indexer.sqlite
DEX_FACTORY_ADDRESSES=
ALLOWED_ORIGINS=https://kriptoaman.com
MAX_WS_CLIENTS=500
SOURCE_LABEL=kriptoaman-first-party-zvq
EOF
chmod 0600 "$ENV_FILE"

chain="$(curl --noproxy '*' -fsS --connect-timeout 6 --max-time 15 -H 'content-type: application/json'   --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' 'https://206.189.36.15/' | jq -er '.result')"
test "$chain" = 0x560c || fail "first-party RPC chain mismatch: $chain"

docker build --pull -t "$IMAGE" "$RELEASE"

previous_id="$(docker ps -aq --filter "name=^/${NAME}$" | head -n1 || true)"
if [[ -n "$previous_id" ]]; then
  docker stop "$NAME" >/dev/null
  docker rename "$NAME" "$BACKUP_NAME"
fi

rollback() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  if docker ps -aq --filter "name=^/${BACKUP_NAME}$" | grep -q .; then
    docker rename "$BACKUP_NAME" "$NAME"
    docker start "$NAME" >/dev/null
  fi
}
trap rollback ERR

docker run -d   --name "$NAME"   --restart unless-stopped   --read-only   --cap-drop ALL   --security-opt no-new-privileges   --memory 2g   --cpus 2   --tmpfs /tmp:rw,noexec,nosuid,size=64m   --env-file "$ENV_FILE"   -v "$DATA_DIR:/data"   -p 127.0.0.1:8790:8790   "$IMAGE" >/dev/null

for _ in $(seq 1 30); do
  if health="$(curl -fsS --max-time 3 http://127.0.0.1:8790/health 2>/dev/null)"; then
    ok="$(jq -r '.ok // false' <<<"$health")"
    cid="$(jq -r '.chainId // 0' <<<"$health")"
    source="$(jq -r '.source // empty' <<<"$health")"
    if [[ "$ok" == true && "$cid" == 22028 && "$source" == kriptoaman-first-party-zvq ]]; then
      break
    fi
  fi
  sleep 2
done

health="$(curl -fsS --max-time 5 http://127.0.0.1:8790/health)"
test "$(jq -r '.ok' <<<"$health")" = true
test "$(jq -r '.chainId' <<<"$health")" = 22028
test "$(jq -r '.source' <<<"$health")" = kriptoaman-first-party-zvq
ss -ltn | grep -Eq '127\.0\.0\.1:8790'

if docker ps -aq --filter "name=^/${BACKUP_NAME}$" | grep -q .; then
  docker rm -f "$BACKUP_NAME" >/dev/null
fi

trap - ERR
echo "CHAIN_LISTENER_DEPLOYED run=$RUN_ID chain=$chain health=$(jq -c . <<<"$health")"
