const rpcUrl = process.env.KAM_EXPLORER_RPC_URL || 'https://explorer.kriptoaman.com/rpc';
const expectedChainId = '0x560c';
const expectedValidatorCount = 4;
const timeoutMs = 12000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function rpc(method, params = []) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
      signal: controller.signal,
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(method + ': HTTP ' + response.status);
    if (payload?.error) throw new Error(method + ': ' + (payload.error.message || 'RPC error'));
    return payload?.result;
  } finally {
    clearTimeout(timer);
  }
}

function hexNumber(value, label) {
  if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value)) {
    throw new Error(label + ': invalid hex value');
  }
  const n = Number.parseInt(value, 16);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error(label + ': invalid number');
  return n;
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
    throw new Error('Block extraData is missing');
  }
  const extraData = Buffer.from(extraDataHex.slice(2), 'hex');
  const [decoded, consumed] = decodeRlp(extraData, 0);
  if (!Array.isArray(decoded) || consumed !== extraData.length) {
    throw new Error('QBFT extraData is not a complete RLP list');
  }

  const candidates = [];
  const walk = (value) => {
    if (!Array.isArray(value)) return;
    if (
      value.length === expectedValidatorCount &&
      value.every((entry) => Buffer.isBuffer(entry) && entry.length === 20)
    ) {
      const addresses = value.map((entry) => '0x' + entry.toString('hex'));
      if (new Set(addresses.map((value) => value.toLowerCase())).size === expectedValidatorCount) {
        candidates.push(addresses);
      }
    }
    for (const child of value) walk(child);
  };
  walk(decoded);

  if (candidates.length !== 1) {
    throw new Error('Unable to identify unique four-validator list in QBFT extraData');
  }
  return candidates[0];
}

async function finalityEvidence(latestBlock) {
  for (const tag of ['finalized', 'safe']) {
    try {
      const block = await rpc('eth_getBlockByNumber', [tag, false]);
      if (block?.number && block?.hash) {
        return {
          source: 'rpc-' + tag,
          block,
          validatorCount: null,
        };
      }
    } catch {
      // Some Besu QBFT deployments do not expose post-Merge safe/finalized tags.
    }
  }

  const validators = validatorsFromExtraData(latestBlock?.extraData);
  return {
    source: 'qbft-committed-head',
    block: latestBlock,
    validatorCount: validators.length,
  };
}

async function main() {
  const report = {
    checkedAt: new Date().toISOString(),
    rpcUrl,
    expectedChainId,
    consensus: 'QBFT',
    checks: {},
    ready: false,
  };

  const chainId = await rpc('eth_chainId');
  report.checks.chainId = { ok: chainId === expectedChainId, value: chainId };
  if (!report.checks.chainId.ok) throw new Error('Chain ID mismatch');

  const head1Hex = await rpc('eth_blockNumber');
  const head1 = hexNumber(head1Hex, 'head1');
  const latest = await rpc('eth_getBlockByNumber', [head1Hex, false]);
  if (!latest?.hash || !latest?.parentHash) throw new Error('Latest block identity unavailable');
  report.checks.latestBlock = { ok: true, value: head1, hash: latest.hash };

  const gasHex = await rpc('eth_gasPrice');
  hexNumber(gasHex, 'gasPrice');
  report.checks.gasPrice = { ok: true, value: gasHex };

  const finality = await finalityEvidence(latest);
  const finalizedNumber = hexNumber(finality.block.number, 'finalizedBlock');
  report.checks.finality = {
    ok:
      finalizedNumber <= head1 &&
      Boolean(finality.block.hash) &&
      (finality.source !== 'qbft-committed-head' || finality.validatorCount === expectedValidatorCount),
    source: finality.source,
    value: finalizedNumber,
    validatorCount: finality.validatorCount,
  };
  if (!report.checks.finality.ok) throw new Error('Finality evidence failed');

  const sample = [latest];
  let cursor = head1;
  for (let i = 0; i < 5 && cursor > 0; i += 1) {
    cursor -= 1;
    const block = await rpc('eth_getBlockByNumber', ['0x' + cursor.toString(16), false]);
    if (!block?.hash || !block?.parentHash) throw new Error('Block sample unavailable');
    sample.push(block);
  }

  let continuityOk = true;
  const intervals = [];
  for (let i = 0; i < sample.length - 1; i += 1) {
    const current = sample[i];
    const previous = sample[i + 1];
    if (String(current.parentHash).toLowerCase() !== String(previous.hash).toLowerCase()) {
      continuityOk = false;
      break;
    }
    const currentTs = hexNumber(current.timestamp, 'blockTimestamp');
    const previousTs = hexNumber(previous.timestamp, 'previousBlockTimestamp');
    const delta = currentTs - previousTs;
    if (delta > 0 && delta < 120) intervals.push(delta);
  }
  report.checks.continuity = {
    ok: continuityOk && intervals.length >= 3,
    sampledBlocks: sample.length,
    verifiedIntervals: intervals.length,
  };
  if (!report.checks.continuity.ok) throw new Error('Block continuity sample failed');

  const averageBlockTime = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  report.checks.blockTime = {
    ok: Number.isFinite(averageBlockTime) && averageBlockTime > 0 && averageBlockTime < 120,
    averageSeconds: Number(averageBlockTime.toFixed(2)),
    intervals,
  };
  if (!report.checks.blockTime.ok) throw new Error('Block-time sample outside verified range');

  await sleep(20000);
  const head2Hex = await rpc('eth_blockNumber');
  const head2 = hexNumber(head2Hex, 'head2');
  report.checks.chainStatus = {
    ok: head2 > head1,
    from: head1,
    to: head2,
    observedOverSeconds: 20,
  };
  if (!report.checks.chainStatus.ok) throw new Error('Block head did not advance');

  report.ready = Object.values(report.checks).every((check) => check.ok === true);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ready) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({
    checkedAt: new Date().toISOString(),
    rpcUrl,
    expectedChainId,
    consensus: 'QBFT',
    ready: false,
    error: String(error?.message || error),
  }, null, 2));
  process.exitCode = 1;
});
