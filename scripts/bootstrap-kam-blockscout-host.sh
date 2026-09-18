#!/usr/bin/env bash
set -Eeuo pipefail

EXPECTED_CHAIN_HEX="0x560c"
EXPECTED_CHAIN_DEC="22028"
KAM_RPC="https://explorer.kriptoaman.com/rpc"
BASE="/opt/kam-blockscout"
COMPOSE_FILE="$BASE/compose.yml"
ENV_FILE="$BASE/.env"
NGINX_FILE="$BASE/nginx.conf"

log(){ printf '\n[%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"; }
fail(){ echo "ERROR: $*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Run as root"

log "Installing host packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl jq git openssl docker.io
if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y docker-compose-v2 2>/dev/null ||   apt-get install -y docker-compose-plugin 2>/dev/null ||   apt-get install -y docker-compose
fi
systemctl enable --now docker

log "Preflight: verifying KAM RPC identity"
chain="$(curl -fsS --retry 4 --retry-delay 2 --max-time 20   -H 'content-type: application/json'   --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'   "$KAM_RPC" | jq -r '.result // empty' 2>/dev/null || true)"
[ "$chain" = "$EXPECTED_CHAIN_HEX" ] || fail "Unexpected chain ID from KAM RPC: ${chain:-empty}"

head_hex="$(curl -fsS --retry 4 --retry-delay 2 --max-time 20   -H 'content-type: application/json'   --data '{"jsonrpc":"2.0","id":2,"method":"eth_blockNumber","params":[]}'   "$KAM_RPC" | jq -r '.result // empty' 2>/dev/null || true)"
[[ "$head_hex" =~ ^0x[0-9a-fA-F]+$ ]] || fail "Invalid block head from KAM RPC: ${head_hex:-empty}"
log "RPC OK: chain=$chain head=$head_hex"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  fail "Docker Compose is unavailable after installation"
fi

log "Preparing isolated Blockscout directory at $BASE"
mkdir -p "$BASE"

if [ -e "$COMPOSE_FILE" ]; then
  log "Existing compose file detected; preserving current configuration"
else
  db_pass="$(openssl rand -hex 24)"
  secret_key="$(openssl rand -hex 64)"
  cat >"$ENV_FILE" <<EOF
DB_PASSWORD=$db_pass
SECRET_KEY_BASE=$secret_key
KAM_RPC=$KAM_RPC
BLOCKSCOUT_IMAGE=ghcr.io/blockscout/blockscout:latest
EOF
  chmod 600 "$ENV_FILE"

  cat >"$COMPOSE_FILE" <<'YAML'
services:
  db:
    image: postgres:17
    container_name: kam-blockscout-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: blockscout
      POSTGRES_USER: blockscout
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    command:
      - postgres
      - -c
      - max_connections=200
      - -c
      - shared_buffers=512MB
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U blockscout -d blockscout"]
      interval: 10s
      timeout: 5s
      retries: 20
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: kam-blockscout-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redisdata:/data

  backend:
    image: ${BLOCKSCOUT_IMAGE}
    container_name: kam-blockscout-backend
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    command: >
      sh -c 'bin/blockscout eval "Elixir.Explorer.ReleaseTasks.create_and_migrate()" &&
      bin/blockscout start'
    environment:
      DATABASE_URL: postgresql://blockscout:${DB_PASSWORD}@db:5432/blockscout
      DATABASE_QUEUE_TARGET: "5000"
      POOL_SIZE: "40"
      POOL_SIZE_API: "10"
      ETHEREUM_JSONRPC_VARIANT: geth
      ETHEREUM_JSONRPC_TRANSPORT: http
      ETHEREUM_JSONRPC_HTTP_URL: ${KAM_RPC}
      ETHEREUM_JSONRPC_TRACE_URL: ${KAM_RPC}
      ETHEREUM_JSONRPC_DISABLE_ARCHIVE_BALANCES: "true"
      CHAIN_ID: "22028"
      COIN: KAM
      COIN_NAME: KAM
      NETWORK: KAM Mainnet
      SUBNETWORK: KAM Mainnet
      BLOCKSCOUT_HOST: explorer.kriptoaman.com
      BLOCKSCOUT_PROTOCOL: https
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}
      DISABLE_MARKET: "true"
      DISABLE_WEBAPP: "true"
      API_V2_ENABLED: "true"
      ACCOUNT_ENABLED: "false"
      CHECKSUM_ADDRESS_HASHES: "true"
      INDEXER_DISABLE_INTERNAL_TRANSACTIONS_FETCHER: "true"
      INDEXER_DISABLE_BLOCK_REWARD_FETCHER: "true"
      INDEXER_DISABLE_PENDING_TRANSACTIONS_FETCHER: "true"
      INDEXER_DISABLE_WITHDRAWALS_FETCHER: "true"
      INDEXER_DISABLE_REPLACED_TRANSACTION_FETCHER: "true"
      INDEXER_CATCHUP_BLOCKS_BATCH_SIZE: "10"
      INDEXER_CATCHUP_BLOCKS_CONCURRENCY: "2"
      INDEXER_COIN_BALANCES_BATCH_SIZE: "10"
      INDEXER_COIN_BALANCES_CONCURRENCY: "2"
      INDEXER_EMPTY_BLOCKS_SANITIZER_BATCH_SIZE: "10"
      INDEXER_EMPTY_BLOCKS_SANITIZER_INTERVAL: "30s"
      MICROSERVICE_SC_VERIFIER_ENABLED: "false"
      MICROSERVICE_VISUALIZE_SOL2UML_ENABLED: "false"
      MICROSERVICE_SIG_PROVIDER_ENABLED: "false"
      NFT_MEDIA_HANDLER_ENABLED: "false"
      ACCOUNT_REDIS_URL: redis://redis:6379
      RATE_LIMITER_REDIS_URL: redis://redis:6379/0
      PORT: "4000"
    expose:
      - "4000"

  proxy:
    image: nginx:1.27-alpine
    container_name: kam-blockscout-proxy
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro

volumes:
  pgdata:
  redisdata:

YAML

  cat >"$NGINX_FILE" <<'NGINX'
server {
    listen 80 default_server;
    server_name _;

    client_max_body_size 8m;

    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto http;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 10s;
        proxy_read_timeout 120s;
        proxy_pass http://backend:4000;
    }
}
NGINX
fi

