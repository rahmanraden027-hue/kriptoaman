#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

BLOCKSCOUT_GIT_TAG="${BLOCKSCOUT_GIT_TAG:-v11.2.3}"
BLOCKSCOUT_DOCKER_TAG="${BLOCKSCOUT_DOCKER_TAG:-11.2.3}"
BLOCKSCOUT_DIR="${BLOCKSCOUT_DIR:-/opt/blockscout}"
COMPOSE_DIR="${BLOCKSCOUT_DIR}/docker-compose"
RPC_URL="${KAM_RPC_URL:-https://explorer.kriptoaman.com/rpc}"
PUBLIC_IP="${KAM_EXPLORER_PUBLIC_IP:-$(curl -fsS --max-time 5 https://api.ipify.org || true)}"
DROPLET_ID="${KAM_EXPLORER_DROPLET_ID:-unknown}"
CHAIN_ID_DEC=22028
CHAIN_ID_HEX=0x560c

log(){ printf '[kam-blockscout] %s\n' "$*"; }
die(){ printf '[kam-blockscout] ERROR: %s\n' "$*" >&2; exit 1; }

[[ "${EUID}" -eq 0 ]] || die "Run as root."

[[ "${PUBLIC_IP}" =~ ^[0-9]+.[0-9]+.[0-9]+.[0-9]+$ ]] || die "Unable to determine Explorer public IPv4 address"

log "Explorer host detected public_ip=${PUBLIC_IP} droplet_id=${DROPLET_ID}"
log "Installing probe dependencies"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl git jq openssl ufw docker.io
if ! apt-get install -y docker-compose-v2; then
  apt-get install -y docker-compose-plugin
fi

log "Verifying KAM RPC before host changes"
chain_id="$(curl -fsS --retry 5 --retry-delay 2 --max-time 20 \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
  "${RPC_URL}" | jq -r '.result // empty')" || die "KAM RPC unavailable"
[[ "${chain_id}" == "${CHAIN_ID_HEX}" ]] || die "Unexpected chain id: ${chain_id:-empty}"

head_hex="$(curl -fsS --retry 5 --retry-delay 2 --max-time 20 \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":2,"method":"eth_blockNumber","params":[]}' \
  "${RPC_URL}" | jq -r '.result // empty')" || die "Unable to read KAM block head"
[[ "${head_hex}" =~ ^0x[0-9a-fA-F]+$ ]] || die "Invalid KAM block head: ${head_hex:-empty}"
log "KAM RPC verified chain_id=${chain_id} block_head=${head_hex}"

systemctl enable --now docker
docker compose version >/dev/null

log "Applying minimal host firewall"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw --force enable

if [[ -e "${BLOCKSCOUT_DIR}" && ! -d "${BLOCKSCOUT_DIR}/.git" ]]; then
  die "${BLOCKSCOUT_DIR} exists but is not a Blockscout git checkout"
fi

if [[ ! -d "${BLOCKSCOUT_DIR}/.git" ]]; then
  log "Cloning Blockscout ${BLOCKSCOUT_GIT_TAG}"
  git clone --depth 1 --branch "${BLOCKSCOUT_GIT_TAG}" https://github.com/blockscout/blockscout.git "${BLOCKSCOUT_DIR}"
else
  log "Refreshing existing Blockscout checkout"
  git -C "${BLOCKSCOUT_DIR}" fetch --tags --force origin "${BLOCKSCOUT_GIT_TAG}"
  git -C "${BLOCKSCOUT_DIR}" checkout --detach "${BLOCKSCOUT_GIT_TAG}"
  git -C "${BLOCKSCOUT_DIR}" reset --hard "${BLOCKSCOUT_GIT_TAG}"
fi

SECRETS_FILE=/root/.kam-blockscout-secrets
if [[ ! -f "${SECRETS_FILE}" ]]; then
  db_pass="$(openssl rand -hex 24)"
  stats_pass="$(openssl rand -hex 24)"
  secret_key="$(openssl rand -base64 64 | tr -d '\n')"
  cat >"${SECRETS_FILE}" <<EOF
DB_PASS=${db_pass}
STATS_PASS=${stats_pass}
SECRET_KEY_BASE=${secret_key}
EOF
  chmod 600 "${SECRETS_FILE}"
fi
# shellcheck disable=SC1090
source "${SECRETS_FILE}"

log "Writing KAM production Blockscout configuration"
python3 - "${COMPOSE_DIR}" "${DB_PASS}" "${STATS_PASS}" "${SECRET_KEY_BASE}" "${RPC_URL}" "${PUBLIC_IP}" "${BLOCKSCOUT_DOCKER_TAG}" <<'PY'
from pathlib import Path
import sys

base=Path(sys.argv[1])
db_pass, stats_pass, secret_key, rpc, public_ip, docker_tag = sys.argv[2:]

