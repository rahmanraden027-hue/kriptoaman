#!/usr/bin/env bash
set -Eeuo pipefail

MODE="${1:-preview}"
APP_DIR=/opt/kriptoaman-indexer
STATE_DIR=/var/lib/kriptoaman-indexer
SERVICE=/etc/systemd/system/kriptoaman-zvq-indexer.service
SOURCE="${SOURCE:-/tmp/zvq-listener.mjs}"
MODEL_SOURCE="${MODEL_SOURCE:-/tmp/discovery-model.mjs}"
BACKUP_DIR="/var/backups/kriptoaman-indexer/${GITHUB_RUN_ID:-manual}"
RPC_CONF_LINK=/etc/nginx/sites-enabled/zevaryq-rpc

fail(){ echo "ERROR: $*" >&2; exit 1; }

[[ "$EUID" == 0 ]] || fail "root required"
[[ -f "$SOURCE" ]] || fail "listener source missing"
[[ -f "$MODEL_SOURCE" ]] || fail "discovery model source missing"
command -v node >/dev/null || fail "node runtime missing"
command -v jq >/dev/null || fail "jq missing"
node --check "$SOURCE"
node --check "$MODEL_SOURCE"

rpc_chain() {
  local url="$1"
  curl --noproxy '*' -fsS --connect-timeout 3 --max-time 6     -H 'content-type: application/json'     --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' "$url"     | jq -er '.result'
}

validate_private_rpc() {
  python3 - "$1" <<'PY'
import ipaddress,sys
from urllib.parse import urlparse
u=sys.argv[1]
p=urlparse(u)
if p.scheme!="http" or p.username or p.password or p.port or p.path!="/rpc" or p.query or p.fragment:
    raise SystemExit(1)
ip=ipaddress.ip_address(p.hostname or "")
if not ip.is_private or ip.is_loopback or ip.is_link_local:
    raise SystemExit(1)
print(u)
PY
}

