import { json, requireBindings, requireSameOrigin } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { getActiveSession } from '../../../../server/auth/sessions.js';
import { getTotpSettings } from '../../../../server/auth/totp.js';
import { getUserByEmail, getUserById } from '../../../../server/auth/users.js';
import { awardKamPointsOnce, getKamPointsSummary } from '../../../../server/auth/kamPoints.js';
import { recordAdminAudit } from '../../../../server/auth/adminAudit.js';

async function requireAdmin(request, env) {
  const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
  if (!session?.sub || !session?.sid) return null;
  const activeSession = await getActiveSession(env.AUTH_DB, session.sid, session.sub);
  if (!activeSession) return null;
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

    const totals = await env.AUTH_DB.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_points,
        COUNT(*) AS total_entries,
        COUNT(DISTINCT user_id) AS rewarded_users,
        COUNT(DISTINCT CASE WHEN source = 'reward.campaign' THEN reference_id END) AS campaign_grants
      FROM kam_points_ledger
    `).first();

    const recent = await env.AUTH_DB.prepare(`
      SELECT l.id, l.user_id, u.email, u.full_name, l.amount, l.reason, l.source,
             l.reference_id, l.metadata_json, l.created_at
      FROM kam_points_ledger l
      JOIN auth_users u ON u.id = l.user_id
      ORDER BY l.created_at DESC
      LIMIT 50
    `).all();

    const rows = (recent?.results || []).map((row) => {
      let metadata = {};
      try { metadata = row.metadata_json ? JSON.parse(row.metadata_json) : {}; } catch { metadata = {}; }
      return {
        id: row.id,
        userId: row.user_id,
        email: row.email,
        fullName: row.full_name || null,
        amount: Number(row.amount || 0),
        reason: row.reason,
        source: row.source,
        referenceId: row.reference_id || null,
        metadata,
        createdAt: row.created_at,
      };
    });

    return json({
      totals: {
        totalPoints: Number(totals?.total_points || 0),
        totalEntries: Number(totals?.total_entries || 0),
        rewardedUsers: Number(totals?.rewarded_users || 0),
        campaignGrants: Number(totals?.campaign_grants || 0),
      },
      recent: rows,
      policy: {
        unit: 'KAM_POINTS',
        onChain: false,
        transferable: false,
        redeemable: false,
        maxCampaignGrant: 100000,
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('KAM rewards dashboard lookup failed', error);
    return json({ error: 'KAM reward service unavailable' }, { status: 503 });
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
    const email = String(body?.email || '').trim().toLowerCase();
    const campaignId = String(body?.campaignId || '').trim().toUpperCase();
    const reason = String(body?.reason || '').trim();
    const amount = Math.trunc(Number(body?.amount));

    if (!email || !email.includes('@')) return json({ error: 'Valid target email required' }, { status: 400 });
    if (!/^[A-Z0-9_-]{3,64}$/.test(campaignId)) return json({ error: 'Invalid campaign ID' }, { status: 400 });
    if (!reason || reason.length > 160) return json({ error: 'Invalid reward reason' }, { status: 400 });
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100000) {
      return json({ error: 'Reward amount must be between 1 and 100000 KAM Points' }, { status: 400 });
    }

    const target = await getUserByEmail(env.AUTH_DB, email);
    if (!target) return json({ error: 'Target user not found' }, { status: 404 });

    const referenceId = `campaign:${campaignId}:user:${target.id}`;
    const grant = await awardKamPointsOnce(env.AUTH_DB, {
      userId: target.id,
      amount,
      reason,
      source: 'reward.campaign',
      referenceId,
      metadata: { campaignId, grantedBy: admin.id, ruleVersion: 1 },
    });

    await recordAdminAudit(env.AUTH_DB, request, admin, 'kam_points.campaign_grant', {
      targetType: 'user',
      targetId: target.id,
      metadata: { campaignId, amount, reason, awarded: grant.awarded },
    });

    const points = await getKamPointsSummary(env.AUTH_DB, target.id, { limit: 5 });
    return json({
      awarded: grant.awarded,
      duplicatePrevented: !grant.awarded,
      campaignId,
      target: { id: target.id, email: target.email },
      points,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('KAM campaign reward failed', error);
    return json({ error: 'KAM reward service unavailable' }, { status: 503 });
  }
}
