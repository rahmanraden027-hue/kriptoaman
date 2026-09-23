import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../chain/kam-mainnet/zevaryq-public-bridge/worker.mjs', import.meta.url), 'utf8');
const config = await readFile(new URL('../chain/kam-mainnet/zevaryq-public-bridge/wrangler.toml', import.meta.url), 'utf8');
const html = await readFile(new URL('../explorer-dashboard/zevaryq-production.html', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/zevaryq-public-bridge-rollout.yml', import.meta.url), 'utf8');

test('bundled homepage uses canonical production ZVQ evidence, not a fabricated mockup', () => {
 assert.match(html, /data-zevaryq-explorer-version="1\.1\.1"/);
 assert.match(html, /class="logo logo-zvq"/);
 assert.match(html, /class="earth-brandmark"/);
 assert.match(source, /homepage\.includes\("EXPECTED_CHAIN='" \+ EXPECTED_ID \+ "'"/);
 assert.match(source, /const EXPECTED_ID = '0x560c'/);
 assert.match(source, /cache-control': 'no-store, max-age=0'/);
 assert.doesNotMatch(source, /content:"ZV"|1\.0\.0/);
});

test('bridge serves only verified HTML and its two versioned binary assets locally', () => {
 assert.match(source, /url\.pathname === '\/'/);
 assert.match(source, /'\/zevaryq-assets\/zevaryq-emblem\.webp'/);
 assert.match(source, /'\/zevaryq-assets\/zevaryq-favicon\.png'/);
 assert.match(config, /type = "Text"/);
 assert.match(config, /type = "Data"/);
 assert.match(config, /workers_dev = false/);
});

test('RPC and Blockscout routes are not remapped to public hostname', () => {
 assert.match(source, /LEGACY_UPSTREAM = 'explorer-new\.kriptoaman\.com'/);
 assert.match(source, /upstream\.hostname = LEGACY_UPSTREAM/);
 assert.match(source, /init\.body = request\.body/);
 assert.doesNotMatch(source, /upstream\.hostname = PUBLIC_HOST/);
 assert.match(workflow, /kam-mainnet-blockscout-api/);
 assert.match(workflow, /eth_chainId/);
 assert.match(workflow, /0x560c/);
});

test('deployment is preflight-gated and restores the prior Worker route on post-switch failure', () => {
 assert.match(workflow, /EXPECTED_OLD_WORKER: kam-mainnet-explorer-cutover/);
 assert.match(workflow, /Restore prior route on verification failure/);
 assert.match(workflow, /steps\.verify\.outcome == 'failure'/);
 assert.match(workflow, /if: github\.event_name == 'push'/);
 assert.doesNotMatch(workflow, /genesis|wipe database|validator private key/i);
});

test('public bridge rollout waits for propagation, authenticates release and protects rollback ownership', () => {
 assert.match(workflow, /route_propagation_attempt=/);
 assert.match(workflow, /for attempt in \$\(seq 1 12\)/);
 assert.match(workflow, /x-zevaryq-explorer-release/);
 assert.match(workflow, /public_verified=false/);
 assert.match(workflow, /public_verified=true/);
 assert.match(workflow, /public_asset_/);
 assert.match(workflow, /Refusing to overwrite concurrent operator route change/);
 assert.match(workflow, /EXPECTED_API_WORKER/);
 assert.match(workflow, /Restore prior route on verification failure/);
});
