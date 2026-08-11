import { sendAdminMagicLinkEmail } from '../../../../server/auth/email.js';
import { authOrigin, isAdminEmail, json, requireBindings, requireSameOrigin } from '../../../../server/auth/http.js';
import { checkRateLimit } from '../../../../server/auth/rateLimit.js';
import { createSignedToken } from '../../../../server/auth/tokens.js';
import { getUserByEmail } from '../../../../server/auth/users.js';

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET', 'RESEND_API_KEY', 'AUTH_EMAIL_FROM', 'ADMIN_EMAILS']);
    requireSameOrigin(request, env);
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const allowed = await checkRateLimit(env.AUTH_DB, request, 'admin-link', email || 'invalid', 3, 60 * 60);
    if (!allowed) return json({ sent: true });

    const user = email ? await getUserByEmail(env.AUTH_DB, email) : null;
    if (user?.email_verified && isAdminEmail(env, email)) {
      const now = Math.floor(Date.now() / 1000);
      const token = await createSignedToken(env.SESSION_SECRET, {
        purpose: 'admin_magic_link',
        email,
        jti: crypto.randomUUID(),
        iat: now,
        exp: now + 10 * 60,
      });
      const loginUrl = authOrigin(request, env) + '/api/auth/admin/callback?token=' + encodeURIComponent(token);
      await sendAdminMagicLinkEmail(env, email, loginUrl);
    }
    return json({ sent: true });
  } catch (error) {
    console.error('Admin magic link request failed', error);
    return json({ sent: true });
  }
}
