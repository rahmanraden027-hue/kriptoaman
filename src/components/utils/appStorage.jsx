/**
 * appStorage — encrypted localStorage wrapper (XOR + base64 obfuscation)
 * For truly sensitive data (keys, seeds) always use server-side storage.
 */

const SALT = 'ka_s3cur3_2026';

function xorEncrypt(str, key) {
  return str.split('').map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('');
}

function encode(value) {
  try {
    const json = typeof value === 'string' ? value : JSON.stringify(value);
    return btoa(unescape(encodeURIComponent(xorEncrypt(json, SALT))));
  } catch { return null; }
}

function decode(encoded) {
  try {
    return xorEncrypt(decodeURIComponent(escape(atob(encoded))), SALT);
  } catch { return null; }
}

export const appStorage = {
  set(key, value) {
    try { localStorage.setItem(`_ka_${key}`, encode(value)); } catch {}
  },
  get(key) {
    try {
      const raw = localStorage.getItem(`_ka_${key}`);
      if (!raw) return null;
      return decode(raw);
    } catch { return null; }
  },
  getJSON(key) {
    const raw = this.get(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  remove(key) { localStorage.removeItem(`_ka_${key}`); },
  clear() {
    Object.keys(localStorage).filter(k => k.startsWith('_ka_')).forEach(k => localStorage.removeItem(k));
  },
};

export default appStorage;