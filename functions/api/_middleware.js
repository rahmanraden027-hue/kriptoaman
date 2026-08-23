const BLOCKED_METHODS = new Set(['TRACE', 'TRACK', 'CONNECT']);
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const SECURITY_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  Pragma: 'no-cache',
  Expires: '0',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

function jsonError(message, status, extraHeaders = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...SECURITY_HEADERS,
      ...extraHeaders,
    },
  });
}

function isTrustedBrowserOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;

  const requestOrigin = new URL(request.url).origin;
  if (origin === requestOrigin) return true;

  // Capacitor uses a local application origin while calling the production API.
  return origin === 'capacitor://localhost' || origin === 'http://localhost' || origin === 'https://localhost';
}

export async function onRequest(context) {
  const { request } = context;
  const method = request.method.toUpperCase();

  if (BLOCKED_METHODS.has(method)) {
    return jsonError('Method not allowed', 405, {
      Allow: 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
    });
  }

  // Browser state-changing requests must originate from this application.
  // Server-to-server integrations that do not send Origin continue to work.
  if (!SAFE_METHODS.has(method) && !isTrustedBrowserOrigin(request)) {
    return jsonError('Cross-origin request blocked', 403);
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
