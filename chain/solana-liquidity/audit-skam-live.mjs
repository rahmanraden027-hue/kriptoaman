import fs from 'node:fs';
import { PublicKey } from '@solana/web3.js';
import {
  SKAM_DECIMALS,
  SKAM_METADATA_URI,
  SKAM_NAME,
  SKAM_RAW_SUPPLY,
  SKAM_SYMBOL,
  TOKEN_2022_PROGRAM_ID,
  findTlvExtension,
  parseMintBase,
} from '../../src/lib/skamToken2022Builder.js';

const MINT = 'Dw9xf7EmMH5dD7rdqkFbzjJtcAWk4KXLBAXUkSRcLSLi';
const POOL_ID = '7vW6cmvM2YYHzoLTx7qJqACzj3X2Rq236b83YHpqCbyD';
const OPERATOR = '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK';
const WSOL = 'So11111111111111111111111111111111111111112';
const METADATA_POINTER_EXTENSION_TYPE = 18;
const TOKEN_METADATA_EXTENSION_TYPE = 19;
const RPC_URLS = [
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet-beta.solana.com',
];

function readU32(bytes, offset) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true);
}

function readString(bytes, offset) {
  const length = readU32(bytes, offset);
  const start = offset + 4;
  const end = start + length;
  if (end > bytes.length) throw new Error('TokenMetadata string exceeds extension bounds.');
  return { value: new TextDecoder().decode(bytes.slice(start, end)), next: end };
}

function parseTokenMetadata(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 68) throw new Error('TokenMetadata extension is too short.');
  let offset = 0;
  const updateAuthority = new PublicKey(bytes.slice(offset, offset + 32)).toBase58();
  offset += 32;
  const mint = new PublicKey(bytes.slice(offset, offset + 32)).toBase58();
  offset += 32;
  const name = readString(bytes, offset); offset = name.next;
  const symbol = readString(bytes, offset); offset = symbol.next;
  const uri = readString(bytes, offset); offset = uri.next;
  if (offset + 4 > bytes.length) throw new Error('TokenMetadata additionalMetadata vector length is missing.');
  const additionalMetadataCount = readU32(bytes, offset);
  return { updateAuthority, mint, name: name.value, symbol: symbol.value, uri: uri.value, additionalMetadataCount };
}

function parseMetadataPointer(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 64) throw new Error('MetadataPointer extension must be exactly 64 bytes.');
  const authorityBytes = bytes.slice(0, 32);
  const metadataBytes = bytes.slice(32, 64);
  const isZero = (value) => value.every((byte) => byte === 0);
  return {
    authority: isZero(authorityBytes) ? null : new PublicKey(authorityBytes).toBase58(),
    metadataAddress: isZero(metadataBytes) ? null : new PublicKey(metadataBytes).toBase58(),
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12_000) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
}

async function rpc(method, params) {
  let lastError;
  for (const url of RPC_URLS) {
    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (payload.error) throw new Error(payload.error.message || JSON.stringify(payload.error));
      return { result: payload.result, provider: new URL(url).hostname };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`All RPC providers failed for ${method}.`);
}

