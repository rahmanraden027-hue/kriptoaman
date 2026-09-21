const HOME = `<!doctype html>
<html lang="en" data-zevaryq-explorer-version="1.0.0">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#020815">
<title>ZEVARYQ EXPLORER · Zevaryq Network</title>
<meta name="description" content="ZEVARYQ EXPLORER — verify ZVQ Mainnet blocks, transactions, validators and network signals from on-chain data.">
<meta property="og:title" content="ZEVARYQ EXPLORER">
<meta property="og:description" content="On-chain intelligence for Zevaryq Network · Chain ID 22028">
<meta property="og:type" content="website">
<meta property="og:url" content="https://explorer.kriptoaman.com/">
<style>
:root{--bg:#010612;--panel:rgba(5,19,42,.82);--panel2:rgba(2,10,25,.94);--line:rgba(34,171,255,.28);--cyan:#35dcff;--blue:#1678ff;--gold:#e8b84c;--green:#38e6a5;--red:#ff7385;--muted:#83a0bd;--text:#f2f8ff}
*{box-sizing:border-box}html{background:var(--bg);scroll-behavior:smooth}body{margin:0;color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;background:radial-gradient(circle at 80% 2%,#092d68 0,transparent 32%),radial-gradient(circle at 10% 25%,rgba(201,151,42,.08),transparent 24%),linear-gradient(180deg,#010612,#031021 54%,#01050c);overflow-x:hidden}body:before{content:"";position:fixed;inset:0;pointer-events:none;background-image:linear-gradient(rgba(55,143,230,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(55,143,230,.03) 1px,transparent 1px);background-size:48px 48px}a{color:inherit;text-decoration:none}.shell{width:min(1440px,calc(100% - 28px));margin:auto;padding:14px 0 40px}.glass{background:linear-gradient(145deg,var(--panel),var(--panel2));border:1px solid var(--line);box-shadow:0 24px 80px rgba(0,35,91,.3),inset 0 1px rgba(255,255,255,.03);backdrop-filter:blur(18px)}header{position:sticky;top:8px;z-index:20;border-radius:20px;padding:10px 14px;display:flex;align-items:center;gap:24px}.brand{display:flex;align-items:center;gap:11px;margin-right:auto}.logo{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;border:1px solid rgba(71,201,255,.45);background:radial-gradient(circle at 30% 20%,#1357b5,#031126 64%);box-shadow:0 0 26px rgba(25,155,255,.25);font-weight:1000;color:var(--gold);font-size:18px;letter-spacing:-2px}.brand b{display:block;letter-spacing:.08em}.brand small{display:block;color:#75b8ef;margin-top:2px}.nav{display:flex;gap:5px}.nav a{padding:10px 12px;border:1px solid transparent;border-radius:11px;font-size:12px;color:#bdd0e3}.nav a:hover{border-color:var(--line);color:#fff}.mainnet{padding:9px 12px;border:1px solid rgba(56,230,165,.35);border-radius:999px;color:#83f8ce;font-size:11px;font-weight:900}.mainnet i{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 12px var(--green);margin-right:7px}.menu{display:none;border:1px solid var(--line);background:#07172e;color:white;border-radius:11px;width:44px;height:44px;font-size:20px}
.hero{margin-top:13px;border-radius:30px;min-height:520px;padding:42px;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(420px,.95fr);align-items:center;gap:18px;overflow:hidden}.eyebrow{font-size:11px;letter-spacing:.2em;color:#68dfff;font-weight:900}.hero h1{font-size:clamp(46px,6vw,82px);line-height:.94;letter-spacing:-.055em;margin:15px 0}.hero h1 span{display:block;background:linear-gradient(90deg,#5ee3ff,#308cff 48%,#efc15b);-webkit-background-clip:text;color:transparent}.hero p{max-width:660px;color:#9bb3ca;font-size:15px;line-height:1.65}.badges{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}.badge{padding:8px 11px;border-radius:999px;border:1px solid rgba(62,174,255,.26);background:rgba(4,22,48,.7);font-size:10px;color:#c9dced}.badge b{color:white}.search{display:flex;gap:8px;max-width:760px}.search input{height:56px;flex:1;min-width:0;border-radius:16px;border:1px solid rgba(44,174,255,.45);background:rgba(0,6,18,.82);color:white;padding:0 17px;font-size:14px;outline:none}.search input:focus{border-color:var(--cyan);box-shadow:0 0 0 3px rgba(53,220,255,.08)}.search button{height:56px;padding:0 24px;border:0;border-radius:16px;background:linear-gradient(120deg,#087cff,#197fff 55%,#d19d35);color:white;font-weight:900;cursor:pointer;min-width:130px}.searchmsg{height:20px;font-size:11px;color:var(--muted);margin-top:8px}.searchmsg.error{color:#ff9dac}
.space{height:420px;position:relative;isolation:isolate}.earth{position:absolute;width:360px;height:360px;border-radius:50%;right:6%;top:38px;background:radial-gradient(circle at 35% 26%,rgba(73,217,255,.9) 0 2%,transparent 3%),radial-gradient(ellipse at 42% 43%,#1683dd 0 8%,#0c4c92 9% 20%,transparent 21%),radial-gradient(ellipse at 62% 65%,#2995d8 0 9%,#0b3769 10% 21%,transparent 22%),radial-gradient(circle at 42% 38%,#0e69bd,#052b5b 52%,#010814 72%);border:1px solid rgba(60,201,255,.55);box-shadow:inset -55px -45px 70px #010711,inset 20px 12px 45px rgba(72,220,255,.27),0 0 75px rgba(17,128,255,.32)}.earth:after{content:"ZV";position:absolute;inset:0;display:grid;place-items:center;font-size:64px;font-weight:1000;color:rgba(238,190,82,.87);text-shadow:0 0 28px rgba(233,178,56,.48)}.orbit{position:absolute;right:-2%;top:50%;width:430px;height:155px;border:1px solid rgba(236,186,70,.68);border-radius:50%;transform:rotate(-17deg);box-shadow:0 0 15px rgba(230,174,48,.1)}.orbit.o2{transform:rotate(20deg);border-color:rgba(53,220,255,.5)}.sat{position:absolute;width:48px;height:18px;background:linear-gradient(90deg,#1e65ad 0 30%,#d8ac48 31% 68%,#1e65ad 69%);border:1px solid #5fdfff;box-shadow:0 0 18px #159cff}.sat:after{content:"";position:absolute;width:3px;height:18px;background:#e9bd58;left:22px;top:17px}.s1{right:4%;top:82px;transform:rotate(18deg)}.s2{left:5%;top:250px;transform:rotate(-18deg)}.s3{right:28%;bottom:8px;transform:rotate(8deg)}.netdot{position:absolute;width:7px;height:7px;border-radius:50%;background:var(--cyan);box-shadow:0 0 16px var(--cyan)}.d1{right:24%;top:120px}.d2{right:8%;top:230px}.d3{right:39%;top:280px}
.strip{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;margin:13px 0}.strip>div{border-radius:18px;padding:16px 18px}.strip b{display:block;font-size:14px}.strip small{color:var(--muted)}.live{color:var(--green)}.label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}.value{font-size:24px;font-weight:950;margin:6px 0}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:13px}.card{min-height:125px;border-radius:20px;padding:16px}.card .value{font-size:27px}.source{font-size:9px;color:#6c89a7;margin-top:8px;text-transform:uppercase;letter-spacing:.08em}.section{border-radius:24px;padding:20px;margin-bottom:13px}.sectionhead{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}.section h2{margin:0;font-size:20px}.section p{margin:4px 0 0;color:var(--muted);font-size:11px}.twocol{display:grid;grid-template-columns:1fr 1fr;gap:13px}.viz{min-height:320px;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 70%,rgba(12,107,217,.25),transparent 42%),linear-gradient(180deg,rgba(1,7,18,.5),rgba(2,13,30,.85));border:1px solid rgba(42,159,255,.16);border-radius:18px}.world{position:absolute;inset:20px;background:radial-gradient(ellipse at center,rgba(22,119,211,.22),transparent 66%);opacity:.8}.world:after{content:"";position:absolute;inset:12% 6%;border:1px dotted rgba(66,204,255,.5);border-radius:48%;box-shadow:0 0 50px rgba(31,150,255,.15)}.viznote{position:absolute;left:18px;bottom:18px;color:#8faac3;font-size:11px}.satview{min-height:430px}.satview .earth{width:420px;height:420px;right:calc(50% - 210px);top:115px}.satview .orbit{right:calc(50% - 270px);top:270px;width:540px}.statsrow{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}.mini{border:1px solid rgba(59,160,248,.15);border-radius:14px;padding:12px;background:rgba(2,12,28,.55)}.mini b{display:block;margin-top:5px}.health{display:grid;gap:0}.healthrow{display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px solid rgba(68,142,220,.1);font-size:12px}.state{font-weight:900}.state.online{color:var(--green)}.state.degraded{color:#ffd16b}.state.offline{color:var(--red)}.state.unknown{color:#8da4ba}.stream{display:flex;gap:9px;overflow:auto;padding-bottom:5px}.blockcard{flex:0 0 160px;border:1px solid var(--line);border-radius:15px;padding:12px;background:rgba(3,17,37,.78);cursor:pointer}.blockcard b{color:var(--cyan)}.blockcard small{display:block;color:var(--muted);margin-top:6px}.tablewrap{overflow:auto}.table{width:100%;min-width:850px;border-collapse:collapse}.table th{text-align:left;color:#7591ad;font-size:9px;letter-spacing:.1em;padding:10px;border-bottom:1px solid var(--line)}.table td{font-size:11px;padding:12px 10px;border-bottom:1px solid rgba(65,143,222,.08);white-space:nowrap}.table a{color:#5cdaff}.empty{color:#839ab1;padding:20px 8px}.footer{display:flex;justify-content:space-between;color:#667f99;font-size:10px;padding:12px 4px}.tag{border:1px solid var(--line);padding:6px 9px;border-radius:999px;color:#a9c6df;font-size:9px}
@media(max-width:1050px){.hero{grid-template-columns:1fr;padding:30px}.space{height:380px}.strip{grid-template-columns:1fr}.grid{grid-template-columns:repeat(2,1fr)}.twocol{grid-template-columns:1fr}.nav{display:none}.menu{display:block}.nav.open{display:flex;position:absolute;top:68px;right:12px;flex-direction:column;background:#041126;border:1px solid var(--line);border-radius:14px;padding:8px;min-width:190px}.nav.open a{min-height:44px}}
@media(max-width:767px){.shell{width:calc(100% - 16px);padding-top:8px}header{top:5px;padding:8px}.brand b{font-size:13px}.brand small{font-size:9px}.logo{width:44px;height:44px}.mainnet{display:none}.hero{padding:23px 16px;border-radius:23px;min-height:0}.hero h1{font-size:44px}.search{display:grid}.search button{width:100%}.space{height:330px}.earth{width:280px;height:280px;right:calc(50% - 140px);top:28px}.orbit{width:330px;right:calc(50% - 165px);top:150px}.satview{min-height:350px}.satview .earth{width:310px;height:310px;right:calc(50% - 155px);top:105px}.satview .orbit{width:360px;right:calc(50% - 180px);top:210px}.grid,.statsrow{grid-template-columns:1fr 1fr}.card{min-height:110px;padding:13px}.section{padding:15px}.footer{display:block;line-height:1.8}}
</style>
</head>
<body><div class="shell">
<header class="glass">
<a class="brand" href="/"><span class="logo">ZV</span><span><b>ZEVARYQ EXPLORER</b><small>Zevaryq Network</small></span></a>
<nav class="nav" id="nav"><a href="/blocks">Blocks</a><a href="/txs">Transactions</a><a href="/validators">Validators</a><a href="/analytics">Analytics</a><a href="/network">More</a></nav>
<span class="mainnet"><i></i>MAINNET</span><button class="menu" id="menu" aria-label="Toggle navigation">☰</button>
</header>
<main>
<section class="hero glass">
<div><div class="eyebrow">ZEVARYQ NETWORK · ON-CHAIN INTELLIGENCE</div><h1>Explore the<span>Zevaryq Network.</span></h1><p>Verify every block, transaction, validator, and network signal directly from on-chain data.</p>
<div class="badges"><span class="badge">Chain ID <b>22028</b></span><span class="badge"><b>ZVQ Mainnet</b></span><span class="badge">EVM Compatible</span><span class="badge">Verified On-Chain Data</span></div>
<form class="search" id="search"><input id="q" autocomplete="off" placeholder="Search address / transaction hash / block number..." aria-label="Universal explorer search"><button>Explore →</button></form><div class="searchmsg" id="searchmsg"></div></div>
<div class="space" aria-label="Illustrative Earth and satellite network"><div class="earth"></div><div class="orbit"></div><div class="orbit o2"></div><span class="sat s1"></span><span class="sat s2"></span><span class="sat s3"></span><i class="netdot d1"></i><i class="netdot d2"></i><i class="netdot d3"></i></div>
</section>
<section class="strip"><div class="glass"><b>ZVQ Mainnet</b><small id="liveText">Status unavailable · live data via RPC & Indexer</small></div><div class="glass"><span class="label">Chain ID</span><span class="value">22028</span></div><div class="glass"><span class="label">Data trust</span><span class="value" id="trust">UNAVAILABLE</span></div></section>
<section class="grid" id="metrics"></section>
<section class="twocol">
<div class="section glass"><div class="sectionhead"><div><h2>Consensus & Finality</h2><p>Verified on-chain signals only</p></div><span class="tag">QBFT evidence where available</span></div><div class="statsrow" id="consensus"></div></div>
<div class="section glass"><div class="sectionhead"><div><h2>Network Performance</h2><p>Calculated and observed telemetry</p></div></div><div class="statsrow" id="performance"></div></div>
</section>
<section class="section glass"><div class="sectionhead"><div><h2>Global Node Topology</h2><p>Illustrative visualization; geography appears only with verified evidence</p></div></div><div class="viz"><div class="world"></div><div class="viznote">Topology data unavailable</div></div></section>
<section class="section glass"><div class="sectionhead"><div><h2>Satellite Network View</h2><p>Global Connectivity · Real-World Infrastructure</p></div><span class="tag">Illustrative visualization</span></div><div class="viz satview"><div class="earth"></div><div class="orbit"></div><div class="orbit o2"></div><span class="sat s1"></span><span class="sat s2"></span><span class="sat s3"></span><div class="viznote">No claim of owned physical satellites or ground infrastructure.</div></div><div class="statsrow" id="satstats"></div></section>
<section class="twocol">
<div class="section glass"><div class="sectionhead"><div><h2>Infrastructure Status</h2><p>States originate from current public probes</p></div></div><div class="health" id="infra"></div></div>
<div class="section glass"><div class="sectionhead"><div><h2>Security Intelligence</h2><p>Evidence-based observations</p></div></div><div class="health" id="security"></div></div>
</section>
<section class="twocol">
<div class="section glass"><div class="sectionhead"><div><h2>Network Activity Flow</h2><p>Total indexed transaction activity; no fabricated categories</p></div></div><div class="viz" style="min-height:230px"><svg viewBox="0 0 800 220" width="100%" height="220" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#25cfff" stop-opacity=".45"/><stop offset="1" stop-color="#1678ff" stop-opacity="0"/></linearGradient></defs><path id="area" fill="url(#g)" stroke="#2ad9ff" stroke-width="3" d="M0 190 L800 190 L800 220 L0 220Z"/></svg><div class="viznote" id="activityNote">Transaction data pending</div></div></div>
<div class="section glass"><div class="sectionhead"><div><h2>Mempool & Fee Intelligence</h2><p>Safe public telemetry only</p></div></div><div class="statsrow" id="fees"></div></div>
</section>
<section class="section glass"><div class="sectionhead"><div><h2>Validator Intelligence</h2><p>Observed proposer evidence; identities are never fabricated</p></div><a class="tag" href="/validators">View validators</a></div><div id="validators" class="empty">Validator evidence unavailable</div></section>
<section class="section glass"><div class="sectionhead"><div><h2>Realtime Block Stream</h2><p>Refreshes every 12 seconds from Blockscout</p></div><a class="tag" href="/blocks">View all</a></div><div class="stream" id="stream"><span class="empty">Block data temporarily unavailable. No values are estimated.</span></div></section>
<section class="section glass"><div class="sectionhead"><div><h2>Latest Blocks</h2><p>Indexed, clickable Blockscout data</p></div><span class="tag" id="freshness">Data pending</span></div><div class="tablewrap"><table class="table"><thead><tr><th>#</th><th>AGE</th><th>TRANSACTIONS</th><th>GAS USED</th><th>VALIDATOR</th><th>HASH</th></tr></thead><tbody id="blocks"><tr><td colspan="6" class="empty">Block data temporarily unavailable. No values are estimated.</td></tr></tbody></table></div></section>
</main><footer class="footer"><span>ZEVARYQ EXPLORER · Zevaryq Network · ZVQ Mainnet</span><span>Chain ID 22028 · Data states: LIVE / INDEXED / CALCULATED / PREVIEW / UNAVAILABLE</span></footer>
</div>
<script>
const EXPECTED_CHAIN='0x560c',RPC='/rpc',API='/api/v2';
const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={rpc:false,api:false,blocks:[],rpcLatency:null,head:null,gas:null};
const unavailable='Unavailable';
function short(v,n=8){if(!v)return '—';return v.length>n*2?v.slice(0,n)+'…'+v.slice(-n):v}
function age(ts){if(!ts)return '—';const s=Math.max(0,Math.floor((Date.now()-new Date(ts).getTime())/1000));return s<60?s+'s ago':s<3600?Math.floor(s/60)+'m ago':Math.floor(s/3600)+'h ago'}
async function getJSON(url,opt={},ms=8000){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{...opt,signal:c.signal,headers:{accept:'application/json',...(opt.headers||{})}});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(t)}}
async function rpc(method,params=[]){return getJSON(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})})}
function mini(label,value,source='UNAVAILABLE'){return '<div class="mini"><span class="label">'+label+'</span><b>'+esc(value)+'</b><span class="source">'+source+'</span></div>'}
function health(label,status){return '<div class="healthrow"><span>'+label+'</span><span class="state '+status.toLowerCase()+'">'+status+'</span></div>'}
function renderStatic(){
 const cards=[['Latest Block',state.head??unavailable,state.head?'LIVE':'UNAVAILABLE'],['Finalized Block',unavailable,'UNAVAILABLE'],['Block Time',calcBlockTime(),'CALCULATED'],['Transactions / Second',calcTps(),'CALCULATED'],['Gas Price',state.gas?Number(BigInt(state.gas))/1e9+' Gwei':unavailable,state.gas?'LIVE':'UNAVAILABLE'],['Active Validators',unavailable,'UNAVAILABLE'],['RPC Latency',state.rpcLatency!=null?state.rpcLatency+' ms':unavailable,state.rpcLatency!=null?'LIVE':'UNAVAILABLE'],['Data Freshness',freshness(),state.blocks.length?'INDEXED':'UNAVAILABLE']];
 $('#metrics').innerHTML=cards.map(x=>'<div class="card glass"><span class="label">'+x[0]+'</span><div class="value">'+esc(x[1])+'</div><span class="source">'+x[2]+'</span></div>').join('');
 $('#consensus').innerHTML=mini('Finalized block / epoch',unavailable)+mini('Finality time',unavailable)+mini('Quorum',unavailable)+mini('Fork / reorg','No verified observation','UNAVAILABLE');
 $('#performance').innerHTML=mini('TPS',calcTps(),state.blocks.length?'CALCULATED':'UNAVAILABLE')+mini('Block utilization',unavailable)+mini('Propagation time',unavailable)+mini('RPC success rate',state.rpc?'Current probe passed':unavailable,state.rpc?'LIVE':'UNAVAILABLE');
 $('#satstats').innerHTML=mini('Orbit links','—')+mini('Ground nodes','—')+mini('Regions','—')+mini('Latency',state.rpcLatency!=null?state.rpcLatency+' ms':'—',state.rpcLatency!=null?'LIVE':'UNAVAILABLE');
 $('#infra').innerHTML=health('RPC',state.rpc?'Online':'Unknown')+health('Indexer',state.api?'Online':'Unknown')+health('API',state.api?'Online':'Unknown')+health('WebSocket','Unknown')+health('Archive Node','Unknown');
 $('#security').innerHTML=health('Chain Integrity',state.rpc&&state.api?'Online':'Unknown')+health('Validator Participation','Unknown')+health('Anomaly Status','Unknown')+health('Fork / Reorg Monitor','Unknown');
 $('#fees').innerHTML=mini('Pending transactions','Mempool telemetry unavailable')+mini('Median gas price',state.gas?Number(BigInt(state.gas))/1e9+' Gwei':unavailable,state.gas?'LIVE':'UNAVAILABLE')+mini('95th percentile gas',unavailable)+mini('Fee pressure',unavailable);
 $('#liveText').innerHTML=state.rpc&&state.api?'<span class="live">● Live on ZVQ Mainnet</span> · Live data via RPC & Indexer':'Status unavailable · live data via RPC & Indexer';
 $('#trust').textContent=state.rpc&&state.api?'LIVE':state.api?'INDEXED':'UNAVAILABLE';
}
function calcBlockTime(){if(state.blocks.length<2)return unavailable;const t=state.blocks.slice(0,8).map(b=>new Date(b.timestamp).getTime()).filter(Number.isFinite);if(t.length<2)return unavailable;return ((Math.max(...t)-Math.min(...t))/1000/(t.length-1)).toFixed(1)+' s'}
function calcTps(){if(state.blocks.length<2)return unavailable;const secs=(new Date(state.blocks[0].timestamp)-new Date(state.blocks[Math.min(7,state.blocks.length-1)].timestamp))/1000;const tx=state.blocks.slice(0,8).reduce((a,b)=>a+Number(b.tx_count??b.transactions_count??0),0);return secs>0?(tx/secs).toFixed(2):unavailable}
function freshness(){if(!state.blocks[0]?.timestamp)return unavailable;return age(state.blocks[0].timestamp)}
function renderBlocks(){
 if(!state.blocks.length)return;
 $('#stream').innerHTML=state.blocks.slice(0,9).map(b=>'<a class="blockcard" href="/block/'+encodeURIComponent(b.height)+'"><b>#'+esc(b.height)+'</b><small>'+age(b.timestamp)+'</small><small>'+esc(b.tx_count??b.transactions_count??0)+' tx</small></a>').join('');
 $('#blocks').innerHTML=state.blocks.slice(0,12).map(b=>'<tr><td><a href="/block/'+encodeURIComponent(b.height)+'">#'+esc(b.height)+'</a></td><td>'+age(b.timestamp)+'</td><td>'+esc(b.tx_count??b.transactions_count??0)+'</td><td>'+esc(b.gas_used??'—')+'</td><td><a href="'+(b.miner?.hash?'/address/'+encodeURIComponent(b.miner.hash):'#')+'">'+short(b.miner?.hash||b.miner||'—')+'</a></td><td><a href="/block/'+encodeURIComponent(b.height)+'">'+short(b.hash||'—')+'</a></td></tr>').join('');
 $('#freshness').textContent='Indexed '+freshness();
 const pts=state.blocks.slice(0,12).reverse().map((b,i)=>{const n=Number(b.tx_count??b.transactions_count??0),x=i*(800/11),y=190-Math.min(150,n*8);return x+' '+y}).join(' L');
 if(pts)$('#area').setAttribute('d','M'+pts+' L800 220 L0 220Z');
 $('#activityNote').textContent='Indexed transaction activity · '+state.blocks.slice(0,12).reduce((a,b)=>a+Number(b.tx_count??b.transactions_count??0),0)+' transactions in sample';
 const proposers=[...new Set(state.blocks.map(b=>b.miner?.hash||b.miner).filter(Boolean))];
 $('#validators').innerHTML=proposers.length?proposers.slice(0,4).map(v=>'<a class="tag" style="display:inline-block;margin:4px" href="/address/'+encodeURIComponent(v)+'">'+short(v)+' · recent proposer activity</a>').join(''):'Validator evidence unavailable';
}
async function probe(){
 try{const t=performance.now(),r=await rpc('eth_chainId');state.rpcLatency=Math.round(performance.now()-t);state.rpc=r.result?.toLowerCase()===EXPECTED_CHAIN;if(state.rpc){const [h,g]=await Promise.all([rpc('eth_blockNumber'),rpc('eth_gasPrice')]);state.head=h.result?parseInt(h.result,16):null;state.gas=g.result||null}}catch(e){state.rpc=false}
 try{const d=await getJSON(API+'/blocks');state.blocks=Array.isArray(d.items)?d.items:[];state.api=state.blocks.length>0;renderBlocks()}catch(e){state.api=false}
 renderStatic()
}
$('#search').addEventListener('submit',e=>{e.preventDefault();const q=$('#q').value.trim(),m=$('#searchmsg');m.className='searchmsg';if(/^\d+$/.test(q))location.href='/block/'+q;else if(/^0x[a-fA-F0-9]{64}$/.test(q))location.href='/tx/'+q;else if(/^0x[a-fA-F0-9]{40}$/.test(q))location.href='/address/'+q;else{m.textContent='Enter a block number, 66-character transaction hash, or 42-character EVM address.';m.classList.add('error')}});
$('#menu').onclick=()=>$('#nav').classList.toggle('open');renderStatic();probe();setInterval(probe,12000);
</script></body></html>`;

