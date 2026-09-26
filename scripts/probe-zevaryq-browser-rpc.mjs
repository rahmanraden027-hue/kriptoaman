// Read-only public endpoint diagnostic. Never issues transactions, changes DNS,
// retries blocked POSTs, or discloses cookies or credentials.
import { writeFileSync } from 'node:fs';

const expectedChainId = '0x560c';
const destinations = {
  canonicalRpc: 'https://rpc.kriptoaman.com',
  explorerBrowserRpc: 'https://explorer.kriptoaman.com/rpc',
};
const publicHeaders = (headers) => Object.fromEntries(
  ['server', 'content-type', 'cf-ray', 'cf-mitigated', 'cache-control', 'x-kam-explorer-version']
    .filter((name) => headers.has(name))
    .map((name) => [name, headers.get(name)])
);
async function chainIdProbe(url) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 'zvq-gateway-diagnostic', method: 'eth_chainId', params: [] }),
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    const body = await response.text();
    let payload = null;
    try { payload = JSON.parse(body); } catch {}
    const headers = publicHeaders(response.headers);
    return {
      status: response.status,
      ok: response.ok && payload?.result === expectedChainId,
      chainId: payload?.result ?? null,
      headers,
      // Public response signature only, never dump full HTML/challenge material.
      responseSignals: response.ok ? [] : [
        ...(body.includes('cloudflare') ? ['body-mentions-cloudflare'] : []),
        ...(body.includes('nginx') ? ['body-mentions-nginx'] : []),
        ...(body.includes('1020') ? ['body-mentions-1020'] : []),
        ...(body.includes('403 Forbidden') ? ['body-mentions-403'] : []),
      ],
      ...(response.ok && payload?.result !== expectedChainId ? { error: 'chain-id-mismatch' } : {}),
    };
  } catch (error) {
    return { ok: false, error: error?.name === 'TimeoutError' ? 'timeout' : 'network-error', detail: String(error?.message || error).slice(0,150) };
  }
}
async function indexedBlocksProbe() {
  try {
    const response = await fetch('https://explorer.kriptoaman.com/api/v2/blocks', { signal: AbortSignal.timeout(12000), cache: 'no-store' });
    const payload = response.ok ? await response.json() : null;
    return { status: response.status, ok: response.ok && Array.isArray(payload?.items) && payload.items.length > 0, itemCount: payload?.items?.length ?? 0, headers: publicHeaders(response.headers) };
  } catch (error) {
    return { ok: false, error: error?.name === 'TimeoutError' ? 'timeout' : 'network-error' };
  }
}
const [canonicalRpc, explorerBrowserRpc, indexedBlocks] = await Promise.all([
  chainIdProbe(destinations.canonicalRpc),
  chainIdProbe(destinations.explorerBrowserRpc),
  indexedBlocksProbe(),
]);
const result = {
  checkedAt: new Date().toISOString(),
  expectedChainId,
  canonicalRpc, explorerBrowserRpc, indexedBlocks,
  verdict: !canonicalRpc.ok ? 'canonical-rpc-failed' : !indexedBlocks.ok ? 'explorer-indexer-failed' : !explorerBrowserRpc.ok ? 'browser-rpc-gateway-blocked' : 'all-public-probes-passed',
};
writeFileSync('zvq-rpc-gateway-report.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.verdict !== 'all-public-probes-passed') process.exitCode = 1;
