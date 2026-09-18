#!/usr/bin/env bash
set -euo pipefail

# Read-only, redacted KAM recovery-host diagnostic.
# Never prints validator keys, enodes, IP addresses, passwords, tokens, or file contents.

EXPECTED_CHAIN_ID="0x560c"
RPC_PORTS=(8545 8648)
OUT_DIR="${KAM_DIAG_OUT_DIR:-/tmp}"
OUT="${OUT_DIR%/}/kam-recovery-host-diagnostic.json"

need() { command -v "$1" >/dev/null 2>&1; }
sha_text() { printf '%s' "$1" | sha256sum | awk '{print $1}'; }
json_array_or_empty() {
  local value="${1:-}"
  if jq -e 'type == "array"' >/dev/null 2>&1 <<<"$value"; then
    jq -c . <<<"$value"
  else
    printf '[]\n'
  fi
}

HOST_FP="$( (cat /etc/machine-id 2>/dev/null || hostname) | sha256sum | awk '{print $1}' )"
OS_NAME="$(. /etc/os-release 2>/dev/null && printf '%s %s' "${NAME:-Linux}" "${VERSION_ID:-unknown}" || uname -s)"
KERNEL="$(uname -r)"
ARCH="$(uname -m)"
NTP_SYNC="$(timedatectl show -p NTPSynchronized --value 2>/dev/null || echo unknown)"

BESU_VERSION="unavailable"
if need besu; then
  BESU_VERSION="$(besu --version 2>/dev/null | head -1 || true)"
fi

SYSTEMD_UNITS="[]"
if need systemctl; then
  raw_systemd="$(
    {
      systemctl list-units --type=service --all --no-legend 2>/dev/null         | awk '{print $1" "$3" "$4}'         | grep -Ei 'besu|kam|qbft'         | sed -E 's/[[:space:]]+/ /g' || true
    } | jq -Rsc 'split("\n")|map(select(length>0))'
  )"
  SYSTEMD_UNITS="$(json_array_or_empty "$raw_systemd")"
fi

CONTAINERS="[]"
if need docker; then
  raw_containers="$(
    {
      docker ps --format '{{.Names}}|{{.Image}}|{{.Status}}' 2>/dev/null         | grep -Ei 'besu|kam|qbft' || true
    } | jq -Rsc 'split("\n")|map(select(length>0))'
  )"
  CONTAINERS="$(json_array_or_empty "$raw_containers")"
fi

rpc_call() {
  local url="$1" method="$2" params="${3:-[]}" body
  if ! jq -e . >/dev/null 2>&1 <<<"$params"; then
    params='[]'
  fi
  body="$(jq -nc --arg method "$method" --argjson params "$params"     '{jsonrpc:"2.0",id:1,method:$method,params:$params}')"
  curl -fsS --max-time 4     -H 'content-type: application/json'     --data "$body"     "$url" 2>/dev/null || true
}

RPC_URL=""
CHAIN_ID=""
BLOCK_HEX=""
PEER_HEX=""
VALIDATOR_COUNT=""
VALIDATOR_FP=""
for port in "${RPC_PORTS[@]}"; do
  candidate="http://127.0.0.1:${port}"
  payload="$(rpc_call "$candidate" eth_chainId '[]')"
  result="$(jq -r '.result // empty' <<<"$payload" 2>/dev/null || true)"
  if [[ "$result" == "$EXPECTED_CHAIN_ID" ]]; then
    RPC_URL="$candidate"
    CHAIN_ID="$result"
    BLOCK_HEX="$(jq -r '.result // empty' <<<"$(rpc_call "$candidate" eth_blockNumber '[]')" 2>/dev/null || true)"
    PEER_HEX="$(jq -r '.result // empty' <<<"$(rpc_call "$candidate" net_peerCount '[]')" 2>/dev/null || true)"
    vals="$(jq -c '.result // empty' <<<"$(rpc_call "$candidate" qbft_getValidatorsByBlockNumber '["latest"]')" 2>/dev/null || true)"
    if [[ -n "$vals" && "$vals" != "null" ]]; then
      VALIDATOR_COUNT="$(jq 'length' <<<"$vals" 2>/dev/null || true)"
      if [[ "$VALIDATOR_COUNT" =~ ^[0-9]+$ ]]; then
        canonical="$(jq -r '.[]' <<<"$vals" | tr '[:upper:]' '[:lower:]' | sort | tr '\n' ',' )"
        VALIDATOR_FP="$(sha_text "$canonical")"
      fi
    fi
    break
  fi
