import {
  createPublicClient,
  defineChain,
  formatUnits,
  http,
  isAddress,
  parseUnits,
} from 'viem';
import { ZEVARYQ } from '@/theme/zevaryqWallet';

const ROUTER_ADDRESS = import.meta.env.VITE_ZEVARYQ_SWAP_ROUTER?.trim() || '';
const WZVQ_ADDRESS = import.meta.env.VITE_ZEVARYQ_WZVQ?.trim() || '';
const TOKENS_JSON = import.meta.env.VITE_ZEVARYQ_SWAP_TOKENS_JSON?.trim() || '[]';

const zevaryqChain = defineChain({
  id: ZEVARYQ.chainId,
  name: ZEVARYQ.network,
  nativeCurrency: { name: ZEVARYQ.name, symbol: ZEVARYQ.symbol, decimals: 18 },
  rpcUrls: { default: { http: [ZEVARYQ.rpc] } },
  blockExplorers: { default: { name: 'ZEVARYQ Explorer', url: ZEVARYQ.explorer } },
});

const publicClient = createPublicClient({
  chain: zevaryqChain,
  transport: http(ZEVARYQ.rpc),
});

const ROUTER_ABI = [
  {
    type: 'function',
    stateMutability: 'view',
    name: 'getAmountsOut',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    type: 'function',
    stateMutability: 'payable',
    name: 'swapExactETHForTokens',
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'swapExactTokensForETH',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
];

const ERC20_ABI = [
  {
    type: 'function',
    stateMutability: 'view',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: 'allowance', type: 'uint256' }],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
];

