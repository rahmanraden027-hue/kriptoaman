import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const script=await readFile(new URL('scripts/deploy-zvq-master-v2-subpages.sh',root),'utf8');
const workflow=await readFile(new URL('.github/workflows/zvq-master-v2-subpages-release.yml',root),'utf8');
const files=[
 'address-detail.html','addresses.html','api-docs.html','block-detail.html','blocks.html','contracts.html',
 'developer-docs.html','developer-examples.html','developer-starter.html','developer-verify.html',
 'developer.html','stats.html','status.html','tokens.html','transaction-detail.html','transactions.html','validators.html'
];
test('release allowlist is exactly seventeen reviewed, non-homepage HTML documents',async()=>{
 const list=script.match(/^FILES=\(([^)]+)\)$/m)?.[1]?.split(' ');
 assert.deepEqual(list,files);
 for(const file of files){
  const html=await readFile(new URL('explorer-dashboard/'+file,root),'utf8');
  assert.match(html,/zevaryq-master-v2\.svg\?v=20261008-zevaryq-identity-v2/,file);
  assert.match(html,/rel="icon"[^>]*zevaryq-master-v2\.svg/,file);
  assert.doesNotMatch(html,/<div class="mark">K<\/div>/,file);
  assert.doesNotMatch(html,/src="https:\/\/kriptoaman\.com\/brand\/(?:zevaryq|kriptoaman)-mark\.svg"/,file);
 }
 assert.ok(!files.includes('index.html'));
 assert.ok(!files.includes('zevaryq-production.html'));
});
test('deploy script is fail-closed, exact-file, checksum and rollback guarded',()=>{
 assert.match(script,/\[\[ "\$EUID" == 0 \]\]/);
 assert.match(script,/hostname -s/);
 assert.match(script,/kam-explorer-blockscout-01/);
 assert.match(script,/data-zevaryq-explorer-version/);
 assert.match(script,/\$D\/index\.html/);
 assert.match(script,/\$BACKUP\/root\.sha/);
 assert.match(script,/\$BACKUP\/\$f\.second-copy/);
 assert.match(script,/\$BACKUP\/\$f\.newsha/);
 assert.match(script,/trap finish EXIT/);
 assert.match(script,/atomic_from/);
 assert.match(script,/--rollback/);
 assert.match(script,/0x560c/);
 assert.match(script,/\$DOMAIN\/api\/v2\/blocks/);
 assert.doesNotMatch(script,/docker compose (?:up|down|restart)|nginx -s reload|systemctl restart|wrangler deploy/);
 assert.doesNotMatch(script,/genesis\.json|private.?key|eth_sendRawTransaction|dns-records/);
});
test('workflow cannot mutate production from a PR or push',()=>{
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/DEPLOY-ZVQ-MASTER-V2-ROUTES/);
 assert.match(workflow,/github.event_name == 'workflow_dispatch'/);
 assert.match(workflow,/runs-on: \[self-hosted, linux, x64, kam-explorer-host\]/);
 assert.match(workflow,/public_before:/);
 assert.match(workflow,/public_after:/);
 assert.match(workflow,/rollback_on_failure:/);
 assert.match(workflow,/release_gate:/);
 assert.match(workflow,/contents: read/);
 assert.doesNotMatch(workflow,/contents: write/);
 assert.match(workflow,/scripts\/deploy-zvq-master-v2-subpages\.sh --rollback/);
});
