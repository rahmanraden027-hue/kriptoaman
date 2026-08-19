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

  return {
    userId: row.id,
    email: row.email,
    fullName: row.full_name || null,
    role: row.role,
    emailVerified: Boolean(row.email_verified),
    kycStatus: row.kyc_status,
    points,
    flags,
    eligible: flags.length === 0,
  };
}

export async function buildKamPointsAuditPreview(db) {
  const duplicateRows = await db.prepare(`
    SELECT LOWER(TRIM(phone)) AS phone_key, COUNT(*) AS count
    FROM auth_users
    WHERE phone IS NOT NULL AND TRIM(phone) <> ''
    GROUP BY LOWER(TRIM(phone))
    HAVING COUNT(*) > 1
  `).all();
  const duplicatePhones = new Set((duplicateRows?.results || []).map((row) => row.phone_key));

  const rows = await db.prepare(`
    SELECT u.id, u.email, u.full_name, u.phone, u.role, u.email_verified, u.kyc_status,
           COALESCE(SUM(l.amount), 0) AS points
    FROM auth_users u
    LEFT JOIN kam_points_ledger l ON l.user_id = u.id
    GROUP BY u.id, u.email, u.full_name, u.phone, u.role, u.email_verified, u.kyc_status
    ORDER BY points DESC, u.created_at ASC
  `).all();

  const candidates = (rows?.results || []).map((row) => normalizeCandidate(row, duplicatePhones));
  const eligible = candidates.filter((item) => item.eligible);
  const excluded = candidates.filter((item) => !item.eligible);
  const totalEligiblePoints = eligible.reduce((sum, item) => sum + item.points, 0);

  const flagCounts = {};
  for (const item of excluded) {
    for (const flag of item.flags) flagCounts[flag] = (flagCounts[flag] || 0) + 1;
  }

  return {
    ruleVersion: RULE_VERSION,
    policy: {
      auditOnly: true,
      onChain: false,
      transferable: false,
      redeemable: false,
      requirements: ['ROLE_USER', 'EMAIL_VERIFIED', 'KYC_APPROVED', 'POSITIVE_KAM_POINTS', 'NO_DUPLICATE_PHONE_REVIEW'],
    },
    totals: {
      accounts: candidates.length,
      eligibleAccounts: eligible.length,
      excludedAccounts: excluded.length,
      eligiblePoints: totalEligiblePoints,
    },
    flagCounts,
    eligible,
    excluded,
  };
}

export async function listKamPointsAuditSnapshots(db) {
  const rows = await db.prepare(`
    SELECT id, code, status, rule_version, total_users, total_points, manifest_hash, created_at
    FROM kam_points_audit_snapshots
    ORDER BY created_at DESC
    LIMIT 50
  `).all();
  return (rows?.results || []).map((row) => ({
    id: row.id,
    code: row.code,
    status: row.status,
    ruleVersion: Number(row.rule_version || 1),
    totalUsers: Number(row.total_users || 0),
    totalPoints: Number(row.total_points || 0),
    manifestHash: row.manifest_hash,
    createdAt: row.created_at,
  }));
}

export async function getKamPointsAuditSnapshotEntries(db, snapshotId, { limit = 100 } = {}) {
  if (!snapshotId) return [];
  const rows = await db.prepare(`
    SELECT e.user_id, u.email, u.full_name, e.points, e.rule_version, e.created_at
    FROM kam_points_audit_snapshot_entries e
    JOIN auth_users u ON u.id = e.user_id
    WHERE e.snapshot_id = ?
    ORDER BY e.points DESC, e.user_id ASC
    LIMIT ?
  `).bind(snapshotId, Math.max(1, Math.min(Number(limit) || 100, 500))).all();
  return (rows?.results || []).map((row) => ({
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name || null,
    points: Number(row.points || 0),
    ruleVersion: Number(row.rule_version || 1),
    createdAt: row.created_at,
  }));
}

export async function freezeKamPointsAuditSnapshot(db, adminId, codeValue) {
  const code = String(codeValue || '').trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,64}$/.test(code)) throw new Error('Invalid snapshot code');

  const existing = await db.prepare('SELECT id FROM kam_points_audit_snapshots WHERE code = ? LIMIT 1').bind(code).first();
  if (existing) throw new Error('Snapshot code already exists');

  const preview = await buildKamPointsAuditPreview(db);
  if (!preview.eligible.length) throw new Error('No eligible KAM Points accounts');

  const ordered = [...preview.eligible].sort((a, b) => a.userId.localeCompare(b.userId));
  const canonical = ordered.map((item) => `${item.userId}:${item.points}`).join('|');
  const manifestHash = await sha256(`KAM_POINTS_AUDIT|${RULE_VERSION}|${code}|${canonical}`);
  const snapshotId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await db.prepare(`
    INSERT INTO kam_points_audit_snapshots
      (id, code, status, rule_version, total_users, total_points, manifest_hash, created_by, created_at)
    VALUES (?, ?, 'FROZEN', ?, ?, ?, ?, ?, ?)
  `).bind(
    snapshotId,
    code,
    RULE_VERSION,
    ordered.length,
    preview.totals.eligiblePoints,
    manifestHash,
    adminId,
    createdAt,
  ).run();

  for (let index = 0; index < ordered.length; index += 50) {
    const chunk = ordered.slice(index, index + 50);
    await db.batch(chunk.map((item) => db.prepare(`
      INSERT INTO kam_points_audit_snapshot_entries
        (snapshot_id, user_id, points, rule_version, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(snapshotId, item.userId, item.points, RULE_VERSION, createdAt)));
  }

  return {
    id: snapshotId,
    code,
    status: 'FROZEN',
    ruleVersion: RULE_VERSION,
    totalUsers: ordered.length,
    totalPoints: preview.totals.eligiblePoints,
    manifestHash,
    createdAt,
  };
}
