import homepage from './homepage.html';
import emblem from './zevaryq-emblem.webp';
import favicon from './zevaryq-favicon.png';

const PUBLIC_HOST = 'explorer.kriptoaman.com';
const LEGACY_UPSTREAM = 'explorer-new.kriptoaman.com';
const RELEASE = '1.1.1';
const EXPECTED_ID = '0x560c';
const HTML_CSP = "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://rpc.kriptoaman.com; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; upgrade-insecure-requests";

function verifiedHomepage() {
  return homepage.includes('data-zevaryq-explorer-version="' + RELEASE + '"')
    && homepage.includes('class="logo logo-zvq"')
    && homepage.includes('class="earth-brandmark"')
    && homepage.includes("EXPECTED_CHAIN='" + EXPECTED_ID + "'");
}

function commonHeaders() {
  return {
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-zevaryq-explorer-release': RELEASE,
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method;
    const htmlRequest = url.pathname === '/' && (method === 'GET' || method === 'HEAD');
    if (htmlRequest) {
      if (!verifiedHomepage()) return new Response('Verified ZVQ release unavailable', { status: 503, headers: { 'cache-control': 'no-store' } });
      return new Response(method === 'HEAD' ? null : homepage, {
        status: 200,
        headers: {
          ...commonHeaders(),
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store, max-age=0',
          'content-security-policy': HTML_CSP,
        },
      });
    }

    const binaryAssets = {
      '/zevaryq-assets/zevaryq-emblem.webp': [emblem, 'image/webp'],
      '/zevaryq-assets/zevaryq-favicon.png': [favicon, 'image/png'],
    };
    if ((method === 'GET' || method === 'HEAD') && Object.hasOwn(binaryAssets, url.pathname)) {
      const [body, type] = binaryAssets[url.pathname];
      return new Response(method === 'HEAD' ? null : body, {
        status: 200,
        headers: {
          ...commonHeaders(),
          'content-type': type,
          'cache-control': 'public, max-age=300',
        },
      });
    }

    // Preserve the existing non-homepage upstream and its separate, more
    // specific /api/v2/* Cloudflare Worker route. Never proxy to PUBLIC_HOST.
    const upstream = new URL(request.url);
    upstream.protocol = 'https:';
    upstream.hostname = LEGACY_UPSTREAM;
    upstream.port = '';
    const headers = new Headers(request.headers);
    headers.set('x-forwarded-host', PUBLIC_HOST);
    headers.set('x-forwarded-proto', 'https');

    const init = { method, headers, redirect: 'manual' };
    if (method !== 'GET' && method !== 'HEAD') init.body = request.body;
    const response = await fetch(new Request(upstream, init));
    const out = new Headers(response.headers);
    out.set('x-zevaryq-explorer-release', RELEASE);
    const location = out.get('location');
    if (location) {
      try {
        const resolved = new URL(location, upstream);
        if (resolved.hostname === LEGACY_UPSTREAM) {
          resolved.hostname = PUBLIC_HOST;
          out.set('location', resolved.toString());
        }
      } catch { /* Preserve non-URL redirects as received. */ }
    }
    return new Response(method === 'HEAD' ? null : response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: out,
    });
  },
};
