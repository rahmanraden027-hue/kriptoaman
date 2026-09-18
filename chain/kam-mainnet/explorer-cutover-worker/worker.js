const ORIGIN_HOST = "explorer-new.kriptoaman.com";
const PUBLIC_HOST = "explorer.kriptoaman.com";

const API_HEALTH_FUNCTION = `async function verifyAPI(){let s=null,b=null;try{s=await api('/stats')}catch{}try{b=await api('/blocks')}catch{}const blockItems=b&&(b.items||b.blocks);const blocksOK=Array.isArray(blockItems)&&blockItems.length>0;const statsOK=!!s&&((s.total_transactions??s.total_transactions_number??s.transactions_count)!=null);apiOK=blocksOK||statsOK;if(apiOK){const full=blocksOK&&statsOK;state('apiState',full?'Online':'Partial',full?'ok':'warn');health('hApi',full?'Online':'Partial',full?'ok':'warn')}else{state('apiState','Reconnecting','warn');health('hApi','Reconnecting','warn')}if(statsOK){const tx=s.total_transactions??s.total_transactions_number??s.transactions_count,ad=s.total_addresses??s.addresses_count;$('mTotalTx').textContent=tx!=null?fmt(tx):'Unavailable';$('mAddresses').textContent=ad!=null?fmt(ad):'Unavailable'}else{$('mTotalTx').textContent='Unavailable';$('mAddresses').textContent='Unavailable'}return{stats:s,blocks:b}}`;

const QBFT_HELPERS = `const hexBytes=v=>{if(typeof v!=='string'||!/^0x[0-9a-f]*$/i.test(v)||v.length%2!==0)return null;const h=v.slice(2),out=new Uint8Array(h.length/2);for(let i=0;i<out.length;i++)out[i]=Number.parseInt(h.slice(i*2,i*2+2),16);return out};
function rlpDecode(buf,offset=0){if(!buf||offset>=buf.length)throw Error('RLP EOF');const p=buf[offset];if(p<=0x7f)return[buf.slice(offset,offset+1),offset+1];const lenNum=(start,count)=>{let n=0;for(let i=0;i<count;i++)n=n*256+buf[start+i];return n};if(p<=0xb7){const l=p-0x80,s=offset+1,e=s+l;if(e>buf.length)throw Error('RLP string');return[buf.slice(s,e),e]}if(p<=0xbf){const ll=p-0xb7,ls=offset+1,le=ls+ll;if(le>buf.length)throw Error('RLP strlen');const l=lenNum(ls,ll),e=le+l;if(e>buf.length)throw Error('RLP long string');return[buf.slice(le,e),e]}const list=(s,e)=>{const out=[];let cur=s;while(cur<e){const[v,n]=rlpDecode(buf,cur);if(n<=cur)throw Error('RLP stalled');out.push(v);cur=n}if(cur!==e)throw Error('RLP boundary');return out};if(p<=0xf7){const l=p-0xc0,s=offset+1,e=s+l;if(e>buf.length)throw Error('RLP list');return[list(s,e),e]}const ll=p-0xf7,ls=offset+1,le=ls+ll;if(le>buf.length)throw Error('RLP listlen');const l=lenNum(ls,ll),e=le+l;if(e>buf.length)throw Error('RLP long list');return[list(le,e),e]}
function qbftValidatorCount(extra){try{const buf=hexBytes(extra);if(!buf)return null;const[decoded,end]=rlpDecode(buf);if(!Array.isArray(decoded)||end!==buf.length)return null;const candidates=[];const walk=v=>{if(!Array.isArray(v))return;if(v.length===4&&v.every(x=>x instanceof Uint8Array&&x.length===20)){const keys=v.map(x=>Array.from(x,b=>b.toString(16).padStart(2,'0')).join(''));if(new Set(keys).size===4)candidates.push(keys)}for(const child of v)walk(child)};walk(decoded);return candidates.length===1?4:null}catch{return null}}`;

const QBFT_FINALITY_REFRESH = `let finalized=await rpc('eth_getBlockByNumber',['finalized',false]).catch(()=>null),finalityLabel='RPC finalized';if(!finalized){finalized=await rpc('eth_getBlockByNumber',['safe',false]).catch(()=>null);finalityLabel='RPC safe'}if(!finalized&&blocks[0]&&qbftValidatorCount(blocks[0].extraData)===4){finalized=blocks[0];finalityLabel='QBFT committed · 4-validator evidence'}renderFinalized(finalized,finalityLabel)`;

const QBFT_RENDER_FINALIZED = `function renderFinalized(b,label='Verified finality'){if(!b){$('finalizedBlock').textContent='Unavailable';$('finalizedAge').textContent='Finality evidence unavailable';return}const n=hexNum(b.number),ts=hexNum(b.timestamp);$('finalizedBlock').textContent=Number.isFinite(n)?fmt(n):'Unavailable';$('finalizedAge').textContent=label+(ts?' · '+ago(ts):'')}`;

