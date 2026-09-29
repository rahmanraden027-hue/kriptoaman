#!/usr/bin/env bash
set -Eeuo pipefail

MODE="${1:-preview}"
RUN_ID="${ZVQ_RPC_CUTOVER_RUN_ID:-}"
[[ "$RUN_ID" =~ ^[0-9]{7,16}$ ]] || { echo "invalid_run_id" >&2; exit 1; }
test "$(id -u)" -eq 0

CONF_LINK=/etc/nginx/sites-enabled/zevaryq-rpc
CONF="$(readlink -f "$CONF_LINK")"
BASE=/var/lib/zvq-rpc-production-policy
GATEWAY_SOURCE=/tmp/zvq-rpc-allowlist-gateway.mjs
GATEWAY_INSTALLED="$BASE/gateway.mjs"
GATEWAY_NAME=zvq-rpc-production-allowlist
GATEWAY_PORT=18445
MARKER="$BASE/pending-$RUN_ID"
BACKUP="$BASE/nginx-$RUN_ID.bak"
CANDIDATE="$BASE/nginx-$RUN_ID.candidate"

rpc_json() {
  local url="$1" method="$2" params="$3"
  curl --noproxy '*' -fsS --connect-timeout 4 --max-time 12     -H 'Content-Type: application/json'     --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"$method\",\"params\":$params}" "$url"
}
rpc_code() {
  local url="$1" method="$2" params="$3"
  curl --noproxy '*' -sS --connect-timeout 4 --max-time 12 -o /dev/null -w '%{http_code}'     -H 'Content-Type: application/json'     --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"$method\",\"params\":$params}" "$url"
}
chain_ok() {
  local url="$1"
  test "$(rpc_json "$url" eth_chainId '[]' | jq -er '.result')" = 0x560c
}
blocks_advance() {
  local url="$1"
  local a b na nb
  a="$(rpc_json "$url" eth_blockNumber '[]' | jq -er '.result')"
  sleep 12
  b="$(rpc_json "$url" eth_blockNumber '[]' | jq -er '.result')"
  na=$((16#${a#0x})); nb=$((16#${b#0x}))
  echo "block_1=$a block_2=$b"
  test "$nb" -gt "$na"
}
discover_upstream() {
  python3 - "$CONF" <<'PY'
import ipaddress,re,sys
text=open(sys.argv[1],encoding='utf-8').read()
matches=re.findall(r'^\s*proxy_pass\s+(http://(10(?:\.\d{1,3}){3})/rpc);\s*$', text, flags=re.M)
if len(matches) != 1:
    raise SystemExit("expected_exactly_one_private_rpc_proxy")
url, host = matches[0]
ip=ipaddress.ip_address(host)
if not ip.is_private or ip.is_loopback or ip.is_link_local:
    raise SystemExit("upstream_not_private")
print(url)
PY
}
restore() {
  if test -r "$BACKUP"; then
    cat "$BACKUP" > "$CONF"
    nginx -t
    systemctl reload nginx
  fi
  docker rm -f "$GATEWAY_NAME" >/dev/null 2>&1 || true
  rm -f "$GATEWAY_INSTALLED" "$CANDIDATE" "$MARKER"
}

case "$MODE" in
  rollback)
    test -r "$MARKER" || { echo "no_pending_cutover"; exit 0; }
    restore
    echo "zvq_rpc_cutover=rolled_back"
    exit 0
    ;;
  finalize)
    test -r "$MARKER"
    grep -Fq 'proxy_pass http://127.0.0.1:18445;' "$CONF"
    test "$(docker inspect -f '{{.State.Status}}' "$GATEWAY_NAME")" = running
    chain_ok 'https://rpc.kriptoaman.com/'
    mv "$MARKER" "$BASE/committed-$RUN_ID"
    rm -f "$CANDIDATE"
    echo "zvq_rpc_cutover=committed"
    exit 0
    ;;
  preview|apply) ;;
  *) echo "unknown_mode" >&2; exit 1 ;;
esac

test -f "$CONF" && test "${CONF#/etc/nginx/}" != "$CONF"
test -r "$GATEWAY_SOURCE"
nginx -t
UPSTREAM="$(discover_upstream)"
echo "upstream_class=private_vpc_rpc"
chain_ok "$UPSTREAM"
blocks_advance "$UPSTREAM"

if test "$MODE" = preview; then
  echo "zvq_rpc_cutover=preview_pass"
  exit 0
