// Read-only, same-origin health aggregation for KriptoAman ecosystem clients.
// This endpoint never signs transactions or calls privileged RPC methods.
const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json = (data, status=200) => new Response(JSON.stringify(data), {status, headers});
const SOURCES = [
  {id:'network',path:'/api/kam/network-status',kind:'chain'},
  {id:'discovery',path:'/api/zvq-first-party-discovery',kind:'chain'},
  {id:'intelligence',path:'/api/zvq-token-intelligence',kind:'chain'},
  {id:'market',path:'/api/market-feed-hot',kind:'market'},
];
const TIMEOUT_MS = 5000;
const MAX_AGE_MS = 60000;
async function probe(origin, source) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(),TIMEOUT_MS);
  try {
    const response = await fetch(origin+source.path,{headers:{Accept:'application/json'},signal:controller.signal,redirect:'error',cache:'no-store'});
    if (!response.ok) return {id:source.id,kind:source.kind,state:'unavailable',httpStatus:response.status};
    const payload = await response.json();
    const time = Number(payload?.observedAt ?? payload?.capturedAt ?? payload?.generatedAt);
    const ageMs = Number.isFinite(time) && time>0 ? Math.max(0,Date.now()-time) : null;
    const expectedChain = source.kind==='chain';
    const chainId = payload?.chainId ?? payload?.chainIdHex ?? payload?.head?.chainId ?? null;
    const verifiedChain = !expectedChain || chainId===22028 || String(chainId).toLowerCase()==='0x560c';
    const declaredHealthy = source.id==='network' ? payload?.live===true && payload?.verified===true :
      source.id==='market' ? payload?.status!=='unavailable' && payload?.status!=='error' :
      payload?.status==='live';
    const fresh = ageMs!==null && ageMs<=MAX_AGE_MS;
    return {id:source.id,kind:source.kind,state:verifiedChain && declaredHealthy && fresh?'live':'unverified',
      httpStatus:response.status,ageMs,chainVerified:expectedChain?verifiedChain:null,
      sourcePath:source.path};
  } catch {
    return {id:source.id,kind:source.kind,state:'unavailable',sourcePath:source.path};
  } finally {clearTimeout(timer);}
}
export async function onRequestGet({request}) {
  const origin = new URL(request.url).origin;
  const sources = await Promise.all(SOURCES.map(source=>probe(origin,source)));
  const live = sources.filter(source=>source.state==='live').length;
  return json({schemaVersion:'1.0',status:live===sources.length?'operational':live?'degraded':'unavailable',
    generatedAt:Date.now(),sources,summary:{live,total:sources.length},
    policy:{readOnly:true,unknownIsNotZero:true,noFabricatedMetrics:true,firstPartyDelivery:true,
      externalMarketCollectionMayApply:true}});
}
