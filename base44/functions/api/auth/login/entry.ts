import { json, requireBindings, requireSameOrigin } from '../../../server/auth/http.js';
import { hashPassword, verifyPassword } from '../../../server/auth/password.js';
import { checkRateLimit } from '../../../server/auth/rateLimit.js';
import { createSessionToken, sessionCookie } from '../../../server/auth/session.js';
import { getUserByEmail } from '../../../server/auth/users.js';

const INVALID = { error: 'Invalid email or password' };

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    requireSameOrigin(request, env);
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password || email.length > 254 || password.length > 128) return json(INVALID, { status: 401 });
    const allowed = await checkRateLimit(env.AUTH_DB, request, 'login', email, 10, 15 * 60);
    if (!allowed) return json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });

    const user = await getUserByEmail(env.AUTH_DB, email, { includePassword: true });
    if (!user?.password_hash) {
      await hashPassword(password);
      return json(INVALID, { status: 401 });
    }
    if (!(await verifyPassword(password, user.password_hash))) return json(INVALID, { status: 401 });
    if (!user.email_verified) return json({ error: 'Email verification required', verification_required: true }, { status: 403 });

    const session = await createSessionToken(env.SESSION_SECRET, user);
    const safeUser = { ...user };
    delete safeUser.password_hash;
    return json({ authenticated: true, user: safeUser }, { headers: { 'Set-Cookie': sessionCookie(session) } });
  } catch (error) {
    console.error('Password login failed', error);
    return json({ error: 'Authentication service unavailable' }, { status: 503 });
  }
}
