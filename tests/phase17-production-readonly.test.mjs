import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
const script = await readFile(new URL('../scripts/phase17-production-readonly.mjs', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/phase17-production-readonly.yml', import.meta.url), 'utf8');
test('Phase 17 collection is bounded and only allows read methods', () => {
  assert.ok(script.includes("['eth_chainId', 'eth_blockNumber', 'eth_getBlockByNumber', 'eth_getCode', 'eth_call']"));
  assert.ok(script.includes("throw Error('METHOD_BLOCKED')"));
  assert.ok(script.includes('pages < 4'));
  assert.ok(script.includes('unique.slice(0, 20)'));
  assert.doesNotMatch(script, /eth_send|eth_sign|personal_|wallet_|deployContract|swapExact|private.?key/i);
  assert.ok(script.includes('readyForProduction: false'));
});
test('Token and liquidity evidence use the verified fixed block with no speculative registry', () => {
  assert.ok(script.includes("throw Error('VERIFIED_CHAIN_REQUIRED')"));
  assert.ok(script.includes("rpc('eth_getCode', [a, head])"));
  assert.ok(script.includes("rpc('eth_call', [{ to, data }, head])"));
  assert.ok(script.includes('NO_APPROVED_ADDRESS_TO_LOGO_MANIFEST'));
  assert.ok(script.includes('fullHistoricalIndexVerified: false'));
  assert.ok(script.includes('PROTECTED_SELF_HOSTED_RUNNER_REQUIRED'));
});
test('PR public collection has no private runner/secrets and retains failure evidence', () => {
  assert.ok(workflow.includes('runs-on: ubuntu-latest'));
  assert.ok(workflow.includes('contents: read'));
  assert.ok(workflow.includes('if: always()'));
  assert.ok(workflow.includes('actions/upload-artifact'));
  assert.ok(workflow.includes('createHash'));
  assert.doesNotMatch(workflow, /secrets\.|self-hosted|docker|ssh |workflow_dispatch.*confirm/s);
});

test('real collector distinguishes an empty index and missing registry without claiming release', async () => {
  const { mkdtemp, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const dir = await mkdtemp(join(tmpdir(), 'phase17-fixture-'));
  const publicRoot = new URL('../public/', import.meta.url).href;
  const preload = `
    import { readFile } from 'node:fs/promises';
    let height = 100;
    const timer = globalThis.setTimeout;
    globalThis.setTimeout = (fn, ms, ...args) => timer(fn, ms === 12000 ? 1 : ms, ...args);
    globalThis.fetch = async (url, options = {}) => {
      if (options.method === 'POST') {
        const q = JSON.parse(options.body);
        const result = q.method === 'eth_chainId' ? '0x560c' : q.method === 'eth_blockNumber' ? '0x' + (height++).toString(16) : undefined;
        if(result === undefined) throw Error('unexpected RPC method');
        return Response.json({ jsonrpc: '2.0', id: q.id, result });
      }
      if(String(url).includes('/api/v2/tokens?')) return Response.json({items: [], next_page_params: null});
      if(String(url).endsWith('/api/zvq-liquidity-evidence')) return Response.json({ code: 'REGISTRY_NOT_CONFIGURED', executionEnabled: false }, {status: 503});
      const path = new URL(url).pathname.replace(/^\\//, '');
      if(!path.startsWith('assets/zevaryq/tokens/')) throw Error('unexpected GET');
      return new Response(await readFile(new URL(path, ${JSON.stringify(publicRoot)})));
    };
  `;
  try {
    await promisify(execFile)(process.execPath, ['--import', 'data:text/javascript,' + encodeURIComponent(preload),
      new URL('../scripts/phase17-production-readonly.mjs', import.meta.url).pathname],
    { env: { ...process.env, ZVQ_EVIDENCE_DIR: dir }, timeout: 20000 });
    const report = JSON.parse(await readFile(join(dir, 'phase17.json'), 'utf8'));
    assert.equal(report.checks.chain.status, 'PASS');
    assert.equal(report.checks.chain.second, 101);
    assert.equal(report.checks.tokens.status, 'PARTIAL');
    assert.equal(report.checks.tokens.indexedCount, 0);
    assert.equal(report.checks.tokens.fullHistoricalIndexVerified, false);
    assert.equal(report.checks.registryLogos.status, 'PASS');
    assert.equal(report.checks.liquidity.reasonCode, 'REGISTRY_NOT_CONFIGURED');
    assert.equal(report.checks.liquidity.status, 'PARTIAL');
    assert.equal(report.checks.privateValidators.status, 'PARTIAL');
    assert.equal(report.readyForProduction, false);
    assert.equal(report.executionEnabled, false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
