import { isAdminEmail, json, requireBindings, requireSameOrigin } from '../../../../server/auth/http.js';
import { checkRateLimit } from '../../../../server/auth/rateLimit.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { createSessionToken, sessionCookie } from '../../../../server/auth/session.js';
import { createVerifiedSession } from '../../../../server/auth/sessions.js';
import { decryptTotpSecret, getTotpSettings, verifyTotp } from '../../../../server/auth/totp.js';
import { consumeOneTimeToken, verifySignedToken } from '../../../../server/auth/tokens.js';
import { getUserByEmail } from '../../../../server/auth/users.js';

const ADMIN_2FA_COOKIE = 'ka_admin_2fa';
const ADMIN_SESSION_TTL_SECONDS = 60 * 60;
const INVALID = { error: 'Invalid or expired administrator verification' };

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return null;
}

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET', 'ADMIN_EMAILS']);
    requireSameOrigin(request, env);
    await ensureAuthSchema(env.AUTH_DB);

    const body = await request.json();
    const code = String(body.code || '').replace(/\D/g, '');
    if (code.length !== 6) return json(INVALID, { status: 401 });

    const challengeToken = readCookie(request, ADMIN_2FA_COOKIE);
    const payload = await verifySignedToken(env.SESSION_SECRET, challengeToken, 'admin_2fa_challenge');
    if (!payload?.email || !payload?.jti || !isAdminEmail(env, payload.email)) {
      return json(INVALID, { status: 401 });
    }

    const allowed = await checkRateLimit(env.AUTH_DB, request, 'admin-2fa', payload.email, 8, 10 * 60);
    if (!allowed) return json({ error: 'Too many administrator verification attempts. Try again later.' }, { status: 429 });

    const user = await getUserByEmail(env.AUTH_DB, payload.email);
    if (!user?.email_verified || user.role !== 'admin') return json(INVALID, { status: 401 });

    const settings = await getTotpSettings(env.AUTH_DB, user.id);
    if (!settings?.enabled || !settings.secret_enc) return json(INVALID, { status: 401 });
    const secret = await decryptTotpSecret(settings.secret_enc, env.SESSION_SECRET);
    if (!(await verifyTotp(secret, code))) return json(INVALID, { status: 401 });

    // Consume the challenge only after the second factor is valid, then issue
    // the authenticated admin session. Reuse of the same challenge is denied.
    if (!(await consumeOneTimeToken(env.AUTH_DB, payload.jti))) return json(INVALID, { status: 401 });

    const verifiedSession = await createVerifiedSession(
      env.AUTH_DB,
      env.SESSION_SECRET,
      user.id,
      request,
      ADMIN_SESSION_TTL_SECONDS,
    );
    const session = await createSessionToken(
      env.SESSION_SECRET,
      user,
      verifiedSession.id,
      ADMIN_SESSION_TTL_SECONDS,
    );

    return json(
      { authenticated: true, admin: true },
      { headers: { 'Set-Cookie': sessionCookie(session, ADMIN_SESSION_TTL_SECONDS) } },
    );
  } catch (error) {
    console.error('Admin 2FA verification failed', error);
    return json({ error: 'Administrator verification unavailable' }, { status: 503 });
  }
}
