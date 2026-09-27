import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const script = await readFile(new URL('../scripts/deploy-zvq-static-subpages.sh', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/zvq-static-subpages-rollout.yml', import.meta.url), 'utf8');
const blocks = await readFile(new URL('../explorer-dashboard/blocks.html', import.meta.url), 'utf8');
const txs = await readFile(new URL('../explorer-dashboard/transactions.html', import.meta.url), 'utf8');

test('reviewed sources have identical approved ZVQ identity and retain indexed APIs', () => {
  for (const html of [blocks,txs]) {
    assert.match(html,/data-zvq-public-brand="1\.0\.0"/);
    assert.match(html,/ZEVARYQ Explorer/);
    assert.match(html,/ZVQ Mainnet/);
    assert.match(html,/Chain ID 22028/);
    assert.doesNotMatch(html,/KAM NETWORK|<strong>KAM Explorer<\/strong>/);
    assert.match(html,/\/api\/v2\//);
  }
});
test('script is exact-file only with matching live mount and no broad deploy', () => {
  for (const f of ['blocks.html','transactions.html']) {
    assert.match(script,new RegExp(f.replace('.','\\.') ));
  }
  for (const route of ['/blocks','/txs']) assert.ok(script.includes(route));
  assert.match(script,/cmp -s "\$TMP\/blocks\.before" "\$D\/blocks\.html"/);
  assert.match(script,/cmp -s "\$TMP\/txs\.before" "\$D\/transactions\.html"/);
  assert.match(script,/data-zevaryq-explorer-version/);
  assert.match(script,/data-zvq-public-brand/);
  assert.match(script,/ROOT_BEFORE/);
  assert.match(script,/BACKUPS=\/var\/backups\//);
  assert.match(script,/cp -p -- "\$D\/\$file" "\$BACKUP\/\$file\.second-copy"/);
  assert.match(script,/MODIFIED=1/);
  assert.match(script,/trap finish EXIT/);
  assert.match(script,/--rollback/);
  assert.doesNotMatch(script,/docker compose (up|down|restart)|nginx -s reload|systemctl restart|wrangler deploy/);
  assert.doesNotMatch(script,/genesis\.json|private.key|eth_sendRawTransaction|dns-records/);
});
test('manual workflow never deploys during PR, push or an invalid confirmation', () => {
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/DEPLOY-ZVQ-SUBPAGES/);
  assert.match(workflow,/github.event_name == 'workflow_dispatch'/);
  assert.match(workflow,/runs-on: \[self-hosted, linux, x64, kam-explorer-host\]/);
  assert.match(workflow,/public_before:/);
  assert.match(workflow,/public_after:/);
  assert.match(workflow,/rollback_on_failure:/);
  assert.match(workflow,/release_gate:/);
  assert.match(workflow,/scripts\/deploy-zvq-static-subpages.sh --rollback/);
  assert.match(workflow,/contents: read/);
  assert.doesNotMatch(workflow,/contents: write/);
});