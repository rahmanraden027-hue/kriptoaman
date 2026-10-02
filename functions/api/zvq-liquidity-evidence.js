const RPC_URL = 'https://rpc.kriptoaman.com/';
const EXPECTED_CHAIN = '0x560c';
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const DATA_RE = /^0x[0-9a-fA-F]*$/;
const TIMEOUT_MS = 8000;

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
const validAddress = value => typeof value === 'string' && ADDRESS_RE.test(value);
const selector = {
  factory: '0xc45a0155',
  weth: '0xad5c4648',
  getPair: '0xe6a43905',
  token0: '0x0dfe1681',
  token1: '0xd21220a7',
  getReserves: '0x0902f1ac',
};

let id = 1;
async function rpc(method, params = []) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Origin: 'https://kriptoaman.com', 'User-Agent': 'KriptoAman-QoryVEx-Liquidity-Evidence/1.0' },
      body: JSON.stringify({ jsonrpc: '2.0', id: id++, method, params }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
    const payload = await response.json();
    if (payload?.error) throw new Error(payload.error.message || 'RPC error');
    return payload?.result;
  } finally { clearTimeout(timeout); }
}

const wordAddress = value => typeof value === 'string' && DATA_RE.test(value) && value.length >= 66
  ? `0x${value.slice(-40)}`.toLowerCase() : null;
const padAddress = value => value.toLowerCase().replace(/^0x/, '').padStart(64, '0');
const uintWord = (hex, index) => {
  try { return BigInt(`0x${hex.slice(2 + index * 64, 2 + (index + 1) * 64)}`).toString(); } catch { return null; }
};

export async function onRequestGet({ env }) {
  const observationId = crypto.randomUUID();
  const router = String(env?.ZEVARYQ_SWAP_ROUTER || '').trim();
  const token = String(env?.ZEVARYQ_LIQUIDITY_TOKEN || '').trim();

  if (!validAddress(router) || !validAddress(token)) {
    return json({
      status: 'unavailable', code: 'REGISTRY_NOT_CONFIGURED',
      message: 'Production router/token registry is not configured for read-only liquidity evidence.',
      executionEnabled: false, observationId,
    }, 503);
  }

  try {
    const [chainId, head, routerCode, tokenCode] = await Promise.all([
      rpc('eth_chainId'), rpc('eth_blockNumber'), rpc('eth_getCode', [router, 'latest']), rpc('eth_getCode', [token, 'latest']),
    ]);
    if (chainId !== EXPECTED_CHAIN) throw new Error('Chain ID mismatch');
    if (!routerCode || routerCode === '0x' || !tokenCode || tokenCode === '0x') throw new Error('Configured registry contract has no bytecode');

    const [factoryRaw, wrappedRaw] = await Promise.all([
      rpc('eth_call', [{ to: router, data: selector.factory }, 'latest']),
      rpc('eth_call', [{ to: router, data: selector.weth }, 'latest']),
    ]);
    const factory = wordAddress(factoryRaw);
    const wrapped = wordAddress(wrappedRaw);
    if (!validAddress(factory) || !validAddress(wrapped)) throw new Error('Router factory/wrapped-native evidence invalid');

    const [factoryCode, wrappedCode] = await Promise.all([
      rpc('eth_getCode', [factory, 'latest']), rpc('eth_getCode', [wrapped, 'latest']),
    ]);
    if (!factoryCode || factoryCode === '0x' || !wrappedCode || wrappedCode === '0x') throw new Error('Factory or wrapped-native has no bytecode');

    const pairRaw = await rpc('eth_call', [{ to: factory, data: `${selector.getPair}${padAddress(wrapped)}${padAddress(token)}` }, 'latest']);
    const pair = wordAddress(pairRaw);
    if (!validAddress(pair) || /^0x0{40}$/.test(pair)) {
      return json({ status: 'live', chainId: 22028, head, router, factory, wrappedNative: wrapped, token: token.toLowerCase(), pair: null, poolEvidence: 'NO_PAIR', liquidityEvidence: 'UNAVAILABLE', executionEnabled: false, observedAt: Date.now(), observationId });
    }

    const pairCode = await rpc('eth_getCode', [pair, 'latest']);
    if (!pairCode || pairCode === '0x') throw new Error('Pair has no bytecode');

    const [token0Raw, token1Raw, reservesRaw] = await Promise.all([
      rpc('eth_call', [{ to: pair, data: selector.token0 }, 'latest']),
      rpc('eth_call', [{ to: pair, data: selector.token1 }, 'latest']),
      rpc('eth_call', [{ to: pair, data: selector.getReserves }, 'latest']),
    ]);
    const token0 = wordAddress(token0Raw);
    const token1 = wordAddress(token1Raw);
    const expected = new Set([wrapped.toLowerCase(), token.toLowerCase()]);
    if (!expected.has(token0) || !expected.has(token1) || token0 === token1) throw new Error('Pair token identity mismatch');

    const reserve0 = uintWord(reservesRaw, 0);
    const reserve1 = uintWord(reservesRaw, 1);
    const blockTimestampLast = uintWord(reservesRaw, 2);
    if (reserve0 == null || reserve1 == null) throw new Error('Reserve evidence invalid');

    return json({
      status: 'live', schemaVersion: 1, chainId: 22028, chainIdHex: EXPECTED_CHAIN, head,
      router: router.toLowerCase(), factory, wrappedNative: wrapped, token: token.toLowerCase(),
      pair, token0, token1, reserve0, reserve1, blockTimestampLast,
      poolEvidence: 'FIRST_PARTY_ON_CHAIN', liquidityEvidence: BigInt(reserve0) > 0n && BigInt(reserve1) > 0n ? 'RESERVES_PRESENT' : 'ZERO_RESERVES',
      executionEnabled: false,
      provenance: { ownership: 'first-party', endpoint: 'rpc.kriptoaman.com', transport: 'JSON-RPC', externalMarketProviderUsed: false },
      observedAt: Date.now(), observationId,
    });
  } catch (error) {
    return json({ status: 'unavailable', code: 'LIQUIDITY_EVIDENCE_UNAVAILABLE', message: error?.message || 'Liquidity evidence unavailable', executionEnabled: false, observationId }, 503);
  }
}
