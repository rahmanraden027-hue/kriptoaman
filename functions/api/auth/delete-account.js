import { clearSessionCookie, getSessionToken, verifySessionToken } from '../../../server/auth/session.js';
import { isAdminEmail, json, requireBindings, requireSameOrigin } from '../../../server/auth/http.js';
import { deleteUserAccount, getUserById } from '../../../server/auth/users.js';

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    requireSameOrigin(request, env);

    const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
    if (!session) return json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    if (body.confirmation !== 'HAPUS') {
      return json({ error: 'Type HAPUS to confirm account deletion' }, { status: 400 });
    }

    const user = await getUserById(env.AUTH_DB, session.sub);
    if (!user) return json({ error: 'Account not found' }, { status: 404 });
    if (user.role === 'admin' || isAdminEmail(env, user.email)) {
      return json({ error: 'Administrator accounts require an audited removal process' }, { status: 403 });
    }

    const deleted = await deleteUserAccount(env.AUTH_DB, user);
    if (!deleted) return json({ error: 'Account deletion could not be completed' }, { status: 409 });

    return json({ deleted: true }, {
      status: 200,
      headers: { 'Set-Cookie': clearSessionCookie() },
    });
  } catch (error) {
    console.error('Account deletion failed', error);
    return json({ error: 'Account deletion service unavailable' }, { status: 503 });
  }
}
