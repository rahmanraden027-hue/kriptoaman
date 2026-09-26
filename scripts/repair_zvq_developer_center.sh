#!/usr/bin/env bash
set -Eeuo pipefail

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
  [developer.html]=explorer-dashboard/developer.html
  [developer-docs.html]=explorer-dashboard/developer-docs.html
  [developer-examples.html]=explorer-dashboard/developer-examples.html
  [developer-verify.html]=explorer-dashboard/developer-verify.html
  [developer-starter.html]=explorer-dashboard/developer-starter.html
  [developer-network.json]=explorer-dashboard/developer-network.json
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

python3 - "$TEMPLATE" "$CANDIDATE" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); out=Path(sys.argv[2]); text=p.read_text()
begin="    # ZVQ_DEVELOPER_BACKEND_V1_BEGIN\n"; end="    # ZVQ_DEVELOPER_BACKEND_V1_END\n"
if begin in text:
    before,rest=text.split(begin,1)
    if end not in rest: raise SystemExit("incomplete existing Developer backend marker")
    _,after=rest.split(end,1); text=before+after
needle="    location / {\n"
if needle not in text: raise SystemExit("frontend catch-all missing")
def route(path,file,ctype="text/html"):
    return f"""    location = {path} {{
        limit_except GET {{ deny all; }}
        root /etc/nginx/templates;
        try_files /kam-dashboard/{file} =404;
        default_type {ctype};
        add_header Cache-Control "no-store" always;
        add_header X-Content-Type-Options "nosniff" always;
    }}
"""
block=begin
block+=route("/developer","developer.html")
block+=route("/developers","developer.html")
block+=route("/developer/docs","developer-docs.html")
block+=route("/developer/examples","developer-examples.html")
block+=route("/developer/verify","developer-verify.html")
block+=route("/developer/starter","developer-starter.html")
block+=route("/developer/network.json","developer-network.json","application/json")
block+=end
out.write_text(text.replace(needle,block+needle,1))
PY
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

python3 scripts/render_zvq_developer_https.py "$TLS_CONFIG" "$CANDIDATE"
cat "$CANDIDATE" > "$TLS_CONFIG"
docker exec "$TLS_NAME" nginx -t
docker exec "$TLS_NAME" nginx -s reload

test "$(curl --noproxy '*' -sS --max-time 12 -o /dev/null -w '%{http_code}' https://146.190.93.254/rpc)" = 403
test "$(curl --noproxy '*' -sS --max-time 12 -o /dev/null -w '%{http_code}' https://146.190.93.254/api/admin)" = 403
curl --noproxy '*' -fsS --max-time 12 --resolve explorer.kriptoaman.com:443:146.190.93.254 -H 'Content-Type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' https://explorer.kriptoaman.com/rpc | python3 -c 'import json,sys; assert json.load(sys.stdin).get("result")=="0x560c"'
python3 scripts/probe_zvq_developer_routes.py --scope origin --require-ready
python3 scripts/probe_zvq_developer_routes.py --scope public --require-ready

trap - ERR
echo "zvq_developer_repair=success backup_dir=$BACKUP_DIR template_backup=$TEMPLATE_BACKUP tls_backup=$TLS_BACKUP"