done

BLOCK_DEC="null"
if [[ "$BLOCK_HEX" =~ ^0x[0-9a-fA-F]+$ ]]; then BLOCK_DEC="$((16#${BLOCK_HEX#0x}))"; fi
PEER_DEC="null"
if [[ "$PEER_HEX" =~ ^0x[0-9a-fA-F]+$ ]]; then PEER_DEC="$((16#${PEER_HEX#0x}))"; fi
[[ "$VALIDATOR_COUNT" =~ ^[0-9]+$ ]] || VALIDATOR_COUNT="null"

RPC_BINDINGS="[]"
if need ss; then
  raw_bindings="$(
    {
      ss -lnt 2>/dev/null | awk 'NR>1 {print $4}'         | grep -E ':(8545|8546|8648)

DATA_DIRS="[]"
for d in /var/lib/besu /opt/besu/data /var/lib/kam/besu /var/lib/kam-mainnet /opt/kam-mainnet/data; do
  if [[ -d "$d" ]]; then
    fs="$(findmnt -n -o FSTYPE --target "$d" 2>/dev/null || echo unknown)"
    usage="$(du -sh "$d" 2>/dev/null | awk '{print $1}' || echo unknown)"
    entry="$(jq -nc --arg path "$d" --arg fs "$fs" --arg usage "$usage" '{path:$path,filesystem:$fs,usage:$usage}')"
    DATA_DIRS="$(jq -c --argjson e "$entry" '. + [$e]' <<<"$DATA_DIRS")"
  fi
done

GENESIS="[]"
while IFS= read -r g; do
  [[ -n "$g" ]] || continue
  h="$(sha256sum "$g" 2>/dev/null | awk '{print $1}' || true)"
  [[ -n "$h" ]] || continue
  base="$(basename "$g")"
  entry="$(jq -nc --arg name "$base" --arg sha256 "$h" '{name:$name,sha256:$sha256}')"
  GENESIS="$(jq -c --argjson e "$entry" '. + [$e]' <<<"$GENESIS")"
done < <(find /etc /opt /var/lib -maxdepth 5 -type f \( -name 'genesis.json' -o -name '*genesis*.json' \) 2>/dev/null | head -20)

READY=false
if [[ "$CHAIN_ID" == "$EXPECTED_CHAIN_ID" && "$VALIDATOR_COUNT" == "4" && "$BLOCK_DEC" != "null" ]]; then
  READY=true
fi

SYSTEMD_UNITS="$(json_array_or_empty "$SYSTEMD_UNITS")"
CONTAINERS="$(json_array_or_empty "$CONTAINERS")"
RPC_BINDINGS="$(json_array_or_empty "$RPC_BINDINGS")"
DATA_DIRS="$(json_array_or_empty "$DATA_DIRS")"
GENESIS="$(json_array_or_empty "$GENESIS")"

mkdir -p "$OUT_DIR"
jq -n   --arg checkedAt "$(date -u +%FT%TZ)"   --arg hostFingerprint "$HOST_FP"   --arg os "$OS_NAME"   --arg kernel "$KERNEL"   --arg arch "$ARCH"   --arg ntp "$NTP_SYNC"   --arg besuVersion "$BESU_VERSION"   --arg chainId "${CHAIN_ID:-unavailable}"   --arg validatorFingerprint "${VALIDATOR_FP:-unavailable}"   --argjson blockNumber "$BLOCK_DEC"   --argjson peerCount "$PEER_DEC"   --argjson validatorCount "$VALIDATOR_COUNT"   --argjson systemdUnits "$SYSTEMD_UNITS"   --argjson containers "$CONTAINERS"   --argjson rpcBindings "$RPC_BINDINGS"   --argjson dataDirs "$DATA_DIRS"   --argjson genesis "$GENESIS"   --argjson ready "$READY"   '{
    schemaVersion:1,
    checkedAt:$checkedAt,
    redacted:true,
    hostFingerprint:$hostFingerprint,
    platform:{os:$os,kernel:$kernel,arch:$arch,ntpSynchronized:$ntp},
    besuVersion:$besuVersion,
    services:{systemd:$systemdUnits,containers:$containers},
    rpc:{
      chainId:$chainId,
      blockNumber:$blockNumber,
      peerCount:$peerCount,
      validatorCount:$validatorCount,
      validatorSetFingerprint:$validatorFingerprint,
      bindingClasses:$rpcBindings
    },
    storage:{dataDirs:$dataDirs,genesisFingerprints:$genesis},
    readyForMigrationPlanning:$ready
  }' | tee "$OUT"

