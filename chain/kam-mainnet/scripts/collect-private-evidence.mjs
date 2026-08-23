import { createHash } from 'node:crypto';

const rpcUrl = process.env.KAM_PRIVATE_RPC_URL || 'http://127.0.0.1:8545';
const expectedChainId = '0x560c';
const expectedValidatorCount = 4;

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

function validatorFingerprint(validators) {
  const normalized = [...validators].map((value) => String(value).toLowerCase()).sort();
  return createHash('sha256').update(normalized.join('\n')).digest('hex');
}

function decodeRlp(buffer, offset = 0) {
  if (offset >= buffer.length) throw new Error('RLP: unexpected EOF');
  const prefix = buffer[offset];

  if (prefix <= 0x7f) return [buffer.subarray(offset, offset + 1), offset + 1];

  if (prefix <= 0xb7) {
    const length = prefix - 0x80;
    const start = offset + 1;
    const end = start + length;
    if (end > buffer.length) throw new Error('RLP: short string');
    return [buffer.subarray(start, end), end];
  }

  if (prefix <= 0xbf) {
    const lengthOfLength = prefix - 0xb7;
    const lengthStart = offset + 1;
    const lengthEnd = lengthStart + lengthOfLength;
    if (lengthEnd > buffer.length) throw new Error('RLP: short string length');
    const length = Number.parseInt(buffer.subarray(lengthStart, lengthEnd).toString('hex') || '0', 16);
    const start = lengthEnd;
    const end = start + length;
    if (end > buffer.length) throw new Error('RLP: short long string');
    return [buffer.subarray(start, end), end];
  }

  const decodeList = (start, end) => {
    const values = [];
    let cursor = start;
    while (cursor < end) {
      const [value, next] = decodeRlp(buffer, cursor);
      if (next <= cursor) throw new Error('RLP: parser did not advance');
      values.push(value);
      cursor = next;
    }
    if (cursor !== end) throw new Error('RLP: list boundary mismatch');
    return values;
  };

  if (prefix <= 0xf7) {
    const length = prefix - 0xc0;
    const start = offset + 1;
    const end = start + length;
    if (end > buffer.length) throw new Error('RLP: short list');
    return [decodeList(start, end), end];
  }

  const lengthOfLength = prefix - 0xf7;
  const lengthStart = offset + 1;
  const lengthEnd = lengthStart + lengthOfLength;
  if (lengthEnd > buffer.length) throw new Error('RLP: short list length');
  const length = Number.parseInt(buffer.subarray(lengthStart, lengthEnd).toString('hex') || '0', 16);
  const start = lengthEnd;
  const end = start + length;
  if (end > buffer.length) throw new Error('RLP: short long list');
  return [decodeList(start, end), end];
}

function validatorsFromExtraData(extraDataHex) {
  if (typeof extraDataHex !== 'string' || !extraDataHex.startsWith('0x')) {
    throw new Error('Block extraData is missing or invalid');
  }
  const extraData = Buffer.from(extraDataHex.slice(2), 'hex');
  const [decoded, consumed] = decodeRlp(extraData, 0);
  if (!Array.isArray(decoded) || consumed !== extraData.length) {
    throw new Error('QBFT extraData is not a complete RLP list');
  }

  // Besu QBFT extraData is an RLP list whose validator set is a nested list
  // of 20-byte addresses. Select exactly one valid four-address candidate.
  const candidates = [];
  const walk = (value) => {
    if (!Array.isArray(value)) return;
    if (
      value.length === expectedValidatorCount &&
      value.every((entry) => Buffer.isBuffer(entry) && entry.length === 20)
    ) {
      const addresses = value.map((entry) => `0x${entry.toString('hex')}`);
      if (new Set(addresses.map((value) => value.toLowerCase())).size === expectedValidatorCount) {
        candidates.push(addresses);
      }
    }
    for (const child of value) walk(child);
  };
  walk(decoded);

  if (candidates.length !== 1) {
    throw new Error(`Unable to identify unique four-validator list in QBFT extraData (candidates=${candidates.length})`);
  }
  return candidates[0];
}

async function getValidators() {
  try {
    const validators = await rpc('qbft_getValidatorsByBlockNumber', ['latest']);
    if (!Array.isArray(validators)) throw new Error('QBFT validator result is not an array');
    return { validators, source: 'qbft_getValidatorsByBlockNumber' };
  } catch (error) {
    const block = await rpc('eth_getBlockByNumber', ['latest', false]);
    const validators = validatorsFromExtraData(block?.extraData);
    return {
      validators,
      source: 'eth_getBlockByNumber.extraData',
      fallbackReason: String(error?.message || error),
    };
  }
}

async function main() {
  const checkedAt = new Date().toISOString();
  const chainId = await rpc('eth_chainId');
  const validatorResult = await getValidators();
  const validators = validatorResult.validators;
  const peerCountHex = await rpc('net_peerCount');
  const block1 = await rpc('eth_blockNumber');
  await new Promise((resolve) => setTimeout(resolve, 4000));
  const block2 = await rpc('eth_blockNumber');

  const peerCount = Number.parseInt(peerCountHex, 16);
  const firstBlock = Number.parseInt(block1, 16);
  const secondBlock = Number.parseInt(block2, 16);

  const checks = {
    chainId: { ok: chainId === expectedChainId, value: chainId },
    validatorSet: {
      ok: validators.length === expectedValidatorCount,
      count: validators.length,
      expectedCount: expectedValidatorCount,
      fingerprintSha256: validatorFingerprint(validators),
      source: validatorResult.source,
    },
    privatePeers: { ok: Number.isFinite(peerCount) && peerCount >= 3, count: peerCount, minimum: 3 },
    blockProgress: {
      ok: Number.isFinite(firstBlock) && Number.isFinite(secondBlock) && secondBlock > firstBlock,
      from: block1,
      to: block2,
    },
  };

  const evidence = {
    schemaVersion: 1,
    checkedAt,
    network: 'KriptoAman Mainnet Candidate',
    source: 'private-self-hosted-runner',
    endpointRedacted: true,
    checks,
    ready: Object.values(checks).every((check) => check.ok === true),
  };

  console.log(JSON.stringify(evidence, null, 2));
  if (!evidence.ready) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({
    schemaVersion: 1,
    checkedAt: new Date().toISOString(),
    source: 'private-self-hosted-runner',
    endpointRedacted: true,
    ready: false,
    error: String(error?.message || error),
  }, null, 2));
  process.exitCode = 1;
});
