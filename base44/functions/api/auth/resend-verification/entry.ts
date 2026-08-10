import { sendVerificationEmail } from '../../../server/auth/email.js';
import { json, requireBindings, requireSameOrigin } from '../../../server/auth/http.js';
import { checkRateLimit } from '../../../server/auth/rateLimit.js';
import { createChallenge, createOtp } from '../../../server/auth/tokens.js';
import { getUserByEmail } from '../../../server/auth/users.js';

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET', 'RESEND_API_KEY', 'AUTH_EMAIL_FROM']);
    requireSameOrigin(request, env);
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    if (!(await checkRateLimit(env.AUTH_DB, request, 'resend', email || 'invalid', 5, 60 * 60))) {
      return json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }
    const user = email ? await getUserByEmail(env.AUTH_DB, email) : null;
    if (user && !user.email_verified) {
      const otp = createOtp();
      await createChallenge(env.AUTH_DB, env.SESSION_SECRET, { email, type: 'email_verify', token: otp, ttlSeconds: 10 * 60 });
      await sendVerificationEmail(env, email, otp);
    }
    return json({ sent: true });
  } catch (error) {
    console.error('Verification resend failed', error);
    return json({ sent: true });
  }
}
