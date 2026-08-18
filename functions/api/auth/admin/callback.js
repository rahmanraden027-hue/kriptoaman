import { isAdminEmail, requireBindings } from '../../../../server/auth/http.js';
import { createSessionToken, sessionCookie } from '../../../../server/auth/session.js';
import { createVerifiedSession } from '../../../../server/auth/sessions.js';
import { consumeOneTimeToken, verifySignedToken } from '../../../../server/auth/tokens.js';
import { getUserByEmail } from '../../../../server/auth/users.js';

const ADMIN_MAGIC_LINK_SESSION_TTL_SECONDS = 60 * 60;

function redirect(location, headers = {}) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      ...headers,
    },
  });
}

export async function onRequestGet({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET', 'ADMIN_EMAILS']);
    const token = new URL(request.url).searchParams.get('token') || '';
    const payload = await verifySignedToken(env.SESSION_SECRET, token, 'admin_magic_link');
    if (!payload?.email || !payload?.jti || !isAdminEmail(env, payload.email)) return redirect('/login?admin_link=invalid');

    const oneTime = await consumeOneTimeToken(env.AUTH_DB, payload.jti);
    if (!oneTime) return redirect('/login?admin_link=used');

    const user = await getUserByEmail(env.AUTH_DB, payload.email);
    if (!user?.email_verified || user.role !== 'admin') return redirect('/login?admin_link=invalid');

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
    return redirect('/ServerControl', {
      'Set-Cookie': sessionCookie(session, ADMIN_MAGIC_LINK_SESSION_TTL_SECONDS),
    });
  } catch (error) {
    console.error('Admin magic link login failed', error);
    return redirect('/login?admin_link=unavailable');
  }
}
