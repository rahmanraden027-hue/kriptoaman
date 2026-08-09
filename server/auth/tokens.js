const encoder = new TextEncoder();

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
