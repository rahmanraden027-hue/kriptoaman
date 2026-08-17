import { clearSessionCookie, getSessionToken, verifySessionToken } from '../../../server/auth/session.js';
import { requireSameOrigin } from '../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../server/auth/schema.js';
import { revokeSession } from '../../../server/auth/sessions.js';

export async function onRequestPost({ request, env }) {
  try {
    requireSameOrigin(request, env);
    if (env.AUTH_DB && env.SESSION_SECRET) {
      await ensureAuthSchema(env.AUTH_DB);
      const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
      if (session?.sid && session?.sub) {
        await revokeSession(env.AUTH_DB, session.sub, session.sid);
      }
    }
  } catch {
    return new Response(null, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: {
      'Set-Cookie': clearSessionCookie(),
      'Cache-Control': 'no-store',
    },
  });
}
