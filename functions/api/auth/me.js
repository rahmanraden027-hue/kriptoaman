import { json, requireBindings, requireSameOrigin } from '../../../server/auth/http.js';
import {
  createSessionToken,
  getSessionToken,
  sessionCookie,
  verifySessionToken,
} from '../../../server/auth/session.js';
import { ensureAuthSchema } from '../../../server/auth/schema.js';
import { createVerifiedSession, getActiveSession, touchSession } from '../../../server/auth/sessions.js';
import { getUserById, updateUserProfile } from '../../../server/auth/users.js';

async function resolveVerifiedSession(request, env, tokenSession, user) {
  if (tokenSession.sid) {
    const active = await getActiveSession(env.AUTH_DB, tokenSession.sid, user.id);
    if (!active) return null;
    await touchSession(env.AUTH_DB, tokenSession.sid, user.id);
    return tokenSession.sid;
  }

  // Seamless migration for valid cookies issued before server-side session tracking.
  const created = await createVerifiedSession(env.AUTH_DB, env.SESSION_SECRET, user.id, request);
  return created.id;
}

export async function onRequestGet({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    await ensureAuthSchema(env.AUTH_DB);
    const token = getSessionToken(request);
    const session = await verifySessionToken(env.SESSION_SECRET, token);
    if (!session) return json({ authenticated: false }, { status: 401 });
    const user = await getUserById(env.AUTH_DB, session.sub);
    if (!user) return json({ authenticated: false }, { status: 401 });

    const sessionId = await resolveVerifiedSession(request, env, session, user);
    if (!sessionId) return json({ authenticated: false }, { status: 401 });

    const renewedToken = await createSessionToken(env.SESSION_SECRET, user, sessionId);
    return json(
      { authenticated: true, user },
      { headers: { 'Set-Cookie': sessionCookie(renewedToken), 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Session lookup failed', error);
    return json({ error: 'Authentication service unavailable' }, { status: 503 });
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    requireSameOrigin(request, env);
    await ensureAuthSchema(env.AUTH_DB);
    const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
    if (!session) return json({ authenticated: false }, { status: 401 });
    const existingUser = await getUserById(env.AUTH_DB, session.sub);
    if (!existingUser) return json({ authenticated: false }, { status: 401 });
    const sessionId = await resolveVerifiedSession(request, env, session, existingUser);
    if (!sessionId) return json({ authenticated: false }, { status: 401 });

    const body = await request.json();
    const changes = {};
    const allowedKeys = new Set(['full_name', 'bio', 'phone', 'referralCode']);
    const unsupported = Object.keys(body).filter((key) => !allowedKeys.has(key));
    if (unsupported.length) return json({ error: 'Unsupported profile field' }, { status: 400 });
    if (body.full_name !== undefined) changes.full_name = String(body.full_name).trim().slice(0, 120);
    if (body.bio !== undefined) changes.bio = String(body.bio).trim().slice(0, 500);
    if (body.phone !== undefined) changes.phone = String(body.phone).trim().slice(0, 32);
    if (body.referralCode !== undefined) {
      const referralCode = String(body.referralCode).trim().toUpperCase();
      if (!/^KA[A-Z0-9]{6}$/.test(referralCode)) return json({ error: 'Invalid referral code' }, { status: 400 });
      changes.referralCode = referralCode;
    }
    const user = await updateUserProfile(env.AUTH_DB, session.sub, changes);
    if (!user) return json({ authenticated: false }, { status: 401 });

    const renewedToken = await createSessionToken(env.SESSION_SECRET, user, sessionId);
    return json(
      { authenticated: true, user },
      { headers: { 'Set-Cookie': sessionCookie(renewedToken), 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Profile update failed', error);
    return json({ error: 'Profile service unavailable' }, { status: 503 });
  }
}