const ORIGIN_HOST = "explorer-new.kriptoaman.com";
const RPC_HOST = "rpc.kriptoaman.com";
const EDGE_VERSION = "zevaryq-edge-1.0.0";

function edgeHeaders(base = new Headers()) {
  const h = new Headers(base);
  h.set("x-zevaryq-explorer-edge", EDGE_VERSION);
  h.set("x-content-type-options", "nosniff");
  h.set("referrer-policy", "strict-origin-when-cross-origin");
  h.set("cache-control", "no-store, max-age=0");
  return h;
}

function homeResponse(status = 200) {
  const h = edgeHeaders();
  h.set("content-type", "text/html; charset=utf-8");
  return new Response(HOME, { status, headers: h });
}

function isUiPath(path) {
  return path === "/" ||
    path === "/blocks" ||
    path === "/txs" ||
    path === "/validators" ||
    path === "/analytics" ||
    path === "/network" ||
    path.startsWith("/block/") ||
    path.startsWith("/tx/") ||
    path.startsWith("/address/");
}

async function proxyRpc(request) {
  const target = new URL(request.url);
  target.protocol = "https:";
  target.hostname = RPC_HOST;
  target.port = "";
  target.pathname = "/";
  const headers = new Headers(request.headers);
  headers.set("host", RPC_HOST);
  const init = { method: request.method, headers, redirect: "manual" };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = request.body;
  const upstream = await fetch(new Request(target.toString(), init));
  const out = edgeHeaders(upstream.headers);
  out.set("x-zevaryq-rpc-upstream", RPC_HOST);
  out.delete("content-length");
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
}

