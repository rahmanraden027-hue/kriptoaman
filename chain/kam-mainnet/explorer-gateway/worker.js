export default {
  async fetch(request, env) {
    if (!env.KAM_EXPLORER_ORIGIN) {
      return new Response('Explorer origin not configured', { status: 503 });
    }

    const incoming = new URL(request.url);
    const base = new URL(env.KAM_EXPLORER_ORIGIN);
    const target = new URL(incoming.pathname + incoming.search, base);
    const headers = new Headers(request.headers);
    headers.set('x-forwarded-host', incoming.host);
    headers.set('x-forwarded-proto', 'https');
    const clientIp = request.headers.get('cf-connecting-ip');
    if (clientIp) headers.set('x-forwarded-for', clientIp);

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
  },
};
