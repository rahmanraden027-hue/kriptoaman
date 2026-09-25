import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {runInNewContext,Script} from 'node:vm';

const root=new URL('../explorer-dashboard/',import.meta.url);
const [html,css,js,deploy]=await Promise.all([
 readFile(new URL('zevaryq-production.html',root),'utf8'),
 readFile(new URL('assets/zvq-v2.css',root),'utf8'),
 readFile(new URL('assets/zvq-v2.js',root),'utf8'),
 readFile(new URL('../scripts/deploy-zevaryq-explorer.sh',import.meta.url),'utf8')
]);

test('v2 keeps the approved ZVQ logo and exposes all six accessible dashboard upgrades',()=>{
 assert.match(html,/data-zvq-dashboard-version="2\.0\.0"/);
 assert.equal((html.match(/class="official-emblem"/g)||[]).length,3);
 for(const panel of ['Network Health','Satellite Network View','Global Node Topology','Live Blockchain Mesh','Latest Transactions','Recent On-Chain Activity'])assert.ok(html.includes(panel),panel);
 for(const id of ['v2-tx-status','v2-tx-list','v2-activity-list','v2-block-flow','v2-telemetry-proof','v2-node-evidence','v2-satellite-evidence','v2-head-proof'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/zvq-v2\.css\?v=20260925/);
 assert.match(html,/zvq-v2\.js\?v=20260925/);
 assert.ok(Buffer.byteLength(html)<100_000,'keep original inline HTML below the production size budget');
});

test('runtime code is syntactically valid and maintains an exact transaction provenance contract',()=>{
 assert.doesNotThrow(()=>new Script(js));
 const sandbox={window:{}};
 runInNewContext(js,sandbox);
 const normalize=sandbox.window.ZVQv2.validTx;
 const hash='0x'+'a'.repeat(64),sender='0x'+'b'.repeat(40);
 const sample={hash,block_number:120,timestamp:'2026-09-25T01:20:00Z',method:'swap',value:'1200000000000000000',from:{hash:sender},status:'ok'};
 const tx=normalize(sample);
 assert.equal(tx.hash,hash);
 assert.equal(tx.kind,'swap');
 assert.equal(tx.block,120);
 assert.equal(tx.value,'1200000000000000000');
 assert.equal(normalize({...sample,hash:'not-a-hash'}),null);
 assert.equal(normalize({...sample,block_number:'garbage'}),null);
 assert.equal(normalize({...sample,method:null}).kind,'');
 assert.equal(normalize({...sample,value:'unexpected'}).value,null);
 assert.match(js,/API\+'\/transactions'/);
 assert.match(js,/if\(!response\.ok\)throw Error\('HTTP '\+response\.status\)/);
 assert.match(js,/seen\.has\(t\.hash\.toLowerCase\(\)\)/);
 assert.match(js,/document\.hidden/);
 assert.match(js,/Math\.min\(180000,30000\*2\*\*/);
 assert.doesNotMatch(js,/eth_sendTransaction|eth_sendRawTransaction|wallet_switchEthereumChain/);
 assert.doesNotMatch(js,/\.innerHTML\s*=/,'v2 indexed data must use safe DOM APIs rather than interpolating network responses into HTML');
});

test('source integrity prevents invented network, satellite and geographic data',()=>{
 const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
 assert.doesNotThrow(()=>new Script(inline));
 assert.match(inline,/EXPECTED_CHAIN='0x560c'/);
 assert.match(inline,/verifiedIndexedBlock/);
 assert.match(inline,/function sampledBlocks/);
 assert.match(inline,/parent_hash\.toLowerCase\(\)===parent\.hash\.toLowerCase\(\)/);
 assert.match(inline,/verifiedFinalizedBlock/);
 assert.match(html,/ILLUSTRATIVE · Node coordinates not independently verified/);
 assert.match(html,/ILLUSTRATIVE · Physical satellite telemetry not connected/);
 assert.match(js,/does not measure satellite or inter-node latency/);
 assert.match(js,/without independently verified node telemetry/);
 assert.match(html,/no illustrative transactions/);
 assert.doesNotMatch(html,/\b42 \/ 42\b|\b2,232,413\b|\b99\.98%\b/);
});

test('v2 deployment protects original assets and serves only exact CSS and JS files',()=>{
 assert.match(deploy,/ZVQ_EXPLORER_V2_ASSETS/);
 assert.match(deploy,/TEMPLATE_BACKUP/);
 assert.match(deploy,/trap rollback ERR/);
 for(const a of ['zvq-v2.css','zvq-v2.js']){
  assert.ok(deploy.includes('location = /zevaryq-assets/'+a+' {'));
  assert.ok(deploy.includes('try_files /kam-dashboard/zevaryq-assets/'+a+' =404;'));
  assert.ok(deploy.includes('for name in zvq-v2.css zvq-v2.js; do'));
 }
 assert.match(deploy,/for asset in zevaryq-emblem\.webp zevaryq-favicon\.png zvq-v2\.css zvq-v2\.js; do/);
 assert.match(deploy,/public_dashboard_release=2\.0\.0-verified-html/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(max-width:560px\)/);
 assert.match(css,/\.chainwire\.verified/);
});