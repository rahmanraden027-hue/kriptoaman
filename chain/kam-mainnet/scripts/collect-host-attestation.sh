#!/usr/bin/env bash
set -euo pipefail

# Collects a redacted local host attestation for the KAM four-host redundancy gate.
# This script never reads validator private keys, SSH keys, RPC credentials, seed phrases,
# treasury material, or cloud API tokens.

ROLE="${KAM_ATTESTATION_ROLE:-}"
VALIDATOR_ID="${KAM_VALIDATOR_ID:-}"
FAILURE_DOMAIN="${KAM_FAILURE_DOMAIN:-}"
NODE_DATA_DIR="${KAM_NODE_DATA_DIR:-/var/lib/besu}"
PERSISTENT_STORAGE_ATTESTED="${KAM_PERSISTENT_STORAGE_ATTESTED:-false}"
MANAGEMENT_RPC_PORTS="${KAM_MANAGEMENT_RPC_PORTS:-8545,8546,8648}"
CONTEXT="${KAM_ATTESTATION_CONTEXT:-kriptoaman-kam-mainnet-host-v1}"

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

command -v sha256sum >/dev/null 2>&1 || fail 'sha256sum is required'
command -v ss >/dev/null 2>&1 || fail 'ss is required (install iproute2)'
command -v timedatectl >/dev/null 2>&1 || fail 'timedatectl is required'
command -v findmnt >/dev/null 2>&1 || fail 'findmnt is required (install util-linux)'

case "$ROLE" in
  validator|rpc-sentry) ;;
  *) fail 'KAM_ATTESTATION_ROLE must be validator or rpc-sentry' ;;
esac

if [[ "$ROLE" == "validator" ]]; then
  [[ -n "$VALIDATOR_ID" ]] || fail 'KAM_VALIDATOR_ID is required for validator role'
  [[ -n "$FAILURE_DOMAIN" ]] || fail 'KAM_FAILURE_DOMAIN is required for validator role'
  [[ "$FAILURE_DOMAIN" != "unknown" && "$FAILURE_DOMAIN" != "placeholder" ]] || fail 'KAM_FAILURE_DOMAIN must describe the real failure domain'
fi

[[ -d "$NODE_DATA_DIR" ]] || fail "KAM_NODE_DATA_DIR does not exist: $NODE_DATA_DIR"
[[ "$PERSISTENT_STORAGE_ATTESTED" == "true" ]] || fail 'Set KAM_PERSISTENT_STORAGE_ATTESTED=true only after verifying the node data survives host/service restart as intended'

MACHINE_ID_PATH=''
for candidate in /etc/machine-id /var/lib/dbus/machine-id; do
  if [[ -s "$candidate" ]]; then
    MACHINE_ID_PATH="$candidate"
    break
  fi
done
[[ -n "$MACHINE_ID_PATH" ]] || fail 'No machine-id source found'

MACHINE_ID=$(tr -d '[:space:]' < "$MACHINE_ID_PATH")
[[ -n "$MACHINE_ID" ]] || fail 'machine-id is empty'
HOST_FINGERPRINT=$(printf '%s\n%s' "$CONTEXT" "$MACHINE_ID" | sha256sum | awk '{print $1}')

if [[ "$ROLE" == "validator" ]]; then
  NORMALIZED_VALIDATOR_ID=$(printf '%s' "$VALIDATOR_ID" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')
  VALIDATOR_FINGERPRINT=$(printf '%s\n%s' "$CONTEXT" "$NORMALIZED_VALIDATOR_ID" | sha256sum | awk '{print $1}')
else
  VALIDATOR_FINGERPRINT=''
fi

TIME_SYNC_RAW=$(timedatectl show -p NTPSynchronized --value 2>/dev/null || true)
case "${TIME_SYNC_RAW,,}" in
  yes|true|1) TIME_SYNC=true ;;
  *) TIME_SYNC=false ;;
esac
[[ "$TIME_SYNC" == "true" ]] || fail 'System clock is not reported as NTP-synchronized'

MOUNT_INFO=$(findmnt -T "$NODE_DATA_DIR" -n -o SOURCE,FSTYPE,TARGET 2>/dev/null || true)
[[ -n "$MOUNT_INFO" ]] || fail 'Unable to resolve node data filesystem'
FSTYPE=$(awk '{print $2}' <<<"$MOUNT_INFO")
case "$FSTYPE" in
  tmpfs|ramfs) fail "Node data filesystem is not persistent: $FSTYPE" ;;
esac

MANAGEMENT_RPC_PRIVATE=true
IFS=',' read -r -a PORTS <<< "$MANAGEMENT_RPC_PORTS"
for raw_port in "${PORTS[@]}"; do
  port=$(printf '%s' "$raw_port" | tr -d '[:space:]')
  [[ "$port" =~ ^[0-9]+$ ]] || fail "Invalid management RPC port: $port"
  while IFS= read -r listener; do
    [[ -z "$listener" ]] && continue
    local_addr=$(awk '{print $4}' <<<"$listener")
    case "$local_addr" in
      0.0.0.0:"$port"|\[::\]:"$port"|:::"$port") MANAGEMENT_RPC_PRIVATE=false ;;
    esac
  done < <(ss -H -ltn "sport = :$port" 2>/dev/null || true)
done
[[ "$MANAGEMENT_RPC_PRIVATE" == "true" ]] || fail 'A configured validator/management RPC port is listening on a wildcard public interface'

CHECKED_AT=$(date -u +'%Y-%m-%dT%H:%M:%SZ')

json_escape() {
  python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'
}

if ! command -v python3 >/dev/null 2>&1; then
  fail 'python3 is required for safe JSON encoding'
fi

ROLE_JSON=$(printf '%s' "$ROLE" | json_escape)
HOST_JSON=$(printf '%s' "$HOST_FINGERPRINT" | json_escape)
FAILURE_JSON=$(printf '%s' "$FAILURE_DOMAIN" | json_escape)
VALIDATOR_JSON=$(printf '%s' "$VALIDATOR_FINGERPRINT" | json_escape)
DATA_DIR_JSON=$(printf '%s' "$NODE_DATA_DIR" | json_escape)
FSTYPE_JSON=$(printf '%s' "$FSTYPE" | json_escape)
CHECKED_JSON=$(printf '%s' "$CHECKED_AT" | json_escape)

cat <<JSON
{
  "schemaVersion": 1,
  "checkedAt": $CHECKED_JSON,
  "role": $ROLE_JSON,
  "hostFingerprint": $HOST_JSON,
  "validatorFingerprint": $VALIDATOR_JSON,
  "failureDomain": $FAILURE_JSON,
  "persistentStorage": true,
  "timeSync": true,
  "managementRpcPrivate": true,
  "nodeData": {
    "path": $DATA_DIR_JSON,
    "filesystemType": $FSTYPE_JSON
  },
  "redacted": true
}
JSON
