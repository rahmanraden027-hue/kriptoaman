const RULE_VERSION = 1;

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return toHex(new Uint8Array(digest));
}

function normalizeCandidate(row, duplicatePhones) {
  const points = Number(row.points || 0);
  const phoneKey = String(row.phone || '').trim().toLowerCase();
  const flags = [];
  if (row.role !== 'user') flags.push('INTERNAL_ROLE');
  if (!Number(row.email_verified)) flags.push('EMAIL_NOT_VERIFIED');
  if (row.kyc_status !== 'approved') flags.push('KYC_NOT_APPROVED');
  if (points <= 0) flags.push('NO_POSITIVE_POINTS');
  if (phoneKey && duplicatePhones.has(phoneKey)) flags.push('DUPLICATE_PHONE_REVIEW');
  return { userId: row.id, email: row.email, fullName: row.full_name || null, role: row.role, emailVerified: Boolean(row.email_verified), kycStatus: row.kyc_status, points, flags, eligible: flags.length === 0 };
}

export async function buildKamPointsAuditPreview(db) {
  const duplicateRows = await db.prepare(`SELECT LOWER(TRIM(phone)) AS phone_key, COUNT(*) AS count FROM auth_users WHERE phone IS NOT NULL AND TRIM(phone) <> '' GROUP BY LOWER(TRIM(phone)) HAVING COUNT(*) > 1`).all();
  const duplicatePhones = new Set((duplicateRows?.results || []).map((row) => row.phone_key));
  const rows = await db.prepare(`SELECT u.id, u.email, u.full_name, u.phone, u.role, u.email_verified, u.kyc_status, COALESCE(SUM(l.amount), 0) AS points FROM auth_users u LEFT JOIN kam_points_ledger l ON l.user_id = u.id GROUP BY u.id, u.email, u.full_name, u.phone, u.role, u.email_verified, u.kyc_status ORDER BY points DESC, u.created_at ASC`).all();
  const candidates = (rows?.results || []).map((row) => normalizeCandidate(row, duplicatePhones));
  const eligible = candidates.filter((item) => item.eligible);
  const excluded = candidates.filter((item) => !item.eligible);
  const flagCounts = {};
  for (const item of excluded) for (const flag of item.flags) flagCounts[flag] = (flagCounts[flag] || 0) + 1;
  return {
    ruleVersion: RULE_VERSION,
    policy: { auditOnly: true, onChain: false, transferable: false, redeemable: false, requirements: ['ROLE_USER', 'EMAIL_VERIFIED', 'KYC_APPROVED', 'POSITIVE_KAM_POINTS', 'NO_DUPLICATE_PHONE_REVIEW'] },
    totals: { accounts: candidates.length, eligibleAccounts: eligible.length, excludedAccounts: excluded.length, eligiblePoints: eligible.reduce((sum, item) => sum + item.points, 0) },
    flagCounts, eligible, excluded,
  };
}

async function ensureApprovalRecord(db, snapshotId, createdAt = new Date().toISOString()) {
  await db.prepare(`INSERT OR IGNORE INTO kam_points_audit_snapshot_approvals (snapshot_id, approval_status, created_at, updated_at) VALUES (?, 'DRAFT', ?, ?)`).bind(snapshotId, createdAt, createdAt).run();
}

export async function listKamPointsAuditSnapshots(db) {
  const rows = await db.prepare(`
    SELECT s.id, s.code, s.status, s.rule_version, s.total_users, s.total_points, s.manifest_hash, s.created_at,
           COALESCE(a.approval_status, 'DRAFT') AS approval_status, a.review_notes, a.reviewed_by, a.reviewed_at,
           a.approval_notes, a.approved_by, a.approved_at, a.locked_at,
           reviewer.email AS reviewer_email, approver.email AS approver_email
    FROM kam_points_audit_snapshots s
    LEFT JOIN kam_points_audit_snapshot_approvals a ON a.snapshot_id = s.id
    LEFT JOIN auth_users reviewer ON reviewer.id = a.reviewed_by
    LEFT JOIN auth_users approver ON approver.id = a.approved_by
    ORDER BY s.created_at DESC LIMIT 50
  `).all();
  return (rows?.results || []).map((row) => ({
    id: row.id, code: row.code, status: row.status, ruleVersion: Number(row.rule_version || 1), totalUsers: Number(row.total_users || 0), totalPoints: Number(row.total_points || 0), manifestHash: row.manifest_hash, createdAt: row.created_at,
    approval: { status: row.approval_status || 'DRAFT', reviewNotes: row.review_notes || null, reviewedBy: row.reviewed_by || null, reviewerEmail: row.reviewer_email || null, reviewedAt: row.reviewed_at || null, approvalNotes: row.approval_notes || null, approvedBy: row.approved_by || null, approverEmail: row.approver_email || null, approvedAt: row.approved_at || null, lockedAt: row.locked_at || null },
  }));
}

