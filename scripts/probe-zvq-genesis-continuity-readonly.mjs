#!/usr/bin/env node
/**
 * Phase P0-P1: bounded, public, read-only KAM -> ZEVARYQ continuity probe.
 * No signing, transaction submission, genesis mutation or wallet ownership claims.
 * Same Chain ID alone does NOT prove common chain history.
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const RPCS = Object.freeze([
  'https://rpc.kriptoaman.com/',
  'https://explorer.kriptoaman.com/rpc',
]);
export const LEGACY = Object.freeze({
  chainId: '0x560c',
  wkam: '0x0d8848ce88bb09a81a4248efdd574d50b98b544a',
  recordedDeploymentBlock: '0x3a998', // 240024 decimal
  recordedTx: '0x571063f1f9d031ac9ae6f22b861ff6766c5c6ee78b2d49d0b93e151acde0e7cf',
});
export const ALLOWED_METHODS = Object.freeze(new Set([
  'eth_chainId', 'eth_blockNumber', 'eth_getBlockByNumber',
  'eth_getTransactionReceipt', 'eth_getCode',
  'eth_getBalance', 'eth_getTransactionCount',
]));

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const HASH = /^0x[0-9a-fA-F]{64}$/;
const HEX = /^0x[0-9a-fA-F]+$/;
const MAX_CALLS = 20;

export function parsePublicAddress(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !ADDRESS.test(value))
    throw new Error('Invalid public genesis address. Do not provide a seed or private key.');
  return value.toLowerCase();
}
export function parseQuantity(value) {
  if (typeof value !== 'string' || !HEX.test(value)) throw new Error('Invalid hex quantity');
  return BigInt(value);
}
function verifiedHash(value) {
  if (typeof value !== 'string' || !HASH.test(value)) throw new Error('Invalid block hash');
  return value.toLowerCase();
}

export function makeRpc(fetchFn = fetch) {
  let count = 0;
  return async (endpoint, method, params = []) => {
    if (!RPCS.includes(endpoint)) throw new Error('RPC origin is not allowlisted');
    if (!ALLOWED_METHODS.has(method)) throw new Error('Non-read-only RPC method refused');
    if (++count > MAX_CALLS) throw new Error('Request budget exceeded');
    const response = await fetchFn(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: count, method, params }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(method + ': HTTP ' + response.status);
    const body = await response.json();
    if (body?.jsonrpc !== '2.0' || body?.error || !Object.hasOwn(body || {}, 'result'))
      throw new Error(method + ': invalid JSON-RPC response');
    return body.result;
  };
}

function sameOrThrow(items, mapper, label) {
  const a = mapper(items[0]);
  const b = mapper(items[1]);
  if (a !== b) throw new Error(label + ': endpoints disagree; fail closed');
  return a;
}

export async function verify({
  rpc = makeRpc(), genesisPublicAddress = null,
} = {}) {
  const wallet = parsePublicAddress(genesisPublicAddress);
  const results = [];
  for (const endpoint of RPCS) {
    const chainId = await rpc(endpoint, 'eth_chainId');
    if (typeof chainId !== 'string' || chainId.toLowerCase() !== LEGACY.chainId)
      throw new Error('Chain ID mismatch; refuse historical proof');

    const head = parseQuantity(await rpc(endpoint, 'eth_blockNumber'));
    if (head < 240024n) throw new Error('Chain head predates legacy deployment block');
    const genesis = await rpc(endpoint, 'eth_getBlockByNumber', ['0x0', false]);
    const historic = await rpc(endpoint, 'eth_getBlockByNumber', [LEGACY.recordedDeploymentBlock, false]);
    const receipt = await rpc(endpoint, 'eth_getTransactionReceipt', [LEGACY.recordedTx]);
    const code = await rpc(endpoint, 'eth_getCode', [LEGACY.wkam, '0x' + head.toString(16)]);
    if (!genesis || !historic) throw new Error('Historical block unavailable');
    const genesisHash = verifiedHash(genesis.hash);
    const historicalHash = verifiedHash(historic.hash);
    if (parseQuantity(historic.number) !== 240024n) throw new Error('Unexpected historical block number');
    if (receipt != null) {
      if (typeof receipt !== 'object' || receipt.transactionHash?.toLowerCase() !== LEGACY.recordedTx
          || verifiedHash(receipt.blockHash) !== historicalHash
          || parseQuantity(receipt.blockNumber) !== 240024n)
        throw new Error('Historical WKAM receipt does not match recorded block');
    }
    if (typeof code !== 'string' || !/^0x[0-9a-fA-F]*$/.test(code))
      throw new Error('Invalid WKAM bytecode response');
    const walletBalanceWei = wallet ? parseQuantity(await rpc(endpoint, 'eth_getBalance', [wallet, '0x' + head.toString(16)])).toString() : null;
    const walletNonce = wallet ? parseQuantity(await rpc(endpoint, 'eth_getTransactionCount', [wallet, '0x' + head.toString(16)])).toString() : null;
    results.push({
      endpoint, head: head.toString(), genesisHash, historicalHash,
      recordedWkamReceiptPresent: receipt !== null,
      wkamCodePresentAtHead: code !== '0x',
      walletBalanceWei, walletNonce,
    });
  }
  const genesisHash = sameOrThrow(results, r => r.genesisHash, 'Genesis hash');
  const historicalHash = sameOrThrow(results, r => r.historicalHash, 'Legacy block hash');
  const receiptPresent = sameOrThrow(results, r => r.recordedWkamReceiptPresent, 'Legacy receipt');
  // Public gateway and explorer proxy may share a single backend; not independent archival proof.
  // Heads may differ: balance comparisons require a genuinely common block, so do not report
  // matching current genesis wallet balances on different heights.
  return {
    observed: 'PUBLIC_READ_ONLY', chainId: 22028, network: 'ZEVARYQ',
    genesisHash, legacyBlockNumber: 240024, legacyBlockHash: historicalHash,
    legacyRecordedWkamTransaction: LEGACY.recordedTx,
    legacyWkamReceiptStatus: receiptPresent ? 'PRESENT_AT_RECORDED_BLOCK' : 'MISSING',
    wkamCodeAtHeads: results.map(r => ({ head: r.head, codePresent: r.wkamCodePresentAtHead })),
    genesisWalletPublicAddress: wallet,
    genesisWalletEvidence: wallet ? 'PER_ENDPOINT_ONLY_DIFFERENT_HEADS_POSSIBLE' : 'AWAITING_CONFIRMED_PUBLIC_ADDRESS',
    endpointReadings: results,
    archivedOriginalGenesisComparison: 'PENDING_TRUSTED_OLD_CHAIN_ARCHIVE',
    authoritativeContinuity: 'NOT_YET_PROVEN',
    walletOwnershipVerified: false,
    transactionBroadcasts: 0,
  };
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    console.log(JSON.stringify(await verify({ genesisPublicAddress: process.env.ZVQ_GENESIS_PUBLIC_ADDRESS || null }), null, 2));
  } catch (error) {
    console.error('P0-P1 read-only proof unavailable: ' + String(error.message));
    process.exitCode = 1;
  }
}
