#!/usr/bin/env bash
set -euo pipefail

# KAM recovery-host diagnostic.
# READ-ONLY and REDACTED: never prints validator keys, enodes, IP addresses,
# passwords, tokens, seed phrases, or configuration file contents.

EXPECTED_CHAIN_ID="0x560c"
RPC_PORTS=(8545 8648)

need() { command -v "$1" >/dev/null 2>&1; }
sha_text() { printf '%s' "$1" | sha256sum | awk '{print $1}'; }

rpc_call() {
  local url="$1"
  local method="$2"
  local params="${3:-[]}"
  local body
  body="$(printf '{"jsonrpc":"2.0","id":1,"method":"%s","params":%s}' "$method" "$params")"
  curl -fsS --max-time 5     -H 'content-type: application/json'     --data "$body"     "$url" 2>/dev/null || true
}

hex_to_dec() {
  local value="${1:-}"
  if [[ "$value" =~ ^0x[0-9a-fA-F]+$ ]]; then
    printf '%d\n' "$((16#${value#0x}))"
  else
    printf 'unavailable\n'
  fi
}

HOST_FP="$( (cat /etc/machine-id 2>/dev/null || hostname) | sha256sum | awk '{print $1}' )"
OS_NAME="$(. /etc/os-release 2>/dev/null && printf '%s %s' "${NAME:-Linux}" "${VERSION_ID:-unknown}" || uname -s)"
KERNEL="$(uname -r)"
ARCH="$(uname -m)"
NTP_SYNC="$(timedatectl show -p NTPSynchronized --value 2>/dev/null || printf 'unknown')"

BESU_VERSION="unavailable"
if need besu; then
  BESU_VERSION="$(besu --version 2>/dev/null | head -1 || printf 'unavailable')"
fi

CHAIN_ID="unavailable"
BLOCK_HEX=""
PEER_HEX=""
VALIDATOR_COUNT="unavailable"
VALIDATOR_FP="unavailable"
RPC_PORT="unavailable"

for port in "${RPC_PORTS[@]}"; do
  candidate="http://127.0.0.1:${port}"
  payload="$(rpc_call "$candidate" eth_chainId '[]')"
  result="$(jq -r '.result // empty' <<<"$payload" 2>/dev/null || true)"
  if [[ "$result" == "$EXPECTED_CHAIN_ID" ]]; then
    RPC_PORT="$port"
    CHAIN_ID="$result"
    BLOCK_HEX="$(jq -r '.result // empty' <<<"$(rpc_call "$candidate" eth_blockNumber '[]')" 2>/dev/null || true)"
    PEER_HEX="$(jq -r '.result // empty' <<<"$(rpc_call "$candidate" net_peerCount '[]')" 2>/dev/null || true)"
    validators="$(jq -c '.result // empty' <<<"$(rpc_call "$candidate" qbft_getValidatorsByBlockNumber '["latest"]')" 2>/dev/null || true)"
    if [[ -n "$validators" && "$validators" != "null" ]] && jq -e 'type=="array"' >/dev/null 2>&1 <<<"$validators"; then
      VALIDATOR_COUNT="$(jq 'length' <<<"$validators")"
      canonical="$(jq -r '.[]' <<<"$validators" | tr '[:upper:]' '[:lower:]' | sort | tr '\n' ',')"
      VALIDATOR_FP="$(sha_text "$canonical")"
    fi
    break
  fi
done

BLOCK_DEC="$(hex_to_dec "$BLOCK_HEX")"
PEER_DEC="$(hex_to_dec "$PEER_HEX")"

RPC_BINDING_CLASSES="none"
if need ss; then
  classes=""
  while IFS= read -r addr; do
    [[ -n "$addr" ]] || continue
    cls="restricted"
    case "$addr" in
      127.*|localhost:*|[::1]:*|::1:*) cls="loopback" ;;
      0.0.0.0:*|[::]:*|*:*) cls="wildcard" ;;
    esac
    if [[ ",$classes," != *",$cls,"* ]]; then
      classes="${classes:+$classes,}$cls"
    fi
  done < <(ss -lnt 2>/dev/null | awk 'NR>1 {print $4}' | grep -E ':(8545|8546|8648)$' || true)
  [[ -n "$classes" ]] && RPC_BINDING_CLASSES="$classes"
