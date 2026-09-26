#!/usr/bin/env node
// Independent PUBLIC read-only evidence. Does not assert wallet ownership,
// network finality, custody, liquidity, collateral, or exchange listing.
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const RPCS = Object.freeze([
  'https://rpc.kriptoaman.com/',
  'https://explorer.kriptoaman.com/rpc',
]);
export const ACCOUNTS = Object.freeze([
  { label: 'repository-labelled treasury candidate (ownership unverified)',
    address: '0xab481451eaf642384d2d9888b355f10d327c5de9' },
  { label: 'reconstructed genesis candidate (ownership unverified)',
    address: '0xd74ea7d92bbb40d475bcea170367b85971acb0f' },
]);
const CHAIN_ID = '0x560c';
const MAX_CALLS = 16;

export function hexBigInt(value) {
  if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value))
    throw new Error('Malformed hexadecimal RPC result');
  return BigInt(value);
}
export function format18(wei) {
  if (wei < 0n) throw new Error('Negative balance');
  const unit = 10n ** 18n;
  return (wei / unit).toString() + '.' + (wei % unit).toString().padStart(18, '0');
}
export function compareBlock(a, b, selected) {
  const matches = [a, b].every(x => x && typeof x === 'object'
    && typeof x.hash === 'string' && /^0x[0-9a-f]{64}$/i.test(x.hash)
    && typeof x.parentHash === 'string' && /^0x[0-9a-f]{64}$/i.test(x.parentHash)
    && hexBigInt(x.number) === selected);
  if (!matches || a.hash.toLowerCase() !== b.hash.toLowerCase()
      || a.parentHash.toLowerCase() !== b.parentHash.toLowerCase())
    throw new Error('Same-height block hash or parent mismatch; do not report balances');
  return a.hash.toLowerCase();
}
export function createRpc(fetchFn = fetch) {
  let calls = 0;
  return async function rpc(url, method, params = []) {
    if (!RPCS.includes(url)) throw new Error('Unapproved RPC endpoint');
    if (!['eth_chainId', 'eth_blockNumber', 'eth_getBlockByNumber', 'eth_getBalance'].includes(method))
      throw new Error('Non-read method refused');
    if (++calls > MAX_CALLS) throw new Error('Read-only request budget exceeded');
    const response = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: calls, method, params }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error(method + ' HTTP ' + response.status);
    const value = await response.json();
    if (value?.jsonrpc !== '2.0' || value?.error || value?.result === undefined
        || value?.result === null)
      throw new Error(method + ' returned invalid or rejected response');
    return value.result;
  };
}
export async function verify({ rpc = createRpc(), sleep = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
  for (const endpoint of RPCS) {
    if ((await rpc(endpoint, 'eth_chainId')).toLowerCase() !== CHAIN_ID)
      throw new Error('Wrong Chain ID; reject balances');
  }
  const first = await Promise.all(RPCS.map(endpoint => rpc(endpoint, 'eth_blockNumber')));
  await sleep(16000);
  const second = await Promise.all(RPCS.map(endpoint => rpc(endpoint, 'eth_blockNumber')));
  const before = first.map(hexBigInt);
  const after = second.map(hexBigInt);
  if (after.some((n, i) => n <= before[i]))
    throw new Error('One or both independent RPC heads did not advance');
  const height = after.reduce((a, b) => a < b ? a : b) - 2n;
  if (height < 1n) throw new Error('No stable shared block available');
  const tag = '0x' + height.toString(16);
  const blocks = await Promise.all(RPCS.map(endpoint =>
    rpc(endpoint, 'eth_getBlockByNumber', [tag, false])));
  const hash = compareBlock(blocks[0], blocks[1], height);
  const balances = [];
  for (const account of ACCOUNTS) {
    if (!/^0x[0-9a-f]{40}$/i.test(account.address))
      throw new Error('Invalid repository-labelled address');
    const values = await Promise.all(RPCS.map(endpoint =>
      rpc(endpoint, 'eth_getBalance', [account.address, tag])));
    const amounts = values.map(hexBigInt);
    if (amounts[0] !== amounts[1])
      throw new Error('Independent RPC balances disagree for ' + account.address);
    balances.push({
      label: account.label, address: account.address, ownership_verified: false,
      at_block: tag, balance_wei: amounts[0].toString(),
      balance_zvq: format18(amounts[0]), providers_agree: true,
    });
  }
  return {
    observed: 'public-readonly', chain_id: 22028, token_symbol: 'ZVQ',
    common_block_number: tag, common_block_hash: hash, both_rpc_heads_advanced: true,
    balances, ownership_verified: false, transactions_sent: 0,
  };
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    console.log(JSON.stringify(await verify()));
  } catch (error) {
    console.error('ZVQ read-only verification failed: ' + String(error.message));
    process.exitCode = 1;
  }
}
