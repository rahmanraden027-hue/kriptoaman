function safeId(value) {
  return /^[a-zA-Z0-9._-]{8,128}$/.test(value || '') ? value : null;
}

function safeDestination(value) {
  try {
    const url = new URL(value || '');
    if (url.protocol !== 'https:') return null;
    const allowed = new Set(['kriptoaman.com', 'www.kriptoaman.com']);
    return allowed.has(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const campaign = safeId(url.searchParams.get('c'));
  const recipient = safeId(url.searchParams.get('r'));
  const destination = safeDestination(url.searchParams.get('u')) || 'https://kriptoaman.com/';
  const now = new Date().toISOString();

  if (campaign && recipient && env.EMAIL_TRACKING_KV) {
    const key = `email:${campaign}:${recipient}`;
    try {
      const current = JSON.parse((await env.EMAIL_TRACKING_KV.get(key)) || '{}');
      const next = {
        ...current,
        campaign,
        recipient,
        firstClickAt: current.firstClickAt || now,
        lastClickAt: now,
        clickCount: Number(current.clickCount || 0) + 1,
      };
      await env.EMAIL_TRACKING_KV.put(key, JSON.stringify(next), { expirationTtl: 60 * 60 * 24 * 180 });
    } catch {
      // Tracking failure must not block navigation.
    }
  }

  return Response.redirect(destination, 302);
}
