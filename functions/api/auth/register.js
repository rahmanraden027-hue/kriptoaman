import { sendVerificationEmail } from '../../../server/auth/email.js';
import { json, requireBindings, requireSameOrigin } from '../../../server/auth/http.js';
import { hashPassword, validatePassword } from '../../../server/auth/password.js';
import { checkRateLimit } from '../../../server/auth/rateLimit.js';
import { createChallenge, createOtp } from '../../../server/auth/tokens.js';
import { createPasswordUser, getUserByEmail } from '../../../server/auth/users.js';

function validEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET', 'RESEND_API_KEY', 'AUTH_EMAIL_FROM']);
    requireSameOrigin(request, env);
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!validEmail(email)) return json({ error: 'Enter a valid email address' }, { status: 400 });
    const passwordError = validatePassword(password);
    if (passwordError) return json({ error: passwordError }, { status: 400 });
    if (!(await checkRateLimit(env.AUTH_DB, request, 'register', email, 5, 60 * 60))) {
      return json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    let user = await getUserByEmail(env.AUTH_DB, email, { includePassword: true });
    if (user?.email_verified) return json({ verification_required: true }, { status: 202 });
    if (!user) user = await createPasswordUser(env.AUTH_DB, email, await hashPassword(password));

    const otp = createOtp();
    await createChallenge(env.AUTH_DB, env.SESSION_SECRET, { email, type: 'email_verify', token: otp, ttlSeconds: 10 * 60 });
    await sendVerificationEmail(env, email, otp);
    return json({ verification_required: true }, { status: 202 });
  } catch (error) {
    console.error('Registration failed', error);
    return json({ error: 'Registration service unavailable' }, { status: 503 });
  }
}
