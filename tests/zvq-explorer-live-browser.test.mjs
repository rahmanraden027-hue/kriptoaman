import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
const script=await readFile(new URL('../scripts/verify-zvq-public-browser.mjs',import.meta.url),'utf8');
const workflow=await readFile(new URL('../.github/workflows/zvq-explorer-browser-proof.yml',import.meta.url),'utf8');

test('live browser proof checks real populated indexed blocks and preserves approved visuals',()=>{
 for(const marker of ['PLAYWRIGHT_CORE','#blocks a[href^="/block/"]','blue-gold-orbital-20260924','Chain ID 22028','.official-emblem','rainbowDataStatus','android-390','desktop-1440'])assert.ok(script.includes(marker),marker);
 assert.match(script,/trust==='INDEXED'\|\|trust==='LIVE'/);
 assert.match(script,/page\.on\('pageerror'/);
 assert.ok(workflow.includes('playwright-core@1.55.0'));

 assert.match(script,/requestFailures/);
});
test('browser proof cannot mutate Explorer infrastructure or blockchain state',()=>{
 assert.match(workflow,/permissions:\s*\n\s*contents: read/);
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/on:\s*[\s\S]*schedule:/);
 assert.doesNotMatch(script+workflow,/deploy-zevaryq-explorer|private.?key|wallet\.request|eth_sendRawTransaction|eth_sendTransaction|eth_sign|self-hosted|sudo|docker exec/i);
});
