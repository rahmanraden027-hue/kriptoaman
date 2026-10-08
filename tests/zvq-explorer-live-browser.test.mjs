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
 assert.ok(script.includes("snapshot.productionV3?2:3"),'live browser must support verified two-logo V3 and three-logo V2 during controlled release');
 assert.ok(script.includes("snapshot.ribbonProvenance==='zero'||snapshot.ribbonProvenance==='stale-zero'"),'zero-indexed traffic needs a distinct trust state');
 assert.ok(script.includes("assert.equal(snapshot.ribbons,0"),'zero indexed transactions must NOT draw decorative ribbons');
 assert.ok(script.includes("assert.equal(snapshot.ribbons,8"),'measured nonzero or labelled preview retains eight ribbons');
 assert.ok(script.includes("snapshot.activityNote||''"),'zero transaction sample needs explicit count evidence');
 assert.ok(script.includes("const requireV3=process.env.ZVQ_REQUIRE_PRODUCTION_V3==='1'"),'strict acceptance must be explicitly opt-in');
 assert.ok(script.includes("assert.equal(snapshot.productionV3,true"),'strict acceptance rejects legacy V2');
 assert.ok(script.includes("assert.equal(snapshot.nodeEvidence,true"),'strict acceptance requires verified-only node evidence');
 assert.ok(script.includes("assert.equal(snapshot.legacySatellitePanel,false"),'strict acceptance rejects duplicate satellite illustration');
 assert.ok(script.includes("requireProductionV3:requireV3"),'saved proof must disclose its acceptance mode');
 assert.match(workflow,/require_production_v3:\s*\n\s*description:/);
 assert.ok(workflow.includes("ZVQ_REQUIRE_PRODUCTION_V3: ${{ inputs.require_production_v3 && '1' || '0' }}"),'manual flag must reach the browser proof');

});
test('browser proof cannot mutate Explorer infrastructure or blockchain state',()=>{
 assert.match(workflow,/permissions:\s*\n\s*contents: read/);
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/on:\s*[\s\S]*schedule:/);
 assert.doesNotMatch(script+workflow,/deploy-zevaryq-explorer|private.?key|wallet\.request|eth_sendRawTransaction|eth_sendTransaction|eth_sign|self-hosted|sudo|docker exec/i);
});
