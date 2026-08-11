import { sendVerificationEmail } from '../../../server/auth/email.js';
import { json, requireBindings, requireSameOrigin } from '../../../server/auth/http.js';
import { hashPassword, validatePassword } from '../../../server/auth/password.js';
import { checkRateLimit } from '../../../server/auth/rateLimit.js';
import { createChallenge, createOtp } from '../../../server/auth/tokens.js';
import { createPasswordUser, getUserByEmail } from '../../../server/auth/users.js';
import { recordRegistrationConsent } from '../../../server/auth/consents.js';

const CONSENT_VERSIONS = Object.freeze({ terms: '2026-08-12', privacy: '2026-08-12' });

function validEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function onRequestPost({ request, env }) {
  const requestId = crypto.randomUUID();
  let stage = 'configuration';
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET', 'RESEND_API_KEY', 'AUTH_EMAIL_FROM']);
    requireSameOrigin(request, env);
    stage = 'input';
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (body.termsAccepted !== true) {
      return json({ error: 'You must accept the Terms of Service and Privacy Policy' }, { status: 400 });
    }
    if (!validEmail(email)) return json({ error: 'Enter a valid email address' }, { status: 400 });
    const passwordError = validatePassword(password);
    if (passwordError) return json({ error: passwordError }, { status: 400 });
    stage = 'rate_limit';
    if (!(await checkRateLimit(env.AUTH_DB, request, 'register', email, 5, 60 * 60))) {
      return json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    stage = 'account_lookup';
    let user = await getUserByEmail(env.AUTH_DB, email, { includePassword: true });
    if (user?.email_verified) {
      return json({ error: 'An account with this email already exists' }, { status: 409 });
    }
    if (!user) {
      stage = 'password_hash';
      const passwordHash = await hashPassword(password);
      stage = 'account_create';
      user = await createPasswordUser(env.AUTH_DB, email, passwordHash);
    }
    stage = 'consent';
    await recordRegistrationConsent(
      env.AUTH_DB,
      env.SESSION_SECRET,
      request,
      user.id,
      CONSENT_VERSIONS,
    );

    stage = 'challenge';
    const otp = createOtp();
    await createChallenge(env.AUTH_DB, env.SESSION_SECRET, { email, type: 'email_verify', token: otp, ttlSeconds: 10 * 60 });
    stage = 'email_delivery';
    await sendVerificationEmail(env, email, otp);
    return json({ verification_required: true }, { status: 202 });
  } catch (error) {
    console.error('Registration failed', { requestId, stage, error });
    return json({
      error: 'Registration service unavailable',
      code: `REGISTRATION_${stage.toUpperCase()}_FAILED`,
      request_id: requestId,
    }, { status: 503 });
  }
}