echo
echo "Diagnostic written to: $OUT"
echo "Safe to share: YES (redacted fingerprints/counts only)."
 || true
    } | awk '
      {
        a=$0
        cls="restricted"
        if (a ~ /^127\./ || a ~ /^\[::1\]/ || a ~ /^::1:/) cls="loopback"
        else if (a ~ /^0\.0\.0\.0:/ || a ~ /^\[::\]:/ || a ~ /^\*:/) cls="wildcard"
        print cls
      }' | sort -u | jq -Rsc 'split("\n")|map(select(length>0))'
  )"
  RPC_BINDINGS="$(json_array_or_empty "$raw_bindings")"
fi

DATA_DIRS="[]"
for d in /var/lib/besu /opt/besu/data /var/lib/kam/besu /var/lib/kam-mainnet /opt/kam-mainnet/data; do
  if [[ -d "$d" ]]; then
    fs="$(findmnt -n -o FSTYPE --target "$d" 2>/dev/null || echo unknown)"
    usage="$(du -sh "$d" 2>/dev/null | awk '{print $1}' || echo unknown)"
    entry="$(jq -nc --arg path "$d" --arg fs "$fs" --arg usage "$usage" '{path:$path,filesystem:$fs,usage:$usage}')"
    DATA_DIRS="$(jq -c --argjson e "$entry" '. + [$e]' <<<"$DATA_DIRS")"
  fi
done

GENESIS="[]"
while IFS= read -r g; do
  [[ -n "$g" ]] || continue
  h="$(sha256sum "$g" 2>/dev/null | awk '{print $1}' || true)"
  [[ -n "$h" ]] || continue
  base="$(basename "$g")"
  entry="$(jq -nc --arg name "$base" --arg sha256 "$h" '{name:$name,sha256:$sha256}')"
  GENESIS="$(jq -c --argjson e "$entry" '. + [$e]' <<<"$GENESIS")"
done < <(find /etc /opt /var/lib -maxdepth 5 -type f \( -name 'genesis.json' -o -name '*genesis*.json' \) 2>/dev/null | head -20)

READY=false
if [[ "$CHAIN_ID" == "$EXPECTED_CHAIN_ID" && "$VALIDATOR_COUNT" == "4" && "$BLOCK_DEC" != "null" ]]; then
  READY=true
fi

mkdir -p "$OUT_DIR"
jq -n   --arg checkedAt "$(date -u +%FT%TZ)"   --arg hostFingerprint "$HOST_FP"   --arg os "$OS_NAME"   --arg kernel "$KERNEL"   --arg arch "$ARCH"   --arg ntp "$NTP_SYNC"   --arg besuVersion "$BESU_VERSION"   --arg chainId "${CHAIN_ID:-unavailable}"   --arg validatorFingerprint "${VALIDATOR_FP:-unavailable}"   --argjson blockNumber "$BLOCK_DEC"   --argjson peerCount "$PEER_DEC"   --argjson validatorCount "$VALIDATOR_COUNT"   --argjson systemdUnits "$SYSTEMD_UNITS"   --argjson containers "$CONTAINERS"   --argjson rpcBindings "$RPC_BINDINGS"   --argjson dataDirs "$DATA_DIRS"   --argjson genesis "$GENESIS"   --argjson ready "$READY"   '{
    schemaVersion:1,
    checkedAt:$checkedAt,
    redacted:true,
    hostFingerprint:$hostFingerprint,
    platform:{os:$os,kernel:$kernel,arch:$arch,ntpSynchronized:$ntp},
    besuVersion:$besuVersion,
    services:{systemd:$systemdUnits,containers:$containers},
    rpc:{
      chainId:$chainId,
      blockNumber:$blockNumber,
      peerCount:$peerCount,
      validatorCount:$validatorCount,
      validatorSetFingerprint:$validatorFingerprint,
      bindingClasses:$rpcBindings
    },
    storage:{dataDirs:$dataDirs,genesisFingerprints:$genesis},
    readyForMigrationPlanning:$ready
  }' | tee "$OUT"

echo
echo "Diagnostic written to: $OUT"
echo "Safe to share: YES (redacted fingerprints/counts only)."
