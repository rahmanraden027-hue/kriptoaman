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
 '/zevaryq-assets/zevaryq-favicon.png':['assets/zevaryq-favicon.png','image/png']
};
const server=createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1').pathname;
 const file=served[pathname];
 if(file){
  try{const bytes=await readFile(join(folder,file[0]));res.writeHead(200,{'content-type':file[1],'cache-control':'no-store'});res.end(bytes)}
  catch{res.writeHead(500);res.end('Local preview asset unavailable')}
  return;
 }
 if(pathname==='/api/v2/blocks'||pathname==='/rpc'){res.writeHead(503,{'content-type':'application/json','access-control-allow-origin':'*'});res.end('{"error":"Offline local visual preview"}');return}
 res.writeHead(404);res.end('Not found');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:chromePath,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const cases=[{name:'android-390',width:390,height:844},{name:'tablet-820',width:820,height:1180},{name:'desktop-1440',width:1440,height:900}];
 for(const config of cases){
  const context=await browser.newContext({viewport:{width:config.width,height:config.height},deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  await page.route('https://rpc.kriptoaman.com/**',route=>route.fulfill({status:503,body:'{"error":"Local preview only"}',headers:{'access-control-allow-origin':'*','content-type':'application/json'}}));
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:25000});
  await page.locator('#rainbowWaves').waitFor();
  const readout=await page.evaluate(()=>{
   const e=document.documentElement,imgs=[...document.querySelectorAll('.official-emblem')];
   return{viewport:window.innerWidth,scrollWidth:e.scrollWidth,emblems:imgs.map(x=>[x.complete,x.naturalWidth,x.naturalHeight]),rainbowPaths:document.querySelectorAll('#rainbowWaves .rainbowWave').length,mode:document.querySelector('#rainbowDataStatus')?.textContent};
  });
  assert.equal(readout.viewport,config.width,config.name+' viewport width');
  if(readout.scrollWidth>config.width+1){
   const protruding=await page.evaluate(()=>[...document.body.querySelectorAll('*')].map(el=>{
    const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
    return{tag:el.tagName.toLowerCase(),id:el.id,cls:String(el.className?.baseVal??el.className??'').slice(0,65),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),overflowX:cs.overflowX};
   }).filter(v=>v.right>innerWidth+1&&v.width>0).sort((a,b)=>b.right-a.right).slice(0,20));
   console.error('OVERFLOW_DETAILS '+config.name+' '+JSON.stringify(protruding));
  }
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
 await writeFile(join(imageDir,'VISUAL_QA.txt'),'Local OFFLINE Explorer visual preview. All status data unavailable; rainbow marked illustrative.\n'+cases.map(c=>c.name).join('\n')+'\n');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
