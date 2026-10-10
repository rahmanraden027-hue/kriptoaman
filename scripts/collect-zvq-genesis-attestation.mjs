#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const args = process.argv.slice(2);
const genesisArg = args.find(arg => !arg.startsWith('--'));
const outputArg = args.find(arg => arg.startsWith('--output='));
const rpcArg = args.find(arg => arg.startsWith('--rpc='));

if (!genesisArg) {
  console.error('Usage: node scripts/collect-zvq-genesis-attestation.mjs /path/to/genesis.json [--rpc=https://rpc.kriptoaman.com] [--output=zvq-genesis-attestation.json]');
  process.exit(2);
}

const genesisPath = resolve(genesisArg);
const rpcUrl = rpcArg ? rpcArg.slice('--rpc='.length) : 'https://rpc.kriptoaman.com';
const outputPath = resolve(outputArg ? outputArg.slice('--output='.length) : 'zvq-genesis-attestation.json');

const raw = await readFile(genesisPath);
const sha256 = createHash('sha256').update(raw).digest('hex');

let genesis;
try {
  genesis = JSON.parse(raw.toString('utf8'));
} catch {
  throw new Error('Genesis file is not valid JSON');
}

const chainId = Number(genesis?.config?.chainId);
if (!Number.isSafeInteger(chainId) || chainId <= 0) {
  throw new Error('Genesis config.chainId is missing or invalid');
}

const alloc = genesis?.alloc && typeof genesis.alloc === 'object' ? genesis.alloc : {};
const allocEntries = Object.entries(alloc);

function parseBalance(value) {
  if (value == null) return 0n;
  if (typeof value === 'object' && value.balance != null) return parseBalance(value.balance);
  const text = String(value).trim();
  if (!text) return 0n;
  if (/^0x[0-9a-f]+$/i.test(text)) return BigInt(text);
  if (/^[0-9]+$/.test(text)) return BigInt(text);
  throw new Error('Unsupported alloc balance format');
}

let aggregateAllocWei = 0n;
for (const [, entry] of allocEntries) {
  aggregateAllocWei += parseBalance(entry);
}

const decimals = 18n;
const base = 10n ** decimals;
const whole = aggregateAllocWei / base;
const fraction = aggregateAllocWei % base;
const aggregateAllocZVQ = fraction === 0n
  ? whole.toString()
  : whole.toString() + '.' + fraction.toString().padStart(Number(decimals), '0').replace(/0+$/, '');

async function rpc(method, params = []) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'user-agent': 'ZEVARYQ-Genesis-Attestation/1.0'
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.error || payload?.result == null) {
      throw new Error('RPC ' + method + ' failed: ' + JSON.stringify(payload));
    }
    return payload.result;
  } finally {
    clearTimeout(timeout);
  }
}

let rpcEvidence = {
  endpoint: rpcUrl,
  chainIdHex: null,
  chainIdDecimal: null,
  genesisBlockHash: null,
  latestBlockHex: null,
  latestBlockDecimal: null,
  verified: false,
  error: null
};

try {
  const [chainIdHex, genesisBlock, latestBlockHex] = await Promise.all([
    rpc('eth_chainId'),
    rpc('eth_getBlockByNumber', ['0x0', false]),
    rpc('eth_blockNumber')
  ]);
  const chainIdDecimal = Number.parseInt(chainIdHex, 16);
  const latestBlockDecimal = Number.parseInt(latestBlockHex, 16);
  rpcEvidence = {
    endpoint: rpcUrl,
    chainIdHex: String(chainIdHex).toLowerCase(),
    chainIdDecimal,
    genesisBlockHash: genesisBlock?.hash || null,
    latestBlockHex,
    latestBlockDecimal,
    verified: chainIdDecimal === chainId && Boolean(genesisBlock?.hash),
    error: null
  };
} catch (error) {
  rpcEvidence.error = error instanceof Error ? error.message : String(error);
}

const consensusConfigKeys = Object.keys(genesis?.config || {})
  .filter(key => /qbft|ibft|clique|consensus/i.test(key))
  .sort();

const result = {
  schemaVersion: 1,
  documentType: 'ZVQ_GENESIS_SUPPLY_ATTESTATION_EVIDENCE',
  collectedAt: new Date().toISOString(),
  source: {
    fileName: basename(genesisPath),
    fileContentPublished: false,
    allocationAddressesPublished: false
  },
  genesis: {
    sha256,
    chainId,
    chainIdHex: '0x' + chainId.toString(16),
    allocAccountCount: allocEntries.length,
    aggregateAllocWei: aggregateAllocWei.toString(),
    aggregateAllocZVQ,
    decimals: 18,
    consensusConfigKeys,
    extraDataPresent: typeof genesis?.extraData === 'string' && genesis.extraData.length > 2
  },
  rpcEvidence,
  assertions: {
    chainIdMatchesRunningNetwork: rpcEvidence.verified && rpcEvidence.chainIdDecimal === chainId,
    aggregateAllocCalculatedFromLocalGenesis: true,
    currentTotalSupplyVerified: false,
    currentCirculatingSupplyVerified: false,
    maximumSupplyTechnicallyEnforcedVerified: false
  },
  safety: {
    privateKeysCollected: false,
    mnemonicsCollected: false,
    keystoresCollected: false,
    allocationAddressesEmitted: false,
    chainMutationPerformed: false
  }
};

await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n', { mode: 0o600 });

console.log('ZVQ_GENESIS_ATTESTATION=COLLECTED');
console.log('Output:', outputPath);
console.log('Genesis SHA-256:', sha256);
console.log('Chain ID:', chainId, result.genesis.chainIdHex);
console.log('Alloc accounts:', allocEntries.length);
console.log('Aggregate alloc ZVQ:', aggregateAllocZVQ);
console.log('RPC identity match:', result.assertions.chainIdMatchesRunningNetwork ? 'YES' : 'NO/UNAVAILABLE');
console.log('Genesis block hash:', rpcEvidence.genesisBlockHash || 'UNAVAILABLE');
console.log('No private keys, mnemonics, keystores, or allocation addresses were emitted.');
