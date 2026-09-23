// Only ACME HTTP-01; never proxy RPC, explorer pages or arbitrary URLs.
const PREFIX='/.well-known/acme-challenge/';
const BASE='http://146-190-93-254.sslip.io';
export default {
  async fetch(request) {
    const url=new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed',{status:405});
    if (!url.pathname.startsWith(PREFIX) || !/^[A-Za-z0-9_-]{20,128}$/.test(url.pathname.slice(PREFIX.length))) {
      return new Response('Not found',{status:404});
    }
    try {
      const upstream=await fetch(BASE+url.pathname,{
        method:'GET',
        redirect:'manual',
        headers:{accept:'text/plain'},
        cf:{cacheTtl:0}
      });
      if (upstream.status!==200) return new Response('Challenge unavailable',{status:502});
      const body=await upstream.text();
      if (body.length>256 || !/^[A-Za-z0-9._-]{20,256}$/.test(body.trim())) {
        return new Response('Invalid challenge',{status:502});
      }
      return new Response(request.method==='HEAD'?null:body,{status:200,
        headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store, max-age=0',
        'x-zvq-acme-bridge':'isolated-http01','x-content-type-options':'nosniff'}});
    } catch {
      return new Response('Origin unavailable',{status:502});
    }
  }
};