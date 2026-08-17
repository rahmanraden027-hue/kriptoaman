import { SESSION_TTL_SECONDS } from './session.js';

const encoder = new TextEncoder();

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashIp(secret, ip) {
  if (!ip) return null;
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${secret}:${ip}`));
  return toHex(new Uint8Array(digest));
}

function maskIp(ip) {
  if (!ip) return null;
  if (ip.includes('.')) {
    const parts = ip.split('.');
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.xxx` : null;
  }
  if (ip.includes(':')) {
    const parts = ip.split(':').filter(Boolean);
    return `${parts.slice(0, 3).join(':')}::xxxx`;
  }
  return null;
}

function deviceLabel(userAgent = '') {
  const ua = userAgent.toLowerCase();
  let browser = 'Browser';
  let os = 'Perangkat';

  if (ua.includes('edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';
  else if (ua.includes('chrome/') && !ua.includes('wv')) browser = 'Chrome';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
  else if (ua.includes('wv')) browser = 'Android WebView';

  if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS/iPadOS';
  else if (ua.includes('windows nt')) os = 'Windows';
  else if (ua.includes('mac os x') || ua.includes('macintosh')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';

  return `${browser} • ${os}`;
}

function readNetworkContext(request) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || null;
  const country = request.headers.get('CF-IPCountry') || request.cf?.country || null;
  const city = request.cf?.city || null;
  return { ip, country, city };
}

export async function createVerifiedSession(db, secret, userId, request, ttlSeconds = SESSION_TTL_SECONDS) {
  const id = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();
  const userAgent = (request.headers.get('User-Agent') || '').slice(0, 500);
  const { ip, country, city } = readNetworkContext(request);

  await db.prepare(
    `INSERT INTO auth_sessions
      (id, user_id, user_agent, device_label, ip_hash, ip_masked, country, city, created_at, last_seen_at, expires_at, revoked_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
  ).bind(
    id,
    userId,
    userAgent || null,
    deviceLabel(userAgent),
    await hashIp(secret, ip),
    maskIp(ip),
    country,
    city,
    now.toISOString(),
    now.toISOString(),
    expiresAt,
  ).run();

  return { id, expiresAt };
}

export async function getActiveSession(db, sessionId, userId) {
  if (!sessionId || !userId) return null;
  const row = await db.prepare(
    `SELECT id, user_id, device_label, ip_masked, country, city, created_at, last_seen_at, expires_at, revoked_at
     FROM auth_sessions WHERE id = ? AND user_id = ? LIMIT 1`,
  ).bind(sessionId, userId).first();
  if (!row || row.revoked_at || new Date(row.expires_at).getTime() <= Date.now()) return null;
  return row;
}

export async function touchSession(db, sessionId, userId, ttlSeconds = SESSION_TTL_SECONDS) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();
  await db.prepare(
    `UPDATE auth_sessions SET last_seen_at = ?, expires_at = ?
     WHERE id = ? AND user_id = ? AND revoked_at IS NULL`,
  ).bind(now.toISOString(), expiresAt, sessionId, userId).run();
  return expiresAt;
}

export async function listSessions(db, userId, currentSessionId) {
  const result = await db.prepare(
    `SELECT id, device_label, ip_masked, country, city, created_at, last_seen_at, expires_at, revoked_at
     FROM auth_sessions
     WHERE user_id = ?
     ORDER BY CASE WHEN id = ? THEN 0 ELSE 1 END, last_seen_at DESC
     LIMIT 25`,
  ).bind(userId, currentSessionId || '').all();

  return (result.results || []).map((row) => ({
    id: row.id,
    device_label: row.device_label || 'Browser • Perangkat',
    ip_masked: row.ip_masked,
    country: row.country,
    city: row.city,
    created_at: row.created_at,
    last_seen_at: row.last_seen_at,
    expires_at: row.expires_at,
    current: row.id === currentSessionId,
    active: !row.revoked_at && new Date(row.expires_at).getTime() > Date.now(),
  }));
}

export async function revokeSession(db, userId, sessionId) {
  const result = await db.prepare(
    `UPDATE auth_sessions SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL`,
  ).bind(new Date().toISOString(), sessionId, userId).run();
  return Number(result.meta?.changes || 0) > 0;
}

export async function revokeOtherSessions(db, userId, currentSessionId) {
  const result = await db.prepare(
    `UPDATE auth_sessions SET revoked_at = ?
     WHERE user_id = ? AND id <> ? AND revoked_at IS NULL`,
  ).bind(new Date().toISOString(), userId, currentSessionId || '').run();
  return Number(result.meta?.changes || 0);
}
