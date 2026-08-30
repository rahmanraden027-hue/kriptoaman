import { json, requireBindings, requireSameOrigin, isAdminEmail } from '../../../../server/auth/http.js';
import { checkRateLimit } from '../../../../server/auth/rateLimit.js';
import { createSessionToken, sessionCookie } from '../../../../server/auth/session.js';
import { createVerifiedSession } from '../../../../server/auth/sessions.js';
import { decryptTotpSecret, getTotpSettings, verifyTotp } from '../../../../server/auth/totp.js';
import { consumeOneTimeToken, verifySignedToken } from '../../../../server/auth/tokens.js';
import { getUserByEmail } from '../../../../server/auth/users.js';

const CHALLENGE_COOKIE = 'ka_admin_2fa';
const ADMIN_MAGIC_LINK_SESSION_TTL_SECONDS = 60 * 60;

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return null;
}

function clearChallengeCookie() {
  return `${CHALLENGE_COOKIE}=; Path=/api/auth/admin; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Priority=High`;
}

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET', 'ADMIN_EMAILS']);
    requireSameOrigin(request, env);

    const challengeToken = readCookie(request, CHALLENGE_COOKIE);
    const payload = await verifySignedToken(env.SESSION_SECRET, challengeToken, 'admin_magic_2fa');
    if (!payload?.email || !payload?.jti || !isAdminEmail(env, payload.email)) {
      return json({ error: 'Admin verification expired. Request a new sign-in link.' }, { status: 401, headers: { 'Set-Cookie': clearChallengeCookie() } });
    }

    const body = await request.json();
    const code = String(body.code || '').replace(/\D/g, '');
    if (code.length !== 6) return json({ error: 'Enter a valid 6-digit authentication code.' }, { status: 400 });

    const allowed = await checkRateLimit(env.AUTH_DB, request, 'admin-magic-2fa', payload.email, 6, 15 * 60);
    if (!allowed) return json({ error: 'Too many verification attempts. Request a new sign-in link.' }, { status: 429, headers: { 'Set-Cookie': clearChallengeCookie() } });

    const user = await getUserByEmail(env.AUTH_DB, payload.email);
    if (!user?.email_verified || user.role !== 'admin' || !isAdminEmail(env, user.email)) {
      return json({ error: 'Admin access required.' }, { status: 403, headers: { 'Set-Cookie': clearChallengeCookie() } });
    }

    const settings = await getTotpSettings(env.AUTH_DB, user.id);
    if (!settings?.enabled || !settings.secret_enc) {
      return json({ error: 'Administrator 2FA is not configured.' }, { status: 409, headers: { 'Set-Cookie': clearChallengeCookie() } });
    }

    const secret = await decryptTotpSecret(settings.secret_enc, env.SESSION_SECRET);
    if (!(await verifyTotp(secret, code))) {
      return json({ error: 'Invalid authentication code.' }, { status: 401 });
    }

    const oneTime = await consumeOneTimeToken(env.AUTH_DB, payload.jti);
    if (!oneTime) {
      return json({ error: 'This administrator verification challenge has already been used.' }, { status: 401, headers: { 'Set-Cookie': clearChallengeCookie() } });
    }

    const activeSession = await createVerifiedSession(
      env.AUTH_DB,
      env.SESSION_SECRET,
      user.id,
      request,
      ADMIN_MAGIC_LINK_SESSION_TTL_SECONDS,
    );
    const session = await createSessionToken(
      env.SESSION_SECRET,
      user,
      activeSession.id,
      ADMIN_MAGIC_LINK_SESSION_TTL_SECONDS,
    );

    const headers = new Headers();
    headers.append('Set-Cookie', sessionCookie(session, ADMIN_MAGIC_LINK_SESSION_TTL_SECONDS));
    headers.append('Set-Cookie', clearChallengeCookie());
    return json({ authenticated: true, admin: true }, { headers });
  } catch (error) {
    console.error('Admin magic-link 2FA verification failed', error);
    return json({ error: 'Administrator verification service unavailable.' }, { status: 503 });
  }
}
