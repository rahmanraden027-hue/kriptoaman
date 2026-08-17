import { json, requireBindings, requireSameOrigin } from '../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../server/auth/session.js';
import { getActiveSession, listSessions, revokeOtherSessions, revokeSession } from '../../../server/auth/sessions.js';

async function authenticate(request, env) {
  requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
  await ensureAuthSchema(env.AUTH_DB);
  const token = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
  if (!token?.sub || !token?.sid) return null;
  const active = await getActiveSession(env.AUTH_DB, token.sid, token.sub);
  if (!active) return null;
  return token;
}

export async function onRequestGet({ request, env }) {
  try {
    const session = await authenticate(request, env);
    if (!session) return json({ authenticated: false }, { status: 401 });
    const sessions = await listSessions(env.AUTH_DB, session.sub, session.sid);
    return json({ sessions }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Session list failed', error);
    return json({ error: 'Session service unavailable' }, { status: 503 });
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    requireSameOrigin(request, env);
    const session = await authenticate(request, env);
    if (!session) return json({ authenticated: false }, { status: 401 });
    const body = await request.json().catch(() => ({}));

    if (body.others === true) {
      const revoked = await revokeOtherSessions(env.AUTH_DB, session.sub, session.sid);
      return json({ revoked, current_session_preserved: true });
    }

    const sessionId = String(body.sessionId || '');
    if (!sessionId) return json({ error: 'sessionId is required' }, { status: 400 });
    if (sessionId === session.sid) return json({ error: 'Use logout to end the current session' }, { status: 409 });

    const revoked = await revokeSession(env.AUTH_DB, session.sub, sessionId);
    return json({ revoked: revoked ? 1 : 0 });
  } catch (error) {
    console.error('Session revoke failed', error);
    return json({ error: 'Session service unavailable' }, { status: 503 });
  }
}
