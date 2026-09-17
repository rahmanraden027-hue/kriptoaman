const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>KriptoAman Explorer</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#07111f;color:#eaf2ff;font:15px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}main{max-width:980px;margin:auto;padding:28px 18px 56px}h1{font-size:30px;margin:0;color:#e8bd62}h2{font-size:16px;margin:0 0 10px;color:#cbd8e8}.sub{color:#8fa6bf;margin:4px 0 24px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.card{background:#0d1b2c;border:1px solid #243c58;border-radius:14px;padding:18px}.value{font-size:25px;font-weight:700;color:#e8bd62;word-break:break-word}.ok{color:#5bd68b}.warn{color:#f2c66d}.bad{color:#ff7f7f}input,button{border:1px solid #3d5875;border-radius:9px;background:#101f32;color:white;padding:12px}input{width:min(680px,100%)}button{background:#b78b3a;cursor:pointer;margin-left:6px}pre{white-space:pre-wrap;word-break:break-word;background:#091522;padding:13px;border-radius:10px;max-height:360px;overflow:auto}.foot{margin-top:20px;color:#7890aa;font-size:13px}@media(max-width:620px){button{margin:8px 0 0;width:100%}}
</style>
</head>
<body><main>
<h1>KriptoAman Explorer</h1>
<div class="sub">KAM Mainnet · Chain ID 22028 / 0x560c</div>
<div class="grid">
  <section class="card"><h2>Public RPC</h2><div id="rpc" class="value warn">Checking…</div></section>
  <section class="card"><h2>Latest Block</h2><div id="block" class="value">—</div></section>
  <section class="card"><h2>Network</h2><div class="value">KAM</div><div>QBFT reconstructed mainnet</div></section>
</div>
<section class="card" style="margin-top:12px"><h2>Block / Transaction lookup</h2><div><input id="q" placeholder="Block number or 0x transaction hash"/><button id="go">Search</button></div><pre id="result">Waiting for query.</pre></section>
<div class="foot">This explorer shell remains available at the edge even if the indexing origin is temporarily reconnecting. Live chain data is shown only when the public RPC verifies Chain ID 0x560c.</div>
<script>
async function rpc(method,params=[]){const r=await fetch('https://rpc.kriptoaman.com',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});const j=await r.json();if(!r.ok||j.error)throw new Error(j.error?.message||j.error||('HTTP '+r.status));return j.result}
async function refresh(){const s=document.getElementById('rpc'),b=document.getElementById('block');try{const c=await rpc('eth_chainId');if(String(c).toLowerCase()!=='0x560c')throw new Error('chain-id mismatch');const h=await rpc('eth_blockNumber');s.textContent='ONLINE';s.className='value ok';b.textContent=Number(BigInt(h));}catch(e){s.textContent='RECONNECTING';s.className='value warn';b.textContent='—';}}
async function lookup(){const out=document.getElementById('result'),q=document.getElementById('q').value.trim();if(!q){out.textContent='Enter a block number or transaction hash.';return}out.textContent='Loading…';try{let v;if(/^0x[0-9a-fA-F]{64}$/.test(q)){v=await rpc('eth_getTransactionByHash',[q])}else{const n=q.startsWith('0x')?q:'0x'+BigInt(q).toString(16);v=await rpc('eth_getBlockByNumber',[n,true])}out.textContent=JSON.stringify(v,null,2)}catch(e){out.textContent='Live RPC unavailable: '+e.message}}
document.getElementById('go').addEventListener('click',lookup);refresh();setInterval(refresh,5000);
</script>
</main></body></html>`;

function edgeHeaders(contentType) {
  return {
    'content-type': contentType,
    'cache-control': 'no-store',
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'x-frame-options': 'SAMEORIGIN',
  };
}

export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);

    if (request.method === 'GET' && (incoming.pathname === '/' || incoming.pathname === '/index.html')) {
      return new Response(PAGE, { status: 200, headers: edgeHeaders('text/html; charset=utf-8') });
    }

    if (request.method === 'GET' && incoming.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'kam-mainnet-explorer-edge',
        chainId: '0x560c',
        originConfigured: Boolean(env.KAM_EXPLORER_ORIGIN),
      }), { status: 200, headers: edgeHeaders('application/json; charset=utf-8') });
    }

    if (!env.KAM_EXPLORER_ORIGIN) {
      return new Response(JSON.stringify({ error: 'Explorer origin not configured' }), {
        status: 503,
        headers: edgeHeaders('application/json; charset=utf-8'),
      });
    }

    const base = new URL(env.KAM_EXPLORER_ORIGIN);
    const target = new URL(incoming.pathname + incoming.search, base);
    const headers = new Headers(request.headers);
    headers.set('x-forwarded-host', incoming.host);
    headers.set('x-forwarded-proto', 'https');
    const clientIp = request.headers.get('cf-connecting-ip');
    if (clientIp) headers.set('x-forwarded-for', clientIp);

    try {
      const upstream = new Request(target.toString(), {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'manual',
      });
      const response = await fetch(upstream);
      const out = new Headers(response.headers);
      out.set('strict-transport-security', 'max-age=31536000; includeSubDomains');
      out.set('x-content-type-options', 'nosniff');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: out,
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Explorer indexing origin temporarily unreachable', chainId: '0x560c' }), {
        status: 502,
        headers: edgeHeaders('application/json; charset=utf-8'),
      });
    }
  },
};
