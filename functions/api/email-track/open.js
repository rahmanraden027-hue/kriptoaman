const PIXEL = Uint8Array.from([71,73,70,56,57,97,1,0,1,0,128,0,0,0,0,0,255,255,255,33,249,4,1,0,0,0,0,44,0,0,0,0,1,0,1,0,0,2,2,68,1,0,59]);

function safeId(value) {
  return /^[a-zA-Z0-9._-]{8,128}$/.test(value || '') ? value : null;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const campaign = safeId(url.searchParams.get('c'));
  const recipient = safeId(url.searchParams.get('r'));
  const now = new Date().toISOString();

  if (campaign && recipient && env.EMAIL_TRACKING_KV) {
    const key = `email:${campaign}:${recipient}`;
    try {
      const current = JSON.parse((await env.EMAIL_TRACKING_KV.get(key)) || '{}');
      const next = {
        ...current,
        campaign,
        recipient,
        firstOpenAt: current.firstOpenAt || now,
        lastOpenAt: now,
        openCount: Number(current.openCount || 0) + 1,
      };
      await env.EMAIL_TRACKING_KV.put(key, JSON.stringify(next), { expirationTtl: 60 * 60 * 24 * 180 });
    } catch {
      // Tracking must never break email rendering.
    }
  }

  return new Response(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(PIXEL.byteLength),
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