export async function getKamPointsAuditSnapshotEntries(db, snapshotId, { limit = 100 } = {}) {
  if (!snapshotId) return [];
  const rows = await db.prepare(`SELECT e.user_id, u.email, u.full_name, e.points, e.rule_version, e.created_at FROM kam_points_audit_snapshot_entries e JOIN auth_users u ON u.id = e.user_id WHERE e.snapshot_id = ? ORDER BY e.points DESC, e.user_id ASC LIMIT ?`).bind(snapshotId, Math.max(1, Math.min(Number(limit) || 100, 500))).all();
  return (rows?.results || []).map((row) => ({ userId: row.user_id, email: row.email, fullName: row.full_name || null, points: Number(row.points || 0), ruleVersion: Number(row.rule_version || 1), createdAt: row.created_at }));
}

async function getAllSnapshotEntries(db, snapshotId) {
  const rows = await db.prepare(`SELECT user_id, points, rule_version FROM kam_points_audit_snapshot_entries WHERE snapshot_id = ? ORDER BY user_id ASC`).bind(snapshotId).all();
  return (rows?.results || []).map((row) => ({ userId: row.user_id, points: Number(row.points || 0), ruleVersion: Number(row.rule_version || 1) }));
}

async function getSnapshotById(db, snapshotId) {
  if (!snapshotId) return null;
  return db.prepare(`SELECT id, code, status, rule_version, total_users, total_points, manifest_hash, created_at FROM kam_points_audit_snapshots WHERE id = ? LIMIT 1`).bind(snapshotId).first();
}

function canonicalManifest(code, ruleVersion, entries) {
  const ordered = [...entries].sort((a, b) => a.userId.localeCompare(b.userId));
  const canonical = ordered.map((item) => `${item.userId}:${item.points}`).join('|');
  return `KAM_POINTS_AUDIT|${ruleVersion}|${code}|${canonical}`;
}

export async function verifyKamPointsAuditSnapshot(db, snapshotId) {
  const snapshot = await getSnapshotById(db, snapshotId);
  if (!snapshot) throw new Error('Snapshot not found');
  const entries = await getAllSnapshotEntries(db, snapshot.id);
  const calculatedHash = await sha256(canonicalManifest(snapshot.code, Number(snapshot.rule_version || 1), entries));
  const calculatedPoints = entries.reduce((sum, row) => sum + row.points, 0);
  const checks = { hashMatch: calculatedHash === snapshot.manifest_hash, userCountMatch: entries.length === Number(snapshot.total_users || 0), pointsMatch: calculatedPoints === Number(snapshot.total_points || 0) };
  return { snapshotId: snapshot.id, code: snapshot.code, storedHash: snapshot.manifest_hash, calculatedHash, storedUsers: Number(snapshot.total_users || 0), calculatedUsers: entries.length, storedPoints: Number(snapshot.total_points || 0), calculatedPoints, checks, integrityOk: checks.hashMatch && checks.userCountMatch && checks.pointsMatch, verifiedAt: new Date().toISOString() };
}

export async function compareKamPointsAuditSnapshots(db, baseSnapshotId, targetSnapshotId) {
  if (!baseSnapshotId || !targetSnapshotId || baseSnapshotId === targetSnapshotId) throw new Error('Two different snapshots are required');
  const [base, target] = await Promise.all([getSnapshotById(db, baseSnapshotId), getSnapshotById(db, targetSnapshotId)]);
  if (!base || !target) throw new Error('Snapshot not found');
  const [baseEntries, targetEntries] = await Promise.all([getAllSnapshotEntries(db, base.id), getAllSnapshotEntries(db, target.id)]);
  const baseMap = new Map(baseEntries.map((row) => [row.userId, row.points]));
  const targetMap = new Map(targetEntries.map((row) => [row.userId, row.points]));
  const added = [], removed = [], changed = [];
  for (const [userId, points] of targetMap) {
    if (!baseMap.has(userId)) added.push({ userId, points });
    else if (baseMap.get(userId) !== points) changed.push({ userId, fromPoints: baseMap.get(userId), toPoints: points, deltaPoints: points - baseMap.get(userId) });
  }
  for (const [userId, points] of baseMap) if (!targetMap.has(userId)) removed.push({ userId, points });
  return {
    base: { id: base.id, code: base.code, totalUsers: Number(base.total_users || 0), totalPoints: Number(base.total_points || 0), createdAt: base.created_at },
    target: { id: target.id, code: target.code, totalUsers: Number(target.total_users || 0), totalPoints: Number(target.total_points || 0), createdAt: target.created_at },
    delta: { users: Number(target.total_users || 0) - Number(base.total_users || 0), points: Number(target.total_points || 0) - Number(base.total_points || 0), addedAccounts: added.length, removedAccounts: removed.length, changedAccounts: changed.length },
    added: added.slice(0, 200), removed: removed.slice(0, 200), changed: changed.sort((a, b) => Math.abs(b.deltaPoints) - Math.abs(a.deltaPoints)).slice(0, 200),
  };
}

