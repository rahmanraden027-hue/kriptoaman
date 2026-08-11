const encoder = new TextEncoder();

function encodeHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashIp(secret, ip) {
  if (!ip) return null;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(ip));
  return encodeHex(new Uint8Array(digest));
}

export async function recordRegistrationConsent(db, secret, request, userId, versions) {
  const acceptedAt = new Date().toISOString();
  const ipHash = await hashIp(secret, request.headers.get('CF-Connecting-IP'));
  const userAgent = String(request.headers.get('User-Agent') || '').slice(0, 512) || null;
  await db.prepare(`
    INSERT INTO auth_consents (
      id, user_id, consent_type, terms_version, privacy_version, ip_hash, user_agent, accepted_at
    ) VALUES (?, ?, 'registration', ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    userId,
    versions.terms,
    versions.privacy,
    ipHash,
    userAgent,
    acceptedAt,
  ).run();
}
