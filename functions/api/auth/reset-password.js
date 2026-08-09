import { json, requireBindings, requireSameOrigin } from '../../../server/auth/http.js';
import { hashPassword, validatePassword } from '../../../server/auth/password.js';
import { findResetChallenge, markChallengeUsed } from '../../../server/auth/tokens.js';
import { getUserByEmail, setPassword } from '../../../server/auth/users.js';

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    requireSameOrigin(request, env);
    const body = await request.json();
    const token = String(body.token || '');
    const newPassword = String(body.newPassword || '');
    const passwordError = validatePassword(newPassword);
    if (!token || passwordError) return json({ error: passwordError || 'Invalid reset token' }, { status: 400 });
    const challenge = await findResetChallenge(env.AUTH_DB, env.SESSION_SECRET, token);
    if (!challenge || challenge.attempts >= 5) return json({ error: 'Invalid or expired reset token' }, { status: 400 });
    const user = await getUserByEmail(env.AUTH_DB, challenge.email);
    if (!user) return json({ error: 'Invalid or expired reset token' }, { status: 400 });
    await setPassword(env.AUTH_DB, user.id, await hashPassword(newPassword));
    await markChallengeUsed(env.AUTH_DB, challenge.id);
    return json({ reset: true });
  } catch (error) {
    console.error('Password reset failed', error);
    return json({ error: 'Password reset service unavailable' }, { status: 503 });
  }
}
