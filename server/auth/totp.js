const encoder = new TextEncoder();
const decoder = new TextDecoder();
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

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

function base32Encode(bytes) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(value) {
  const normalized = String(value || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let buffer = 0;
  const bytes = [];
  for (const char of normalized) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx < 0) continue;
    buffer = (buffer << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

async function encryptionKey(secret) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptTotpSecret(secret, masterSecret) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey(masterSecret);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(secret));
  return `${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(ciphertext))}`;
}

export async function decryptTotpSecret(value, masterSecret) {
  const [ivPart, dataPart] = String(value || '').split('.');
  if (!ivPart || !dataPart) throw new Error('Invalid encrypted TOTP secret');
  const key = await encryptionKey(masterSecret);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64UrlDecode(ivPart) },
    key,
    base64UrlDecode(dataPart),
  );
  return decoder.decode(plaintext);
}

export function generateTotpSecret() {
  return base32Encode(crypto.getRandomValues(new Uint8Array(20)));
}

function counterBytes(counter) {
  const bytes = new Uint8Array(8);
  let current = BigInt(counter);
  for (let i = 7; i >= 0; i -= 1) {
    bytes[i] = Number(current & 255n);
    current >>= 8n;
  }
  return bytes;
}

async function totpAt(secret, counter) {
  const key = await crypto.subtle.importKey(
    'raw',
    base32Decode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, counterBytes(counter)));
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24)
    | ((digest[offset + 1] & 0xff) << 16)
    | ((digest[offset + 2] & 0xff) << 8)
    | (digest[offset + 3] & 0xff);
  return String(binary % 1000000).padStart(6, '0');
}

export async function verifyTotp(secret, code, nowMs = Date.now()) {
  const normalized = String(code || '').replace(/\D/g, '');
  if (normalized.length !== 6) return false;
  const counter = Math.floor(nowMs / 30000);
  for (const drift of [-1, 0, 1]) {
    if (await totpAt(secret, counter + drift) === normalized) return true;
  }
  return false;
}

export function otpauthUri(email, secret) {
  const issuer = 'KriptoAman';
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export async function hashBackupCode(code) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(code || '').trim().toUpperCase()));
  return base64UrlEncode(new Uint8Array(digest));
}

export function generateBackupCodes(count = 8) {
  return Array.from({ length: count }, () => {
    const bytes = crypto.getRandomValues(new Uint8Array(5));
    return Array.from(bytes, (b) => (b % 36).toString(36).toUpperCase()).join('');
  });
}

export async function getTotpSettings(db, userId) {
  return db.prepare('SELECT user_id, secret_enc, enabled, backup_hashes, created_at, updated_at FROM auth_totp WHERE user_id = ?')
    .bind(userId)
    .first();
}
