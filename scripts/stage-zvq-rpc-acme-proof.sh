#!/usr/bin/env bash
# Temporary, isolated public port-80 proof. Never replaces an existing listener.
set -Eeuo pipefail
MODE="$1"
RUN_ID="$2"
[[ "$RUN_ID" =~ ^[0-9]{7,16}$ ]] || exit 1
test "$(id -u)" -eq 0
BASE="/var/lib/zvq-rpc-acme-proof/$RUN_ID"
IP=206.189.36.15
if [[ "$MODE" == start ]]; then
  test ! -e "$BASE"
  if ss -H -ltn '( sport = :80 )' | grep -q .; then
    echo 'rpc_acme_safe_abort=port_80_occupied' >&2
    exit 1
  fi
  if ss -H -ltn '( sport = :443 )' | grep -q .; then
    echo 'rpc_acme_safe_abort=port_443_occupied' >&2
    exit 1
  fi
  umask 077
  install -d -m 0700 "$BASE/.well-known/acme-challenge"
  printf 'zvq-rpc-acme-proof-%s\n' "$RUN_ID" > "$BASE/.well-known/acme-challenge/zvq-rpc-$RUN_ID"
  nohup python3 -m http.server 80 --bind 0.0.0.0 --directory "$BASE" </dev/null >"$BASE/server.log" 2>&1 &
  PID=$!
  printf '%s\n' "$PID" > "$BASE/proof.pid"
  sleep 2
  if ! kill -0 "$PID" 2>/dev/null || ! curl --noproxy '*' --fail-with-body -sS --max-time 4 "http://127.0.0.1/.well-known/acme-challenge/zvq-rpc-$RUN_ID" | grep -Fxq "zvq-rpc-acme-proof-$RUN_ID"; then
    kill "$PID" 2>/dev/null || true
    rm -rf -- "$BASE"
    echo 'rpc_acme_preflight=local_failed; no_production_changes' >&2
    exit 1
  fi
  echo 'rpc_acme_preflight=local_ready; awaiting_independent_internet_proof'
elif [[ "$MODE" == stop ]]; then
  if [[ -f "$BASE/proof.pid" ]]; then
    PID="$(cat "$BASE/proof.pid")"
    if [[ "$PID" =~ ^[0-9]+$ ]] && kill -0 "$PID" 2>/dev/null; then
      CMD="$(ps -p "$PID" -o args= || true)"
      if [[ "$CMD" == *"python3 -m http.server 80 --bind 0.0.0.0 --directory $BASE"* ]]; then
        kill "$PID"
      else
        echo 'rpc_acme_cleanup=refusing_to_kill_unrelated_process' >&2
        exit 1
      fi
    fi
    rm -rf -- "$BASE"
  fi
  for attempt in 1 2 3 4 5; do
    if ! ss -H -ltn '( sport = :80 )' | grep -q .; then
      echo 'rpc_acme_preflight=cleaned; port_80_free=yes'
      exit 0
    fi
    sleep 1
  done
  echo 'rpc_acme_cleanup=port_80_still_occupied; abort_before_certbot' >&2
  exit 1
else
  echo 'usage: stage-zvq-rpc-acme-proof.sh start|stop RUN_ID' >&2
  exit 2
fi
