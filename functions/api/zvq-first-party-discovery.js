const RPC_URL = 'https://rpc.kriptoaman.com/';
const EXPECTED_CHAIN = '0x560c';
const MAX_BLOCKS = 6;
const RPC_TIMEOUT_MS = 8000;

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });

async function rpc(method, params = []) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Origin: 'https://kriptoaman.com',
        'User-Agent': 'KriptoAman-First-Party-Discovery/1.0',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`RPC ${method} returned HTTP ${response.status}`);
    const payload = await response.json();
    if (payload?.error) throw new Error(payload.error.message || `RPC ${method} failed`);
    return payload?.result;
  } finally {
    clearTimeout(timeout);
  }
}

const hexToNumber = value => Number.parseInt(String(value || '0x0'), 16);

export async function onRequestGet() {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  try {
    const [chainId, headHex] = await Promise.all([rpc('eth_chainId'), rpc('eth_blockNumber')]);
    if (chainId !== EXPECTED_CHAIN) {
      return json({ status: 'unavailable', code: 'CHAIN_ID_MISMATCH', expected: EXPECTED_CHAIN, actual: chainId, requestId }, 503);
    }

    const head = hexToNumber(headHex);
    const heights = Array.from({ length: MAX_BLOCKS }, (_, index) => head - index).filter(height => height >= 0);
    const blocks = (await Promise.all(heights.map(height => rpc('eth_getBlockByNumber', [`0x${height.toString(16)}`, true]))))
      .filter(Boolean);

    const contractCreations = [];
    for (const block of blocks) {
      for (const tx of Array.isArray(block?.transactions) ? block.transactions : []) {
        if (tx?.to == null && tx?.hash) {
          contractCreations.push({
            txHash: tx.hash,
            from: tx.from || null,
            blockNumber: hexToNumber(block.number),
            blockHash: block.hash || null,
            observedAt: Date.now(),
          });
        }
      }
    }

    return json({
      status: 'live',
      network: 'ZEVARYQ Mainnet',
      chainId: 22028,
      chainIdHex: EXPECTED_CHAIN,
      head: {
        number: head,
        hex: headHex,
        hash: blocks[0]?.hash || null,
        timestamp: blocks[0]?.timestamp ? hexToNumber(blocks[0].timestamp) * 1000 : null,
      },
      observation: {
        scannedBlocks: blocks.length,
        contractCreations,
        contractCreationCount: contractCreations.length,
      },
      provenance: {
        ownership: 'first-party',
        transport: 'JSON-RPC',
        endpoint: 'rpc.kriptoaman.com',
        externalMarketProviderUsed: false,
        finality: 'observed-not-finalized',
        note: 'Direct read-only observation from KriptoAman ZEVARYQ RPC. Contract creation does not imply ERC-20 compatibility, liquidity, listing, safety, or endorsement.',
      },
      latencyMs: Date.now() - startedAt,
      observedAt: Date.now(),
      requestId,
    });
  } catch (error) {
    return json({
      status: 'unavailable',
      code: 'FIRST_PARTY_RPC_UNAVAILABLE',
      message: error?.message || 'First-party RPC unavailable',
      provenance: { ownership: 'first-party', endpoint: 'rpc.kriptoaman.com', externalMarketProviderUsed: false },
      requestId,
    }, 503);
  }
}
