import { sendAdminMagicLinkEmail } from '../../../../server/auth/email.js';
import { authOrigin, isAdminEmail, json, requireBindings, requireSameOrigin } from '../../../../server/auth/http.js';
import { checkRateLimit } from '../../../../server/auth/rateLimit.js';
import { createSignedToken } from '../../../../server/auth/tokens.js';
import { getUserByEmail } from '../../../../server/auth/users.js';

const ADMIN_LINK_LIMIT = 3;
const ADMIN_LINK_WINDOW_SECONDS = 10 * 60;

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET', 'RESEND_API_KEY', 'AUTH_EMAIL_FROM', 'ADMIN_EMAILS']);
    requireSameOrigin(request, env);
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();

    // Version the limiter key so an old one-hour lockout cannot strand the admin
    // after this recovery change is deployed.
    const allowed = await checkRateLimit(
      env.AUTH_DB,
      request,
      'admin-link-v2',
      email || 'invalid',
      ADMIN_LINK_LIMIT,
      ADMIN_LINK_WINDOW_SECONDS,
    );
    if (!allowed) {
      return json({
        sent: false,
        error: 'Terlalu banyak permintaan tautan admin. Tunggu 10 menit lalu coba lagi.',
        retry_after_seconds: ADMIN_LINK_WINDOW_SECONDS,
      }, { status: 429 });
    }

    const user = email ? await getUserByEmail(env.AUTH_DB, email) : null;
    if (user?.email_verified && user.role === 'admin' && isAdminEmail(env, email)) {
      const now = Math.floor(Date.now() / 1000);
      const token = await createSignedToken(env.SESSION_SECRET, {
        purpose: 'admin_magic_link',
        email,
        jti: crypto.randomUUID(),
        iat: now,
        exp: now + 5 * 60,
      });
      const loginUrl = authOrigin(request, env) + '/api/auth/admin/callback?token=' + encodeURIComponent(token);
      await sendAdminMagicLinkEmail(env, email, loginUrl);
    }

    // Keep the normal response generic so this endpoint does not disclose whether
    // arbitrary addresses are registered as administrators.
    return json({ sent: true });
  } catch (error) {
    console.error('Admin magic link request failed', {
      name: error?.name,
      message: error?.message,
      status: error?.status,
      provider: error?.provider,
    });
    return json({
      sent: false,
      error: 'Pengiriman tautan admin sementara gagal. Silakan coba lagi dalam beberapa saat.',
    }, { status: 503 });
  }
}
