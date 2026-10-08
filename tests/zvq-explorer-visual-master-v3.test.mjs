import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {Script} from 'node:vm';

const dir=new URL('../explorer-dashboard/',import.meta.url);
const [html,css,js]=await Promise.all([
 readFile(new URL('zevaryq-production.html',dir),'utf8'),
 readFile(new URL('assets/zvq-v2.css',dir),'utf8'),
 readFile(new URL('assets/zvq-v2.js',dir),'utf8')
]);
const main=html.split('<main>')[1]?.split('</main>')[0]||'';

test('production V3 is data-first and does not duplicate illustrative geographic or satellite maps',()=>{
 assert.match(main,/data-zvq-network-telemetry="production-v3"/);
 assert.match(main,/data-zvq-node-evidence="verified-only"/);
 assert.match(main,/<h2>Network Telemetry<\/h2>/);
 assert.match(main,/<h2>Node Location Evidence<\/h2>/);
 assert.doesNotMatch(main,/Satellite Network View/);
 assert.doesNotMatch(main,/class="viz satview"/);
 assert.doesNotMatch(main,/class="reference-worldmap"/);
 assert.match(main,/No verified node coordinates/);
 assert.match(main,/Satellite links and ground stations have no verified connection/);
 assert.equal((main.match(/class="reference-orbit-art"/g)||[]).length,1,'only primary orbital globe is displayed');
 assert.equal((main.match(/class="earth-brandmark"/g)||[]).length,1,'the official main globe is retained');
 assert.equal((html.match(/class="official-emblem"/g)||[]).length,2,'header and hero keep Master V2');
 assert.match(main,/id="v2-satellite-evidence"/);
 assert.match(main,/id="v2-node-evidence"/);
 assert.match(main,/id="v2-telemetry-proof"/);
 assert.ok(Buffer.byteLength(html)<100_000);
});

test('first verified block stream and latest indexed blocks appear before unverified infrastructure detail',()=>{
 const positions=['Network Health','Realtime Block Stream','Latest Blocks','Consensus & Finality','Node Location Evidence','Network Telemetry'];
 const indices=positions.map(x=>main.indexOf('<h2>'+x+'</h2>'));
 for(let i=0;i<indices.length;i++)assert.ok(indices[i]>=0,positions[i]+' missing');
 for(let i=1;i<indices.length;i++)assert.ok(indices[i]>indices[i-1],positions[i]+' incorrectly ordered');
 for(const id of ['metrics','stream','blocks','consensus','satstats','infra'])assert.match(main,new RegExp('id="'+id+'"'));
 assert.match(html,/const EXPECTED_CHAIN='0x560c'/);
});

test('telemetry is built solely from RPC and Blockscout evidence and absent geography remains unknown',()=>{
 assert.match(html,/mini\('RPC chain',state\.rpc\?'22028':unavailable/);
 assert.match(html,/mini\('Indexer',state\.api\?'Online':unavailable/);
 assert.match(html,/mini\('Indexed block',state\.api&&state\.blocks\.length/);
 assert.match(js,/const status=rpc&&indexed\?'VERIFIED':rpc\|\|indexed\?'PARTIAL':'UNAVAILABLE'/);
 assert.match(js,/makeElement\('details','zvq-public-orbits'\)/);
 assert.match(js,/makeElement\('summary','zvq-orbit-summary'/);
 assert.match(js,/Independent public orbit elements are reference only/);
 assert.match(js,/does not measure satellite or inter-node latency/);
 assert.doesNotMatch(js,/\.innerHTML\s*=/);
 assert.doesNotThrow(()=>new Script(js));
 const scriptStart=html.indexOf('<script>');
 const scriptEnd=html.indexOf('</script>',scriptStart+8);
 assert.ok(scriptStart>=0&&scriptEnd>scriptStart,'trusted inline production script must exist');
 const inline=html.slice(scriptStart+8,scriptEnd);
 assert.ok(inline);
 assert.doesNotThrow(()=>new Script(inline));
});

test('V3 palette reduces ornamental glow and respects reduced motion/mobile breakpoints',()=>{
 assert.match(css,/ZVQ-PRODUCTION-VISUAL-MASTER-3/);
 for(const color of ['#050d19','#0b1b30','#38bdf8','#d8b46c','#34d399'])assert.ok(css.includes(color));
 assert.match(css,/node-evidence-placeholder/);
 assert.match(css,/telemetry-intro/);
 assert.match(css,/zvq-orbit-summary:focus-visible/);
 assert.match(css,/@media\(max-width:560px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(html,/globe21-datafirst-zero-truth-visualmaster3/);
 assert.match(html,/globe21-visualmaster3/);
});
