const RPCS = [
  { name: 'Ethereum', url: 'https://cloudflare-eth.com' },
  { name: 'BNB Chain', url: 'https://bsc-dataseed.binance.org' },
  { name: 'Polygon', url: 'https://polygon-rpc.com' },
  { name: 'Arbitrum', url: 'https://arb1.arbitrum.io/rpc' },
  { name: 'Optimism', url: 'https://mainnet.optimism.io' },
  { name: 'Base', url: 'https://mainnet.base.org' },
  { name: 'Avalanche C-Chain', url: 'https://api.avax.network/ext/bc/C/rpc' },
];

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(JSON.stringify(data), { ...init, headers });
}

async function gasPrice({ name, url }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_gasPrice', params: [], id: 1 }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload?.result || typeof payload.result !== 'string') throw new Error('Invalid RPC response');
    const wei = BigInt(payload.result);
    const gwei = Number(wei) / 1e9;
    return {
      name,
      gwei: Number.isFinite(gwei) ? Number(gwei.toFixed(3)) : null,
      latency: Date.now() - started,
      status: 'online',
    };
  } catch (error) {
    return {
      name,
      gwei: null,
      latency: null,
      status: 'unavailable',
      error: error?.name === 'AbortError' ? 'timeout' : 'rpc_unavailable',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function onRequestGet() {
  const gas_prices = await Promise.all(RPCS.map(gasPrice));
  const available = gas_prices.filter((item) => item.status === 'online').length;
  return json({
    gas_prices,
    summary: {
      available,
      total: gas_prices.length,
      status: available === gas_prices.length ? 'ok' : available > 0 ? 'degraded' : 'unavailable',
    },
    checked_at: new Date().toISOString(),
  });
}
