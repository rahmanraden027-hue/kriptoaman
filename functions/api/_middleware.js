const BLOCKED_METHODS = new Set(['TRACE', 'TRACK', 'CONNECT']);

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

export async function onRequest(context) {
  const { request } = context;

  if (BLOCKED_METHODS.has(request.method.toUpperCase())) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Allow: 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
        ...SECURITY_HEADERS,
      },
    });
  }

  const response = await context.next();
  const hardened = new Response(response.body, response);

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    hardened.headers.set(name, value);
  }

  return hardened;
}
