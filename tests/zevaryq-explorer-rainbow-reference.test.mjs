import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { Script, runInNewContext } from 'node:vm';

const html=await readFile(new URL('../explorer-dashboard/zevaryq-production.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/i)?.[1]||'';

test('reference fidelity uses only the preserved, approved official logo in all three placements',()=>{
 assert.equal((html.match(/class="official-emblem"/g)||[]).length,3);
 assert.equal((html.match(/src="\/zevaryq-assets\/zevaryq-master-v2\.svg\?v=20261008-zevaryq-identity-v2"/g)||[]).length,3);
 assert.match(html,/data-zvq-reference-visual="blue-gold-orbital-20260924"/);
 assert.equal((html.match(/viewBox="0 0 140 80"/g)||[]).length,6,'three detailed satellites in each globe scene');
 assert.match(html,/class="reference-orbit-art"/);
 assert.match(html,/id="rainbowWaves" data-provenance="illustrative"/);
});

test('rainbow flow retains approved eight luminous layers without claiming invented transaction categories',()=>{
 for(const shade of ['#278aff','#40d9ff','#9652fa','#f841d8','#ff71bd','#ffdc38','#38ef8d','#00caff'])assert.ok(html.includes(shade),'missing rainbow shade '+shade);
 assert.match(html,/id="rainbowGlow"/);
 assert.match(html,/id="rainbowGrid"/);
 assert.match(html,/All ribbon colors encode the same measured transaction-count series/);
 assert.match(script,/state\.blocks\.slice\(0,12\)\.reverse\(\)\.map/);
 assert.match(script,/Number\.isSafeInteger\(n\)/);
 assert.match(script,/wave\.dataset\.provenance=state\.api\?'indexed':'stale'/);
 assert.match(script,/status\.textContent=state\.api\?'INDEXED':'STALE'/);
 assert.doesNotMatch(html,/21\s*\/\s*21|128\+ nodes|1,236 pending|3\.4 TPS|100% Secure/i);
});

test('the smoothed, actual-sample curve handles flat and changing transaction counts',()=>{
 const from=script.indexOf('function smoothRainbowPath('),to=script.indexOf('function renderRainbowActivity(',from);
 assert.ok(from>0&&to>from);
 const smooth=runInNewContext(script.slice(from,to)+';smoothRainbowPath');
 assert.equal(smooth([[0,75]]),'');
 const wave=smooth([[0,80],[400,60],[800,120]]);
 assert.ok(wave.startsWith('M0.00 80.00 C'),'path starts at first verified sample');
 assert.ok(wave.endsWith('800.00 120.00'),'path ends at final verified sample');
 assert.doesNotMatch(wave,/NaN|Infinity/);
});

test('zero indexed transactions render a neutral empty state, not eight misleading ribbons',()=>{
 const from=script.indexOf('function renderRainbowActivity('),to=script.indexOf('function renderBlocks(',from);
 assert.ok(from>0&&to>from);
 const render=script.slice(from,to);
 const simulate=(values,api)=>{
  const wave={dataset:{},innerHTML:'PREVIEW',replaceChildren(){this.innerHTML='';},setAttribute(){}};
  const status={textContent:'PREVIEW'},note={textContent:'PREVIEW'};
  const nodes={rainbowWaves:wave,rainbowDataStatus:status,activityNote:note};
  runInNewContext(render+';renderRainbowActivity();',{
   state:{api,blocks:values.map(tx_count=>({tx_count}))},$:id=>nodes[id],
   RAINBOW_COLORS:['red','orange','yellow','green','blue','indigo','violet','cyan'],
   smoothRainbowPath:()=> 'M0 80 L800 80'
  });
  return {wave,status,note};
 };
 const zero=simulate(Array(12).fill(0),true);
 assert.equal(zero.wave.innerHTML,'');
 assert.equal(zero.wave.dataset.provenance,'zero');
 assert.equal(zero.status.textContent,'INDEXED · ZERO');
 assert.match(zero.note.textContent,/0 transactions across 12 sampled blocks/);
 const stale=simulate(Array(12).fill(0),false);
 assert.equal(stale.wave.dataset.provenance,'stale-zero');
 assert.equal(stale.status.textContent,'STALE · ZERO');
 const nonzero=simulate([0,1,2,0],true);
 assert.equal((nonzero.wave.innerHTML.match(/<path/g)||[]).length,8);
 assert.equal(nonzero.status.textContent,'INDEXED');
});

test('unavailable indexer preserves decorative layout but clearly labels preview or stale sample',()=>{
 assert.match(script,/samples\.length<2\|\|samples\.some/);
 assert.match(html,/data-provenance="illustrative"/);
 assert.match(script,/Illustrative color preview · verified transaction series unavailable/);
 assert.match(script,/wave\.setAttribute\('opacity',state\.api\?'1':'.48'\)/);
 assert.match(script,/if\(state\.blocks\.length\)renderBlocks\(\)/);
 assert.match(html,/not live satellite telemetry/);
 assert.match(html,/Topology data unavailable/);
});

test('safe wallet connection is user-initiated, read-only and guards chain identity',()=>{
 assert.match(html,/id="walletConnect" type="button"/);
 assert.match(html,/aria-describedby="walletState"/);
 assert.match(script,/addEventListener\('click',connectWallet\)/);
 assert.match(script,/method:'eth_requestAccounts'/);
 assert.match(script,/method:'eth_chainId'/);
 assert.match(script,/String\(chain\)\.toLowerCase\(\)!==EXPECTED_CHAIN/);
 assert.doesNotMatch(script,/eth_sendTransaction|eth_sendRawTransaction|wallet_switchEthereumChain|wallet_addEthereumChain/);
 assert.match(html,/aria-expanded="false"/);
});

test('CSS offers responsive Android, tablet, desktop and reduced-motion layouts without shrinking desktop dashboard',()=>{
 assert.match(html,/@media\(max-width:1120px\)/);
 assert.match(html,/@media\(max-width:850px\)/);
 assert.match(html,/@media\(max-width:560px\)/);
 assert.match(html,/@media\(max-width:355px\)/);
 assert.match(html,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(html,/max-width:min\(290px,calc\(100vw - 24px\)\)/);
 assert.match(html,/overflow-x:auto/);
 assert.ok(Buffer.byteLength(html)<100000,'production HTML must remain under the current 100KB regression cap');
 assert.doesNotThrow(()=>new Script(script));
});
