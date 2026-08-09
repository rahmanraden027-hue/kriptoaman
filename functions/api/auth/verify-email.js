import { json, requireBindings, requireSameOrigin } from '../../../server/auth/http.js';
import { createSessionToken, sessionCookie } from '../../../server/auth/session.js';
import { consumeChallenge } from '../../../server/auth/tokens.js';
import { getUserByEmail, markEmailVerified } from '../../../server/auth/users.js';

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    requireSameOrigin(request, env);
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim();
    if (!email || !/^\d{6}$/.test(code)) return json({ error: 'Invalid verification code' }, { status: 400 });
    const valid = await consumeChallenge(env.AUTH_DB, env.SESSION_SECRET, { email, type: 'email_verify', token: code, maxAttempts: 5 });
    if (!valid) return json({ error: 'Invalid or expired verification code' }, { status: 400 });
    const user = await getUserByEmail(env.AUTH_DB, email);
    if (!user) return json({ error: 'Account not found' }, { status: 404 });
    await markEmailVerified(env.AUTH_DB, user.id);
    const verifiedUser = await getUserByEmail(env.AUTH_DB, email);
    const session = await createSessionToken(env.SESSION_SECRET, verifiedUser);
    return json({ authenticated: true, user: verifiedUser }, { headers: { 'Set-Cookie': sessionCookie(session) } });
  } catch (error) {
    console.error('Email verification failed', error);
    return json({ error: 'Verification service unavailable' }, { status: 503 });
  }
}
