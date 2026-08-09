import { sendPasswordResetEmail } from '../../../server/auth/email.js';
import { authOrigin, json, requireBindings, requireSameOrigin } from '../../../server/auth/http.js';
import { checkRateLimit } from '../../../server/auth/rateLimit.js';
import { createChallenge, createResetToken } from '../../../server/auth/tokens.js';
import { getUserByEmail } from '../../../server/auth/users.js';

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET', 'RESEND_API_KEY', 'AUTH_EMAIL_FROM']);
    requireSameOrigin(request, env);
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    if (!(await checkRateLimit(env.AUTH_DB, request, 'forgot', email || 'invalid', 5, 60 * 60))) return json({ sent: true });
    const user = email ? await getUserByEmail(env.AUTH_DB, email) : null;
    if (user?.email_verified) {
      const rawToken = createResetToken();
      const challengeId = await createChallenge(env.AUTH_DB, env.SESSION_SECRET, {
        email,
        type: 'password_reset',
        token: rawToken,
        ttlSeconds: 30 * 60,
      });
      const token = `${challengeId}.${rawToken}`;
      const resetUrl = `${authOrigin(request, env)}/reset-password?token=${encodeURIComponent(token)}`;
      await sendPasswordResetEmail(env, email, resetUrl);
    }
    return json({ sent: true });
  } catch (error) {
    console.error('Password reset request failed', error);
    return json({ sent: true });
  }
}
