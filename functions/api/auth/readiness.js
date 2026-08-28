import { json, requireBindings } from '../../../server/auth/http.js';

export async function onRequestGet({ env }) {
  const requestId = crypto.randomUUID();
  const checks = {
    configuration: false,
    database: false,
    email: false,
    session: false,
  };

  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET', 'RESEND_API_KEY', 'AUTH_EMAIL_FROM']);
    checks.configuration = true;
    checks.email = Boolean(env.RESEND_API_KEY && env.AUTH_EMAIL_FROM);
    checks.session = Boolean(env.SESSION_SECRET);

    const row = await env.AUTH_DB.prepare('SELECT 1 AS ok').first();
    checks.database = Number(row?.ok) === 1;

    const ready = Object.values(checks).every(Boolean);
    return json({
      ready,
      service: 'kriptoaman-auth',
      registration: ready,
      checks,
      checked_at: new Date().toISOString(),
      request_id: requestId,
    }, { status: ready ? 200 : 503 });
  } catch (error) {
    console.error('Auth readiness failed', { requestId, error });
    return json({
      ready: false,
      service: 'kriptoaman-auth',
      registration: false,
      checks,
      checked_at: new Date().toISOString(),
      request_id: requestId,
    }, { status: 503 });
  }
}
