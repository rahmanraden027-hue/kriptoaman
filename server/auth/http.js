export function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function authOrigin(request, env) {
  const configured = env.AUTH_ORIGIN?.replace(/\/$/, '');
  if (configured) return configured;
  return new URL(request.url).origin;
}

export function requireBindings(env, names) {
  const missing = names.filter((name) => !env[name]);
  if (missing.length) throw new Error(`Missing server binding: ${missing.join(', ')}`);
}

export function requireSameOrigin(request, env) {
  const origin = request.headers.get('Origin');
  const expected = authOrigin(request, env);
  if (!origin || origin !== expected) {
    const error = new Error('Invalid request origin');
    error.status = 403;
    throw error;
  }
}

export function isAdminEmail(env, email) {
  const admins = (env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
