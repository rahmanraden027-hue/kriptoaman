const encoder = new TextEncoder();

function decode(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function encode(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const result = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return encode(new Uint8Array(result));
}

export function createOtp() {
  const upperBound = 0x100000000 - (0x100000000 % 1000000);
  let value;
  do {
    value = crypto.getRandomValues(new Uint32Array(1))[0];
  } while (value >= upperBound);
  return String(value % 1000000).padStart(6, '0');
}

export function createResetToken() {
  return encode(crypto.getRandomValues(new Uint8Array(32)));
}

export function tokenDigest(secret, type, email, token) {
  return hmac(secret, `${type}:${email.toLowerCase()}:${token}`);
}

export async function createChallenge(db, secret, { email, type, token, ttlSeconds }) {
  const now = Date.now();
  const digest = await tokenDigest(secret, type, email, token);
  const id = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO auth_challenges (id, email, type, secret_hash, expires_at, attempts, used_at, created_at)
    VALUES (?, ?, ?, ?, ?, 0, NULL, ?)
  `).bind(
    id,
    email.toLowerCase(),
    type,
    digest,
    new Date(now + ttlSeconds * 1000).toISOString(),
    new Date(now).toISOString(),
  ).run();
  return id;
}

export async function consumeChallenge(db, secret, { email, type, token, maxAttempts = 5 }) {
  const normalizedEmail = email.toLowerCase();
  const challenge = await db.prepare(`
    SELECT id, secret_hash, expires_at, attempts
    FROM auth_challenges
    WHERE email = ? AND type = ? AND used_at IS NULL
    ORDER BY created_at DESC LIMIT 1
  `).bind(normalizedEmail, type).first();
  if (!challenge) return false;
  if (challenge.attempts >= maxAttempts || Date.parse(challenge.expires_at) <= Date.now()) return false;

  await db.prepare('UPDATE auth_challenges SET attempts = attempts + 1 WHERE id = ?')
    .bind(challenge.id)
    .run();
  const digest = await tokenDigest(secret, type, normalizedEmail, token);
  if (digest !== challenge.secret_hash) return false;
  await db.prepare('UPDATE auth_challenges SET used_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), challenge.id)
    .run();
  return true;
}

export async function findResetChallenge(db, secret, token) {
  const separator = token.indexOf('.');
  if (separator <= 0) return null;
  const id = token.slice(0, separator);
  const rawToken = token.slice(separator + 1);
  if (!rawToken) return null;
  const challenge = await db.prepare(`
    SELECT id, email, secret_hash, expires_at, attempts
    FROM auth_challenges
    WHERE id = ? AND type = 'password_reset' AND used_at IS NULL AND expires_at > ?
    LIMIT 1
  `).bind(id, new Date().toISOString()).first();
  if (!challenge) return null;
  const digest = await tokenDigest(secret, 'password_reset', challenge.email, rawToken);
  return digest === challenge.secret_hash ? challenge : null;
}

export async function markChallengeUsed(db, id) {
  await db.prepare('UPDATE auth_challenges SET used_at = ?, attempts = attempts + 1 WHERE id = ?')
    .bind(new Date().toISOString(), id)
    .run();
}


export async function createSignedToken(secret, payload) {
  const encodedPayload = encode(encoder.encode(JSON.stringify(payload)));
  const signature = await hmac(secret, 'signed:' + encodedPayload);
  return encodedPayload + '.' + signature;
}

export async function verifySignedToken(secret, token, purpose) {
  if (!token || !token.includes('.')) return null;
  const parts = token.split('.');
  const encodedPayload = parts[0];
  const signature = parts[1];
  if (!encodedPayload || !signature || parts.length !== 2) return null;
  const expected = await hmac(secret, 'signed:' + encodedPayload);
  if (signature !== expected) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(decode(encodedPayload)));
    if (payload.purpose !== purpose || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function consumeOneTimeToken(db, jti) {
  if (!jti) return false;
  const result = await db.prepare(
    'INSERT OR IGNORE INTO auth_rate_limits (key, count, window_started_at) VALUES (?, 1, ?)'
  ).bind('used-token:' + jti, new Date().toISOString()).run();
  return Number(result?.meta?.changes || 0) === 1;
}
