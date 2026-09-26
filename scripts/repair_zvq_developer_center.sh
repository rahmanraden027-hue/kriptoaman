#!/usr/bin/env bash
set -Eeuo pipefail
if [[ "$(id -u)" != 0 ]]; then echo "Root access through reviewed workflow required" >&2; exit 1; fi
REPO="$(pwd -P)"

BASE=/opt/blockscout/docker-compose
PROXY_DIR="$BASE/proxy"
TEMPLATE="$PROXY_DIR/default.conf.template"
TLS_BASE=/var/lib/zvq-origin-ip-tls
TLS_CONFIG="$TLS_BASE/default.conf"
TLS_NAME=zvq-origin-ip-tls
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="$PROXY_DIR/zvq-developer-backup-$STAMP"
TEMPLATE_BACKUP="$TEMPLATE.zvq-developer-$STAMP.bak"
TLS_BACKUP="$TLS_CONFIG.zvq-developer-$STAMP.bak"
CANDIDATE="$(mktemp)"
BODY="$(mktemp)"
cleanup(){ rm -f "$CANDIDATE" "$BODY"; }
trap cleanup EXIT
fail(){ echo "ZVQ Developer repair: $*" >&2; exit 1; }

declare -A FILES=(
  [developer.html]="$REPO/explorer-dashboard/developer.html"
  [developer-docs.html]="$REPO/explorer-dashboard/developer-docs.html"
  [developer-examples.html]="$REPO/explorer-dashboard/developer-examples.html"
  [developer-verify.html]="$REPO/explorer-dashboard/developer-verify.html"
  [developer-starter.html]="$REPO/explorer-dashboard/developer-starter.html"
  [developer-network.json]="$REPO/explorer-dashboard/developer-network.json"
)
for f in "${FILES[@]}"; do test -f "$f" || fail "missing reviewed source: $f"; done
grep -Fq 'data-kam-developer-version="1.0.0"' explorer-dashboard/developer.html
grep -Fq 'data-kam-developer-docs-version="1.0.0"' explorer-dashboard/developer-docs.html
grep -Fq 'data-kam-developer-examples-version="1.0.0"' explorer-dashboard/developer-examples.html
grep -Fq 'data-kam-developer-verify-version="1.0.0"' explorer-dashboard/developer-verify.html
grep -Fq 'data-kam-developer-starter-version="1.0.0"' explorer-dashboard/developer-starter.html
python3 - <<'PY'
import json
d=json.load(open("explorer-dashboard/developer-network.json"))
assert d["chainId"]==22028 and d["chainIdHex"]=="0x560c"
assert d["networkName"]=="ZEVARYQ Mainnet"
assert d["nativeCurrency"]["symbol"]=="ZVQ"
assert d["publicDeveloperAccess"] is True
PY

test -f "$TEMPLATE"; test -f "$TLS_CONFIG"
cd "$BASE"
PROXY_ID="$(docker compose ps -q proxy)"; test -n "$PROXY_ID"
PROXY_IMAGE="$(docker inspect "$PROXY_ID" --format '{{.Config.Image}}')"
proxy_fs(){ docker run --rm --network none -i -v "$PROXY_DIR:/target" "$PROXY_IMAGE" sh -c "$1"; }
proxy_fs "mkdir -p /target/$(basename "$BACKUP_DIR")/kam-dashboard"
proxy_fs "cp -a /target/default.conf.template /target/$(basename "$TEMPLATE_BACKUP")"
for name in "${!FILES[@]}"; do
  proxy_fs "if test -f /target/kam-dashboard/$name; then cp -a /target/kam-dashboard/$name /target/$(basename "$BACKUP_DIR")/kam-dashboard/$name; fi"
done
cp -a "$TLS_CONFIG" "$TLS_BACKUP"

rollback(){
  code=$?
  echo "repair failed; rolling back Developer-only changes" >&2
  proxy_fs "cp -a /target/$(basename "$TEMPLATE_BACKUP") /target/default.conf.template" || true
  for name in "${!FILES[@]}"; do
    proxy_fs "if test -f /target/$(basename "$BACKUP_DIR")/kam-dashboard/$name; then cp -a /target/$(basename "$BACKUP_DIR")/kam-dashboard/$name /target/kam-dashboard/$name; else rm -f /target/kam-dashboard/$name; fi" || true
  done
  cp -a "$TLS_BACKUP" "$TLS_CONFIG" || true
  docker compose up -d --force-recreate proxy >/dev/null 2>&1 || true
  docker exec "$TLS_NAME" nginx -t >/dev/null 2>&1 && docker exec "$TLS_NAME" nginx -s reload >/dev/null 2>&1 || true
  exit "$code"
}
trap rollback ERR

for name in "${!FILES[@]}"; do
  proxy_fs "mkdir -p /target/kam-dashboard; cat > /target/kam-dashboard/$name; chmod 0644 /target/kam-dashboard/$name" < "${FILES[$name]}"
done

python3 "$REPO/scripts/render_zvq_developer_backend.py" "$TEMPLATE" "$CANDIDATE"
proxy_fs "cat > /target/default.conf.template" < "$CANDIDATE"
docker compose up -d --force-recreate proxy

for path in /developer /developers /developer/docs /developer/examples /developer/verify /developer/starter /developer/network.json; do
  code="$(curl --noproxy '*' -sS --max-time 12 -o "$BODY" -w '%{http_code}' -H 'Host: explorer.kriptoaman.com' "http://127.0.0.1:80$path")"
  test "$code" = 200
  if test "$path" = /developer/network.json; then
    python3 - "$BODY" <<'PY'
import json,sys
d=json.load(open(sys.argv[1])); assert d["chainId"]==22028 and d["nativeCurrency"]["symbol"]=="ZVQ"
PY
  else
    grep -Fq 'ZVQ' "$BODY"
  fi
done

python3 "$REPO/scripts/render_zvq_developer_https.py" "$TLS_CONFIG" "$CANDIDATE"
cat "$CANDIDATE" > "$TLS_CONFIG"
docker exec "$TLS_NAME" nginx -t
docker exec "$TLS_NAME" nginx -s reload

test "$(curl --noproxy '*' -sS --max-time 12 -o /dev/null -w '%{http_code}' https://146.190.93.254/rpc)" = 403
test "$(curl --noproxy '*' -sS --max-time 12 -o /dev/null -w '%{http_code}' https://146.190.93.254/api/admin)" = 403
curl --noproxy '*' -fsS --max-time 12 --resolve explorer.kriptoaman.com:443:146.190.93.254 -H 'Content-Type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' https://explorer.kriptoaman.com/rpc | python3 -c 'import json,sys; assert json.load(sys.stdin).get("result")=="0x560c"'
for attempt in 1 2 3 4 5 6; do
  if python3 "$REPO/scripts/probe_zvq_developer_routes.py" --scope origin --require-ready; then break; fi
  if [[ "$attempt" == 6 ]]; then echo "Developer direct-origin verification failed" >&2; false; fi
  sleep 2
done
for attempt in 1 2 3 4 5 6; do
  if python3 "$REPO/scripts/probe_zvq_developer_routes.py" --scope public --require-ready; then break; fi
  if [[ "$attempt" == 6 ]]; then echo "Developer public verification failed" >&2; false; fi
  sleep 2
done

trap - ERR
echo "zvq_developer_repair=success backup_dir=$BACKUP_DIR template_backup=$TEMPLATE_BACKUP tls_backup=$TLS_BACKUP"