fi

test ! -e "$MARKER" && test ! -e "$BACKUP" && test ! -e "$CANDIDATE"
if docker inspect "$GATEWAY_NAME" >/dev/null 2>&1; then
  echo "ambiguous_existing_gateway" >&2
  exit 1
fi
if ss -H -ltn "( sport = :$GATEWAY_PORT )" | grep -q .; then
  echo "gateway_port_already_owned" >&2
  exit 1
fi

install -d -m 0700 "$BASE"
cp -a "$CONF" "$BACKUP"
cp -a "$CONF" "$CANDIDATE"
install -m 0644 "$GATEWAY_SOURCE" "$GATEWAY_INSTALLED"
printf 'run_id=%s\nbackup=%s\n' "$RUN_ID" "$BACKUP" > "$MARKER"
chmod 0600 "$MARKER"

committed=0
rollback_on_error() {
  code=$?
  if test "$committed" != 1; then
    echo "cutover_failed=rollback" >&2
    restore || true
  fi
  exit "$code"
}
trap rollback_on_error ERR INT TERM

docker image inspect node:24-alpine >/dev/null 2>&1 || docker pull node:24-alpine >/dev/null
docker run -d --name "$GATEWAY_NAME" --network host --restart unless-stopped   --read-only --user 10001:10001 --cap-drop ALL --security-opt no-new-privileges   --memory 128m --pids-limit 64 --tmpfs /tmp   --mount "type=bind,src=$GATEWAY_INSTALLED,dst=/gateway.mjs,readonly"   -e "ZVQ_UPSTREAM_URL=$UPSTREAM" -e "ZVQ_GATEWAY_PORT=$GATEWAY_PORT"   node:24-alpine node /gateway.mjs >/dev/null

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if chain_ok "http://127.0.0.1:$GATEWAY_PORT/"; then break; fi
  sleep 1
done
chain_ok "http://127.0.0.1:$GATEWAY_PORT/"
for method in admin_peers debug_traceTransaction eth_sendRawTransaction; do
  params='[]'; test "$method" = eth_sendRawTransaction && params='["0x00"]'
  test "$(rpc_code "http://127.0.0.1:$GATEWAY_PORT/" "$method" "$params")" = 403
done
test "$(curl --noproxy '*' -sS -o /dev/null -w '%{http_code}' -X OPTIONS   -H 'Origin: https://explorer.kriptoaman.com'   -H 'Access-Control-Request-Method: POST'   "http://127.0.0.1:$GATEWAY_PORT/")" = 204
test "$(curl --noproxy '*' -sS -o /dev/null -w '%{http_code}' -X OPTIONS   -H 'Origin: https://attacker.example'   -H 'Access-Control-Request-Method: POST'   "http://127.0.0.1:$GATEWAY_PORT/")" = 403

python3 - "$CANDIDATE" "$UPSTREAM" <<'PY'
import sys
path, upstream = sys.argv[1:3]
text=open(path,encoding='utf-8').read()
old=f"proxy_pass {upstream};"
if text.count(old) != 1:
    raise SystemExit("proxy_pass_count_mismatch")
text=text.replace(old, "proxy_pass http://127.0.0.1:18445;")
open(path,'w',encoding='utf-8').write(text)
PY
cat "$CANDIDATE" > "$CONF"
nginx -t
systemctl reload nginx

LOCAL='https://rpc.kriptoaman.com/'
chain="$(curl --noproxy '*' --resolve rpc.kriptoaman.com:443:127.0.0.1 -fsS --max-time 10   -H 'Origin: https://explorer.kriptoaman.com' -H 'Content-Type: application/json'   --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' "$LOCAL" | jq -er '.result')"
test "$chain" = 0x560c
for method in admin_peers debug_traceTransaction eth_sendRawTransaction; do
  params='[]'; test "$method" = eth_sendRawTransaction && params='["0x00"]'
  code="$(curl --noproxy '*' --resolve rpc.kriptoaman.com:443:127.0.0.1 -sS --max-time 8     -o /dev/null -w '%{http_code}' -H 'Origin: https://explorer.kriptoaman.com'     -H 'Content-Type: application/json'     --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"$method\",\"params\":$params}" "$LOCAL")"
  echo "local_blocked_method=$method http_code=$code"
  test "$code" = 403
done

committed=1
trap - ERR INT TERM
echo "zvq_rpc_cutover=staged_pending_external_verify chain_id=0x560c"
