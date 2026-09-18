const rpcUrl = process.env.KAM_EXPLORER_RPC_URL || 'https://explorer.kriptoaman.com/rpc';
const expectedChainId = '0x560c';
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

async function finalityBlock() {
  for (const tag of ['finalized', 'safe']) {
    try {
      const block = await rpc('eth_getBlockByNumber', [tag, false]);
      if (block?.number) return { tag, block };
    } catch {}
  }
  throw new Error('No verified finalized/safe block tag available');
}

async function main() {
  const report = { checkedAt: new Date().toISOString(), rpcUrl, checks: {}, ready: false };

  const chainId = await rpc('eth_chainId');
  report.checks.chainId = { ok: chainId === expectedChainId, value: chainId };
  if (!report.checks.chainId.ok) throw new Error('Chain ID mismatch');

  const head1Hex = await rpc('eth_blockNumber');
  const head1 = hexNumber(head1Hex, 'head1');
  report.checks.latestBlock = { ok: true, value: head1 };

  const gasHex = await rpc('eth_gasPrice');
  hexNumber(gasHex, 'gasPrice');
  report.checks.gasPrice = { ok: true, value: gasHex };

  const { tag, block: finalized } = await finalityBlock();
  const finalizedNumber = hexNumber(finalized.number, 'finalizedBlock');
  report.checks.finality = {
    ok: finalizedNumber <= head1,
    tag,
    value: finalizedNumber,
  };
  if (!report.checks.finality.ok) throw new Error('Finalized/safe block exceeds latest head');

  if (head1 < 1) throw new Error('Insufficient block height for block-time sample');
  const latest = await rpc('eth_getBlockByNumber', [head1Hex, false]);
  const previousHex = '0x' + (head1 - 1).toString(16);
  const previous = await rpc('eth_getBlockByNumber', [previousHex, false]);
  const latestTs = hexNumber(latest?.timestamp, 'latestTimestamp');
  const previousTs = hexNumber(previous?.timestamp, 'previousTimestamp');
  const blockTime = latestTs - previousTs;
  report.checks.blockTime = { ok: blockTime > 0 && blockTime < 120, seconds: blockTime };
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

  report.ready = Object.values(report.checks).every((check) => check.ok);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ready) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({
    checkedAt: new Date().toISOString(),
    rpcUrl,
    ready: false,
    error: String(error?.message || error),
  }, null, 2));
  process.exitCode = 1;
});
