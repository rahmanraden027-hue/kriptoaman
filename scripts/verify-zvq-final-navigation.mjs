// Live read-only navigation acceptance: existing Explorer routes only.
// Never signs, broadcasts, modifies chain state, deploys services or changes DNS.
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const playwrightPath=process.env.PLAYWRIGHT_CORE;
const chromePath=process.env.ZVQ_CHROME;
if(!playwrightPath||!chromePath)throw Error('PLAYWRIGHT_CORE and ZVQ_CHROME are required');
const {chromium}=await import(pathToFileURL(playwrightPath).href);
const proofDir=resolve(process.env.ZVQ_NAV_EVIDENCE_DIR||'zvq-navigation-evidence');
await mkdir(proofDir,{recursive:true});
const run=String(process.env.GITHUB_RUN_ID||'manual').replace(/[^a-z0-9_-]/gi,'');
const root='https://explorer.kriptoaman.com';
const cases=[{name:'android-390',width:390,height:844},{name:'desktop-1440',width:1440,height:900}];
const history=[];
const browser=await chromium.launch({headless:true,executablePath:chromePath,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
try{
 for(const config of cases){
  const context=await browser.newContext({viewport:{width:config.width,height:config.height},deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await context.newPage();
  const jsErrors=[],routes=[];
  page.on('pageerror',error=>jsErrors.push(String(error)));
  const visit=async (path,selector)=>{
   const result=await page.goto(root+path,{waitUntil:'domcontentloaded',timeout:30000});
   const status=result?.status()??0;
   routes.push({path,status});
   assert.equal(status,200,'Explorer route '+path+' must be served without 404/503');
   if(selector)await page.locator(selector).waitFor({state:'attached',timeout:15000});
  };
  const home=()=>visit('/?navigation_acceptance='+run,'[data-zvq-network-telemetry="production-v3"]');
  const menuLink=async href=>{
   if(config.width<=1050){
    await page.locator('#menu').click();
    assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true','mobile menu must open');
   }
   await page.locator('#nav a[href="'+href+'"]').click();
  };
  try{
   await home();
   assert.equal(await page.locator('.official-emblem').count(),2,'Master V2 must have two placements');
   const logos=await page.locator('.official-emblem').evaluateAll(items=>items.map(i=>({loaded:i.complete,width:i.naturalWidth})));
   assert.ok(logos.every(i=>i.loaded&&i.width>0),'ZVQ Master V2 must decode');
   await page.locator('#metrics').waitFor({state:'attached'});
   await page.locator('#infra').waitFor({state:'attached'});
   await menuLink('#metrics');
   assert.equal(new URL(page.url()).hash,'#metrics','Network Data must jump to Network Health');
   if(config.width<=1050)assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false','mobile menu must close after click');
   await menuLink('#infra');
   assert.equal(new URL(page.url()).hash,'#infra','Infrastructure must jump to evidence panel');
   await menuLink('#token-discovery');
   assert.equal(new URL(page.url()).hash,'#token-discovery','Tokens must jump to discovery panel');
   assert.ok(await page.locator('#token-discovery a[href="/tokens"]').count()===1,'token directory link must exist');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=1,'No horizontal overflow at '+config.width);
   await page.screenshot({path:join(proofDir,config.name+'-home.png'),fullPage:true,animations:'disabled'});
   for(const [href,expectedHeading] of [['/blocks','Blocks'],['/txs','Transactions'],['/validators','ZVQ Proposer Observatory']]){
    await home();
    if(config.width<=1050)await page.locator('#menu').click();
    const [response]=await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),page.locator('#nav a[href="'+href+'"]').click()]);
    const status=response?.status()??0;
    routes.push({path:href,status,clicked:true});
    assert.equal(status,200,'Navigation to '+href+' must never be 404/503');
    assert.ok((await page.locator('body').innerText()).includes(expectedHeading),href+' page must show '+expectedHeading);
   }
   await home();
   await page.locator('#token-discovery a[href="/tokens"]').click();
   await page.waitForURL('**/tokens',{timeout:30000});
   assert.match(await page.title(),/ZVQ Token Registry/);
   assert.ok((await page.locator('body').innerText()).includes('Legacy WKAM reference'),'WKAM must be explicitly historical');
   assert.ok((await page.locator('body').innerText()).includes('Token evidence'),'Latest registry copy must be deployed');
   const historyLink=page.locator('#legacy-wkam a[href^="/tokens?address="]');
   assert.equal(await historyLink.count(),1,'Legacy address must navigate through a valid registry route');
   await historyLink.click();
   await page.waitForURL('**/tokens?address=**');
   await page.locator('#selected-token-state').waitFor({state:'visible',timeout:10000});
   assert.ok(await page.locator('#selected-token').isVisible(),'Selected contract evidence panel must be visible');
   const selected=await page.locator('#selected-token-state').innerText();
   assert.ok(/INDEXED|not verifiable|Checking/.test(selected),'Token metadata must be indexed or fail closed');
   await visit('/api-docs','body');
   await page.screenshot({path:join(proofDir,config.name+'-final.png'),fullPage:true,animations:'disabled'});
   assert.deepEqual(jsErrors,[],'No uncaught errors across Explorer navigation');
   const outcome={device:config.name,status:'PASS',routes,jsErrors,tokenEvidence:selected};
   history.push(outcome);
   console.log('ZVQ_NAVIGATION_PASS '+JSON.stringify(outcome));
  }catch(e){
   await page.screenshot({path:join(proofDir,config.name+'-failure.png'),fullPage:true,animations:'disabled'}).catch(()=>{});
   const failure={device:config.name,status:'FAIL',error:String(e),currentUrl:page.url(),routes,jsErrors};
   history.push(failure);
   console.error('ZVQ_NAVIGATION_FAIL '+JSON.stringify(failure));
   throw e;
  }finally{
   await context.close();
  }
 }
}finally{
 await writeFile(join(proofDir,'navigation-proof.json'),JSON.stringify({checkedAt:new Date().toISOString(),release:'Explorer Visual Master V3',scope:'read-only public route/navigation acceptance',history},null,2));
 await browser.close();
}