async function auditMint() {
  const { result, provider } = await rpc('getAccountInfo', [MINT, { encoding: 'base64', commitment: 'confirmed' }]);
  if (!result?.value) throw new Error('sKAM mint account was not found on Solana mainnet.');
  const owner = result.value.owner;
  if (owner !== TOKEN_2022_PROGRAM_ID.toBase58()) throw new Error(`Mint owner mismatch: ${owner}`);
  const data = Uint8Array.from(Buffer.from(result.value.data[0], 'base64'));
  const base = parseMintBase(data);
  if (!base.initialized) throw new Error('sKAM mint is not initialized.');
  if (base.decimals !== SKAM_DECIMALS) throw new Error(`Decimals mismatch: ${base.decimals}`);
  if (base.supply !== SKAM_RAW_SUPPLY) throw new Error(`Raw supply mismatch: ${base.supply.toString()}`);

  const pointerRaw = findTlvExtension(data, METADATA_POINTER_EXTENSION_TYPE);
  const metadataRaw = findTlvExtension(data, TOKEN_METADATA_EXTENSION_TYPE);
  if (!pointerRaw) throw new Error('MetadataPointer extension missing.');
  if (!metadataRaw) throw new Error('TokenMetadata extension missing.');
  const pointer = parseMetadataPointer(pointerRaw);
  const metadata = parseTokenMetadata(metadataRaw);

  if (pointer.metadataAddress !== MINT) throw new Error(`MetadataPointer address mismatch: ${pointer.metadataAddress}`);
  if (metadata.mint !== MINT) throw new Error(`TokenMetadata mint mismatch: ${metadata.mint}`);
  if (metadata.name !== SKAM_NAME) throw new Error(`TokenMetadata name mismatch: ${metadata.name}`);
  if (metadata.symbol !== SKAM_SYMBOL) throw new Error(`TokenMetadata symbol mismatch: ${metadata.symbol}`);
  if (metadata.uri !== SKAM_METADATA_URI) throw new Error(`TokenMetadata URI mismatch: ${metadata.uri}`);

  return {
    provider,
    mint: MINT,
    program: owner,
    initialized: base.initialized,
    decimals: base.decimals,
    rawSupply: base.supply.toString(),
    supplyUi: Number(base.supply / (10n ** BigInt(base.decimals))),
    mintAuthority: base.mintAuthority,
    freezeAuthority: base.freezeAuthority,
    mintable: base.mintAuthority !== null,
    freezable: base.freezeAuthority !== null,
    metadataPointerAuthority: pointer.authority,
    metadataAddress: pointer.metadataAddress,
    metadataUpdateAuthority: metadata.updateAuthority,
    metadata: {
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      additionalMetadataCount: metadata.additionalMetadataCount,
    },
  };
}

async function auditOperator() {
  const [{ result: balanceResult, provider }, { result: tokenAccounts }] = await Promise.all([
    rpc('getBalance', [OPERATOR, { commitment: 'confirmed' }]),
    rpc('getTokenAccountsByOwner', [OPERATOR, { mint: MINT }, { encoding: 'jsonParsed', commitment: 'confirmed' }]),
  ]);
  const tokenBalance = tokenAccounts?.value?.reduce((sum, entry) => {
    const amount = entry?.account?.data?.parsed?.info?.tokenAmount?.uiAmountString;
    return sum + Number(amount || 0);
  }, 0) ?? 0;
  return {
    provider,
    operator: OPERATOR,
    solBalance: Number(balanceResult?.value || 0) / 1e9,
    skamBalanceUi: tokenBalance,
  };
}

async function auditPublicMetadata() {
  const metadataResponse = await fetchWithTimeout(SKAM_METADATA_URI, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!metadataResponse.ok) throw new Error(`Public metadata HTTP ${metadataResponse.status}`);
  const metadata = await metadataResponse.json();
  if (metadata.name !== SKAM_NAME || metadata.symbol !== SKAM_SYMBOL) throw new Error('Public metadata identity mismatch.');
  if (typeof metadata.image !== 'string' || !metadata.image.startsWith('https://')) throw new Error('Public metadata image is missing or not HTTPS.');
  const logoResponse = await fetchWithTimeout(metadata.image, { method: 'HEAD', cache: 'no-store' });
  if (!logoResponse.ok) throw new Error(`Public logo HTTP ${logoResponse.status}`);
  return { name: metadata.name, symbol: metadata.symbol, image: metadata.image, metadataHttp: metadataResponse.status, logoHttp: logoResponse.status };
}