function rewriteHomepage(html) {
  if (html.includes("RPC='https://rpc.kriptoaman.com'")) {
    html = html.replace("RPC='https://rpc.kriptoaman.com'", "RPC='/rpc'");
  }

  const apiStart = html.indexOf("async function verifyAPI(){");
  const apiEnd = html.indexOf("async function readBlocksRPC", apiStart);
  if (apiStart >= 0 && apiEnd > apiStart) {
    html = html.slice(0, apiStart) + API_HEALTH_FUNCTION + "\n" + html.slice(apiEnd);
  }

  html = html.replace(
    "<div class=\"sourceName\">Public RPC</div><div class=\"sourceValue\">rpc.kriptoaman.com</div>",
    "<div class=\"sourceName\">KAM RPC</div><div class=\"sourceValue\">Same-origin /rpc gateway</div>",
  );

  html = html.replace(
    "$('activeSource').textContent=rpcOK?'KAM Public RPC':(apiOK?'Explorer API':'No verified live source');",
    "$('activeSource').textContent=rpcOK?'KAM RPC via /rpc':(apiOK?'Explorer API':'No verified live source');",
  );

  html = html.replace(
    '<span id="finalizedAge">RPC finalized tag</span>',
    '<span id="finalizedAge">RPC finalized / QBFT commit</span>',
  );

  if (!html.includes('function qbftValidatorCount')) {
    const helperAnchor = "const fmt=n=>";
    const helperIndex = html.indexOf(helperAnchor);
    if (helperIndex < 0) throw new Error("QBFT helper insertion anchor missing");
    html = html.slice(0, helperIndex) + QBFT_HELPERS + "\n" + html.slice(helperIndex);
  }

  if (html.includes("function renderFinalized(b){if(!b){$('finalizedBlock').textContent='Unavailable';$('finalizedAge').textContent='RPC finalized tag unavailable';return}const n=hexNum(b.number),ts=hexNum(b.timestamp);$('finalizedBlock').textContent=Number.isFinite(n)?fmt(n):'Unavailable';$('finalizedAge').textContent=ts?ago(ts):'Verified by RPC'}")) {
    html = html.replace(
      "function renderFinalized(b){if(!b){$('finalizedBlock').textContent='Unavailable';$('finalizedAge').textContent='RPC finalized tag unavailable';return}const n=hexNum(b.number),ts=hexNum(b.timestamp);$('finalizedBlock').textContent=Number.isFinite(n)?fmt(n):'Unavailable';$('finalizedAge').textContent=ts?ago(ts):'Verified by RPC'}",
      QBFT_RENDER_FINALIZED,
    );
  }

  if (html.includes("const finalized=await rpc('eth_getBlockByNumber',['finalized',false]).catch(()=>null);renderFinalized(finalized)")) {
    html = html.replace(
      "const finalized=await rpc('eth_getBlockByNumber',['finalized',false]).catch(()=>null);renderFinalized(finalized)",
      QBFT_FINALITY_REFRESH,
    );
  }

  if (!html.includes("QBFT committed · 4-validator evidence")) {
    throw new Error("QBFT finality rewrite anchor missing");
  }

  if (!html.includes("RPC='/rpc'")) {
    throw new Error("homepage RPC rewrite anchor missing");
  }
  if (!html.includes("Blocks online") && !html.includes("state('apiState',full?'Online':'Partial'")) {
    throw new Error("homepage API health rewrite anchor missing");
  }
  return html;
}

export default {
  async fetch(request) {
    const publicUrl = new URL(request.url);
    const upstreamUrl = new URL(request.url);
    upstreamUrl.protocol = "https:";
    upstreamUrl.hostname = ORIGIN_HOST;
    upstreamUrl.port = "";

    const headers = new Headers(request.headers);
    headers.set("x-forwarded-host", PUBLIC_HOST);
    headers.set("x-forwarded-proto", "https");

    const init = {
      method: request.method,
      headers,
      redirect: "manual",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
    }

    const upstreamResponse = await fetch(new Request(upstreamUrl.toString(), init));
    const responseHeaders = new Headers(upstreamResponse.headers);

    const location = responseHeaders.get("location");
    if (location) {
      try {
        const redirectUrl = new URL(location, upstreamUrl);
        if (redirectUrl.hostname === ORIGIN_HOST) {
          redirectUrl.hostname = PUBLIC_HOST;
          responseHeaders.set("location", redirectUrl.toString());
        }
      } catch {
        // Preserve non-URL Location values unchanged.
      }
    }

    responseHeaders.set("x-kam-explorer-cutover", "explorer-new");
    responseHeaders.set("x-kam-explorer-origin", ORIGIN_HOST);

    const isHomepage =
      request.method === "GET" &&
      publicUrl.pathname === "/" &&
      upstreamResponse.ok &&
      (upstreamResponse.headers.get("content-type") || "").includes("text/html");

    if (isHomepage) {
      try {
        const html = rewriteHomepage(await upstreamResponse.text());
        responseHeaders.delete("content-length");
        responseHeaders.delete("content-encoding");
        responseHeaders.delete("etag");
        responseHeaders.set("cache-control", "no-store, max-age=0");
        responseHeaders.set("x-kam-explorer-browser-rpc", "same-origin");
        return new Response(html, {
          status: upstreamResponse.status,
          statusText: upstreamResponse.statusText,
          headers: responseHeaders,
        });
      } catch (error) {
        return new Response("Explorer presentation rewrite unavailable", {
          status: 502,
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-store",
            "x-kam-explorer-cutover": "rewrite-failed",
          },
        });
      }
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
