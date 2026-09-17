import base from './worker.js';

const UI_PATCH = `
<script>
(()=>{
  const unavailable=(v)=>!v||['—','Unavailable','Checking','Reconnecting'].includes(String(v).trim());
  const syncIndexerState=()=>{
    const tx=document.getElementById('mTotalTx');
    const ad=document.getElementById('mAddresses');
    const health=document.getElementById('hApi');
    if(!health)return;
    const row=health.closest('.healthRow');
    if(row&&row.firstElementChild)row.firstElementChild.textContent='Indexer aggregates';
    const missing=unavailable(tx&&tx.textContent)||unavailable(ad&&ad.textContent);
    health.textContent=missing?'Reconnecting':'Available';
    health.className='state '+(missing?'warn':'ok');
  };
  syncIndexerState();
  setInterval(syncIndexerState,1500);
})();
</script>`;

function patchHtml(html) {
  return html
    .replace('<html lang="en">', '<html lang="en" translate="no">')
    .replace('<head>', '<head>\n<meta name="google" content="notranslate"/>')
    .replace('<div class="label">Gas price</div>', '<div class="label">Gas price (Gwei)</div>')
    .replace('<span>Explorer indexer</span><span class="state" id="hApi">Checking</span>', '<span>Indexer aggregates</span><span class="state" id="hApi">Checking</span>')
    .replace('KAM Explorer V2 · UI resilience revision 2.1', 'KAM Explorer V2 · UI resilience revision 2.2')
    .replace('</body>', `${UI_PATCH}\n</body>`);
}

export default {
  async fetch(request, env, ctx) {
    const response = await base.fetch(request, env, ctx);
    if (request.method === 'GET' && (response.headers.get('content-type') || '').includes('text/html')) {
      const headers = new Headers(response.headers);
      headers.delete('content-length');
      headers.set('cache-control', 'no-store');
      headers.set('x-kam-explorer-ui', '2.2');
      return new Response(patchHtml(await response.text()), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    return response;
  },
};