env=base/'envs/common-blockscout.env'
text=env.read_text()
values={
    'ETHEREUM_JSONRPC_VARIANT':'geth',
    'ETHEREUM_JSONRPC_HTTP_URL':rpc,
    'ETHEREUM_JSONRPC_TRACE_URL':rpc,
    'ETHEREUM_JSONRPC_TRANSPORT':'http',
    'ETHEREUM_JSONRPC_DISABLE_ARCHIVE_BALANCES':'true',
    'DATABASE_URL':f'postgresql://blockscout:{db_pass}@db:5432/blockscout',
    'SECRET_KEY_BASE':secret_key,
    'COIN_NAME':'KAM',
    'COIN':'KAM',
    'DISABLE_MARKET':'true',
    'POOL_SIZE':'30',
    'POOL_SIZE_API':'10',
    'API_V2_ENABLED':'true',
    'RE_CAPTCHA_DISABLED':'true',
    'CHAIN_ID':'22028',
    'FIRST_BLOCK':'0',
    'INDEXER_DISABLE_INTERNAL_TRANSACTIONS_FETCHER':'true',
    'INDEXER_DISABLE_PENDING_TRANSACTIONS_FETCHER':'true',
    'INDEXER_DISABLE_REPLACED_TRANSACTION_FETCHER':'true',
    'INDEXER_CATCHUP_BLOCKS_BATCH_SIZE':'10',
    'INDEXER_CATCHUP_BLOCKS_CONCURRENCY':'2',
    'INDEXER_RECEIPTS_BATCH_SIZE':'50',
    'INDEXER_RECEIPTS_CONCURRENCY':'2',
    'INDEXER_COIN_BALANCES_BATCH_SIZE':'50',
    'INDEXER_COIN_BALANCES_CONCURRENCY':'2',
    'INDEXER_TOKEN_CONCURRENCY':'2',
}
lines=text.splitlines()
seen=set()
out=[]
for line in lines:
    raw=line[1:] if line.startswith('#') else line
    key=raw.split('=',1)[0].strip() if '=' in raw else None
    if key in values:
        if key not in seen:
            out.append(f'{key}={values[key]}')
            seen.add(key)
        continue
    out.append(line)
for key,val in values.items():
    if key not in seen:
        out.append(f'{key}={val}')
env.write_text('\n'.join(out)+'\n')

front=base/'envs/common-frontend.env'
ft=front.read_text()
fvals={
    'NEXT_PUBLIC_API_HOST':public_ip,
    'NEXT_PUBLIC_API_PROTOCOL':'http',
    'NEXT_PUBLIC_NETWORK_NAME':'KAM Mainnet',
    'NEXT_PUBLIC_NETWORK_SHORT_NAME':'KAM',
    'NEXT_PUBLIC_NETWORK_ID':'22028',
    'NEXT_PUBLIC_NETWORK_CURRENCY_NAME':'KAM',
    'NEXT_PUBLIC_NETWORK_CURRENCY_SYMBOL':'KAM',
    'NEXT_PUBLIC_NETWORK_CURRENCY_DECIMALS':'18',
    'NEXT_PUBLIC_APP_HOST':public_ip,
    'NEXT_PUBLIC_APP_PROTOCOL':'http',
    'NEXT_PUBLIC_IS_TESTNET':'false',
}
flines=ft.splitlines()
fout=[]
fseen=set()
for line in flines:
    raw=line[1:] if line.startswith('#') else line
    key=raw.split('=',1)[0].strip() if '=' in raw else None
    if key in fvals:
        if key not in fseen:
            fout.append(f'{key}={fvals[key]}')
            fseen.add(key)
        continue
    fout.append(line)
for key,val in fvals.items():
    if key not in fseen:
        fout.append(f'{key}={val}')
front.write_text('\n'.join(fout)+'\n')

db=base/'services/db.yml'
d=db.read_text()
d=d.replace("POSTGRES_PASSWORD: 'ceWb1MeLBEeOIfk65gU8EjF8'",f"POSTGRES_PASSWORD: '{db_pass}'")
d=d.replace("published: 7432","host_ip: 127.0.0.1\n        published: 7432")
db.write_text(d)

stats=base/'services/stats.yml'
s=stats.read_text()
s=s.replace("POSTGRES_PASSWORD: 'n0uejXPl61ci6ldCuE2gQU5Y'",f"POSTGRES_PASSWORD: '{stats_pass}'")
s=s.replace("published: 7433","host_ip: 127.0.0.1\n        published: 7433")
s=s.replace("postgres://stats:n0uejXPl61ci6ldCuE2gQU5Y@stats-db:5432/stats",f"postgres://stats:{stats_pass}@stats-db:5432/stats")
s=s.replace("postgresql://blockscout:ceWb1MeLBEeOIfk65gU8EjF8@db:5432/blockscout",f"postgresql://blockscout:{db_pass}@db:5432/blockscout")
stats.write_text(s)

ng=base/'services/nginx.yml'
n=ng.read_text()
n=n.replace("target: 8080\n        published: 8080","target: 8080\n        host_ip: 127.0.0.1\n        published: 8080")
n=n.replace("target: 8081\n        published: 8081","target: 8081\n        host_ip: 127.0.0.1\n        published: 8081")
ng.write_text(n)

