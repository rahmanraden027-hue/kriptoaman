const encoder = new TextEncoder();

const SESSION_COOKIE = 'ka_session';
const OAUTH_STATE_COOKIE = 'ka_oauth_state';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function base64UrlEncode(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return null;
}

async function importSigningKey(secret) {
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters');
  }
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function sign(secret, message) {
  const key = await importSigningKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return base64UrlEncode(new Uint8Array(signature));
}

export async function createSessionToken(secret, user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role || 'user',
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await sign(secret, encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(secret, token) {
  if (!token || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  try {
    const key = await importSigningKey(secret);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(signature),
      encoder.encode(payload),
    );
    if (!valid) return null;
    const decoded = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
    if (!decoded.exp || decoded.exp <= Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function getSessionToken(request) {
  return readCookie(request, SESSION_COOKIE);
}

export function sessionCookie(token) {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export function createOAuthState() {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
}

export function oauthStateCookie(state) {
  return `${OAUTH_STATE_COOKIE}=${state}; Path=/api/auth/google; Max-Age=600; HttpOnly; Secure; SameSite=Lax`;
}

export function clearOAuthStateCookie() {
  return `${OAUTH_STATE_COOKIE}=; Path=/api/auth/google; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export function getOAuthState(request) {
  return readCookie(request, OAUTH_STATE_COOKIE);
}
