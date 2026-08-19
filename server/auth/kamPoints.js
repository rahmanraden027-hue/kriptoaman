export async function getKamPointsSummary(db, userId, { limit = 20 } = {}) {
  const balanceRow = await db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS balance
    FROM kam_points_ledger
    WHERE user_id = ?
  `).bind(userId).first();

  const history = await db.prepare(`
    SELECT id, amount, reason, source, reference_id, metadata_json, created_at
    FROM kam_points_ledger
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(userId, Math.max(1, Math.min(Number(limit) || 20, 100))).all();

  return {
    balance: Number(balanceRow?.balance || 0),
    history: (history?.results || []).map((row) => {
      let metadata = {};
      try { metadata = row.metadata_json ? JSON.parse(row.metadata_json) : {}; } catch { metadata = {}; }
      return {
        id: row.id,
        amount: Number(row.amount || 0),
        reason: row.reason,
        source: row.source,
        referenceId: row.reference_id || null,
        metadata,
        createdAt: row.created_at,
      };
    }),
  };
}

function normalizeAward({ userId, amount, reason, source = 'system', referenceId = null, metadata = {} }) {
  const normalizedAmount = Math.trunc(Number(amount));
  if (!userId || !Number.isSafeInteger(normalizedAmount) || normalizedAmount <= 0 || normalizedAmount > 1_000_000) {
    throw new Error('Invalid KAM Points award');
  }
  if (!reason || String(reason).trim().length > 160) throw new Error('Invalid KAM Points reason');
  if (!source || String(source).trim().length > 80) throw new Error('Invalid KAM Points source');
  return {
    userId,
    amount: normalizedAmount,
    reason: String(reason).trim(),
    source: String(source).trim(),
    referenceId: referenceId ? String(referenceId).trim().slice(0, 160) : null,
    metadata: metadata && typeof metadata === 'object' ? metadata : {},
  };
}

export async function awardKamPoints(db, input) {
  const award = normalizeAward(input);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.prepare(`
    INSERT INTO kam_points_ledger (
      id, user_id, amount, reason, source, reference_id, metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    award.userId,
    award.amount,
    award.reason,
    award.source,
    award.referenceId,
    JSON.stringify(award.metadata),
    now,
  ).run();

  return { id, amount: award.amount, createdAt: now, awarded: true };
}

export async function awardKamPointsOnce(db, input) {
  const award = normalizeAward(input);
  if (!award.referenceId) throw new Error('Idempotent KAM Points award requires referenceId');
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const result = await db.prepare(`
    INSERT OR IGNORE INTO kam_points_ledger (
      id, user_id, amount, reason, source, reference_id, metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    award.userId,
    award.amount,
    award.reason,
    award.source,
    award.referenceId,
    JSON.stringify(award.metadata),
    now,
  ).run();

  return {
    id: Number(result?.meta?.changes || 0) > 0 ? id : null,
    amount: award.amount,
    createdAt: Number(result?.meta?.changes || 0) > 0 ? now : null,
    awarded: Number(result?.meta?.changes || 0) > 0,
  };
}
