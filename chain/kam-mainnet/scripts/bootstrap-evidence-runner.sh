#!/usr/bin/env bash
set -euo pipefail

# KAM private mainnet evidence runner bootstrap.
# Run on a protected Ubuntu/Linux x64 operations host or validator-adjacent host.
# This script intentionally does NOT fetch or store a GitHub runner registration token.

REPO_URL="https://github.com/rahmanraden027-hue/kriptoaman"
RUNNER_LABEL="kam-mainnet-evidence"
RPC_URL="${KAM_PRIVATE_RPC_URL:-http://127.0.0.1:8545}"
EVIDENCE_DIR="/var/lib/kam-evidence"
RUNNER_HOME="/opt/kam-actions-runner"
RUNNER_USER="kamrunner"

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "Run as root (sudo)." >&2
    exit 1
  fi
}

rpc() {
  local method="$1"
  local params="${2:-[] }"
  curl --fail --silent --show-error \
    -H 'content-type: application/json' \
    --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"${method}\",\"params\":${params}}" \
    "${RPC_URL}"
}

require_root

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  ca-certificates curl jq git openssl tar gzip

if ! id -u "${RUNNER_USER}" >/dev/null 2>&1; then
  useradd --system --create-home --home-dir "${RUNNER_HOME}" --shell /bin/bash "${RUNNER_USER}"
fi

install -d -m 0750 -o root -g "${RUNNER_USER}" "${EVIDENCE_DIR}"
install -d -m 0750 -o "${RUNNER_USER}" -g "${RUNNER_USER}" "${RUNNER_HOME}"

# RPC must be local-only. Refuse obvious public bindings/endpoints.
case "${RPC_URL}" in
  http://127.0.0.1:*|http://localhost:*|http://[::1]:*) ;;
  *)
    echo "Refusing non-loopback KAM_PRIVATE_RPC_URL: ${RPC_URL}" >&2
    exit 1
    ;;
esac

CHAIN_ID="$(rpc eth_chainId | jq -r '.result // empty')"
BLOCK_1="$(rpc eth_blockNumber | jq -r '.result // empty')"
PEERS="$(rpc net_peerCount | jq -r '.result // empty')"
VALIDATORS="$(rpc qbft_getValidatorsByBlockNumber '["latest"]' | jq -c '.result // empty')"
sleep 4
BLOCK_2="$(rpc eth_blockNumber | jq -r '.result // empty')"

[[ "${CHAIN_ID}" == "0x560c" ]] || { echo "Unexpected chain id: ${CHAIN_ID}" >&2; exit 1; }
[[ -n "${VALIDATORS}" ]] || { echo "QBFT validator query failed" >&2; exit 1; }
[[ "$(jq 'length' <<<"${VALIDATORS}")" -eq 4 ]] || { echo "Expected exactly 4 validators" >&2; exit 1; }

P1=$((16#${BLOCK_1#0x}))
P2=$((16#${BLOCK_2#0x}))
PC=$((16#${PEERS#0x}))
[[ "${P2}" -gt "${P1}" ]] || { echo "Block height did not advance" >&2; exit 1; }
[[ "${PC}" -ge 3 ]] || { echo "Expected at least 3 private peers" >&2; exit 1; }

cat >"${EVIDENCE_DIR}/runner-bootstrap-check.json" <<JSON
{
  "checkedAt": "$(date -u +%FT%TZ)",
  "chainId": "${CHAIN_ID}",
  "validatorCount": 4,
  "privatePeerCount": ${PC},
  "blockFrom": "${BLOCK_1}",
  "blockTo": "${BLOCK_2}",
  "rpcLoopbackOnly": true,
  "runnerLabelRequired": "${RUNNER_LABEL}",
  "readyForRunnerRegistration": true
}
JSON
chmod 0640 "${EVIDENCE_DIR}/runner-bootstrap-check.json"
chown root:"${RUNNER_USER}" "${EVIDENCE_DIR}/runner-bootstrap-check.json"

cat <<EOF
KAM private evidence host prerequisite check PASSED.

Next action on this host:
1. In GitHub: ${REPO_URL}/settings/actions/runners/new
2. Choose Linux x64 and copy the CURRENT GitHub-provided download/config commands.
3. Install under: ${RUNNER_HOME}
4. Configure the runner with label: ${RUNNER_LABEL}
5. Install/start it as a system service.
6. Prepare ${EVIDENCE_DIR}/backup-restore-evidence.json from a REAL isolated restore test.
7. Run workflow: KAM Private Mainnet Evidence.

Do not paste the registration token, validator keys, enodes, seed phrases, or SSH keys into chat or commit them to GitHub.
EOF
