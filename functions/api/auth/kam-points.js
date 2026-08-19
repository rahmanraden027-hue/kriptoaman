import { json, requireBindings } from '../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../server/auth/session.js';
import { getActiveSession } from '../../../server/auth/sessions.js';
import { getUserById } from '../../../server/auth/users.js';
import { getKamPointsSummary } from '../../../server/auth/kamPoints.js';

export async function onRequestGet({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    await ensureAuthSchema(env.AUTH_DB);

    const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
    if (!session?.sub || !session?.sid) {
      return json({ authenticated: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }

    const activeSession = await getActiveSession(env.AUTH_DB, session.sid, session.sub);
    if (!activeSession) {
      return json({ authenticated: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }

    const user = await getUserById(env.AUTH_DB, session.sub);
    if (!user) {
      return json({ authenticated: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }

    const points = await getKamPointsSummary(env.AUTH_DB, user.id);
    return json({
      unit: 'KAM_POINTS',
      onChain: false,
      transferable: false,
      redeemable: false,
      ...points,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('KAM Points lookup failed', error);
    return json({ error: 'KAM Points service unavailable' }, { status: 503 });
  }
}
