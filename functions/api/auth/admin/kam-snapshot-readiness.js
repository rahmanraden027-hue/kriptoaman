import { json, requireBindings, requireSameOrigin } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { getActiveSession } from '../../../../server/auth/sessions.js';
import { getTotpSettings } from '../../../../server/auth/totp.js';
import { getUserById } from '../../../../server/auth/users.js';
import { recordAdminAudit } from '../../../../server/auth/adminAudit.js';
import { autoApproveKamPointsAuditSnapshot } from '../../../../server/auth/kamSnapshotAutoApproval.js';
import {
  approveKamPointsAuditSnapshot,
  buildKamPointsAuditPreview,
  compareKamPointsAuditSnapshots,
  freezeKamPointsAuditSnapshot,
  getKamPointsAuditSnapshotEntries,
  listKamPointsAuditSnapshots,
  reviewKamPointsAuditSnapshot,
  verifyKamPointsAuditSnapshot,
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

    const url = new URL(request.url);
    const action = String(url.searchParams.get('action') || '').toLowerCase();
    if (action === 'verify') {
      const snapshotId = url.searchParams.get('snapshotId');
      if (!snapshotId) return json({ error: 'snapshotId required' }, { status: 400 });
      return json({ verification: await verifyKamPointsAuditSnapshot(env.AUTH_DB, snapshotId) }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (action === 'compare') {
      const baseSnapshotId = url.searchParams.get('baseSnapshotId');
      const targetSnapshotId = url.searchParams.get('targetSnapshotId');
      if (!baseSnapshotId || !targetSnapshotId) return json({ error: 'baseSnapshotId and targetSnapshotId required' }, { status: 400 });
      return json({ comparison: await compareKamPointsAuditSnapshots(env.AUTH_DB, baseSnapshotId, targetSnapshotId) }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const [preview, snapshots] = await Promise.all([buildKamPointsAuditPreview(env.AUTH_DB), listKamPointsAuditSnapshots(env.AUTH_DB)]);
    const latestEntries = snapshots[0] ? await getKamPointsAuditSnapshotEntries(env.AUTH_DB, snapshots[0].id, { limit: 100 }) : [];
    return json({
      preview,
      snapshots,
      latestEntries,
      approvalPolicy: {
        mode: 'INTEGRITY_GATED_AUTO_APPROVAL',
        automatic: true,
        requiresIntegrity: true,
        dualControl: false,
        auditOnly: true,
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('KAM snapshot readiness lookup failed', error);
    const message = String(error?.message || '');
    const status = message.includes('not found') || message.includes('required') ? 400 : 503;
    return json({ error: message || 'Snapshot readiness service unavailable' }, { status });
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
    const approval = await autoApproveKamPointsAuditSnapshot(env.AUTH_DB, admin.id, snapshot.id);

    await recordAdminAudit(env.AUTH_DB, request, admin, 'kam_points.audit_snapshot.freeze_auto_approve', {
      targetType: 'kam_points_audit_snapshot',
      targetId: snapshot.id,
      metadata: {
        code: snapshot.code,
        totalUsers: snapshot.totalUsers,
        totalPoints: snapshot.totalPoints,
        manifestHash: snapshot.manifestHash,
        approvalStatus: approval.status,
        automatic: true,
        integrityOk: approval.integrity.integrityOk,
        dualControl: false,
        auditOnly: true,
      },
    });

    return json({
      frozen: true,
      autoApproved: true,
      snapshot: { ...snapshot, approvalStatus: approval.status, lockedAt: approval.lockedAt },
      approval,
    }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('KAM snapshot freeze/auto-approval failed', error);
    const message = String(error?.message || '');
    const status = /Invalid|exists|No eligible|integrity|required|not found/i.test(message) ? 400 : 503;
    return json({ error: message || 'Snapshot readiness service unavailable' }, { status });
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    requireSameOrigin(request, env);
    await ensureAuthSchema(env.AUTH_DB);
    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: 'Admin access with 2FA required' }, { status: 403 });
    const body = await request.json();
    const action = String(body?.action || '').trim().toLowerCase();
    const snapshotId = String(body?.snapshotId || '').trim();
    const notes = String(body?.notes || '').trim();
    if (!snapshotId) return json({ error: 'snapshotId required' }, { status: 400 });

    if (action === 'auto-approve') {
      const approval = await autoApproveKamPointsAuditSnapshot(env.AUTH_DB, admin.id, snapshotId);
      await recordAdminAudit(env.AUTH_DB, request, admin, 'kam_points.audit_snapshot.auto_approve', {
        targetType: 'kam_points_audit_snapshot',
        targetId: snapshotId,
        metadata: { integrityOk: approval.integrity.integrityOk, automatic: true, dualControl: false, auditOnly: true },
      });
      return json({ updated: true, approval, snapshots: await listKamPointsAuditSnapshots(env.AUTH_DB) }, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (action === 'review') {
      const review = await reviewKamPointsAuditSnapshot(env.AUTH_DB, admin.id, snapshotId, notes);
      await recordAdminAudit(env.AUTH_DB, request, admin, 'kam_points.audit_snapshot.review', {
        targetType: 'kam_points_audit_snapshot', targetId: snapshotId, metadata: { notes, integrityOk: review.integrity.integrityOk, auditOnly: true },
      });
      return json({ updated: true, review, snapshots: await listKamPointsAuditSnapshots(env.AUTH_DB) }, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (action === 'approve') {
      const approval = await approveKamPointsAuditSnapshot(env.AUTH_DB, admin.id, snapshotId, notes);
      await recordAdminAudit(env.AUTH_DB, request, admin, 'kam_points.audit_snapshot.approve', {
        targetType: 'kam_points_audit_snapshot', targetId: snapshotId, metadata: { notes, integrityOk: approval.integrity.integrityOk, lockedAt: approval.lockedAt, dualControl: true, auditOnly: true },
      });
      return json({ updated: true, approval, snapshots: await listKamPointsAuditSnapshots(env.AUTH_DB) }, { headers: { 'Cache-Control': 'no-store' } });
    }

    return json({ error: 'Unsupported approval action' }, { status: 400 });
  } catch (error) {
    console.error('KAM snapshot approval action failed', error);
    const message = String(error?.message || '');
    const status = /required|not found|must be reviewed|different approver|integrity|locked|auto approval/i.test(message) ? 400 : 503;
    return json({ error: message || 'Snapshot approval service unavailable' }, { status });
  }
}