async function auditDexScreener() {
  const url = `https://api.dexscreener.com/token-pairs/v1/solana/${MINT}`;
  const response = await fetchWithTimeout(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`DEX Screener HTTP ${response.status}`);
  const pairs = await response.json();
  if (!Array.isArray(pairs)) throw new Error('Unexpected DEX Screener response.');
  const pair = pairs.find((item) => item?.pairAddress === POOL_ID);
  if (!pair) throw new Error(`Expected Raydium pool ${POOL_ID} is not indexed by DEX Screener.`);
  if (String(pair.dexId || '').toLowerCase() !== 'raydium') throw new Error(`DEX mismatch: ${pair.dexId}`);
  const mints = new Set([pair.baseToken?.address, pair.quoteToken?.address]);
  if (!mints.has(MINT) || !mints.has(WSOL)) throw new Error('DEX Screener pair does not contain sKAM + canonical WSOL.');
  const txns = pair.txns || {};
  const observedTxns = Object.values(txns).reduce((max, bucket) => {
    const total = Number(bucket?.buys || 0) + Number(bucket?.sells || 0);
    return Math.max(max, total);
  }, 0);
  return {
    indexed: true,
    pairAddress: pair.pairAddress,
    dexId: pair.dexId,
    url: pair.url,
    baseToken: pair.baseToken,
    quoteToken: pair.quoteToken,
    priceUsd: pair.priceUsd == null ? null : Number(pair.priceUsd),
    priceNative: pair.priceNative == null ? null : Number(pair.priceNative),
    liquidityUsd: pair.liquidity?.usd == null ? null : Number(pair.liquidity.usd),
    fdv: pair.fdv == null ? null : Number(pair.fdv),
    marketCap: pair.marketCap == null ? null : Number(pair.marketCap),
    pairCreatedAt: pair.pairCreatedAt ?? null,
    observedTxns,
    txns,
    volume: pair.volume || {},
    priceChange: pair.priceChange || {},
  };
}

const startedAt = new Date().toISOString();
const [mint, operator, publicMetadata, dex] = await Promise.all([
  auditMint(),
  auditOperator(),
  auditPublicMetadata(),
  auditDexScreener(),
]);

const findings = [];
if (mint.mintAuthority) findings.push({ severity: 'HIGH', code: 'MINT_AUTHORITY_ACTIVE', detail: `Additional sKAM can still be minted by ${mint.mintAuthority}.` });
if (mint.freezeAuthority) findings.push({ severity: 'HIGH', code: 'FREEZE_AUTHORITY_ACTIVE', detail: `Token accounts can still be frozen by ${mint.freezeAuthority}.` });
if (mint.metadataUpdateAuthority) findings.push({ severity: 'INFO', code: 'METADATA_UPDATE_AUTHORITY_ACTIVE', detail: `On-chain metadata remains mutable by ${mint.metadataUpdateAuthority}.` });
if (mint.metadataPointerAuthority) findings.push({ severity: 'INFO', code: 'METADATA_POINTER_AUTHORITY_ACTIVE', detail: `Metadata pointer remains mutable by ${mint.metadataPointerAuthority}.` });
if (dex.liquidityUsd == null || dex.liquidityUsd < 1_000) findings.push({ severity: 'HIGH', code: 'THIN_LIQUIDITY', detail: `DEX Screener liquidity is ${dex.liquidityUsd == null ? 'unknown' : `$${dex.liquidityUsd}`}; price and slippage are highly sensitive at this depth.` });
if (dex.observedTxns < 1) findings.push({ severity: 'MEDIUM', code: 'NO_OBSERVED_DEX_TXNS', detail: 'DEX Screener has not observed a transaction for the expected pool.' });
if (operator.solBalance < 0.02) findings.push({ severity: 'MEDIUM', code: 'LOW_OPERATOR_SOL', detail: `Operator SOL balance is ${operator.solBalance}; keep enough SOL for legitimate operational transactions.` });

const integrityPass = mint.mint === MINT
  && mint.decimals === SKAM_DECIMALS
  && mint.rawSupply === SKAM_RAW_SUPPLY.toString()
  && mint.metadata.name === SKAM_NAME
  && mint.metadata.symbol === SKAM_SYMBOL
  && mint.metadata.uri === SKAM_METADATA_URI
  && dex.indexed
  && dex.pairAddress === POOL_ID;

const report = {
  audit: 'KriptoAman sKAM live final read-only audit',
  network: 'solana-mainnet-beta',
  startedAt,
  completedAt: new Date().toISOString(),
  integrityPass,
  launchStatus: integrityPass && dex.observedTxns > 0 ? 'LIVE_VERIFIED' : 'REVIEW_REQUIRED',
  securityHardeningStatus: findings.some((f) => f.severity === 'HIGH') ? 'ACTION_REQUIRED' : 'PASS',
  constants: { mint: MINT, poolId: POOL_ID, operator: OPERATOR, canonicalWsol: WSOL },
  mint,
  operator,
  publicMetadata,
  dexScreener: dex,
  findings,
};

fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/skam-final-live-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (!integrityPass) process.exit(2);
