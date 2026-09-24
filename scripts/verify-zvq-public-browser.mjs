// Read-only public browser proof: verify real UI hydration, not just HTTP 200 or static HTML.
// No credentials, wallet signing, writes to production, deployments, or chain mutations.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';

const modulePath=process.env.PLAYWRIGHT_CORE;
const chromePath=process.env.ZVQ_CHROME;
if(!modulePath||!chromePath)throw Error('PLAYWRIGHT_CORE and ZVQ_CHROME are required');
const {chromium}=await import(pathToFileURL(modulePath).href);
const evidenceDir=resolve(process.env.ZVQ_BROWSER_EVIDENCE_DIR||'zvq-public-browser-proof');
await mkdir(evidenceDir,{recursive:true});
const runId=String(process.env.GITHUB_RUN_ID||'manual').replace(/[^0-9a-z_-]/gi,'');
const url='https://explorer.kriptoaman.com/?zvq_browser_proof='+runId;
const cases=[{name:'android-390',width:390,height:844},{name:'desktop-1440',width:1440,height:900}];
let browser;
const report=[];
try{
 browser=await chromium.launch({headless:true,executablePath:chromePath,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 for(const config of cases){
  const context=await browser.newContext({viewport:{width:config.width,height:config.height},deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await context.newPage();
  const pageErrors=[],requestFailures=[],backendResponses=[];
  page.on('pageerror',error=>pageErrors.push(String(error)));
  page.on('requestfailed',request=>{
   if(/\/rpc(?:\?|$)|\/api\/v2\//.test(request.url())||request.url().startsWith('https://rpc.kriptoaman.com/'))
    requestFailures.push({url:request.url(),failure:request.failure()?.errorText||'unknown'});
  });
  page.on('response',response=>{
   if(/\/api\/v2\/blocks(?:\?|$)/.test(response.url())||response.url().startsWith('https://rpc.kriptoaman.com/'))
    backendResponses.push({url:response.url(),status:response.status()});
  });
  let snapshot;
  try{
   const navigation=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
   assert.equal(navigation?.status(),200,'public homepage must return HTTP 200');
   await page.waitForFunction(()=>{
    const trust=document.querySelector('#trust')?.textContent?.trim();
    const rows=document.querySelectorAll('#blocks a[href^="/block/"]').length;
    const source=document.querySelector('#liveText')?.textContent||'';
    return (trust==='INDEXED'||trust==='LIVE')&&rows>=1&&/indexed|live/i.test(source);
   },null,{timeout:40000,polling:500});
   snapshot=await page.evaluate(()=>{
    const root=document.documentElement;
    const imgs=[...document.querySelectorAll('.official-emblem')];
    const cells=[...document.querySelectorAll('#blocks tr')];
    const heights=cells.map(row=>row.querySelector('a[href^="/block/"]')?.textContent?.trim()).filter(Boolean);
    const wave=document.querySelector('#rainbowWaves');
    return{
     viewport:innerWidth,scrollWidth:root.scrollWidth,
     trust:document.querySelector('#trust')?.textContent?.trim(),
     chainLabel:document.body.innerText.includes('Chain ID 22028'),
     visual:root.getAttribute('data-zvq-reference-visual'),
     ribbonMode:document.querySelector('#rainbowDataStatus')?.textContent?.trim(),
     ribbonProvenance:wave?.dataset.provenance,
     ribbons:wave?.querySelectorAll('.rainbowWave').length,
     logos:imgs.map(i=>({ready:i.complete,width:i.naturalWidth,height:i.naturalHeight})),
     heights,
     hero:document.querySelector('.earth-brandmark')!==null
    };
   });
   assert.equal(snapshot.visual,'blue-gold-orbital-20260924','approved visual identity unchanged');
   assert.equal(snapshot.chainLabel,true,'ZVQ Chain ID must remain visible');
   assert.equal(snapshot.viewport,config.width,'viewport');
   assert.ok(snapshot.scrollWidth<=config.width+1,'horizontal overflow at '+config.width+'px');
   assert.equal(snapshot.logos.length,3,'all three approved ZVQ logo placements');
   assert.ok(snapshot.logos.every(i=>i.ready&&i.width>0&&i.height>0),'logo assets must decode');
   assert.equal(snapshot.hero,true,'approved globe/emblem element');
   assert.ok(snapshot.heights.length>=1,'indexed block anchors must be displayed');
   assert.match(snapshot.heights[0],/^#\d+$/,'real indexed height display');
   assert.equal(snapshot.ribbons,8,'exactly eight approved rainbow ribbons');
   assert.ok(['indexed','illustrative'].includes(snapshot.ribbonProvenance),
    'rainbow provenance must never be fabricated');
   assert.deepEqual(pageErrors,[],'no uncaught JavaScript errors');
   await page.screenshot({path:join(evidenceDir,config.name+'.png'),fullPage:true,animations:'disabled'});
   const result={viewport:config.name,result:'PASS',snapshot,backendResponses,requestFailures,pageErrors};
   report.push(result);
   console.log('PUBLIC_BROWSER_OK '+JSON.stringify({viewport:config.name,trust:snapshot.trust,blocks:snapshot.heights.length,tip:snapshot.heights[0],rainbow:snapshot.ribbonMode,logos:snapshot.logos.length,jsErrors:pageErrors.length}));
  }catch(error){
   await page.screenshot({path:join(evidenceDir,config.name+'-failure.png'),fullPage:true,animations:'disabled'}).catch(()=>{});
   report.push({viewport:config.name,result:'FAIL',error:String(error),backendResponses,requestFailures,pageErrors,observed:await page.evaluate(()=>({trust:document.querySelector('#trust')?.textContent,probe:document.querySelector('#probeDetails')?.textContent,blockText:document.querySelector('#blocks')?.textContent?.slice(0,250)})).catch(()=>null)});
   console.error('PUBLIC_BROWSER_FAIL '+JSON.stringify(report.at(-1)));
   throw error;
  }finally{await context.close();}
 }
}finally{
 await writeFile(join(evidenceDir,'proof.json'),JSON.stringify({checkedAt:new Date().toISOString(),url,scope:'read-only public Explorer browser hydration',report},null,2));
 if(browser)await browser.close();
}
