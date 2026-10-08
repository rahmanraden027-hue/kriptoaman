// Bounded, public, read-only evidence. This never grants production approval.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { AbiCoder } from 'ethers';
import { ZEVARYQ_FIRST_PARTY_ASSETS } from '../src/data/zevaryqAssetRegistry.js';
const dir = resolve(process.env.ZVQ_EVIDENCE_DIR || 'phase17-evidence');
await mkdir(dir, { recursive: true });
const report = { checkedAt: new Date().toISOString(), revision: process.env.GITHUB_SHA || null,
  readOnly: true, readyForProduction: false, executionEnabled: false, checks: {} };
const checks = report.checks;
const address = /^0x[0-9a-fA-F]{40}$/;
const hex = /^0x(?:[0-9a-fA-F]{2})+$/;
const coder = AbiCoder.defaultAbiCoder();
const rpcUrl = 'https://rpc.kriptoaman.com/';
const explorer = 'https://explorer.kriptoaman.com';
let id = 0;
async function get(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(12000), cache: 'no-store', headers: { Accept: 'application/json' } });
  const body = await r.json().catch(() => null);
  return { http: r.status, body };
}
async function rpc(method, params = []) {
  if (!['eth_chainId', 'eth_blockNumber', 'eth_getBlockByNumber', 'eth_getCode', 'eth_call'].includes(method)) throw Error('METHOD_BLOCKED');
  const r = await fetch(rpcUrl, { method: 'POST', signal: AbortSignal.timeout(12000),
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }) });
  const d = await r.json();
  if (!r.ok || d.error || d.result === undefined) throw Error(`RPC_UNAVAILABLE_${method}`);
  return d.result;
}
async function check(name, task) {
  try { checks[name] = await task(); }
  catch (e) { checks[name] = { status: 'PARTIAL', reason: String(e.message).slice(0, 140), evidenceUnavailable: true }; }
}
const hash = b => createHash('sha256').update(b).digest('hex');
const validCode = c => typeof c === 'string' && hex.test(c);
const knownAddress = t => t?.address?.hash || t?.address_hash || t?.address;
let head = null;
await check('chain', async () => {
  const chain = await rpc('eth_chainId');
  if (chain !== '0x560c') return { status: 'FAIL', observedChainId: chain };
  head = await rpc('eth_blockNumber');
  const first = Number(BigInt(head));
  await new Promise(r => setTimeout(r, 12000));
  const second = Number(BigInt(await rpc('eth_blockNumber')));
  return { status: second > first ? 'PASS' : 'FAIL', chainId: 22028, first, second, sampleIntervalSeconds: 12 };
});
await check('tokens', async () => {
  if (!head || checks.chain.status !== 'PASS') throw Error('VERIFIED_CHAIN_REQUIRED');
  const tokens = []; let next = null; let pages = 0;
  do {
    const qs = new URLSearchParams({ type: 'ERC-20', ...(next || {}) });
    const d = await get(explorer + '/api/v2/tokens?' + qs);
    if (d.http !== 200 || !Array.isArray(d.body?.items)) throw Error('TOKEN_DIRECTORY_UNAVAILABLE');
    tokens.push(...d.body.items); next = d.body.next_page_params; pages++;
  } while (next && pages < 4);
  const unique = [...new Map(tokens.filter(t => address.test(knownAddress(t) || '')).map(t => [knownAddress(t).toLowerCase(), t])).values()];
  const details = [];
  for (const token of unique.slice(0, 20)) {
    const a = knownAddress(token); const entry = { address: a, status: 'PARTIAL' };
    try {
      const code = await rpc('eth_getCode', [a, head]);
      if (!validCode(code)) { entry.status = 'FAIL'; entry.reason = 'INDEXED_TOKEN_HAS_NO_CODE_AT_SNAPSHOT'; }
      else {
        entry.codeSha256 = hash(Buffer.from(code.slice(2), 'hex'));
        entry.onChain = {};
        for (const [key, selector, type] of [['name', '0x06fdde03', 'string'], ['symbol', '0x95d89b41', 'string'], ['decimals', '0x313ce567', 'uint8']]) {
          try { entry.onChain[key] = String(coder.decode([type], await rpc('eth_call', [{ to: a, data: selector }, head]))[0]); }
          catch { entry.onChain[key] = null; }
        }
        entry.indexed = { name: token.name, symbol: token.symbol, decimals: token.decimals };
        entry.metadataMatches = Object.keys(entry.onChain).every(k => entry.onChain[k] !== null && entry.onChain[k] === String(entry.indexed[k]));
        entry.status = entry.metadataMatches ? 'PASS' : Object.values(entry.onChain).includes(null) ? 'PARTIAL' : 'FAIL';
        entry.logo = { url: token.icon_url || null, verified: false, reason: 'NO_APPROVED_ADDRESS_TO_LOGO_MANIFEST' };
      }
    } catch { entry.reason = 'READ_ONLY_TOKEN_PROBE_UNAVAILABLE'; }
    details.push(entry);
  }
  return { status: details.some(t => t.status === 'FAIL') ? 'FAIL' : 'PARTIAL', snapshot: head,
    pages, paginationExhausted: !next, indexedCount: unique.length, inspectedCount: details.length,
    fullHistoricalIndexVerified: false, details,
    reason: unique.length ? 'HISTORICAL_RECEIPTS_AND_APPROVED_LOGO_BINDINGS_REQUIRED' : 'EMPTY_INDEX_IS_NOT_PROOF_OF_NO_DEPLOYED_TOKENS' };
});
await check('registryLogos', async () => {
  const assets = [];
  for (const a of ZEVARYQ_FIRST_PARTY_ASSETS) {
    const local = await readFile(new URL('../public' + a.icon, import.meta.url));
    const r = await fetch('https://kriptoaman.com' + a.icon, { signal: AbortSignal.timeout(12000), cache: 'no-store' });
    const actual = hash(Buffer.from(await r.arrayBuffer()));
    assets.push({ symbol: a.symbol, registryStatus: a.status, contractAddress: a.contractAddress,
      assetType: a.assetType, http: r.status, expectedSha256: hash(local), observedSha256: actual,
      status: r.ok && actual === hash(local) ? 'PASS' : 'FAIL' });
  }
  return { status: assets.every(a => a.status === 'PASS') ? 'PASS' : 'FAIL', assets,
    note: 'Native ZVQ has no ERC-20 contract; planned zBTC/zETH are not on-chain deployment evidence.' };
});
await check('liquidity', async () => {
  const d = await get('https://kriptoaman.com/api/zvq-liquidity-evidence');
  const b = d.body;
  if (d.http !== 200) return { status: 'PARTIAL', http: d.http, reasonCode: b?.code || 'UNCLASSIFIED_HTTP_ERROR',
    registryVerified: false, pairVerified: false, reservesVerified: false, executionEnabled: false };
  if (b?.executionEnabled !== false || b?.chainId !== 22028) return { status: 'FAIL', reason: 'ENDPOINT_SAFETY_OR_CHAIN_MISMATCH' };
  if (!b.pair) return { status: 'PARTIAL', http: d.http, poolEvidence: b.poolEvidence, reservesVerified: false, executionEnabled: false };
  if (!head || checks.chain.status !== 'PASS') throw Error('VERIFIED_CHAIN_REQUIRED');
  const names = ['router', 'factory', 'wrappedNative', 'token', 'pair'];
  for (const key of names) if (!address.test(b[key] || '') || !validCode(await rpc('eth_getCode', [b[key], head])))
    return { status: 'FAIL', reason: 'REGISTRY_ADDRESS_OR_CODE_INVALID', field: key };
  const call = async (to, data, type) => coder.decode([type], await rpc('eth_call', [{ to, data }, head]))[0];
  const factory = await call(b.router, '0xc45a0155', 'address');
  const wrapped = await call(b.router, '0xad5c4648', 'address');
  const pair = await call(factory, '0xe6a43905' + coder.encode(['address', 'address'], [wrapped, b.token]).slice(2), 'address');
  const t0 = await call(pair, '0x0dfe1681', 'address');
  const t1 = await call(pair, '0xd21220a7', 'address');
  const reserves = coder.decode(['uint112', 'uint112', 'uint32'], await rpc('eth_call', [{ to: pair, data: '0x0902f1ac' }, head]));
  const same = (x, y) => x.toLowerCase() === y.toLowerCase();
  const identitiesMatch = same(factory, b.factory) && same(wrapped, b.wrappedNative) && same(pair, b.pair)
    && ((same(t0, wrapped) && same(t1, b.token)) || (same(t1, wrapped) && same(t0, b.token)));
  return { status: identitiesMatch ? 'PARTIAL' : 'FAIL', http: d.http, snapshot: head, identitiesMatch,
    registry: Object.fromEntries(names.map(k => [k, b[k]])), reserve0: String(reserves[0]), reserve1: String(reserves[1]),
    positiveReserves: reserves[0] > 0n && reserves[1] > 0n, executionEnabled: false,
    reason: 'RESERVES_DO_NOT_PROVE_CUSTODY_BACKING_LOCK_OR_COMMERCIAL_APPROVAL' };
});
checks.privateValidators = { status: 'PARTIAL', reason: 'PROTECTED_SELF_HOSTED_RUNNER_REQUIRED',
  validatorCountVerified: false, peerHealthVerified: false, privateFinalityVerified: false };
await writeFile(join(dir, 'phase17.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (Object.values(checks).some(c => c.status === 'FAIL')) process.exitCode = 1;