async function proxyOrigin(request) {
  const target = new URL(request.url);
  target.protocol = "https:";
  target.hostname = ORIGIN_HOST;
  target.port = "";
  const headers = new Headers(request.headers);
  headers.set("x-forwarded-host", "explorer.kriptoaman.com");
  headers.set("x-forwarded-proto", "https");
  const init = { method: request.method, headers, redirect: "manual" };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = request.body;
  const upstream = await fetch(new Request(target.toString(), init));
  const out = edgeHeaders(upstream.headers);
  out.set("x-zevaryq-origin", ORIGIN_HOST);
  const location = out.get("location");
  if (location) {
    try {
      const redirect = new URL(location, target);
      if (redirect.hostname === ORIGIN_HOST) {
        redirect.hostname = "explorer.kriptoaman.com";
        out.set("location", redirect.toString());
      }
    } catch {}
  }
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/rpc") {
      try {
        const r = await proxyRpc(request);
        if (r.status !== 429 && r.status < 500) return r;
      } catch {}
      try {
        return await proxyOrigin(request);
      } catch {
        return Response.json({ error: "RPC temporarily unavailable" }, { status: 503, headers: edgeHeaders() });
      }
    }

    if (request.method === "GET" && url.pathname === "/") return homeResponse();

    if (isUiPath(url.pathname) && request.method === "GET") {
      try {
        const upstream = await proxyOrigin(request);
        if (upstream.status !== 429 && upstream.status < 500) return upstream;
      } catch {}
      return homeResponse();
    }

    try {
      return await proxyOrigin(request);
    } catch {
      if (request.method === "GET") return homeResponse();
      return new Response("Explorer upstream unavailable", { status: 503, headers: edgeHeaders() });
    }
  },
};