log "Selecting Blockscout image"
set +e
docker pull ghcr.io/blockscout/blockscout:11.3.1 >/dev/null 2>&1
rc1=$?
if [ "$rc1" -eq 0 ]; then
  sed -i 's#^BLOCKSCOUT_IMAGE=.*#BLOCKSCOUT_IMAGE=ghcr.io/blockscout/blockscout:11.3.1#' "$ENV_FILE"
else
  docker pull ghcr.io/blockscout/blockscout:v11.3.1 >/dev/null 2>&1
  rc2=$?
  if [ "$rc2" -eq 0 ]; then
    sed -i 's#^BLOCKSCOUT_IMAGE=.*#BLOCKSCOUT_IMAGE=ghcr.io/blockscout/blockscout:v11.3.1#' "$ENV_FILE"
  else
    docker pull ghcr.io/blockscout/blockscout:latest >/dev/null 2>&1
    rc3=$?
    [ "$rc3" -eq 0 ] || { set -e; fail "Unable to pull Blockscout image"; }
    sed -i 's#^BLOCKSCOUT_IMAGE=.*#BLOCKSCOUT_IMAGE=ghcr.io/blockscout/blockscout:latest#' "$ENV_FILE"
  fi
fi
set -e

log "Starting Blockscout API/indexer stack"
cd "$BASE"
"${COMPOSE[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull
"${COMPOSE[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q '^Status: active'; then
  ufw allow OpenSSH >/dev/null
  ufw allow 80/tcp >/dev/null
fi

log "Waiting for backend API"
ok=false
for i in $(seq 1 90); do
  code="$(curl -sS -o /tmp/kam-blocks.json -w '%{http_code}' --max-time 10 http://127.0.0.1/api/v2/blocks || true)"
  if [ "$code" = "200" ] && jq -e '.items | type=="array"' /tmp/kam-blocks.json >/dev/null 2>&1; then
    ok=true
    break
  fi
  if (( i % 10 == 0 )); then
    echo "waiting attempt=$i http=$code"
    "${COMPOSE[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps || true
  fi
  sleep 10
done

if [ "$ok" != "true" ]; then
  echo "=== docker compose ps ==="
  "${COMPOSE[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps || true
  echo "=== backend logs (last 160 lines) ==="
  "${COMPOSE[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=160 backend || true
  fail "Blockscout API did not become ready within 15 minutes"
fi

log "Blockscout API is responding"
curl -fsS http://127.0.0.1/api/v2/blocks | jq '{items_count:(.items|length), first_block:(.items[0].height // .items[0].number // null)}'
curl -fsS http://127.0.0.1/api/v2/stats | jq '{total_transactions, total_addresses, average_block_time}' || true

echo
echo "=== FINAL LOCAL STATUS ==="
"${COMPOSE[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
echo "chain_id=$EXPECTED_CHAIN_HEX ($EXPECTED_CHAIN_DEC)"
echo "rpc_head=$head_hex"
echo "local_api=http://127.0.0.1/api/v2/blocks"
echo "bootstrap_status=SUCCESS"
