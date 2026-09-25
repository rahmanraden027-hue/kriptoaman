// Browser-based Explorer-only visual regression smoke. Screenshots are previews, never production data.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const folder=fileURLToPath(new URL('../explorer-dashboard/',import.meta.url));
const modulePath=process.env.PLAYWRIGHT_CORE;
const chromePath=process.env.ZVQ_CHROME;
const imageDir=resolve(process.env.ZVQ_SCREENSHOT_DIR||'zvq-visual-proof');
if(!modulePath||!chromePath)throw Error('PLAYWRIGHT_CORE and ZVQ_CHROME must be set');
const {chromium}=await import(pathToFileURL(modulePath).href);
await mkdir(imageDir,{recursive:true});
const served={
 '/':['zevaryq-production.html','text/html; charset=utf-8'],
 '/zevaryq-assets/zevaryq-emblem.webp':['assets/zevaryq-emblem.webp','image/webp'],
 '/zevaryq-assets/zevaryq-favicon.png':['assets/zevaryq-favicon.png','image/png'],
 '/zevaryq-assets/zvq-v2.css':['assets/zvq-v2.css','text/css; charset=utf-8'],
 '/zevaryq-assets/zvq-v2.js':['assets/zvq-v2.js','application/javascript; charset=utf-8'],
 '/before':['zevaryq-before.html','text/html; charset=utf-8']
};
const server=createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1').pathname;
 const file=served[pathname];
 if(file){
  try{const bytes=await readFile(join(folder,file[0]));res.writeHead(200,{'content-type':file[1],'cache-control':'no-store'});res.end(bytes)}
  catch{res.writeHead(500);res.end('Local preview asset unavailable')}
  return;
 }
 if(pathname==='/api/v2/blocks'||pathname==='/api/v2/transactions'||pathname==='/rpc'){res.writeHead(503,{'content-type':'application/json','access-control-allow-origin':'*'});res.end('{"error":"Offline local visual preview"}');return}
 res.writeHead(404);res.end('Not found');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:chromePath,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const cases=[{name:'android-360',width:360,height:800},{name:'android-393',width:393,height:852},{name:'tablet-768',width:768,height:1024},{name:'desktop-1440',width:1440,height:900}];
 for(const config of cases){
  const context=await browser.newContext({viewport:{width:config.width,height:config.height},deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  await page.route('https://rpc.kriptoaman.com/**',route=>route.fulfill({status:503,body:'{"error":"Local preview only"}',headers:{'access-control-allow-origin':'*','content-type':'application/json'}}));
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:25000});
  await page.locator('#rainbowWaves').waitFor();
  const readout=await page.evaluate(()=>{
   const e=document.documentElement,imgs=[...document.querySelectorAll('.official-emblem')];
   return{viewport:window.innerWidth,scrollWidth:e.scrollWidth,emblems:imgs.map(x=>[x.complete,x.naturalWidth,x.naturalHeight]),rainbowPaths:document.querySelectorAll('#rainbowWaves .rainbowWave').length,mode:document.querySelector('#rainbowDataStatus')?.textContent,v2:typeof window.ZVQv2?.validTx==='function',txPanel:!!document.querySelector('#v2-tx-list'),orbitStatus:document.querySelector('.zvq-orbit-badge')?.textContent};
  });
  assert.equal(readout.viewport,config.width,config.name+' viewport width');
  assert.equal(readout.v2,true,config.name+' v2 runtime asset missing');
  assert.equal(readout.txPanel,true,config.name+' indexed transaction panel missing');
  assert.equal(readout.orbitStatus,'UNAVAILABLE',config.name+' missing-public-orbit-feed must fail closed');
  if(readout.scrollWidth>config.width+1){
   const protruding=await page.evaluate(()=>[...document.body.querySelectorAll('*')].map(el=>{
    const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
    return{tag:el.tagName.toLowerCase(),id:el.id,cls:String(el.className?.baseVal??el.className??'').slice(0,65),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),overflowX:cs.overflowX};
   }).filter(v=>v.right>innerWidth+1&&v.width>0).sort((a,b)=>b.right-a.right).slice(0,20));
   console.error('OVERFLOW_DETAILS '+config.name+' '+JSON.stringify(protruding));
  }
  if(config.width<=393){const scroll=await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo({top:Math.min(900,document.documentElement.scrollHeight-innerHeight),behavior:'instant'});return window.scrollY});assert.ok(scroll>0,config.name+' vertical Android scrolling');await page.evaluate(()=>window.scrollTo(0,0));}
  const screenshot=join(imageDir,config.name+'.png');
  await page.screenshot({path:screenshot,fullPage:true,animations:'disabled'});
  assert.ok(readout.scrollWidth<=config.width+1,config.name+' horizontal overflow: '+readout.scrollWidth);
  assert.equal(readout.emblems.length,3,config.name+' should preserve three official logo placements');
  assert.ok(readout.emblems.every(([loaded,w,h])=>loaded&&w>0&&h>0),config.name+' logo failed to decode');
  assert.equal(readout.rainbowPaths,8,config.name+' rainbow ribbons');
  assert.equal(readout.mode,'PREVIEW','local offline screenshot must not claim live data');
  if(config.width<=1050){
   await page.locator('#menu').click();
   assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');
   assert.equal(await page.locator('#nav').isVisible(),true,config.name+' mobile navigation unavailable');
   await page.locator('#walletConnect').click();
   assert.match(await page.locator('#walletState').textContent(),/No EVM browser wallet detected/);
  }
  assert.deepEqual(errors,[],config.name+' JavaScript runtime error');
  console.log('VISUAL_OK '+config.name+' viewport='+readout.viewport+' scrollWidth='+readout.scrollWidth+' logos='+readout.emblems.length+' rainbow='+readout.rainbowPaths+' preview='+readout.mode+' screenshot='+screenshot);
  await context.close();
 }
 // Before/after screenshot proof: the base revision is served only in this isolated offline preview.
 for(const width of [360,393,768,1440]){
  const config=cases.find(item=>item.width===width);
  const ctx=await browser.newContext({viewport:{width,height:config.height}});
  const p=await ctx.newPage();
  await p.route('https://rpc.kriptoaman.com/**',r=>r.fulfill({status:503,body:'{"error":"QA offline baseline"}',headers:{'access-control-allow-origin':'*','content-type':'application/json'}}));
  await p.goto(origin+'/before',{waitUntil:'domcontentloaded'});
  await p.screenshot({path:join(imageDir,'BEFORE-'+width+'.png'),fullPage:true,animations:'disabled'});
  console.log('BASELINE_SCREENSHOT_OK '+width);
  await ctx.close();
 }
 // Prove that indexed data renders while browser RPC returns HTTP 403, using QA-only fixture values.
 {
  const ctx=await browser.newContext({viewport:{width:393,height:852}});
  const p=await ctx.newPage();
  const timestamp=new Date().toISOString(),older=new Date(Date.now()-3000).toISOString();
  const h1='0x'+'1'.repeat(64),h2='0x'+'2'.repeat(64);
  await p.route('https://rpc.kriptoaman.com/**',r=>r.fulfill({status:403,contentType:'application/json',body:'{"error":"QA RPC 403"}',headers:{'access-control-allow-origin':'*'}}));
  await p.route('**/rpc',r=>r.fulfill({status:403,contentType:'application/json',body:'{"error":"QA RPC 403"}'}));
  await p.route('**/api/v2/blocks',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({items:[{height:200,hash:h1,parent_hash:h2,timestamp,tx_count:2},{height:199,hash:h2,parent_hash:'0x'+'3'.repeat(64),timestamp:older,tx_count:1}]})}));
  await p.route('**/api/v2/transactions',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({items:[{hash:'0x'+'a'.repeat(64),block_number:200,timestamp,method:'swap',value:'1000000000000000000',status:'ok'},{hash:'0x'+'b'.repeat(64),block_number:199,timestamp:older,method:'transfer',value:'250000000000000000',status:'ok'}]})}));
  await p.goto(origin,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>document.querySelector('#v2-tx-status')?.textContent==='INDEXED'&&document.querySelector('#meshStatus')?.textContent.includes('verified parent links'),{timeout:20000});
  const proof=await p.evaluate(()=>({txRows:document.querySelectorAll('#v2-tx-list .v2-tx-item').length,activity:document.querySelectorAll('#v2-activity-list .v2-activity-item').length,trust:document.querySelector('#trust').textContent,mesh:document.querySelector('#meshStatus').textContent,latest:document.querySelector('#blocks').textContent,latency:document.querySelector('#v2-telemetry-proof').textContent}));
  assert.equal(proof.txRows,2);assert.equal(proof.activity,2);assert.equal(proof.trust,'INDEXED');assert.match(proof.mesh,/1 verified parent links/);
  assert.match(proof.latest,/#200/);assert.match(proof.latency,/Satellite telemetry requires/);
  await p.screenshot({path:join(imageDir,'QA-indexer-works-RPC-403.png'),fullPage:true,animations:'disabled'});
  console.log('RPC_403_INDEXER_QA_OK '+JSON.stringify(proof));
  await ctx.close();
 }
 // Public GP fixture validates the source-specific UI, not a spacecraft communications link.
 {
  const ctx=await browser.newContext({viewport:{width:393,height:852}});
  const p=await ctx.newPage();
  const now=new Date().toISOString(),catalog=[25544,20580,33591];
  const body={
   schema:'zvq-public-orbits/v1',provider:'CelesTrak',source_type:'public_orbital_elements',
   is_satellite_link_telemetry:false,affiliation:'none_claimed',checked_at:now,
   records:catalog.map((id,i)=>({
    catalog_number:id,object_name:['ISS (ZARYA)','HST','NOAA 19'][i],epoch:now,
    inclination_deg:51.5,eccentricity:0.0008,mean_motion_rev_per_day:15.5,ascending_node_deg:44.2
   }))
  };
  await p.route('**/zevaryq-assets/public-orbits.json',route=>route.fulfill({
   status:200,contentType:'application/json',body:JSON.stringify(body)
  }));
  await p.route('https://rpc.kriptoaman.com/**',route=>route.fulfill({
   status:503,contentType:'application/json',body:'{"error":"QA offline"}',
   headers:{'access-control-allow-origin':'*'}
  }));
  await p.goto(origin,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>document.querySelector('.zvq-orbit-badge')?.textContent==='PUBLIC GP');
  const proof=await p.evaluate(()=>({
   status:document.querySelector('.zvq-orbit-badge')?.textContent,
   count:document.querySelectorAll('.zvq-orbit-tile').length,
   notice:document.querySelector('.zvq-orbit-footnote')?.textContent,
   content:document.querySelector('#zvq-public-orbits')?.textContent
  }));
  assert.equal(proof.status,'PUBLIC GP');
  assert.equal(proof.count,3);
  assert.match(proof.notice,/not real-time spacecraft positions/i);
  assert.match(proof.content,/Physical network telemetry: UNAVAILABLE/);
  await p.screenshot({path:join(imageDir,'QA-public-GP-not-physical-telemetry.png'),fullPage:true,animations:'disabled'});
  console.log('PUBLIC_GP_QA_ONLY_OK '+JSON.stringify({count:proof.count,status:proof.status}));
  await ctx.close();
 }
 // Respect user system preference: no satellite or chain animation under reduced motion.
 {
  const ctx=await browser.newContext({viewport:{width:393,height:852},reducedMotion:'reduce'});
  const p=await ctx.newPage();
  await p.route('https://rpc.kriptoaman.com/**',r=>r.fulfill({status:503,body:'{"error":"QA offline"}',headers:{'access-control-allow-origin':'*','content-type':'application/json'}}));
  await p.goto(origin,{waitUntil:'domcontentloaded'});
  const result=await p.evaluate(()=>({reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,orbit:getComputedStyle(document.querySelector('.space .orbit')).animationName}));
  assert.equal(result.reduced,true);assert.equal(result.orbit,'none');
  console.log('REDUCED_MOTION_QA_OK');
  await ctx.close();
 }
 // Explicitly test transaction-bound ribbons using QA-only fixture; never publish these counts as live.
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await context.newPage();
 await page.route('https://rpc.kriptoaman.com/**',route=>route.fulfill({status:503,body:'{"error":"Local preview only"}',headers:{'access-control-allow-origin':'*','content-type':'application/json'}}));
 await page.goto(origin,{waitUntil:'domcontentloaded'});
 const fixture=await page.evaluate(()=>{
  state.blocks=[{tx_count:1},{tx_count:9},{tx_count:0},{tx_count:18}];
  state.api=true;renderRainbowActivity();
  return {status:document.querySelector('#rainbowDataStatus').textContent,provenance:document.querySelector('#rainbowWaves').dataset.provenance,paths:document.querySelectorAll('#rainbowWaves path').length,notation:document.querySelector('#activityNote').textContent};
 });
 assert.equal(fixture.status,'INDEXED');assert.equal(fixture.provenance,'indexed');assert.equal(fixture.paths,8);assert.match(fixture.notation,/28 transactions across 4 sampled blocks/);
 console.log('RAINBOW_FIXTURE_OK; QA-only synthetic counts are never rendered in production.');
 await context.close();

 // An injected EIP-1193 test provider verifies the deliberate click-to-connect
 // flow and wrong-chain fail-closed behavior without accessing a real wallet.
 for(const chainId of ['0x560c','0x1']){
  const walletContext=await browser.newContext({viewport:{width:1440,height:900}});
  await walletContext.addInitScript(chain=>{
   window.__zvqWalletMethods=[];
   window.ethereum={request:async({method})=>{
    window.__zvqWalletMethods.push(method);
    if(method==='eth_requestAccounts')return ['0x'+'a'.repeat(40)];
    if(method==='eth_chainId')return chain;
    throw Error('Unexpected wallet request');
   }};
  },chainId);
  const walletPage=await walletContext.newPage();
  await walletPage.route('https://rpc.kriptoaman.com/**',route=>route.fulfill({status:503,body:'{"error":"QA offline"}',headers:{'access-control-allow-origin':'*','content-type':'application/json'}}));
  await walletPage.goto(origin,{waitUntil:'domcontentloaded'});
  await walletPage.locator('#walletConnect').click();
  const wallet=await walletPage.evaluate(()=>({
   methods:window.__zvqWalletMethods,
   button:document.querySelector('#walletConnect').textContent,
   status:document.querySelector('#walletState').textContent
  }));
  assert.deepEqual(wallet.methods,['eth_requestAccounts','eth_chainId'],'wallet control requests no transaction');
  if(chainId==='0x560c'){
   assert.match(wallet.button,/^0xaaa…aaaaa$/);
   assert.match(wallet.status,/Wallet connected on ZVQ/);
  }else{
   assert.equal(wallet.button,'Wrong network');
   assert.match(wallet.status,/switch to ZVQ Chain ID 22028/);
  }
  console.log('WALLET_QA_OK chain='+chainId+' methods='+wallet.methods.join(',')+' status='+wallet.status);
  await walletContext.close();
 }

 await writeFile(join(imageDir,'VISUAL_QA.txt'),'Explorer offline screenshots use unavailable status. Public GP and RPC-403 screenshots use QA-only synthetic fixtures and are NOT production or satellite-link evidence.\n'+cases.map(c=>c.name).join('\n')+'\n');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