export async function reviewKamPointsAuditSnapshot(db, reviewerId, snapshotId, notesValue) {
  const snapshot = await getSnapshotById(db, snapshotId);
  if (!snapshot) throw new Error('Snapshot not found');
  await ensureApprovalRecord(db, snapshotId, snapshot.created_at);
  const integrity = await verifyKamPointsAuditSnapshot(db, snapshotId);
  if (!integrity.integrityOk) throw new Error('Snapshot integrity check failed');
  const current = await db.prepare(`SELECT approval_status FROM kam_points_audit_snapshot_approvals WHERE snapshot_id = ?`).bind(snapshotId).first();
  if (current?.approval_status === 'APPROVED') throw new Error('Approved snapshot is locked');
  const notes = String(notesValue || '').trim();
  if (!notes || notes.length > 500) throw new Error('Review notes required');
  const now = new Date().toISOString();
  await db.prepare(`UPDATE kam_points_audit_snapshot_approvals SET approval_status = 'REVIEWED', review_notes = ?, reviewed_by = ?, reviewed_at = ?, approval_notes = NULL, approved_by = NULL, approved_at = NULL, locked_at = NULL, updated_at = ? WHERE snapshot_id = ?`).bind(notes, reviewerId, now, now, snapshotId).run();
  return { snapshotId, status: 'REVIEWED', reviewedBy: reviewerId, reviewedAt: now, integrity };
}

export async function approveKamPointsAuditSnapshot(db, approverId, snapshotId, notesValue) {
  const snapshot = await getSnapshotById(db, snapshotId);
  if (!snapshot) throw new Error('Snapshot not found');
  await ensureApprovalRecord(db, snapshotId, snapshot.created_at);
  const approval = await db.prepare(`SELECT approval_status, reviewed_by FROM kam_points_audit_snapshot_approvals WHERE snapshot_id = ?`).bind(snapshotId).first();
  if (approval?.approval_status !== 'REVIEWED') throw new Error('Snapshot must be reviewed first');
  if (!approval.reviewed_by || approval.reviewed_by === approverId) throw new Error('Dual-control requires a different approver');
  const integrity = await verifyKamPointsAuditSnapshot(db, snapshotId);
  if (!integrity.integrityOk) throw new Error('Snapshot integrity check failed');
  const notes = String(notesValue || '').trim();
  if (!notes || notes.length > 500) throw new Error('Approval notes required');
  const now = new Date().toISOString();
  await db.prepare(`UPDATE kam_points_audit_snapshot_approvals SET approval_status = 'APPROVED', approval_notes = ?, approved_by = ?, approved_at = ?, locked_at = ?, updated_at = ? WHERE snapshot_id = ? AND approval_status = 'REVIEWED'`).bind(notes, approverId, now, now, now, snapshotId).run();
  return { snapshotId, status: 'APPROVED', approvedBy: approverId, approvedAt: now, lockedAt: now, integrity };
}

export async function freezeKamPointsAuditSnapshot(db, adminId, codeValue) {
  const code = String(codeValue || '').trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,64}$/.test(code)) throw new Error('Invalid snapshot code');
  const existing = await db.prepare('SELECT id FROM kam_points_audit_snapshots WHERE code = ? LIMIT 1').bind(code).first();
  if (existing) throw new Error('Snapshot code already exists');
  const preview = await buildKamPointsAuditPreview(db);
  if (!preview.eligible.length) throw new Error('No eligible KAM Points accounts');
  const ordered = [...preview.eligible].sort((a, b) => a.userId.localeCompare(b.userId));
  const manifestHash = await sha256(canonicalManifest(code, RULE_VERSION, ordered));
  const snapshotId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db.prepare(`INSERT INTO kam_points_audit_snapshots (id, code, status, rule_version, total_users, total_points, manifest_hash, created_by, created_at) VALUES (?, ?, 'FROZEN', ?, ?, ?, ?, ?, ?)`).bind(snapshotId, code, RULE_VERSION, ordered.length, preview.totals.eligiblePoints, manifestHash, adminId, createdAt).run();
  for (let index = 0; index < ordered.length; index += 50) {
    const chunk = ordered.slice(index, index + 50);
    await db.batch(chunk.map((item) => db.prepare(`INSERT INTO kam_points_audit_snapshot_entries (snapshot_id, user_id, points, rule_version, created_at) VALUES (?, ?, ?, ?, ?)`).bind(snapshotId, item.userId, item.points, RULE_VERSION, createdAt)));
  }
  await ensureApprovalRecord(db, snapshotId, createdAt);
  return { id: snapshotId, code, status: 'FROZEN', approvalStatus: 'DRAFT', ruleVersion: RULE_VERSION, totalUsers: ordered.length, totalPoints: preview.totals.eligiblePoints, manifestHash, createdAt };
}
