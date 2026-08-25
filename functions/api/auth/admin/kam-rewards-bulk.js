import { json, requireBindings, requireSameOrigin } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { getActiveSession } from '../../../../server/auth/sessions.js';
import { getTotpSettings } from '../../../../server/auth/totp.js';
import { getUserById } from '../../../../server/auth/users.js';
import { awardKamPointsOnce } from '../../../../server/auth/kamPoints.js';
import { recordAdminAudit } from '../../../../server/auth/adminAudit.js';

const MAX_BULK_USERS = 1000;
const SEGMENTS = new Set(['EXISTING_BEFORE', 'NEW_FROM']);

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

function normalizeCampaignId(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizeSegment(value) {
  return String(value || '').trim().toUpperCase();
}

function parseCutoff(value) {
  const parsed = Date.parse(String(value || ''));
  if (!Number.isFinite(parsed)) throw new Error('Valid cutoff timestamp required');
  return new Date(parsed).toISOString();
}

async function loadCampaign(db, campaignId) {
  return db.prepare(`
    SELECT id, code, name, campaign_type, status, budget_points, distributed_points,
           reward_points, starts_at, ends_at
    FROM kam_reward_campaigns
    WHERE code = ? LIMIT 1
  `).bind(campaignId).first();
}

function assertCampaignUsable(campaign) {
  if (!campaign) throw new Error('Campaign not found');
  if (campaign.campaign_type !== 'COMMUNITY') throw new Error('Bulk grant only supports COMMUNITY campaigns');
  if (campaign.status !== 'ACTIVE') throw new Error('Campaign must be ACTIVE');
  const now = Date.now();
  if (campaign.starts_at && Date.parse(campaign.starts_at) > now) throw new Error('Campaign has not started');
  if (campaign.ends_at && Date.parse(campaign.ends_at) < now) throw new Error('Campaign has ended');
  const reward = Number(campaign.reward_points || 0);
  if (!Number.isSafeInteger(reward) || reward < 1 || reward > 100000) throw new Error('Campaign reward is invalid');
}

async function getEligibleUsers(db, { campaignId, segment, cutoff }) {
  const comparator = segment === 'EXISTING_BEFORE' ? '<' : '>=';
  const rows = await db.prepare(`
    SELECT u.id, u.email, u.full_name, u.created_at,
           CASE WHEN l.id IS NULL THEN 0 ELSE 1 END AS already_rewarded
    FROM auth_users u
    LEFT JOIN kam_points_ledger l
      ON l.user_id = u.id
     AND l.source = 'reward.campaign'
     AND l.reference_id = ('campaign:' || ? || ':user:' || u.id)
    WHERE u.role = 'user' AND u.created_at ${comparator} ?
    ORDER BY u.created_at ASC
    LIMIT ?
  `).bind(campaignId, cutoff, MAX_BULK_USERS + 1).all();
  return rows?.results || [];
}

async function buildPreview(db, campaign, campaignId, segment, cutoff) {
  const users = await getEligibleUsers(db, { campaignId, segment, cutoff });
  if (users.length > MAX_BULK_USERS) throw new Error(`Bulk grant exceeds safety limit of ${MAX_BULK_USERS} users`);
  const pending = users.filter((row) => !Number(row.already_rewarded));
  const alreadyRewarded = users.length - pending.length;
  const rewardPoints = Number(campaign.reward_points || 0);
  const requiredPoints = pending.length * rewardPoints;
  const remainingPoints = Math.max(0, Number(campaign.budget_points || 0) - Number(campaign.distributed_points || 0));
  return {
    campaignId,
    campaignName: campaign.name,
    segment,
    cutoff,
    rewardPoints,
    eligibleUsers: users.length,
    pendingUsers: pending.length,
    alreadyRewarded,
    requiredPoints,
    remainingPoints,
    budgetSufficient: remainingPoints >= requiredPoints,
    sample: pending.slice(0, 10).map((row) => ({ id: row.id, email: row.email, createdAt: row.created_at })),
    pending,
  };
}

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    requireSameOrigin(request, env);
    await ensureAuthSchema(env.AUTH_DB);
    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: 'Admin access with 2FA required' }, { status: 403 });

    const body = await request.json();
    const campaignId = normalizeCampaignId(body?.campaignId);
    const segment = normalizeSegment(body?.segment);
    const cutoff = parseCutoff(body?.cutoff);
    const execute = body?.execute === true;
    const confirmation = String(body?.confirmation || '').trim().toUpperCase();

    if (!/^[A-Z0-9_-]{3,64}$/.test(campaignId)) return json({ error: 'Invalid campaign ID' }, { status: 400 });
    if (!SEGMENTS.has(segment)) return json({ error: 'segment must be EXISTING_BEFORE or NEW_FROM' }, { status: 400 });

    const campaign = await loadCampaign(env.AUTH_DB, campaignId);
    assertCampaignUsable(campaign);
    const preview = await buildPreview(env.AUTH_DB, campaign, campaignId, segment, cutoff);

    if (!execute) {
      const { pending, ...safePreview } = preview;
      await recordAdminAudit(env.AUTH_DB, request, admin, 'kam_points.bulk_preview', {
        targetType: 'campaign', targetId: campaign.id,
        metadata: { campaignId, segment, cutoff, pendingUsers: safePreview.pendingUsers, requiredPoints: safePreview.requiredPoints },
      });
      return json({ mode: 'preview', ...safePreview }, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (confirmation !== campaignId) return json({ error: 'Confirmation must exactly match campaign ID' }, { status: 400 });
    if (!preview.budgetSufficient) return json({ error: 'Campaign budget is insufficient', preview: { pendingUsers: preview.pendingUsers, requiredPoints: preview.requiredPoints, remainingPoints: preview.remainingPoints } }, { status: 409 });
    if (preview.pendingUsers < 1) return json({ mode: 'execute', awardedUsers: 0, distributedPoints: 0, duplicatePrevented: preview.alreadyRewarded }, { headers: { 'Cache-Control': 'no-store' } });

    let awardedUsers = 0;
    let distributedPoints = 0;
    for (const target of preview.pending) {
      const grant = await awardKamPointsOnce(env.AUTH_DB, {
        userId: target.id,
        amount: preview.rewardPoints,
        reason: `Campaign ${campaignId}`,
        source: 'reward.campaign',
        referenceId: `campaign:${campaignId}:user:${target.id}`,
        metadata: { campaignId, segment, cutoff, grantedBy: admin.id, bulk: true, ruleVersion: 1 },
      });
      if (grant.awarded) {
        awardedUsers += 1;
        distributedPoints += preview.rewardPoints;
      }
    }

    if (distributedPoints > 0) {
      const now = new Date().toISOString();
      await env.AUTH_DB.prepare(`
        UPDATE kam_reward_campaigns
        SET distributed_points = distributed_points + ?, updated_at = ?
        WHERE id = ?
      `).bind(distributedPoints, now, campaign.id).run();
    }

    await recordAdminAudit(env.AUTH_DB, request, admin, 'kam_points.bulk_execute', {
      targetType: 'campaign', targetId: campaign.id,
      metadata: { campaignId, segment, cutoff, awardedUsers, distributedPoints, duplicatePrevented: preview.alreadyRewarded },
    });

    return json({
      mode: 'execute', campaignId, segment, cutoff, rewardPoints: preview.rewardPoints,
      awardedUsers, distributedPoints, duplicatePrevented: preview.alreadyRewarded,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('KAM bulk campaign reward failed', error);
    const known = [
      'Campaign not found', 'Bulk grant only supports COMMUNITY campaigns', 'Campaign must be ACTIVE',
      'Campaign has not started', 'Campaign has ended', 'Campaign reward is invalid', 'Valid cutoff timestamp required',
    ];
    const status = known.includes(error?.message) ? 409 : 503;
    return json({ error: error?.message || 'KAM bulk reward service unavailable' }, { status });
  }
}