function loadTokens() {
  let parsed;
  try {
    parsed = JSON.parse(TOKENS_JSON);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const seen = new Set();
  return parsed
    .map((token) => ({
      symbol: String(token?.symbol || '').trim().toUpperCase(),
      name: String(token?.name || token?.symbol || '').trim(),
      address: String(token?.address || '').trim(),
      decimals: Number(token?.decimals),
    }))
    .filter((token) => {
      if (!token.symbol || token.symbol === ZEVARYQ.symbol || seen.has(token.symbol)) return false;
      if (!isAddress(token.address) || !Number.isInteger(token.decimals) || token.decimals < 0 || token.decimals > 36) return false;
      seen.add(token.symbol);
      return true;
    });
}

export const ZEVARYQ_SWAP_TOKENS = Object.freeze(loadTokens());

export function getZevaryqSwapConfiguration() {
  const reasons = [];
  if (!isAddress(ROUTER_ADDRESS)) reasons.push('VITE_ZEVARYQ_SWAP_ROUTER is missing or invalid');
  if (!isAddress(WZVQ_ADDRESS)) reasons.push('VITE_ZEVARYQ_WZVQ is missing or invalid');
  if (!ZEVARYQ_SWAP_TOKENS.length) reasons.push('VITE_ZEVARYQ_SWAP_TOKENS_JSON has no valid verified token contracts');
  return {
    configured: reasons.length === 0,
    router: isAddress(ROUTER_ADDRESS) ? ROUTER_ADDRESS : null,
    wzvq: isAddress(WZVQ_ADDRESS) ? WZVQ_ADDRESS : null,
    tokens: ZEVARYQ_SWAP_TOKENS,
    reasons,
  };
}

async function requireContract(address, label) {
  const bytecode = await publicClient.getBytecode({ address });
  if (!bytecode || bytecode === '0x') throw new Error(`${label} has no contract bytecode on ZEVARYQ Mainnet.`);
}

export async function verifyZevaryqSwapContracts() {
  const config = getZevaryqSwapConfiguration();
  if (!config.configured) {
    return { ...config, verified: false };
  }
  const chainId = await publicClient.getChainId();
  if (chainId !== ZEVARYQ.chainId) throw new Error(`RPC chain mismatch: expected ${ZEVARYQ.chainId}, got ${chainId}.`);
  await Promise.all([
    requireContract(config.router, 'Swap router'),
    requireContract(config.wzvq, 'WZVQ'),
    ...config.tokens.map((token) => requireContract(token.address, token.symbol)),
  ]);
  return { ...config, verified: true };
}

function tokenBySymbol(symbol) {
  return ZEVARYQ_SWAP_TOKENS.find((token) => token.symbol === String(symbol || '').toUpperCase()) || null;
}

function buildRoute(fromSymbol, toSymbol, config) {
  const fromZvq = fromSymbol === ZEVARYQ.symbol;
  const toZvq = toSymbol === ZEVARYQ.symbol;
  if (fromZvq === toZvq) throw new Error('Swap must include ZVQ on one side.');
  const token = tokenBySymbol(fromZvq ? toSymbol : fromSymbol);
  if (!token) throw new Error('Token is not in the verified ZEVARYQ swap registry.');
  return {
    fromZvq,
    toZvq,
    token,
    path: fromZvq ? [config.wzvq, token.address] : [token.address, config.wzvq],
  };
}

export async function quoteZevaryqSwap({ fromSymbol, toSymbol, amount, slippageBps = 50 }) {
  const config = await verifyZevaryqSwapContracts();
  if (!config.verified) throw new Error(config.reasons.join('; '));

  const route = buildRoute(fromSymbol, toSymbol, config);
  const inputDecimals = route.fromZvq ? 18 : route.token.decimals;
  const outputDecimals = route.toZvq ? 18 : route.token.decimals;
  const amountIn = parseUnits(String(amount || ''), inputDecimals);
  if (amountIn <= 0n) throw new Error('Swap amount must be greater than zero.');

  const amounts = await publicClient.readContract({
    address: config.router,
    abi: ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [amountIn, route.path],
  });
  const amountOut = amounts?.[amounts.length - 1];
  if (!amountOut || amountOut <= 0n) throw new Error('Router returned no executable output amount.');

  const boundedSlippage = Math.min(500, Math.max(1, Number(slippageBps) || 50));
  const minAmountOut = amountOut * BigInt(10_000 - boundedSlippage) / 10_000n;

  return {
    chainId: ZEVARYQ.chainId,
    router: config.router,
    path: route.path,
    fromSymbol,
    toSymbol,
    amountIn,
    amountOut,
    minAmountOut,
    amountOutFormatted: formatUnits(amountOut, outputDecimals),
    minAmountOutFormatted: formatUnits(minAmountOut, outputDecimals),
    inputDecimals,
    outputDecimals,
    token: route.token,
    fromZvq: route.fromZvq,
    slippageBps: boundedSlippage,
    quotedAt: Date.now(),
  };
}

async function requireWalletOnZevaryq(walletClient, account) {
  if (!walletClient || !account) throw new Error('Connect a wallet first.');
  const chainId = await walletClient.getChainId();
  if (Number(chainId) !== ZEVARYQ.chainId) throw new Error('Switch the wallet to ZEVARYQ Mainnet before swapping.');
}

export async function executeZevaryqSwap({ walletClient, account, quote }) {
  if (!quote || quote.chainId !== ZEVARYQ.chainId) throw new Error('A fresh ZEVARYQ on-chain quote is required.');
  if (Date.now() - Number(quote.quotedAt || 0) > 60_000) throw new Error('Quote expired. Refresh the quote before signing.');
  await requireWalletOnZevaryq(walletClient, account);

  const config = await verifyZevaryqSwapContracts();
  if (!config.verified || config.router.toLowerCase() !== quote.router.toLowerCase()) {
    throw new Error('Swap router verification changed. Refresh before signing.');
  }

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
  let approvalHash = null;

  if (!quote.fromZvq) {
    const allowance = await publicClient.readContract({
      address: quote.token.address,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account, config.router],
    });
    if (allowance < quote.amountIn) {
      approvalHash = await walletClient.writeContract({
        account,
        chain: zevaryqChain,
        address: quote.token.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [config.router, quote.amountIn],
      });
      const approvalReceipt = await publicClient.waitForTransactionReceipt({ hash: approvalHash });
      if (approvalReceipt.status !== 'success') throw new Error('Token approval transaction failed.');
    }
  }

  const hash = quote.fromZvq
    ? await walletClient.writeContract({
        account,
        chain: zevaryqChain,
        address: config.router,
        abi: ROUTER_ABI,
        functionName: 'swapExactETHForTokens',
        args: [quote.minAmountOut, quote.path, account, deadline],
        value: quote.amountIn,
      })
    : await walletClient.writeContract({
        account,
        chain: zevaryqChain,
        address: config.router,
        abi: ROUTER_ABI,
        functionName: 'swapExactTokensForETH',
        args: [quote.amountIn, quote.minAmountOut, quote.path, account, deadline],
      });

  return { hash, approvalHash };
}

export function getZevaryqSwapExplorerUrl(hash) {
  return hash ? `${ZEVARYQ.explorer}/tx/${hash}` : ZEVARYQ.explorer;
}
