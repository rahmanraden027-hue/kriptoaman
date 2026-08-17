import { json, requireBindings, requireSameOrigin } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { decryptTotpSecret, getTotpSettings, verifyTotp } from '../../../../server/auth/totp.js';

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    requireSameOrigin(request, env);
    await ensureAuthSchema(env.AUTH_DB);
    const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
    if (!session) return json({ authenticated: false }, { status: 401 });
    const body = await request.json();
    const code = String(body.code || '').replace(/\D/g, '');
    if (code.length !== 6) return json({ error: 'Kode 2FA harus 6 digit' }, { status: 400 });

    const settings = await getTotpSettings(env.AUTH_DB, session.sub);
    if (!settings?.secret_enc) return json({ error: 'Mulai setup 2FA terlebih dahulu' }, { status: 400 });
    const secret = await decryptTotpSecret(settings.secret_enc, env.SESSION_SECRET);
    if (!(await verifyTotp(secret, code))) return json({ error: 'Kode 2FA tidak valid' }, { status: 401 });

    await env.AUTH_DB.prepare('UPDATE auth_totp SET enabled = 1, updated_at = ? WHERE user_id = ?')
      .bind(new Date().toISOString(), session.sub)
      .run();
    return json({ enabled: true });
  } catch (error) {
    console.error('2FA verification failed', error);
    return json({ error: 'Unable to verify two-factor authentication' }, { status: 503 });
  }
}
