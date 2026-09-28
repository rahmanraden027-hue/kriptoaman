import { sendPasswordResetEmail } from '../../../server/auth/email.js';
import { authOrigin, json, requireBindings, requireSameOrigin } from '../../../server/auth/http.js';
import { checkRateLimit } from '../../../server/auth/rateLimit.js';
import { createChallenge, createResetToken } from '../../../server/auth/tokens.js';
import { getUserByEmail } from '../../../server/auth/users.js';

function scheduleDelivery(context, task) {
  const guarded = task.catch((error) => {
    console.error('Password reset email delivery failed', error);
  });
  if (typeof context.waitUntil === 'function') {
    context.waitUntil(guarded);
    return;
  }
  return guarded;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET', 'RESEND_API_KEY', 'AUTH_EMAIL_FROM']);
    requireSameOrigin(request, env);

    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();

    // Always return the same public response. Invalid or unknown accounts do not
    // consume rate-limit writes and cannot be used to enumerate registrations.
    if (!email) return json({ sent: true });

    const user = await getUserByEmail(env.AUTH_DB, email);
    if (!user?.email_verified) return json({ sent: true });

    if (!(await checkRateLimit(env.AUTH_DB, request, 'forgot', user.id, 5, 60 * 60))) {
      return json({ sent: true });
    }

    const rawToken = createResetToken();
    const challengeId = await createChallenge(env.AUTH_DB, env.SESSION_SECRET, {
      email,
      type: 'password_reset',
      token: rawToken,
      ttlSeconds: 30 * 60,
    });
    const token = `${challengeId}.${rawToken}`;
    const resetUrl = `${authOrigin(request, env)}/reset-password?token=${encodeURIComponent(token)}`;

    const delivery = scheduleDelivery(context, sendPasswordResetEmail(env, email, resetUrl));
    if (delivery) await delivery;

    return json({ sent: true });
  } catch (error) {
    console.error('Password reset request failed', error);
    return json({ sent: true });
  }
}