fi

SYSTEMD_MATCHES="none"
if need systemctl; then
  SYSTEMD_MATCHES="$(
    systemctl list-units --type=service --all --no-legend 2>/dev/null       | awk '{print $1":"$3":"$4}'       | grep -Ei 'besu|kam|qbft'       | tr '\n' ','       | sed 's/,$//' || true
  )"
  [[ -n "$SYSTEMD_MATCHES" ]] || SYSTEMD_MATCHES="none"
fi

CONTAINER_MATCHES="none"
if need docker; then
  CONTAINER_MATCHES="$(
    docker ps --format '{{.Names}}|{{.Image}}|{{.Status}}' 2>/dev/null       | grep -Ei 'besu|kam|qbft'       | tr '\n' ';'       | sed 's/;$//' || true
  )"
  [[ -n "$CONTAINER_MATCHES" ]] || CONTAINER_MATCHES="none"
fi

DATA_DIR_SUMMARY="none"
for d in /var/lib/besu /opt/besu/data /var/lib/kam/besu /var/lib/kam-mainnet /opt/kam-mainnet/data; do
  if [[ -d "$d" ]]; then
    usage="$(du -sh "$d" 2>/dev/null | awk '{print $1}' || printf 'unknown')"
    fs="$(findmnt -n -o FSTYPE --target "$d" 2>/dev/null || printf 'unknown')"
    item="$(basename "$d"):${usage}:${fs}"
    if [[ "$DATA_DIR_SUMMARY" == "none" ]]; then
      DATA_DIR_SUMMARY="$item"
    else
      DATA_DIR_SUMMARY="$DATA_DIR_SUMMARY;$item"
    fi
  fi
done

GENESIS_FINGERPRINTS="none"
while IFS= read -r g; do
  [[ -n "$g" ]] || continue
  h="$(sha256sum "$g" 2>/dev/null | awk '{print $1}' || true)"
  [[ -n "$h" ]] || continue
  item="$(basename "$g"):$h"
  if [[ "$GENESIS_FINGERPRINTS" == "none" ]]; then
    GENESIS_FINGERPRINTS="$item"
  else
    GENESIS_FINGERPRINTS="$GENESIS_FINGERPRINTS;$item"
  fi
done < <(find /etc /opt /var/lib -maxdepth 5 -type f \( -name 'genesis.json' -o -name '*genesis*.json' \) 2>/dev/null | head -20)

READY="false"
if [[ "$CHAIN_ID" == "$EXPECTED_CHAIN_ID" && "$VALIDATOR_COUNT" == "4" && "$BLOCK_DEC" != "unavailable" ]]; then
  READY="true"
fi

echo "=== KAM RECOVERY HOST DIAGNOSTIC ==="
echo "checked_at=$(date -u +%FT%TZ)"
echo "redacted=true"
echo "host_fingerprint=$HOST_FP"
echo "os=$OS_NAME"
echo "kernel=$KERNEL"
echo "arch=$ARCH"
echo "ntp_synchronized=$NTP_SYNC"
echo "besu_version=$BESU_VERSION"
echo "systemd_matches=$SYSTEMD_MATCHES"
echo "container_matches=$CONTAINER_MATCHES"
echo "rpc_port=$RPC_PORT"
echo "chain_id=$CHAIN_ID"
echo "block_number=$BLOCK_DEC"
echo "peer_count=$PEER_DEC"
echo "validator_count=$VALIDATOR_COUNT"
echo "validator_set_fingerprint=$VALIDATOR_FP"
echo "rpc_binding_classes=$RPC_BINDING_CLASSES"
echo "data_dirs=$DATA_DIR_SUMMARY"
echo "genesis_fingerprints=$GENESIS_FINGERPRINTS"
echo "ready_for_migration_planning=$READY"
echo "=== END KAM DIAGNOSTIC ==="
