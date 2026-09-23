import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { canonicalFinality, collectFinalityEvidence } from '../scripts/probe-zvq-private-finality.mjs';

const hash = '0x' + 'a'.repeat(64);
const block = { number: '0x64', hash };

test('canonical finality only accepts the exact independently fetched block', () => {
  assert.equal(canonicalFinality(block, { ...block }, 110)?.number, 100);
  assert.equal(canonicalFinality(block, { ...block, hash: '0x' + 'b'.repeat(64) }, 110), null);
  assert.equal(canonicalFinality(block, { ...block }, 99), null);
  assert.equal(canonicalFinality({ ...block, hash: '' }, block, 110), null);
});

test('verified finality is independently checked and does not infer from membership', async () => {
  const methods = [];
  const out = await collectFinalityEvidence(async (method, params) => {
    methods.push(method);
    if (method === 'eth_chainId') return '0x560c';
    if (method === 'eth_blockNumber') return '0x6e';
    if (method === 'eth_getBlockByNumber') return params[0] === 'finalized' ? block : { ...block };
    throw Error('unexpected RPC');
  }, '2026-09-23T10:00:00Z');
  assert.equal(out.status, 'verified');
  assert.equal(out.finalizedBlock, 100);
  assert.deepEqual(methods, ['eth_chainId', 'eth_blockNumber', 'eth_getBlockByNumber', 'eth_getBlockByNumber']);
  assert.equal(JSON.stringify(out).includes('127.0.0.1'), false);
});

test('unsupported finalized tags remain unavailable without fabricating a height', async () => {
  const out = await collectFinalityEvidence(async method => {
    if (method === 'eth_chainId') return '0x560c';
    if (method === 'eth_blockNumber') return '0x6e';
    throw Error('method unsupported');
  });
  assert.equal(out.status, 'unavailable');
  assert.equal(out.reason, 'finalized-tag-not-exposed');
  assert.equal(out.finalizedBlock, null);
});

test('chain mismatch and conflicting canonical hashes fail closed', async () => {
  const mismatch = await collectFinalityEvidence(async () => '0x1');
  assert.equal(mismatch.status, 'unverified');
  const conflicting = await collectFinalityEvidence(async (method, params) => {
    if (method === 'eth_chainId') return '0x560c';
    if (method === 'eth_blockNumber') return '0x6e';
    return params[0] === 'finalized' ? block : { ...block, hash: '0x' + 'b'.repeat(64) };
  });
  assert.equal(conflicting.status, 'unverified');
  assert.equal(conflicting.finalizedBlock, null);
});

test('private evidence auto refresh cannot execute from unreviewed pull requests', async () => {
  const workflow = await readFile(new URL('../.github/workflows/kam-private-mainnet-evidence.yml', import.meta.url), 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /push:\n    branches: \[main\]/);
  assert.match(workflow, /- '\.github\/workflows\/kam-private-mainnet-evidence\.yml'/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.match(workflow, /runs-on: \[self-hosted, linux, x64, kam-mainnet-evidence\]/);
  assert.match(workflow, /node scripts\/probe-zvq-private-finality\.mjs/);
  assert.match(workflow, /if: always\(\)/);
  assert.doesNotMatch(workflow, /private key|genesis|wipe database/i);
});
