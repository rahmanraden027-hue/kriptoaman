import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
const path=new URL('../.github/workflows/kam-private-mainnet-evidence.yml',import.meta.url);
const content=await readFile(path,'utf8');
test('read-only private evidence refreshes at least twice daily without PR execution',()=>{
 assert.match(content,/workflow_dispatch:/);
 assert.match(content,/cron: '23 1,13 \* \* \*'/);
 assert.match(content,/push:\n    branches: \[main\]/);
 assert.doesNotMatch(content,/pull_request:/);
 assert.match(content,/runs-on: \[self-hosted, linux, x64, kam-mainnet-evidence\]/);
 assert.match(content,/permissions:\n  contents: read/);
});
test('private evidence verifies QBFT, canonical finality, distinct hosts, origin and isolated restore independently',()=>{
 for(const name of ['qbft','finality','topology','protected_origin','restore']){
  assert.match(content,new RegExp('id: '+name+'\\n        continue-on-error: true'));
  assert.ok(content.includes('steps.'+name+'.outcome'),name);
 }
 for(const tool of ['collect-private-evidence.mjs','probe-zvq-private-finality.mjs','verify-four-host-topology.mjs','verify-protected-rpc-origin.mjs','verify-backup-restore-evidence.mjs']) assert.ok(content.includes(tool),tool);
 assert.match(content,/p.status!=='verified'/);
 assert.match(content,/if: always\(\)/);
 assert.match(content,/Keep candidate-not-public/);
 assert.doesNotMatch(content,/sudo|docker compose (down|up)|power.?cycle|reset.*database|genesis.*write|private.key/i);
});
