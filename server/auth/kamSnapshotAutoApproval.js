import { verifyKamPointsAuditSnapshot } from './kamSnapshotAudit.js';

export async function autoApproveKamPointsAuditSnapshot(db, actorId, snapshotId) {
  if (!actorId || !snapshotId) throw new Error('Auto approval requires actor and snapshot');

  const integrity = await verifyKamPointsAuditSnapshot(db, snapshotId);
  if (!integrity.integrityOk) throw new Error('Snapshot integrity check failed');

  const current = await db.prepare(`
    SELECT approval_status, locked_at
    FROM kam_points_audit_snapshot_approvals
    WHERE snapshot_id = ?
    LIMIT 1
  `).bind(snapshotId).first();

  if (!current) throw new Error('Snapshot approval record not found');
  if (current.approval_status === 'APPROVED' && current.locked_at) {
    return {
      snapshotId,
      status: 'APPROVED',
      lockedAt: current.locked_at,
      integrity,
      automatic: true,
      alreadyApproved: true,
    };
  }

  const now = new Date().toISOString();
  const note = 'AUTOMATIC_INTEGRITY_APPROVAL: SHA-256 hash, account count and KAM Points total verified.';

  const result = await db.prepare(`
    UPDATE kam_points_audit_snapshot_approvals
    SET approval_status = 'APPROVED',
        review_notes = ?,
        reviewed_by = ?,
        reviewed_at = ?,
        approval_notes = ?,
        approved_by = ?,
        approved_at = ?,
        locked_at = ?,
        updated_at = ?
    WHERE snapshot_id = ?
      AND approval_status IN ('DRAFT', 'REVIEWED')
  `).bind(note, actorId, now, note, actorId, now, now, now, snapshotId).run();

  if (!result?.meta?.changes) throw new Error('Snapshot auto approval was not applied');

  return {
    snapshotId,
    status: 'APPROVED',
    approvedBy: actorId,
    approvedAt: now,
    lockedAt: now,
    integrity,
    automatic: true,
    dualControl: false,
    policy: 'INTEGRITY_GATED_AUTO_APPROVAL',
  };
}
