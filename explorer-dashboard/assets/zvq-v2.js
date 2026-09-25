/* ZEVARYQ Explorer 2.0 — visual enhancements; independently indexed transaction activity. */
(function(){
 'use strict';
 const API='/api/v2',validHash=/^0x[a-f0-9]{64}$/i,validAddress=/^0x[a-f0-9]{40}$/i;
 const select=id=>document.getElementById(id),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const txState={items:[],lastGood:0,error:null,fetching:false,failures:0,nextAttempt:0};
 const headHistory=[],txClasses=['transfer','swap','stake','mint','bridge'];
 function shortHash(h){return typeof h==='string'&&h.length>20?h.slice(0,9)+'…'+h.slice(-6):'—'}
 function labelTime(s){if(!s)return 'Time unavailable';const t=Date.parse(s);if(!Number.isFinite(t))return 'Time unavailable';const age=Math.max(0,Math.round((Date.now()-t)/1000));return age<60?age+'s ago':age<3600?Math.floor(age/60)+'m ago':Math.floor(age/3600)+'h ago'}
 function validTx(t){
  if(!t||!validHash.test(t.hash||''))return null;
  const block=Number(t.block_number);
  if(!Number.isSafeInteger(block)||block<0)return null;
  const timestamp=typeof t.timestamp==='string'&&Number.isFinite(Date.parse(t.timestamp))?t.timestamp:null;
  const sender=t.from?.hash,receiver=t.to?.hash;
  const method=typeof t.method==='string'?t.method.trim().slice(0,52):'';
  const kind=txClasses.find(k=>new RegExp('(^|[^a-z])'+k+'([^a-z]|$)','i').test(method))||'';
  const status=['ok','error'].includes(t.status)?t.status:'';
  const value=typeof t.value==='string'&&/^[0-9]{1,78}$/.test(t.value)?t.value:null;
  return {hash:t.hash,block,timestamp,sender:validAddress.test(sender||'')?sender:null,receiver:validAddress.test(receiver||'')?receiver:null,method:method||'Indexed transaction',kind,status,value};
 }
 function formatAmount(wei){if(wei===null)return 'Amount unavailable';try{const n=BigInt(wei),base=1000000000000000000n,major=n/base,frac=(n%base).toString().padStart(18,'0').slice(0,5).replace(/0+$/,'');return major.toString()+(frac?'.'+frac:'')+' ZVQ'}catch{return 'Amount unavailable'}}
 function spark(values){if(values.length<2)return '';const lo=Math.min(...values),hi=Math.max(...values),spread=Math.max(1,hi-lo);return values.map((v,i)=>(i?'L':'M')+(i*100/(values.length-1)).toFixed(1)+' '+(36-(v-lo)*31/spread).toFixed(1)).join(' ')}
 function renderSampleChart(state){
  const flow=select('v2-block-flow');if(!flow)return;
  const blocks=state.blocks.slice(0,12).reverse(),samples=blocks.map(b=>Number(b.tx_count??b.transactions_count));
  if(samples.length<2||samples.some(x=>!Number.isSafeInteger(x)||x<0)){flow.innerHTML='<p class="v2-datameta">Transaction-count sample unavailable; no illustrative trend is presented as live data.</p>';return}
  const path=spark(samples),p=state.api?'INDEXED':'STALE',count=samples.reduce((a,b)=>a+b,0);
  flow.innerHTML='<h3>Recent transaction counts · '+p+'</h3><svg viewBox="0 0 100 42" preserveAspectRatio="none" role="img" aria-label="Indexed transaction-count trend from '+samples.length+' consecutive indexed blocks"><defs><linearGradient id="v2-gradient" x1="0" x2="1"><stop stop-color="#46dfff"/><stop offset=".5" stop-color="#d075ff"/><stop offset="1" stop-color="#ffe07e"/></linearGradient></defs><path d="'+path+'" stroke="url(#v2-gradient)" stroke-width="1.8" fill="none" vector-effect="non-scaling-stroke"/><path d="'+path+' L100 42 L0 42 Z" fill="rgba(70,177,251,.12)"/></svg><p class="v2-datameta"><span class="v2-provenance '+p.toLowerCase()+'">'+p+'</span>'+count.toLocaleString()+' transactions · '+samples.length+' observed blocks</p>';
 }
 function renderMetrics(state){
  const cards=[...document.querySelectorAll('#metrics .card')];
  if(cards.length<8)return;
  cards.forEach((card,i)=>{
   const tag=card.querySelector('.source');if(tag){const raw=tag.textContent.trim();tag.classList.toggle('indexed',raw==='INDEXED');tag.title=raw==='CALCULATED'?'Calculated from current indexed blocks':raw==='STALE'?'Cached indexer sample':'Status: '+raw}
   if(i===3&&state.api){const samples=state.blocks.slice(0,10).reverse().map(b=>Number(b.tx_count??b.transactions_count));if(samples.length>=2&&samples.every(n=>Number.isSafeInteger(n)&&n>=0)&&!card.querySelector('.v2-mini-chart')){const chart=document.createElementNS('http://www.w3.org/2000/svg','svg');chart.setAttribute('viewBox','0 0 100 42');chart.setAttribute('preserveAspectRatio','none');chart.setAttribute('class','v2-mini-chart');chart.setAttribute('role','img');chart.setAttribute('aria-label','Indexed transaction count trend');const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',spark(samples));chart.append(p);card.append(chart)}}
  });
 }
 function renderTx(){
  const grid=select('v2-tx-list'),activity=select('v2-activity-list'),badge=select('v2-tx-status'),note=select('v2-tx-note');
  if(!grid||!activity)return;
  const fresh=txState.lastGood&&Date.now()-txState.lastGood<90000&&!txState.error,provenance=fresh?'INDEXED':txState.items.length?'STALE':'UNAVAILABLE';
  badge.textContent=provenance;badge.className='tag v2-provenance '+provenance.toLowerCase();
  note.textContent=provenance==='INDEXED'?'Read-only Blockscout /api/v2/transactions · checked '+new Date(txState.lastGood).toLocaleTimeString():txState.items.length?'Cached indexed history · current refresh unavailable':txState.error?'Indexer transactions unavailable: '+txState.error:'Connecting to indexed transaction history…';
  if(!txState.items.length){const msg='<p class="empty">'+(txState.error?'Transaction indexer unavailable; no sample transactions shown.':'Waiting for verified indexed transactions…')+'</p>';grid.innerHTML=msg;activity.innerHTML=msg;return}
  grid.innerHTML=txState.items.slice(0,6).map(t=>{
   const cls=t.kind||'default',kind=t.kind?t.kind[0].toUpperCase()+t.kind.slice(1):'Transaction';
   return '<a class="v2-tx-item" href="/tx/'+encodeURIComponent(t.hash)+'"><div><strong>'+escape(shortHash(t.hash))+'</strong><small>Block #'+t.block+' · '+escape(labelTime(t.timestamp))+'</small></div><div><span class="v2-method '+cls+'">'+escape(kind)+'</span><small>'+escape(formatAmount(t.value))+'</small></div></a>';
  }).join('');
  activity.innerHTML=txState.items.slice(0,6).map(t=>{
   const kind=t.kind?t.kind[0].toUpperCase()+t.kind.slice(1):'Transaction';
   return '<a class="v2-activity-item" href="/tx/'+encodeURIComponent(t.hash)+'"><div><strong>'+escape(kind)+' · '+escape(shortHash(t.hash))+'</strong><small>Indexer method: '+escape(t.method)+' · '+escape(labelTime(t.timestamp))+'</small></div><div><span class="v2-method '+(t.kind||'')+'">'+escape(t.status||'Indexed')+'</span><small>Block #'+t.block+'</small></div></a>';
  }).join('');
 }
 async function loadTx(){
  if(txState.fetching||document.hidden||Date.now()<txState.nextAttempt)return;
  txState.fetching=true;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8500);
  try{
   const response=await fetch(API+'/transactions',{method:'GET',signal:controller.signal,headers:{accept:'application/json'},cache:'no-store'});
   if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();
   if(!Array.isArray(data?.items))throw Error('Invalid indexed response');
   const seen=new Set();
   txState.items=data.items.map(validTx).filter(t=>{if(!t||seen.has(t.hash.toLowerCase()))return false;seen.add(t.hash.toLowerCase());return true}).sort((a,b)=>b.block-a.block).slice(0,16);
   txState.lastGood=Date.now();txState.error=null;txState.failures=0;txState.nextAttempt=Date.now()+30000;
  }catch(error){
   txState.error=String(error?.name==='AbortError'?'Request timed out':error?.message||error).slice(0,90);
   txState.failures++;txState.nextAttempt=Date.now()+Math.min(180000,30000*2**Math.min(txState.failures,3));
  }finally{clearTimeout(timeout);txState.fetching=false;renderTx()}
 }
 function render(state){
  renderMetrics(state);renderSampleChart(state);
  const proof=select('v2-telemetry-proof');if(proof){proof.innerHTML=state.rpcLatency!==null&&state.rpc?'<span class="v2-provenance indexed">LIVE</span> Browser-to-RPC response time: <strong>'+state.rpcLatency+' ms</strong>. This does not measure satellite or inter-node latency.':'<span class="v2-provenance unavailable">UNAVAILABLE</span> Browser RPC latency cannot currently be verified. Satellite telemetry requires a separately verified feed.'}
  const map=select('v2-node-evidence');if(map)map.textContent='ILLUSTRATIVE · Geographic node coordinates and regional counts unavailable without independently verified node telemetry.';
  const sat=select('v2-satellite-evidence');if(sat)sat.textContent='ILLUSTRATIVE · Orbit and satellite artwork; no verified physical satellite feed connected.';
  const marker=select('v2-head-proof');if(marker){const head=state.rpc&&Number.isSafeInteger(state.head)?state.head:null;const idx=state.api&&state.blocks.length?Number(state.blocks[0].height):null;marker.textContent=head!==null?'RPC verified head #'+head+(Number.isSafeInteger(idx)?' · indexed #'+idx:''):Number.isSafeInteger(idx)?'INDEXED block #'+idx+' · browser RPC unverified':'Latest verified head unavailable'}
 }
 function start(state){
  render(state);renderTx();loadTx();
  setInterval(()=>{if(!document.hidden)loadTx()},30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadTx()});
 }
 window.ZVQv2={start,render,loadTx,validTx};
 if(typeof state!=='undefined')start(state);
})();