proxy=base/'proxy/default.conf.template'
proxy.write_text(r'''map $http_upgrade $connection_upgrade {
  default upgrade;
  '' close;
}

server {
  listen 80 default_server;
  server_name _;

  add_header X-KAM-Blockscout-Origin "1" always;
  add_header X-Content-Type-Options "nosniff" always;

  location ~ ^/api/ {
    proxy_pass ${BACK_PROXY_PASS};
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_read_timeout 120s;
  }

  location = /healthz {
    access_log off;
    return 200 "kam-blockscout-origin-ok\n";
  }

  location / {
    return 404;
  }
}

server {
  listen 8080;
  server_name _;
  location / { proxy_pass http://stats:8050/; }
}

server {
  listen 8081;
  server_name _;
  location / { proxy_pass http://visualizer:8050/; }
}
''')

(base/'.env').write_text(f'DOCKER_TAG={docker_tag}\n')
PY

touch "${BLOCKSCOUT_DIR}/.kam-production-marker"

log "Validating Docker Compose"
cd "${COMPOSE_DIR}"
docker compose -f geth.yml config >/dev/null

BACKEND_PUBLIC_IMAGE="ghcr.io/blockscout/blockscout:${BLOCKSCOUT_DOCKER_TAG}"
BACKEND_LOCAL_IMAGE="kam-blockscout-backend:${BLOCKSCOUT_DOCKER_TAG}"

log "Checking published Blockscout backend image"
if docker manifest inspect "${BACKEND_PUBLIC_IMAGE}" >/dev/null 2>&1; then
  log "Using published backend image ${BACKEND_PUBLIC_IMAGE}"
else
  log "Published backend image unavailable; building backend from pinned source ${BLOCKSCOUT_GIT_TAG}"
  docker build     --file "${BLOCKSCOUT_DIR}/docker/Dockerfile"     --tag "${BACKEND_LOCAL_IMAGE}"     --build-arg "BLOCKSCOUT_VERSION=${BLOCKSCOUT_GIT_TAG}"     --build-arg "RELEASE_VERSION=${BLOCKSCOUT_DOCKER_TAG}"     "${BLOCKSCOUT_DIR}"

  python3 - "${COMPOSE_DIR}/services/backend.yml" "${BACKEND_LOCAL_IMAGE}" <<'PY'
from pathlib import Path
import sys

path=Path(sys.argv[1])
image=sys.argv[2]
text=path.read_text()
old='    image: ghcr.io/blockscout/${DOCKER_REPO:-blockscout}:${DOCKER_TAG:-latest}'
if old not in text:
    raise SystemExit('backend image anchor missing')
text=text.replace(old, f'    image: {image}', 1)
text=text.replace('    pull_policy: always', '    pull_policy: never', 1)
path.write_text(text)
PY
fi

mkdir -p "${COMPOSE_DIR}/dets" "${COMPOSE_DIR}/logs"
chown -R 10001:10001 "${COMPOSE_DIR}/dets" "${COMPOSE_DIR}/logs"

log "Re-validating Docker Compose after backend selection"
docker compose -f geth.yml config >/dev/null

log "Pulling Blockscout companion containers"
docker compose -f geth.yml pull

log "Starting Blockscout and indexer"
docker compose -f geth.yml up -d

log "Waiting for Blockscout API contract"
deadline=$((SECONDS+900))
api_ok=false
while (( SECONDS < deadline )); do
  if body="$(curl -fsS --max-time 10 http://127.0.0.1/api/v2/blocks 2>/dev/null)"; then
    if jq -e '(.items|type=="array")' >/dev/null 2>&1 <<<"${body}"; then
      api_ok=true
      break
    fi
  fi
  sleep 10
done

log "Container state"
docker compose -f geth.yml ps

if [[ "${api_ok}" != true ]]; then
  log "API did not become ready within 15 minutes; printing backend tail"
  docker compose -f geth.yml logs --tail=120 backend || true
  exit 2
fi

stats="$(curl -fsS --max-time 10 http://127.0.0.1/api/v2/stats || true)"
blocks="$(curl -fsS --max-time 10 http://127.0.0.1/api/v2/blocks)"
latest="$(jq -r '.items[0].height // empty' <<<"${blocks}")"

log "Blockscout API ready latest_indexed_block=${latest:-unknown}"
if [[ -n "${stats}" ]]; then
  jq -c '{total_transactions,total_addresses,average_block_time}' <<<"${stats}" || true
fi

cat >/root/KAM_BLOCKSCOUT_STATUS.txt <<EOF
droplet_id=${DROPLET_ID}
public_ip=${PUBLIC_IP}
blockscout_git_tag=${BLOCKSCOUT_GIT_TAG}
blockscout_docker_tag=${BLOCKSCOUT_DOCKER_TAG}
chain_id=${CHAIN_ID_DEC}
rpc_url=${RPC_URL}
rpc_head=${head_hex}
api_ready=${api_ok}
latest_indexed_block=${latest:-unknown}
configured_at=$(date -u +%FT%TZ)
EOF
chmod 600 /root/KAM_BLOCKSCOUT_STATUS.txt

log "Bootstrap complete"
log "Local health: http://127.0.0.1/healthz"
log "API origin: http://${PUBLIC_IP}/api/v2/blocks"
