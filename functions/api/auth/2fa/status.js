import { json, requireBindings } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { getTotpSettings } from '../../../../server/auth/totp.js';

export async function onRequestGet({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    await ensureAuthSchema(env.AUTH_DB);
    const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
    if (!session) return json({ authenticated: false }, { status: 401 });
    const settings = await getTotpSettings(env.AUTH_DB, session.sub);
    return json({ enabled: Boolean(settings?.enabled) });
  } catch (error) {
    console.error('2FA status failed', error);
    return json({ error: 'Two-factor authentication service unavailable' }, { status: 503 });
  }
}
