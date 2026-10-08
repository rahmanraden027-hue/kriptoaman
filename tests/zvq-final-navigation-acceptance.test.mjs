import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
const script=await readFile(new URL('../scripts/verify-zvq-final-navigation.mjs',import.meta.url),'utf8');
const workflow=await readFile(new URL('../.github/workflows/zvq-final-navigation-acceptance.yml',import.meta.url),'utf8');

test('final acceptance clicks all public menu routes on mobile and desktop',()=>{
 for(const marker of ['android-390','desktop-1440','production-v3','#metrics','#infra','#token-discovery',
  "'/blocks'","'/txs'","'/validators'","'/api-docs'","'#selected-token-state'",
  'ZVQ_NAVIGATION_PASS','navigation-proof.json','page.waitForNavigation',
  'Legacy WKAM reference'])assert.ok(script.includes(marker),marker);
 assert.match(script,/assert\.equal\(status,200/);
 assert.match(script,/No horizontal overflow/);
 assert.match(script,/No uncaught errors across Explorer navigation/);
 assert.match(script,/indexed or fail closed/i);
 assert.match(script,/PUBLIC|ZVQ_NAVIGATION_PASS/);
});
test('read-only CI cannot bypass Phase 13 or touch blockchain',()=>{
 assert.match(workflow,/permissions:\s*\n\s*contents: read/);
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/node-version: '22'/);
 assert.match(workflow,/upload-artifact@v4/);
 assert.doesNotMatch(script+workflow,/\beth_sendTransaction\b|\beth_sendRawTransaction\b|\bwallet\.request\b|private.?key|sudo|docker exec|deploy-zevaryq-explorer|wallet-signing|genesis.*change|writeRpc/i);
 assert.ok(!workflow.includes('self-hosted'),'public navigation must run off-origin');
 assert.ok(!workflow.includes('inputs.confirm_explorer_only'),'browser evidence must not deploy Explorer');
});