discover_private_rpc_from_nginx() {
  local conf target port row env upstream
  [[ -L "$RPC_CONF_LINK" || -f "$RPC_CONF_LINK" ]] || return 1
  conf="$(readlink -f "$RPC_CONF_LINK")"
  [[ -r "$conf" ]] || return 1
  target="$(python3 - "$conf" <<'PY'
import re,sys
text=open(sys.argv[1],encoding='utf-8').read()
hits=re.findall(r'^\s*proxy_pass\s+(http://[^;]+);\s*$',text,flags=re.M)
eligible=[u for u in hits if re.fullmatch(r'http://10(?:\.\d{1,3}){3}/rpc',u) or re.fullmatch(r'http://127\.0\.0\.1:1844[56]',u)]
if len(eligible)!=1:
    raise SystemExit(1)
print(eligible[0])
PY
)" || return 1

  if [[ "$target" =~ ^http://10([.][0-9]{1,3}){3}/rpc$ ]]; then
    validate_private_rpc "$target" >/dev/null || return 1
    printf '%s\n' "$target"
    return 0
  fi

  if [[ "$target" =~ ^http://127[.]0[.]0[.]1:(18445|18446)$ ]]; then
    port="${BASH_REMATCH[1]}"
    while read -r id; do
      [[ -n "$id" ]] || continue
      env="$(docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$id" 2>/dev/null || true)"
      [[ "$(awk -F= '$1=="ZVQ_GATEWAY_PORT"{print $2}' <<<"$env" | tail -1)" == "$port" ]] || continue
      upstream="$(awk -F= '$1=="ZVQ_UPSTREAM_URL"{sub(/^[^=]*=/,"");print}' <<<"$env" | tail -1)"
      if validate_private_rpc "$upstream" >/dev/null 2>&1; then
        printf '%s\n' "$upstream"
        return 0
      fi
    done < <(docker ps -q)
  fi
  return 1
}

probe_ws_subscription() {
  local url="$1"
  node - "$url" <<'NODE'
const url=process.argv[2];
let finished=false;
const done=(code,msg)=>{
  if(finished)return;
  finished=true;
  clearTimeout(timer);
  try{ws.close()}catch{}
  if(msg) console.error(msg);
  setTimeout(()=>process.exit(code),10);
};
const timer=setTimeout(()=>done(1,'websocket probe timeout'),6000);
let ws;
try{ws=new WebSocket(url)}catch(e){done(1,e.message)}
ws.addEventListener('open',()=>{
  ws.send(JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_chainId',params:[]}));
});
ws.addEventListener('message',ev=>{
  try{
    const p=JSON.parse(String(ev.data));
    if(p.id===1){
      if(p.result!=='0x560c') return done(1,'unexpected websocket chain');
      ws.send(JSON.stringify({jsonrpc:'2.0',id:2,method:'eth_subscribe',params:['newHeads']}));
      return;
    }
    if(p.id===2 && typeof p.result==='string' && p.result.length>0) return done(0);
  }catch(e){done(1,e.message)}
});
ws.addEventListener('error',()=>done(1,'websocket connection error'));
ws.addEventListener('close',()=>{ if(!finished) done(1,'websocket closed before subscription'); });
NODE
}

HTTP_RPC=
for p in 8545 8547 9545; do
  if ss -H -ltn "( sport = :$p )" | grep -q .; then
    candidate="http://127.0.0.1:$p"
    chain="$(rpc_chain "$candidate" 2>/dev/null || true)"
    if [[ "$chain" == 0x560c ]]; then HTTP_RPC="$candidate"; break; fi
  fi
done

if [[ -z "$HTTP_RPC" ]]; then
  candidate="$(discover_private_rpc_from_nginx || true)"
  if [[ -n "$candidate" && "$(rpc_chain "$candidate" 2>/dev/null || true)" == 0x560c ]]; then
    HTTP_RPC="$candidate"
  fi
fi
[[ -n "$HTTP_RPC" ]] || fail "ZEVARYQ HTTP RPC unavailable from sentry"

WS_RPC=
if [[ "$HTTP_RPC" =~ ^http://127[.]0[.]0[.]1: ]]; then
  ws_hosts=(127.0.0.1)
else
  ws_host="$(python3 - "$HTTP_RPC" <<'PY'
import sys
from urllib.parse import urlparse
print(urlparse(sys.argv[1]).hostname or "")
PY
)"
  [[ -n "$ws_host" ]] || fail "unable to resolve private RPC host"
  ws_hosts=("$ws_host")
fi

for host in "${ws_hosts[@]}"; do
  for p in 8546 8547 9546; do
    candidate="ws://$host:$p"
    if probe_ws_subscription "$candidate" >/dev/null 2>&1; then WS_RPC="$candidate"; break 2; fi
  done
done
[[ -n "$WS_RPC" ]] || fail "WebSocket subscription not confirmed"

echo "preflight_chain=0x560c rpc_scope=$([[ "$HTTP_RPC" == http://127.* ]] && echo loopback || echo private_vpc) websocket_subscription=pass mode=$MODE"
[[ "$MODE" == preview ]] && exit 0
[[ "$MODE" == apply || "$MODE" == rollback ]] || fail "mode must be preview|apply|rollback"

if [[ "$MODE" == rollback ]]; then
  [[ -d "$BACKUP_DIR" ]] || fail "backup directory unavailable"
  if [[ -f "$BACKUP_DIR/zvq-listener.mjs" ]]; then
    install -D -m 0750 "$BACKUP_DIR/zvq-listener.mjs" "$APP_DIR/zvq-listener.mjs"
    [[ ! -f "$BACKUP_DIR/discovery-model.mjs" ]] || install -m 0640 "$BACKUP_DIR/discovery-model.mjs" "$APP_DIR/discovery-model.mjs"
    [[ ! -f "$BACKUP_DIR/service" ]] || install -m 0644 "$BACKUP_DIR/service" "$SERVICE"
    systemctl daemon-reload
    systemctl restart kriptoaman-zvq-indexer.service
  else
    systemctl disable --now kriptoaman-zvq-indexer.service 2>/dev/null || true
    rm -f "$SERVICE"
    systemctl daemon-reload
  fi
  echo "first_party_websocket_indexer=rolled_back"
  exit 0
fi

mkdir -p "$BACKUP_DIR" "$APP_DIR" "$STATE_DIR"
chmod 0750 "$APP_DIR" "$STATE_DIR"
[[ ! -f "$APP_DIR/zvq-listener.mjs" ]] || cp -a "$APP_DIR/zvq-listener.mjs" "$BACKUP_DIR/zvq-listener.mjs"
[[ ! -f "$APP_DIR/discovery-model.mjs" ]] || cp -a "$APP_DIR/discovery-model.mjs" "$BACKUP_DIR/discovery-model.mjs"
[[ ! -f "$SERVICE" ]] || cp -a "$SERVICE" "$BACKUP_DIR/service"
install -m 0750 "$SOURCE" "$APP_DIR/zvq-listener.mjs"
install -m 0640 "$MODEL_SOURCE" "$APP_DIR/discovery-model.mjs"

cat >"$SERVICE" <<UNIT
[Unit]
Description=KriptoAman ZEVARYQ First-Party WebSocket Indexer
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=ZVQ_INDEXER_HTTP_RPC=$HTTP_RPC
Environment=ZVQ_INDEXER_WS_RPC=$WS_RPC
Environment=ZVQ_INDEXER_PORT=8765
Environment=ZVQ_INDEXER_STATE_DIR=$STATE_DIR
ExecStart=/usr/bin/node $APP_DIR/zvq-listener.mjs
Restart=always
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$STATE_DIR
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
LockPersonality=true
MemoryDenyWriteExecute=true

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now kriptoaman-zvq-indexer.service

health=
for _ in 1 2 3 4 5 6 7 8; do
  health="$(curl --noproxy '*' -fsS --max-time 5 http://127.0.0.1:8765/health 2>/dev/null || true)"
  if jq -e '.status=="live" and .version>=2 and .chainId==22028 and .websocketSubscribed==true and (.latency.samples>=1)' <<<"$health" >/dev/null 2>&1; then
    break
  fi
  sleep 3
done
systemctl is-active --quiet kriptoaman-zvq-indexer.service || fail "indexer service not active"
jq -e '.status=="live" and .version>=2 and .chainId==22028 and .websocketSubscribed==true and (.latency.samples>=1)' <<<"$health" >/dev/null   || { journalctl -u kriptoaman-zvq-indexer.service -n 30 --no-pager >&2 || true; fail "WebSocket stream did not become live"; }

echo "first_party_websocket_indexer=pass"
