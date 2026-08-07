// Multi-chain wallet config & public-node balance/history fetchers.
// No API keys required — uses public RPC nodes and block explorers.

export const CHAINS = [
  { key: 'BTC', name: 'Bitcoin', symbol: 'BTC', color: '#f7931a', explorer: 'https://blockstream.info/address/', type: 'btc', priceKey: 'BTC' },
  { key: 'ETH', name: 'Ethereum', symbol: 'ETH', color: '#627eea', explorer: 'https://etherscan.io/address/', type: 'evm', rpc: 'https://eth.llamarpc.com', decimals: 18, priceKey: 'ETH' },
  { key: 'BNB', name: 'BNB Chain', symbol: 'BNB', color: '#f3ba2f', explorer: 'https://bscscan.com/address/', type: 'evm', rpc: 'https://bsc-dataseed.binance.org', decimals: 18, priceKey: 'BNB' },
  { key: 'SOL', name: 'Solana', symbol: 'SOL', color: '#14f195', explorer: 'https://explorer.solana.com/address/', type: 'solana', rpc: 'https://api.mainnet-beta.solana.com', decimals: 9, priceKey: 'SOL' },
  { key: 'BASE', name: 'Base', symbol: 'ETH', color: '#0052ff', explorer: 'https://basescan.org/address/', type: 'evm', rpc: 'https://mainnet.base.org', decimals: 18, priceKey: 'ETH', addressKey: 'ETH' },
  { key: 'MATIC', name: 'Polygon', symbol: 'MATIC', color: '#8247e5', explorer: 'https://polygonscan.com/address/', type: 'evm', rpc: 'https://polygon-rpc.com', decimals: 18, priceKey: 'MATIC' },
  { key: 'ARB', name: 'Arbitrum', symbol: 'ETH', color: '#28a0f0', explorer: 'https://arbiscan.io/address/', type: 'evm', rpc: 'https://arb1.arbitrum.io/rpc', decimals: 18, priceKey: 'ETH', addressKey: 'ETH' },
  { key: 'TRX', name: 'TRON', symbol: 'TRX', color: '#ff060a', explorer: 'https://tronscan.org/#/address/', type: 'tron', rpc: 'https://api.trongrid.io', decimals: 6, priceKey: 'TRX' },
];

export function chainAddress(chain, addresses) {
  const key = chain.addressKey || chain.key;
  return addresses?.[key]?.address || addresses?.[chain.key]?.address || '';
}

export async function fetchBalance(chain, address) {
  if (!address) return 0;
  try {
    if (chain.type === 'btc') {
      const r = await fetch(`https://blockstream.info/api/address/${address}`);
      const d = await r.json();
      const sat = (d.chain_stats?.funded_txo_sum || 0) - (d.chain_stats?.spent_txo_sum || 0);
      return sat / 1e8;
    }
    if (chain.type === 'evm') {
      const r = await fetch(chain.rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] }),
      });
      const d = await r.json();
      return parseInt(d.result || '0x0', 16) / Math.pow(10, chain.decimals);
    }
    if (chain.type === 'solana') {
      const r = await fetch(chain.rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address] }),
      });
      const d = await r.json();
      return (d.result?.value || 0) / 1e9;
    }
    if (chain.type === 'tron') {
      const r = await fetch(`https://api.trongrid.io/v1/accounts/${address}`);
      const d = await r.json();
      return (d.data?.[0]?.balance || 0) / 1e6;
    }
  } catch { /* network — keep 0 */ }
  return 0;
}

export async function fetchHistory(chain, address) {
  if (!address) return [];
  try {
    if (chain.type === 'btc') {
      const r = await fetch(`https://blockstream.info/api/address/${address}/txs`);
      const txs = await r.json();
      return (txs || []).slice(0, 8).map((t) => {
        const recv = (t.vout || []).reduce((s, o) => s + (o.scriptpubkey_address === address ? o.value : 0), 0);
        const sent = (t.vin || []).reduce((s, o) => s + (o.prevout && o.prevout.scriptpubkey_address === address ? o.prevout.value : 0), 0);
        const net = (recv - sent) / 1e8;
        return { hash: t.txid, value: net, time: (t.status?.block_time || 0) * 1000, type: net >= 0 ? 'in' : 'out' };
      });
    }
    if (chain.type === 'solana') {
      const r = await fetch(chain.rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSignaturesForAddress', params: [address, { limit: 8 }] }),
      });
      const d = await r.json();
      return (d.result || []).map((s) => ({ hash: s.signature, value: null, time: (s.blockTime || 0) * 1000, type: s.err ? 'failed' : 'tx' }));
    }
    return []; // EVM/tron: free tx history requires an API key — UI shows explorer link
  } catch { return []; }
}