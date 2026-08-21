import { createHash } from 'node:crypto';

const rpcUrl = process.env.KAM_PRIVATE_RPC_URL || 'http://127.0.0.1:8545';
const expectedChainId = '0x560c';
const expectedValidatorCount = 4;
const validatorAddressPattern = /^0x[0-9a-f]{40}$/i;

async function rpc(method, params = []) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
  });
  if (!response.ok) throw new Error(`${method}: HTTP ${response.status}`);
  const payload = await response.json();
  if (payload?.error || payload?.result == null) {
    throw new Error(`${method}: ${payload?.error?.message || 'invalid response'}`);
  }
  return payload.result;
}

function normalizeValidators(validators) {
  return validators.map((value) => String(value).toLowerCase()).sort();
}

function validatorFingerprint(validators) {
  return createHash('sha256').update(normalizeValidators(validators).join('\n')).digest('hex');
}

async function main() {
  const checkedAt = new Date().toISOString();
  const chainId = await rpc('eth_chainId');
  const validators = await rpc('qbft_getValidatorsByBlockNumber', ['latest']);
  const peerCountHex = await rpc('net_peerCount');
  const block1 = await rpc('eth_blockNumber');
  await new Promise((resolve) => setTimeout(resolve, 4000));
  const block2 = await rpc('eth_blockNumber');

  if (!Array.isArray(validators)) throw new Error('QBFT validator result is not an array');

  const normalizedValidators = normalizeValidators(validators);
  const uniqueValidators = new Set(normalizedValidators);
  const addressesValid = normalizedValidators.every((address) => validatorAddressPattern.test(address));
  const peerCount = Number.parseInt(peerCountHex, 16);
  const firstBlock = Number.parseInt(block1, 16);
  const secondBlock = Number.parseInt(block2, 16);

  const checks = {
    chainId: { ok: chainId === expectedChainId, value: chainId },
    validatorSet: {
      ok:
        validators.length === expectedValidatorCount &&
        uniqueValidators.size === expectedValidatorCount &&
        addressesValid,
      count: validators.length,
      uniqueCount: uniqueValidators.size,
      expectedCount: expectedValidatorCount,
      addressesValid,
      fingerprintSha256: validatorFingerprint(validators),
    },
    privatePeers: { ok: Number.isFinite(peerCount) && peerCount >= 3, count: peerCount, minimum: 3 },
    blockProgress: {
      ok: Number.isFinite(firstBlock) && Number.isFinite(secondBlock) && secondBlock > firstBlock,
      from: block1,
      to: block2,
    },
  };

  const evidence = {
    schemaVersion: 2,
    checkedAt,
    network: 'KriptoAman Mainnet Candidate',
    source: 'private-self-hosted-runner',
    endpointRedacted: true,
    validatorAddressesRedacted: true,
    checks,
    ready: Object.values(checks).every((check) => check.ok === true),
  };

  console.log(JSON.stringify(evidence, null, 2));
  if (!evidence.ready) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({
    schemaVersion: 2,
    checkedAt: new Date().toISOString(),
    source: 'private-self-hosted-runner',
    endpointRedacted: true,
    validatorAddressesRedacted: true,
    ready: false,
    error: String(error?.message || error),
  }, null, 2));
  process.exitCode = 1;
});
