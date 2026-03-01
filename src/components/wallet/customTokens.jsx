// Custom token management for EVM chains (ERC-20, BEP-20, etc.)

const STORAGE_KEY = 'coinvault_custom_tokens';

const EVM_CHAIN_CONFIG = {
  ETH:   { rpcUrl: 'https://eth.llamarpc.com',            explorerApi: 'https://api.etherscan.io/api',             explorerTx: 'https://etherscan.io/tx/',           nativeSymbol: 'ETH',  chainId: 1 },
  BNB:   { rpcUrl: 'https://bsc-dataseed.binance.org',    explorerApi: 'https://api.bscscan.com/api',              explorerTx: 'https://bscscan.com/tx/',            nativeSymbol: 'BNB',  chainId: 56 },
  MATIC: { rpcUrl: 'https://polygon-rpc.com',             explorerApi: 'https://api.polygonscan.com/api',          explorerTx: 'https://polygonscan.com/tx/',         nativeSymbol: 'POL',  chainId: 137 },
  ARB:   { rpcUrl: 'https://arb1.arbitrum.io/rpc',        explorerApi: 'https://api.arbiscan.io/api',              explorerTx: 'https://arbiscan.io/tx/',             nativeSymbol: 'ETH',  chainId: 42161 },
  OP:    { rpcUrl: 'https://mainnet.optimism.io',          explorerApi: 'https://api-optimistic.etherscan.io/api', explorerTx: 'https://optimistic.etherscan.io/tx/', nativeSymbol: 'ETH',  chainId: 10 },
  BASE:  { rpcUrl: 'https://mainnet.base.org',            explorerApi: 'https://api.basescan.org/api',             explorerTx: 'https://basescan.org/tx/',            nativeSymbol: 'ETH',  chainId: 8453 },
  AVAX:  { rpcUrl: 'https://api.avax.network/ext/bc/C/rpc', explorerApi: 'https://api.snowtrace.io/api',           explorerTx: 'https://snowtrace.io/tx/',            nativeSymbol: 'AVAX', chainId: 43114 },
  FTM:   { rpcUrl: 'https://rpcapi.fantom.network',       explorerApi: 'https://api.ftmscan.com/api',              explorerTx: 'https://ftmscan.com/tx/',             nativeSymbol: 'FTM',  chainId: 250 },
};

export const EVM_CHAINS = Object.keys(EVM_CHAIN_CONFIG);

// Load tokens from localStorage
export function loadCustomTokens() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

// Save tokens to localStorage
export function saveCustomTokens(tokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

// Add a new token
export function addCustomToken(token) {
  const tokens = loadCustomTokens();
  // Deduplicate by contract + chain
  const exists = tokens.find(t => t.contract.toLowerCase() === token.contract.toLowerCase() && t.chain === token.chain);
  if (exists) return tokens;
  const newTokens = [...tokens, { ...token, id: `${token.chain}_${token.contract.toLowerCase()}` }];
  saveCustomTokens(newTokens);
  return newTokens;
}

// Remove a token
export function removeCustomToken(id) {
  const tokens = loadCustomTokens().filter(t => t.id !== id);
  saveCustomTokens(tokens);
  return tokens;
}

// ERC-20 ABI minimal (balanceOf, decimals, symbol, name)
const ERC20_ABI = {
  balanceOf: '0x70a08231',
  decimals: '0x313ce567',
  symbol: '0x95d89b41',
  name: '0x06fdde03',
};

function padAddress(address) {
  return '000000000000000000000000' + address.toLowerCase().replace('0x', '');
}

async function ethCall(rpcUrl, contract, data) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: contract, data }, 'latest'] }),
  });
  const json = await res.json();
  return json.result;
}

function decodeUint(hex) {
  if (!hex || hex === '0x') return 0;
  return parseInt(hex, 16);
}

function decodeString(hex) {
  if (!hex || hex === '0x') return '';
  try {
    // ABI string: 32 bytes offset, 32 bytes length, then UTF-8 bytes
    const raw = hex.replace('0x', '');
    const offset = parseInt(raw.slice(0, 64), 16) * 2;
    const len = parseInt(raw.slice(offset, offset + 64), 16) * 2;
    const strHex = raw.slice(offset + 64, offset + 64 + len);
    const bytes = strHex.match(/.{2}/g)?.map(b => parseInt(b, 16)) || [];
    return new TextDecoder().decode(new Uint8Array(bytes));
  } catch {
    return '';
  }
}

// Fetch token metadata from contract
export async function fetchTokenMetadata(chain, contractAddress) {
  const cfg = EVM_CHAIN_CONFIG[chain];
  if (!cfg) throw new Error('Chain tidak didukung');

  const [nameHex, symbolHex, decimalsHex] = await Promise.all([
    ethCall(cfg.rpcUrl, contractAddress, ERC20_ABI.name),
    ethCall(cfg.rpcUrl, contractAddress, ERC20_ABI.symbol),
    ethCall(cfg.rpcUrl, contractAddress, ERC20_ABI.decimals),
  ]);

  const name = decodeString(nameHex) || 'Unknown Token';
  const symbol = decodeString(symbolHex) || '???';
  const decimals = decodeUint(decimalsHex) || 18;

  if (!name && !symbol) throw new Error('Kontrak tidak valid atau bukan ERC-20');
  return { name, symbol, decimals };
}

// Get token balance for an address
export async function fetchTokenBalance(chain, contractAddress, walletAddress, decimals = 18) {
  const cfg = EVM_CHAIN_CONFIG[chain];
  if (!cfg) return 0;
  const data = ERC20_ABI.balanceOf + padAddress(walletAddress);
  const hex = await ethCall(cfg.rpcUrl, contractAddress, data);
  const raw = decodeUint(hex);
  return raw / Math.pow(10, decimals);
}

// Get token transactions via explorer API
export async function fetchTokenTransactions(chain, contractAddress, walletAddress) {
  const cfg = EVM_CHAIN_CONFIG[chain];
  if (!cfg) return [];
  const url = `${cfg.explorerApi}?module=account&action=tokentx&contractaddress=${contractAddress}&address=${walletAddress}&page=1&offset=20&sort=desc`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data.result)) return [];
  return data.result.map(tx => {
    const isSent = tx.from?.toLowerCase() === walletAddress.toLowerCase();
    const value = parseInt(tx.value || '0') / Math.pow(10, parseInt(tx.tokenDecimal || 18));
    return {
      hash: tx.hash,
      amount: isSent ? -value : value,
      type: isSent ? 'sent' : 'received',
      date: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      counterparty: isSent ? tx.to : tx.from,
      confirmations: 100,
      tokenSymbol: tx.tokenSymbol,
      explorerTx: cfg.explorerTx,
    };
  });
}

export { EVM_CHAIN_CONFIG };