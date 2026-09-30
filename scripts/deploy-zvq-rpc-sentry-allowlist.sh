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
MARKER="$BASE/pending-$RUN_ID"
BACKUP="$BASE/nginx-$RUN_ID.bak"
CANDIDATE_CONF="$BASE/nginx-$RUN_ID.candidate"
CANDIDATE_GATEWAY="$BASE/gateway-$RUN_ID.mjs"
CANDIDATE_NAME="zvq-rpc-allowlist-$RUN_ID"
STATE="$BASE/state-$RUN_ID.env"

fail(){ echo "ERROR: $*" >&2; exit 1; }

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
validate_private_rpc() {
  python3 - "$1" <<'PY'
import ipaddress,sys
u=sys.argv[1]
from urllib.parse import urlparse
p=urlparse(u)
if p.scheme!="http" or p.username or p.password or p.port or p.path!="/rpc" or p.query or p.fragment:
    raise SystemExit(1)
ip=ipaddress.ip_address(p.hostname or "")
if not ip.is_private or ip.is_loopback or ip.is_link_local:
    raise SystemExit(1)
print(u)
PY
}
discover_current_target() {
  python3 - "$CONF" <<'PY'
import re,sys
text=open(sys.argv[1],encoding='utf-8').read()
matches=re.findall(r'^\s*proxy_pass\s+(http://[^;]+);\s*$', text, flags=re.M)
eligible=[u for u in matches if re.fullmatch(r'http://10(?:\.\d{1,3}){3}/rpc',u) or re.fullmatch(r'http://127\.0\.0\.1:1844[56]',u)]
if len(eligible)!=1:
    raise SystemExit("expected_exactly_one_rpc_proxy_target")
print(eligible[0])
PY
}
container_for_gateway_port() {
  local wanted="$1" id env name port upstream
  while read -r id; do
    [[ -n "$id" ]] || continue
    env="$(docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$id" 2>/dev/null || true)"
    port="$(awk -F= '$1=="ZVQ_GATEWAY_PORT"{print $2}' <<<"$env" | tail -1)"
    [[ "$port" == "$wanted" ]] || continue
    upstream="$(awk -F= '$1=="ZVQ_UPSTREAM_URL"{sub(/^[^=]*=/,"");print}' <<<"$env" | tail -1)"
    name="$(docker inspect -f '{{.Name}}' "$id" | sed 's#^/##')"
    [[ "$name" =~ ^[A-Za-z0-9_.-]+$ ]] || fail "unsafe active container name"
    validate_private_rpc "$upstream" >/dev/null || fail "active gateway upstream is not approved private RPC"
    printf '%s|%s\n' "$name" "$upstream"
    return 0
  done < <(docker ps -q)
  return 1
}
resolve_upstream() {
  local target="$1" row port
  if [[ "$target" =~ ^http://10([.][0-9]{1,3}){3}/rpc$ ]]; then
    validate_private_rpc "$target"
    return
  fi
  if [[ "$target" =~ ^http://127[.]0[.]0[.]1:(18445|18446)$ ]]; then
    port="${BASH_REMATCH[1]}"
    row="$(container_for_gateway_port "$port")" || fail "active gateway container not found for port $port"
    printf '%s\n' "${row#*|}"
    return
  fi
  fail "unsupported current proxy target"
}
verify_qory_indexer() {
  local body
  body="$(curl --noproxy '*' -fsS --connect-timeout 3 --max-time 8 http://127.0.0.1:8765/health)" || fail "QoryVEx indexer health unavailable"
  jq -e '.status=="live" and .version>=2 and .chainId==22028 and .websocketSubscribed==true' <<<"$body" >/dev/null     || fail "QoryVEx indexer not live/v2"
}
load_state() {
  [[ -r "$STATE" ]] || fail "state file unavailable"
  # State values are written only after strict validation and shell escaping.
  # shellcheck disable=SC1090
  source "$STATE"
  [[ "$candidate_name" =~ ^zvq-rpc-allowlist-[0-9]{7,16}$ ]] || fail "invalid candidate state"
  [[ "$candidate_port" =~ ^1844[56]$ ]] || fail "invalid candidate port"
  [[ "$previous_target" =~ ^http://(10([.][0-9]{1,3}){3}/rpc|127[.]0[.]0[.]1:1844[56])$ ]] || fail "invalid previous target"
  [[ -z "${previous_container:-}" || "$previous_container" =~ ^[A-Za-z0-9_.-]+$ ]] || fail "invalid previous container"
}
restore_state() {
  load_state
  if [[ -r "$BACKUP" ]]; then
    cat "$BACKUP" > "$CONF"
    nginx -t
    systemctl reload nginx
  fi
  docker rm -f "$candidate_name" >/dev/null 2>&1 || true
  rm -f "$CANDIDATE_GATEWAY" "$CANDIDATE_CONF" "$MARKER" "$STATE"
}

case "$MODE" in
  rollback)
    [[ -r "$MARKER" ]] || { echo "no_pending_cutover"; exit 0; }
    restore_state
    echo "zvq_rpc_cutover=rolled_back"
    exit 0
    ;;
  finalize)
    [[ -r "$MARKER" ]] || fail "pending marker unavailable"
    load_state
    grep -Fq "proxy_pass http://127.0.0.1:$candidate_port;" "$CONF"
    test "$(docker inspect -f '{{.State.Status}}' "$candidate_name")" = running
    chain_ok 'https://rpc.kriptoaman.com/'
    qory="$(curl --noproxy '*' -fsS --max-time 10 -H 'Origin: https://kriptoaman.com' https://rpc.kriptoaman.com/qoryvex/v1/discovery)"
    jq -e '.status=="live" and .version>=2 and .chainId==22028 and .websocketSubscribed==true' <<<"$qory" >/dev/null
    if [[ -n "${previous_container:-}" && "$previous_container" != "$candidate_name" ]]; then
      docker rm -f "$previous_container" >/dev/null
    fi
    mv "$MARKER" "$BASE/committed-$RUN_ID"
    rm -f "$CANDIDATE_CONF"
    echo "zvq_rpc_cutover=committed candidate_port=$candidate_port"
    exit 0
    ;;
  preview|apply) ;;
  *) echo "unknown_mode" >&2; exit 1 ;;
esac

test -f "$CONF" && test "${CONF#/etc/nginx/}" != "$CONF"
test -r "$GATEWAY_SOURCE"
command -v node >/dev/null
node --check "$GATEWAY_SOURCE"
nginx -t
verify_qory_indexer

CURRENT_TARGET="$(discover_current_target)"
UPSTREAM="$(resolve_upstream "$CURRENT_TARGET")"
validate_private_rpc "$UPSTREAM" >/dev/null
previous_container=
if [[ "$CURRENT_TARGET" =~ ^http://127[.]0[.]0[.]1:(18445|18446)$ ]]; then
  active_port="${BASH_REMATCH[1]}"
  row="$(container_for_gateway_port "$active_port")" || fail "active gateway container unavailable"
  previous_container="${row%%|*}"
  candidate_port=18445
  [[ "$active_port" == 18445 ]] && candidate_port=18446
else
  candidate_port=18445
fi

echo "cutover_mode=$([[ -n "$previous_container" ]] && echo blue_green_upgrade || echo initial) current_target=$CURRENT_TARGET candidate_port=$candidate_port"
chain_ok "$UPSTREAM"
blocks_advance "$UPSTREAM"

if [[ "$MODE" == preview ]]; then
  echo "zvq_rpc_cutover=preview_pass"
  exit 0
fi

test ! -e "$MARKER" && test ! -e "$BACKUP" && test ! -e "$CANDIDATE_CONF" && test ! -e "$STATE"
if ss -H -ltn "( sport = :$candidate_port )" | grep -q .; then
  fail "candidate gateway port already owned: $candidate_port"
fi
if docker inspect "$CANDIDATE_NAME" >/dev/null 2>&1; then
  fail "candidate container already exists"
fi

install -d -m 0700 "$BASE"
cp -a "$CONF" "$BACKUP"
cp -a "$CONF" "$CANDIDATE_CONF"
install -m 0644 "$GATEWAY_SOURCE" "$CANDIDATE_GATEWAY"
printf 'candidate_name=%q\ncandidate_port=%q\nprevious_target=%q\nprevious_container=%q\n'   "$CANDIDATE_NAME" "$candidate_port" "$CURRENT_TARGET" "$previous_container" > "$STATE"
chmod 0600 "$STATE"
printf 'run_id=%s\nbackup=%s\n' "$RUN_ID" "$BACKUP" > "$MARKER"
chmod 0600 "$MARKER"

rollback_on_error() {
  code=$?
  echo "cutover_failed=rollback" >&2
  restore_state || true
  exit "$code"
}
trap rollback_on_error ERR INT TERM

docker image inspect node:24-alpine >/dev/null 2>&1 || docker pull node:24-alpine >/dev/null
docker run -d --name "$CANDIDATE_NAME" --network host --restart unless-stopped   --read-only --user 10001:10001 --cap-drop ALL --security-opt no-new-privileges   --memory 128m --pids-limit 64 --tmpfs /tmp   --mount "type=bind,src=$CANDIDATE_GATEWAY,dst=/gateway.mjs,readonly"   -e "ZVQ_UPSTREAM_URL=$UPSTREAM" -e "ZVQ_GATEWAY_PORT=$candidate_port"   node:24-alpine node /gateway.mjs >/dev/null

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if chain_ok "http://127.0.0.1:$candidate_port/"; then break; fi
  sleep 1
done
chain_ok "http://127.0.0.1:$candidate_port/"
for method in admin_peers debug_traceTransaction eth_sendRawTransaction; do
  params='[]'; [[ "$method" == eth_sendRawTransaction ]] && params='["0x00"]'
  test "$(rpc_code "http://127.0.0.1:$candidate_port/" "$method" "$params")" = 403
done
test "$(curl --noproxy '*' -sS -o /dev/null -w '%{http_code}' -X OPTIONS   -H 'Origin: https://explorer.kriptoaman.com'   -H 'Access-Control-Request-Method: POST'   "http://127.0.0.1:$candidate_port/")" = 204
test "$(curl --noproxy '*' -sS -o /dev/null -w '%{http_code}' -X OPTIONS   -H 'Origin: https://attacker.example'   -H 'Access-Control-Request-Method: POST'   "http://127.0.0.1:$candidate_port/")" = 403
qory_local="$(curl --noproxy '*' -fsS --max-time 8 -H 'Origin: https://kriptoaman.com' "http://127.0.0.1:$candidate_port/qoryvex/v1/discovery")"
jq -e '.status=="live" and .version>=2 and .chainId==22028 and .websocketSubscribed==true and .source.ownership=="first-party"' <<<"$qory_local" >/dev/null

python3 - "$CANDIDATE_CONF" "$CURRENT_TARGET" "$candidate_port" <<'PY'
import sys
path,current,port=sys.argv[1:4]
text=open(path,encoding='utf-8').read()
old=f"proxy_pass {current};"
new=f"proxy_pass http://127.0.0.1:{port};"
if text.count(old)!=1:
    raise SystemExit("proxy_pass_count_mismatch")
open(path,'w',encoding='utf-8').write(text.replace(old,new))
PY
cat "$CANDIDATE_CONF" > "$CONF"
nginx -t
systemctl reload nginx

LOCAL='https://rpc.kriptoaman.com/'
chain="$(curl --noproxy '*' --resolve rpc.kriptoaman.com:443:127.0.0.1 -fsS --max-time 10   -H 'Origin: https://explorer.kriptoaman.com' -H 'Content-Type: application/json'   --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' "$LOCAL" | jq -er '.result')"
test "$chain" = 0x560c
for method in admin_peers debug_traceTransaction eth_sendRawTransaction; do
  params='[]'; [[ "$method" == eth_sendRawTransaction ]] && params='["0x00"]'
  code="$(curl --noproxy '*' --resolve rpc.kriptoaman.com:443:127.0.0.1 -sS --max-time 8     -o /dev/null -w '%{http_code}' -H 'Origin: https://explorer.kriptoaman.com'     -H 'Content-Type: application/json'     --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"$method\",\"params\":$params}" "$LOCAL")"
  echo "local_blocked_method=$method http_code=$code"
  test "$code" = 403
done
qory_origin="$(curl --noproxy '*' --resolve rpc.kriptoaman.com:443:127.0.0.1 -fsS --max-time 10   -H 'Origin: https://kriptoaman.com' https://rpc.kriptoaman.com/qoryvex/v1/discovery)"
jq -e '.status=="live" and .version>=2 and .chainId==22028 and .websocketSubscribed==true' <<<"$qory_origin" >/dev/null

trap - ERR INT TERM
echo "zvq_rpc_cutover=staged_pending_external_verify chain_id=0x560c candidate_port=$candidate_port"
