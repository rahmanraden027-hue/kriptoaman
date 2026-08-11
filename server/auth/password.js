const encoder = new TextEncoder();
// Cloudflare Pages Functions must complete password operations within the
// request CPU budget. Keep the iteration count encoded in every hash so it
// can be raised transparently as the runtime budget evolves.
const ITERATIONS = 100000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

function encode(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decode(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    HASH_BYTES * 8,
  );
  return new Uint8Array(bits);
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i += 1) difference |= a[i] ^ b[i];
  return difference === 0;
}

export function validatePassword(password) {
  if (typeof password !== 'string') return 'Password is required';
  if (password.length < 12) return 'Password must contain at least 12 characters';
  if (password.length > 128) return 'Password must contain no more than 128 characters';
  return null;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2_sha256$${ITERATIONS}$${encode(salt)}$${encode(hash)}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string') return false;
  const [algorithm, rawIterations, rawSalt, rawHash] = stored.split('$');
  const iterations = Number(rawIterations);
  if (algorithm !== 'pbkdf2_sha256' || !Number.isSafeInteger(iterations) || iterations < 1) return false;
  try {
    const expected = decode(rawHash);
    const actual = await derive(password, decode(rawSalt), iterations);
    return constantTimeEqual(actual, expected);
  } catch {
    return false;
  }
}
