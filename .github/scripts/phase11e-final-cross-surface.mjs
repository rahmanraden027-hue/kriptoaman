import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const LIVE = process.env.PHASE11E_LIVE || 'https://kriptoaman.com';
const CANDIDATE = process.env.PHASE11E_CANDIDATE || 'http://127.0.0.1:4173';
const PUBLIC_HREFS = ['/', '/Market', '/IntelligenceHub', '/ZEVARYQ', '/Services'];
const WORKSPACE_HREFS = ['/dashboard', '/Market', '/IntelligenceHub', '/ZEVARYQ', '/Services'];
const CANONICAL_STATES = ['LIVE', 'VERIFIED', 'SYNCED', 'PARTIAL', 'SNAPSHOT', 'UNAVAILABLE', 'CHECKING'];
const MOCK_USER = { id:'phase11e-user', email:'phase11e@kriptoaman.local', full_name:'Phase 11E User', role:'user' };

await fs.mkdir('phase11e-evidence', { recursive: true });
const browser = await chromium.launch({ headless: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function newContext({ width, height, authenticated=false, candidate=false }) {
  const context = await browser.newContext({
    viewport: { width, height },
    locale: 'id-ID',
    reducedMotion: 'reduce',
    isMobile: width < 600,
    hasTouch: width < 900,
    deviceScaleFactor: 1,
  });
  await context.addInitScript(() => {
    localStorage.setItem('ka_language','id');
    localStorage.setItem('_ka_disclaimer_accepted_v2','1');
    localStorage.removeItem('cv_pin_enabled');
  });
  const page = await context.newPage();

  if (candidate) {
    await page.route('**/api/**', async route => {
      const req=route.request();
      const url=new URL(req.url());
      if (url.pathname==='/api/auth/me' && req.method()==='GET') {
        return route.fulfill({
          status: authenticated ? 200 : 401,
          contentType:'application/json',
          body: JSON.stringify(authenticated ? { user: MOCK_USER } : { error:'Unauthenticated Phase 11E fixture' }),
        });
      }
      return route.fulfill({ status:503, contentType:'application/json', body:JSON.stringify({ error:'Phase 11E fail-closed fixture' }) });
    });
  }
  return { context, page };
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1200);
}

async function navSnapshot(page, expected) {
  return page.evaluate(expectedHrefs => {
    for (const nav of [...document.querySelectorAll('nav,aside')]) {
      const links=[...nav.querySelectorAll('a[href]')];
      const hrefs=[...new Set(links.map(a=>new URL(a.href,location.href).pathname).filter(x=>expectedHrefs.includes(x)))];
      if (expectedHrefs.every(x=>hrefs.includes(x))) {
        const active=links.find(a=>a.getAttribute('aria-current')==='page');
        return { hrefs, activeHref:active ? new URL(active.href,location.href).pathname : null };
      }
    }
    return null;
  }, expected);
}

async function surfaceSnapshot(page) {
  return page.evaluate(states => {
    const text=document.body.innerText;
    const bottomNav=document.querySelector('.ka-embedded-nav, nav[aria-label="Mobile primary navigation"], nav[aria-label="Navigasi utama"]');
    const r=bottomNav?.getBoundingClientRect();
    return {
      path:location.pathname,
      title:document.title,
      width:innerWidth,
      scrollWidth:document.documentElement.scrollWidth,
      brand:/KRIPTOAMAN|KriptoAman/.test(text),
      stateWords:states.filter(s=>new RegExp('\\b'+s+'\\b').test(text)),
      bottomNav: r ? { top:r.top, bottom:r.bottom, height:r.height } : null,
      shell:Boolean(document.querySelector('.ka-global-shell')),
      topbar:Boolean(document.querySelector('.ka-global-topbar')),
      sidebar:Boolean(document.querySelector('.ka-global-sidebar')),
      embedded:Boolean(document.querySelector('.ka-embedded-nav')),
      text:text.slice(0,1200),
    };
  }, CANONICAL_STATES);
}

function checkGeometry(s,label,{mobile=false,stateRequired=false}={}) {
  assert(s.scrollWidth <= s.width + 1, label+': horizontal overflow '+s.scrollWidth+' > '+s.width);
  assert(s.brand, label+': KriptoAman brand missing');
  if (stateRequired) assert(s.stateWords.length>0,label+': canonical production state missing');
  if (mobile && s.bottomNav) {
    assert(s.bottomNav.height >= 44,label+': bottom navigation touch area too small');
    assert(s.bottomNav.bottom <= 845,label+': bottom navigation extends beyond viewport');
  }
}

async function livePublic() {
  const {context,page}=await newContext({width:390,height:844});
  const out=[];
  try {
    for (const spec of [
      {path:'/',active:'/',state:true},
      {path:'/Market',active:'/Market',state:true},
      {path:'/ZEVARYQ',active:'/ZEVARYQ',state:true},
      {path:'/Services',active:'/Services',state:false},
    ]) {
      await page.goto(LIVE+spec.path,{waitUntil:'domcontentloaded',timeout:60000});
      await settle(page);
      const nav=await navSnapshot(page,PUBLIC_HREFS);
      const snap=await surfaceSnapshot(page);
      assert(nav,label(spec.path)+': canonical nav missing');
      assert(nav.activeHref===spec.active,label(spec.path)+': active nav mismatch '+nav.activeHref);
      checkGeometry(snap,label(spec.path),{mobile:true,stateRequired:spec.state});
      await page.screenshot({path:'phase11e-evidence/live-mobile-'+slug(spec.path)+'.png',fullPage:true});
      out.push({route:spec.path,nav,snap});
    }

    await page.goto(LIVE+'/IntelligenceHub',{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForURL(/\/login(?:\?|$)/,{timeout:15000});
    out.push({route:'/IntelligenceHub',boundary:'LOGIN_REQUIRED',resolved:new URL(page.url()).pathname});

    await page.goto(LIVE+'/wallet-app',{waitUntil:'domcontentloaded',timeout:60000});
    await settle(page);
    const wallet=await surfaceSnapshot(page);
    assert(/ZEVARYQ/i.test(await page.locator('body').innerText()),'live wallet: ZEVARYQ identity missing');
    assert(/Connect Wallet|Receive ZVQ|My Wallet Assets/i.test(await page.locator('body').innerText()),'live wallet: wallet surface incomplete');
    checkGeometry(wallet,'live /wallet-app',{mobile:true,stateRequired:false});
    await page.screenshot({path:'phase11e-evidence/live-mobile-wallet.png',fullPage:true});
    out.push({route:'/wallet-app',snap:wallet});
  } finally { await context.close(); }
  return out;
}

function slug(path){ return path==='/'?'home':path.slice(1).toLowerCase(); }
function label(path){ return 'live '+path; }

async function candidateAuthenticated({width,height,name}) {
  const {context,page}=await newContext({width,height,authenticated:true,candidate:true});
  const out=[];
  try {
    const journey=[
      {path:'/dashboard',active:'/dashboard',state:true},
      {path:'/Market',active:'/Market',state:true},
      {path:'/IntelligenceHub',active:'/IntelligenceHub',state:true},
      {path:'/ZEVARYQ',active:'/ZEVARYQ',state:true},
      {path:'/Services',active:'/Services',state:false},
    ];
    for (const step of journey) {
      await page.goto(CANDIDATE+step.path,{waitUntil:'domcontentloaded',timeout:60000});
      await page.locator('.ka-global-shell').waitFor({state:'attached',timeout:30000});
      await settle(page);
      const nav=await navSnapshot(page,WORKSPACE_HREFS);
      const snap=await surfaceSnapshot(page);
      assert(nav,name+' '+step.path+': canonical nav missing');
      assert(nav.activeHref===step.active,name+' '+step.path+': active nav mismatch '+nav.activeHref);
      assert(snap.shell && snap.topbar,name+' '+step.path+': workspace shell incomplete');
      if(width>=1024) assert(snap.sidebar,name+' '+step.path+': desktop sidebar missing');
      else assert(snap.embedded,name+' '+step.path+': mobile embedded navigation missing');
      checkGeometry(snap,name+' '+step.path,{mobile:width<600,stateRequired:step.state});
      await page.screenshot({path:'phase11e-evidence/'+name+'-'+slug(step.path)+'.png',fullPage:true});
      out.push({route:step.path,nav,snap});
    }
  } finally { await context.close(); }
  return out;
}

try {
  const live=await livePublic();
  const authMobile=await candidateAuthenticated({width:390,height:844,name:'candidate-auth-mobile'});
  const authDesktop=await candidateAuthenticated({width:1440,height:1000,name:'candidate-auth-desktop'});
  const report={
    liveTarget:LIVE,
    candidateTarget:CANDIDATE,
    generatedAt:new Date().toISOString(),
    policy:{
      livePublic:'real production, read-only',
      authenticated:'candidate browser auth fixture only',
      realCredentialsUsed:false,
      nonAuthCandidateApis:'503 fail-closed',
    },
    live,
    authMobile,
    authDesktop,
  };
  await fs.writeFile('phase11e-evidence/final-cross-surface-report.json',JSON.stringify(report,null,2));
  console.log('PHASE11E_LIVE_PUBLIC=PASS');
  console.log('PHASE11E_AUTH_MOBILE=PASS');
  console.log('PHASE11E_AUTH_DESKTOP=PASS');
  console.log('PHASE11E_FINAL_CROSS_SURFACE=PASS');
} finally {
  await browser.close();
}
