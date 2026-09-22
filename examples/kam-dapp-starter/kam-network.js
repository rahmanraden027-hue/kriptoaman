export const ZEVARYQ_NETWORK = Object.freeze({
  name: 'ZEVARYQ Mainnet',
  chainId: 22028,
  chainIdHex: '0x560c',
  rpcUrl: 'https://rpc.kriptoaman.com',
  explorerUrl: 'https://explorer.kriptoaman.com',
  nativeCurrency: Object.freeze({ name: 'ZEVARYQ', symbol: 'ZVQ', decimals: 18 }),
});

const EXPLORER_ENDPOINTS = Object.freeze({
  blocks: `${ZEVARYQ_NETWORK.explorerUrl}/api/v2/blocks`,
  transactions: `${ZEVARYQ_NETWORK.explorerUrl}/api/v2/transactions`,
  stats: `${ZEVARYQ_NETWORK.explorerUrl}/api/v2/stats`,
});

export async function jsonRpc(method, params = []) {
  const response = await fetch(ZEVARYQ_NETWORK.rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  });
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.message || 'RPC error');
  return payload.result;
}

async function fetchExplorerUrl(url) {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Explorer HTTP ${response.status}`);
  return response.json();
}

export function latestBlocks() {
  return fetchExplorerUrl(EXPLORER_ENDPOINTS.blocks);
}

export function latestTransactions() {
  return fetchExplorerUrl(EXPLORER_ENDPOINTS.transactions);
}

export function networkStats() {
  return fetchExplorerUrl(EXPLORER_ENDPOINTS.stats);
}

export async function verifyNetwork() {
  const [chainIdHex, blockNumberHex] = await Promise.all([
    jsonRpc('eth_chainId'),
    jsonRpc('eth_blockNumber'),
  ]);
  if (String(chainIdHex).toLowerCase() !== ZEVARYQ_NETWORK.chainIdHex) {
    throw new Error(`Unexpected Chain ID: ${chainIdHex}`);
  }
  return {
    chainId: Number.parseInt(chainIdHex, 16),
    blockNumber: Number.parseInt(blockNumberHex, 16),
  };
}

export async function addToWallet(provider = globalThis.ethereum) {
  if (!provider?.request) throw new Error('No injected EVM wallet detected');
  return provider.request({
    method: 'wallet_addEthereumChain',
    params: [{
      chainId: ZEVARYQ_NETWORK.chainIdHex,
      chainName: ZEVARYQ_NETWORK.name,
      nativeCurrency: ZEVARYQ_NETWORK.nativeCurrency,
      rpcUrls: [ZEVARYQ_NETWORK.rpcUrl],
      blockExplorerUrls: [ZEVARYQ_NETWORK.explorerUrl],
    }],
  });
}

export async function switchToZEVARYQ(provider = globalThis.ethereum) {
  if (!provider?.request) throw new Error('No injected EVM wallet detected');
  try {
    return await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ZEVARYQ_NETWORK.chainIdHex }],
    });
  } catch (error) {
    if (error?.code === 4902) return addToWallet(provider);
    throw error;
  }
}

export async function requestAccounts(provider = globalThis.ethereum) {
  if (!provider?.request) throw new Error('No injected EVM wallet detected');
  return provider.request({ method: 'eth_requestAccounts' });
}

export function explorerTxUrl(hash) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash || '')) throw new Error('Invalid transaction hash');
  return `${ZEVARYQ_NETWORK.explorerUrl}/tx/${hash}`;
}

export function explorerAddressUrl(address) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address || '')) throw new Error('Invalid address');
  return `${ZEVARYQ_NETWORK.explorerUrl}/address/${address}`;
}
// Deprecated compatibility aliases for integrations using the pre-rebrand starter API.
export const KAM_NETWORK = ZEVARYQ_NETWORK;
export const switchToKAM = switchToZEVARYQ;
