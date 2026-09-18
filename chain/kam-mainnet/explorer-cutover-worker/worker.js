const ORIGIN_HOST = "explorer-new.kriptoaman.com";
const PUBLIC_HOST = "explorer.kriptoaman.com";

const API_HEALTH_FUNCTION = `async function verifyAPI(){let s=null,b=null;try{s=await api('/stats')}catch{}try{b=await api('/blocks')}catch{}const blockItems=b&&(b.items||b.blocks);const blocksOK=Array.isArray(blockItems)&&blockItems.length>0;const statsOK=!!s&&((s.total_transactions??s.total_transactions_number??s.transactions_count)!=null);apiOK=blocksOK||statsOK;if(apiOK){const full=blocksOK&&statsOK;state('apiState',full?'Online':'Partial',full?'ok':'warn');health('hApi',full?'Online':'Partial',full?'ok':'warn')}else{state('apiState','Reconnecting','warn');health('hApi','Reconnecting','warn')}if(statsOK){const tx=s.total_transactions??s.total_transactions_number??s.transactions_count,ad=s.total_addresses??s.addresses_count;$('mTotalTx').textContent=tx!=null?fmt(tx):'Unavailable';$('mAddresses').textContent=ad!=null?fmt(ad):'Unavailable'}else{$('mTotalTx').textContent='Unavailable';$('mAddresses').textContent='Unavailable'}return{stats:s,blocks:b}}`;

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
