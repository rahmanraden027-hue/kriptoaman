import { json, requireBindings, requireSameOrigin } from '../../../server/auth/http.js';
import { verifyPassword } from '../../../server/auth/password.js';
import { checkRateLimit } from '../../../server/auth/rateLimit.js';
import { ensureAuthSchema } from '../../../server/auth/schema.js';
import { createSessionToken, sessionCookie } from '../../../server/auth/session.js';
import { createVerifiedSession } from '../../../server/auth/sessions.js';
import { decryptTotpSecret, getTotpSettings, verifyTotp } from '../../../server/auth/totp.js';
import { getUserByEmail } from '../../../server/auth/users.js';

const INVALID = { error: 'Invalid email, password, or 2FA code' };

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    requireSameOrigin(request, env);
    await ensureAuthSchema(env.AUTH_DB);
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const code = String(body.code || '').replace(/\D/g, '');
    if (!email || !password || code.length !== 6) return json(INVALID, { status: 401 });

    const allowed = await checkRateLimit(env.AUTH_DB, request, 'login-2fa', email, 10, 15 * 60);
    if (!allowed) return json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });

    const user = await getUserByEmail(env.AUTH_DB, email, { includePassword: true });
    if (!user?.password_hash || !(await verifyPassword(password, user.password_hash))) return json(INVALID, { status: 401 });
    if (!user.email_verified) return json({ error: 'Email verification required', verification_required: true }, { status: 403 });

    const settings = await getTotpSettings(env.AUTH_DB, user.id);
    if (!settings?.enabled || !settings.secret_enc) return json({ error: 'Two-factor authentication is not enabled' }, { status: 409 });
    const secret = await decryptTotpSecret(settings.secret_enc, env.SESSION_SECRET);
    if (!(await verifyTotp(secret, code))) return json(INVALID, { status: 401 });

    const verifiedSession = await createVerifiedSession(env.AUTH_DB, env.SESSION_SECRET, user.id, request);
    const session = await createSessionToken(env.SESSION_SECRET, user, verifiedSession.id);
    const safeUser = { ...user };
    delete safeUser.password_hash;
    return json({ authenticated: true, user: safeUser }, { headers: { 'Set-Cookie': sessionCookie(session) } });
  } catch (error) {
    console.error('2FA login failed', error);
    return json({ error: 'Authentication service unavailable' }, { status: 503 });
  }
}
