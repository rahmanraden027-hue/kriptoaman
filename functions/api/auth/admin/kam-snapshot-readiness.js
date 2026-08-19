import { json, requireBindings, requireSameOrigin } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { getActiveSession } from '../../../../server/auth/sessions.js';
import { getTotpSettings } from '../../../../server/auth/totp.js';
import { getUserById } from '../../../../server/auth/users.js';
import { recordAdminAudit } from '../../../../server/auth/adminAudit.js';
import {
  buildKamPointsAuditPreview,
  freezeKamPointsAuditSnapshot,
  getKamPointsAuditSnapshotEntries,
  listKamPointsAuditSnapshots,
} from '../../../../server/auth/kamSnapshotAudit.js';

async function requireAdmin(request, env) {
  const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
  if (!session?.sub || !session?.sid) return null;
  const active = await getActiveSession(env.AUTH_DB, session.sid, session.sub);
  if (!active) return null;
  const user = await getUserById(env.AUTH_DB, session.sub);
  if (!user || user.role !== 'admin') return null;
  const totp = await getTotpSettings(env.AUTH_DB, user.id);
  if (!totp?.enabled || !totp?.secret_enc) return null;
  return user;
}

export async function onRequestGet({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    await ensureAuthSchema(env.AUTH_DB);
    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: 'Admin access with 2FA required' }, { status: 403 });

    const [preview, snapshots] = await Promise.all([
      buildKamPointsAuditPreview(env.AUTH_DB),
      listKamPointsAuditSnapshots(env.AUTH_DB),
    ]);
    const latestEntries = snapshots[0]
      ? await getKamPointsAuditSnapshotEntries(env.AUTH_DB, snapshots[0].id, { limit: 100 })
      : [];

    return json({ preview, snapshots, latestEntries }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('KAM snapshot readiness lookup failed', error);
    return json({ error: 'Snapshot readiness service unavailable' }, { status: 503 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    requireSameOrigin(request, env);
    await ensureAuthSchema(env.AUTH_DB);
    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: 'Admin access with 2FA required' }, { status: 403 });

    const body = await request.json();
    const snapshot = await freezeKamPointsAuditSnapshot(env.AUTH_DB, admin.id, body?.code);
    await recordAdminAudit(env.AUTH_DB, request, admin, 'kam_points.audit_snapshot.freeze', {
      targetType: 'kam_points_audit_snapshot',
      targetId: snapshot.id,
      metadata: {
        code: snapshot.code,
        totalUsers: snapshot.totalUsers,
        totalPoints: snapshot.totalPoints,
        manifestHash: snapshot.manifestHash,
        auditOnly: true,
      },
    });

    return json({ frozen: true, snapshot }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('KAM snapshot freeze failed', error);
    const message = String(error?.message || '');
    const status = message.includes('Invalid') || message.includes('exists') || message.includes('No eligible') ? 400 : 503;
    return json({ error: message || 'Snapshot readiness service unavailable' }, { status });
  }
}
