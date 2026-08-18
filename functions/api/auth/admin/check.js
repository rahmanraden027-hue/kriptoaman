import { json, requireBindings } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { getActiveSession } from '../../../../server/auth/sessions.js';
import { getUserById } from '../../../../server/auth/users.js';

export async function onRequestGet({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    await ensureAuthSchema(env.AUTH_DB);

    const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
    if (!session?.sub || !session?.sid) {
      return json({ admin: false, error: 'Authentication required' }, { status: 401 });
    }

    const activeSession = await getActiveSession(env.AUTH_DB, session.sid, session.sub);
    if (!activeSession) {
      return json({ admin: false, error: 'Session inactive' }, { status: 401 });
    }

    const user = await getUserById(env.AUTH_DB, session.sub);
    if (!user || user.role !== 'admin') {
      return json({ admin: false, error: 'Admin access required' }, { status: 403 });
    }

    return json({ admin: true, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Admin access check failed', error);
    return json({ admin: false, error: 'Admin verification unavailable' }, { status: 503 });
  }
}
