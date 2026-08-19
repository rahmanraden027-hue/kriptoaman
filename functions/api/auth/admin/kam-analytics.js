import { json, requireBindings } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { getActiveSession } from '../../../../server/auth/sessions.js';
import { getTotpSettings } from '../../../../server/auth/totp.js';
import { getUserById } from '../../../../server/auth/users.js';

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

function percent(numerator, denominator) {
  const a = Number(numerator || 0);
  const b = Number(denominator || 0);
  if (!b) return 0;
  return Math.round((a / b) * 10000) / 100;
}

export async function onRequestGet({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    await ensureAuthSchema(env.AUTH_DB);
    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: 'Admin access with 2FA required' }, { status: 403 });

    const [refTotals, campaignRows, networkRows, topReferrers] = await Promise.all([
      env.AUTH_DB.prepare(`
        SELECT
          COUNT(*) AS invites,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN status = 'QUALIFIED' THEN 1 ELSE 0 END) AS qualified,
          SUM(CASE WHEN status = 'REWARDED' THEN 1 ELSE 0 END) AS rewarded,
          SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
        FROM kam_referrals
      `).first(),
      env.AUTH_DB.prepare(`
        SELECT c.id, c.code, c.name, c.campaign_type, c.status, c.budget_points,
               c.distributed_points, c.reward_points, c.invitee_reward_points,
               c.starts_at, c.ends_at,
               COUNT(r.id) AS invites,
               SUM(CASE WHEN r.status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
               SUM(CASE WHEN r.status = 'QUALIFIED' THEN 1 ELSE 0 END) AS qualified,
               SUM(CASE WHEN r.status = 'REWARDED' THEN 1 ELSE 0 END) AS rewarded,
               SUM(CASE WHEN r.status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
        FROM kam_reward_campaigns c
        LEFT JOIN kam_referrals r ON r.campaign_id = c.id
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT 100
      `).all(),
      env.AUTH_DB.prepare(`
        SELECT r.id, r.status, r.referral_code, r.created_at, r.qualified_at, r.rewarded_at,
               c.code AS campaign_code, c.name AS campaign_name,
               ref.id AS referrer_id, ref.email AS referrer_email, ref.full_name AS referrer_name,
               inv.id AS invitee_id, inv.email AS invitee_email, inv.full_name AS invitee_name,
               inv.email_verified AS invitee_email_verified, inv.kyc_status AS invitee_kyc_status
        FROM kam_referrals r
        JOIN kam_reward_campaigns c ON c.id = r.campaign_id
        JOIN auth_users ref ON ref.id = r.referrer_user_id
        JOIN auth_users inv ON inv.id = r.invitee_user_id
        ORDER BY r.created_at DESC
        LIMIT 100
      `).all(),
      env.AUTH_DB.prepare(`
        SELECT u.id, u.email, u.full_name, u.referral_code,
               COUNT(r.id) AS invites,
               SUM(CASE WHEN r.status = 'REWARDED' THEN 1 ELSE 0 END) AS rewarded,
               COALESCE((
                 SELECT SUM(l.amount) FROM kam_points_ledger l
                 WHERE l.user_id = u.id AND l.source = 'reward.referral'
               ), 0) AS referral_points
        FROM auth_users u
        JOIN kam_referrals r ON r.referrer_user_id = u.id
        GROUP BY u.id
        ORDER BY rewarded DESC, invites DESC
        LIMIT 25
      `).all(),
    ]);

    const totals = {
      invites: Number(refTotals?.invites || 0),
      pending: Number(refTotals?.pending || 0),
      qualified: Number(refTotals?.qualified || 0),
      rewarded: Number(refTotals?.rewarded || 0),
      rejected: Number(refTotals?.rejected || 0),
    };
    totals.qualificationRate = percent(totals.qualified + totals.rewarded, totals.invites);
    totals.rewardConversionRate = percent(totals.rewarded, totals.invites);

    const campaigns = (campaignRows?.results || []).map((row) => {
      const budget = Number(row.budget_points || 0);
      const distributed = Number(row.distributed_points || 0);
      const invites = Number(row.invites || 0);
      const rewarded = Number(row.rewarded || 0);
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        type: row.campaign_type,
        status: row.status,
        budgetPoints: budget,
        distributedPoints: distributed,
        remainingPoints: Math.max(0, budget - distributed),
        budgetUsagePercent: percent(distributed, budget),
        rewardPoints: Number(row.reward_points || 0),
        inviteeRewardPoints: Number(row.invitee_reward_points || 0),
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        invites,
        pending: Number(row.pending || 0),
        qualified: Number(row.qualified || 0),
        rewarded,
        rejected: Number(row.rejected || 0),
        conversionRate: percent(rewarded, invites),
      };
    });

    const network = (networkRows?.results || []).map((row) => ({
      id: row.id,
      status: row.status,
      referralCode: row.referral_code,
      campaignCode: row.campaign_code,
      campaignName: row.campaign_name,
      referrer: { id: row.referrer_id, email: row.referrer_email, name: row.referrer_name || null },
      invitee: {
        id: row.invitee_id,
        email: row.invitee_email,
        name: row.invitee_name || null,
        emailVerified: Boolean(row.invitee_email_verified),
        kycStatus: row.invitee_kyc_status || 'none',
      },
      createdAt: row.created_at,
      qualifiedAt: row.qualified_at || null,
      rewardedAt: row.rewarded_at || null,
    }));

    return json({
      totals,
      campaigns,
      network,
      topReferrers: (topReferrers?.results || []).map((row) => ({
        id: row.id,
        email: row.email,
        name: row.full_name || null,
        referralCode: row.referral_code || null,
        invites: Number(row.invites || 0),
        rewarded: Number(row.rewarded || 0),
        referralPoints: Number(row.referral_points || 0),
        conversionRate: percent(row.rewarded, row.invites),
      })),
      generatedAt: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('KAM analytics lookup failed', error);
    return json({ error: 'KAM analytics service unavailable' }, { status: 503 });
  }
}
