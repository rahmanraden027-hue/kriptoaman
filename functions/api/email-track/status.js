function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function onRequestGet({ request, env }) {
  if (!env.EMAIL_TRACKING_KV || !env.EMAIL_TRACKING_ADMIN_KEY) {
    return new Response(JSON.stringify({ error: 'Email tracking storage is not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  const auth = request.headers.get('Authorization') || '';
  if (auth !== `Bearer ${env.EMAIL_TRACKING_ADMIN_KEY}`) return unauthorized();

  const url = new URL(request.url);
  const campaign = url.searchParams.get('c') || '';
  if (!/^[a-zA-Z0-9._-]{8,128}$/.test(campaign)) {
    return new Response(JSON.stringify({ error: 'Invalid campaign id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  const prefix = `email:${campaign}:`;
  const listed = await env.EMAIL_TRACKING_KV.list({ prefix, limit: 1000 });
  const records = [];
  for (const item of listed.keys) {
    const raw = await env.EMAIL_TRACKING_KV.get(item.name);
    if (!raw) continue;
    try { records.push(JSON.parse(raw)); } catch {}
  }

  const summary = records.reduce((acc, row) => {
    acc.recipients += 1;
    if (row.firstOpenAt) acc.opened += 1;
    if (row.firstClickAt) acc.clicked += 1;
    acc.totalOpens += Number(row.openCount || 0);
    acc.totalClicks += Number(row.clickCount || 0);
    return acc;
  }, { recipients: 0, opened: 0, clicked: 0, totalOpens: 0, totalClicks: 0 });

  return new Response(JSON.stringify({ campaign, summary, records }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
