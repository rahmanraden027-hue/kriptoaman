const RPC_URL = process.env.KAM_RPC_URL || 'https://rpc.kriptoaman.com';
const WKAM = '0x0d8848CE88BB09a81a4248Efdd574d50B98b544A';
const EXPECTED_CHAIN_ID = 22028n;

async function rpc(method, params = []) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${method} HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.error) throw new Error(`${method}: ${payload.error.message || 'RPC error'}`);
    return payload.result;
  } finally {
    clearTimeout(timer);
  }
}

function decodeUint(hex) {
  return BigInt(hex || '0x0');
}

function decodeAbiString(hex) {
  if (!hex || hex === '0x') return '';
  const raw = hex.slice(2);
  if (raw.length < 128) return '';
  const offset = Number.parseInt(raw.slice(0, 64), 16) * 2;
  const length = Number.parseInt(raw.slice(offset, offset + 64), 16) * 2;
  const bytes = raw.slice(offset + 64, offset + 64 + length);
  return Buffer.from(bytes, 'hex').toString('utf8');
}

const chainHex = await rpc('eth_chainId');
const chainId = BigInt(chainHex);
if (chainId !== EXPECTED_CHAIN_ID) throw new Error(`Unexpected chainId ${chainId}`);

const blockHex = await rpc('eth_blockNumber');
const blockNumber = decodeUint(blockHex);
if (blockNumber <= 0n) throw new Error('Block number is not advancing/available');

const code = await rpc('eth_getCode', [WKAM, 'latest']);
if (!code || code === '0x') throw new Error('No WKAM bytecode at canonical address');

const symbolHex = await rpc('eth_call', [{ to: WKAM, data: '0x95d89b41' }, 'latest']);
const decimalsHex = await rpc('eth_call', [{ to: WKAM, data: '0x313ce567' }, 'latest']);
const totalSupplyHex = await rpc('eth_call', [{ to: WKAM, data: '0x18160ddd' }, 'latest']);

const symbol = decodeAbiString(symbolHex);
const decimals = Number(decodeUint(decimalsHex));
const totalSupply = decodeUint(totalSupplyHex);

if (symbol !== 'WKAM') throw new Error(`Unexpected WKAM symbol: ${symbol || '<empty>'}`);
if (decimals !== 18) throw new Error(`Unexpected WKAM decimals: ${decimals}`);

console.log(JSON.stringify({
  rpc: RPC_URL,
  chainId: Number(chainId),
  blockNumber: blockNumber.toString(),
  wkam: WKAM,
  bytecodePresent: true,
  symbol,
  decimals,
  totalSupply: totalSupply.toString(),
  mode: 'read-only',
}, null, 2));
