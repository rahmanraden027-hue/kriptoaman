import { json, requireBindings, requireSameOrigin } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { getActiveSession } from '../../../../server/auth/sessions.js';
import { getUserById } from '../../../../server/auth/users.js';
import { recordAdminAudit } from '../../../../server/auth/adminAudit.js';

async function requireAdmin(request, env) {
  const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
  if (!session?.sub || !session?.sid) return null;
  const activeSession = await getActiveSession(env.AUTH_DB, session.sid, session.sub);
  if (!activeSession) return null;
  const user = await getUserById(env.AUTH_DB, session.sub);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET', 'RESEND_API_KEY', 'AUTH_EMAIL_FROM', 'ADMIN_EMAILS']);
    requireSameOrigin(request, env);
    await ensureAuthSchema(env.AUTH_DB);

    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: 'Admin access required' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const note = String(body?.note || '').trim().slice(0, 2000);
    const version = String(body?.version || '').trim().slice(0, 64);
    if (!note) return json({ error: 'Deploy note is required' }, { status: 400 });

    const recipients = (env.ADMIN_EMAILS || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    if (!recipients.length) return json({ error: 'Admin recipient unavailable' }, { status: 503 });

    const subject = `[KriptoAman] Admin deploy notification${version ? ` — v${version}` : ''}`;
    const text = [
      'Admin KriptoAman membuat catatan deploy.',
      '',
      `Admin: ${admin.email}`,
      `Versi: ${version || 'tidak ditentukan'}`,
      `Waktu: ${new Date().toISOString()}`,
      '',
      `Catatan: ${note}`,
      '',
      'Konfirmasi/publish tetap dilakukan melalui dashboard deployment resmi.',
    ].join('\n');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `admin-deploy-${crypto.randomUUID()}`,
      },
      body: JSON.stringify({
        from: env.AUTH_EMAIL_FROM,
        to: recipients,
        subject,
        text,
      }),
    });

    if (!response.ok) throw new Error(`Email delivery failed with status ${response.status}`);

    await recordAdminAudit(env.AUTH_DB, request, admin, 'deploy.notification', {
      targetType: 'deployment',
      targetId: version || 'unspecified',
      metadata: { version: version || null, noteLength: note.length, recipientCount: recipients.length },
    });

    return json({ sent: true });
  } catch (error) {
    console.error('Admin deploy notification failed', error);
    return json({ error: 'Deploy notification unavailable' }, { status: 503 });
  }
}
