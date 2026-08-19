import { awardKamPointsOnce } from './kamPoints.js';

function normalizeCode(value) {
  return String(value || '').trim().toUpperCase();
}

function campaignIsActive(campaign, now = Date.now()) {
  if (!campaign || campaign.status !== 'ACTIVE') return false;
  if (campaign.starts_at && Date.parse(campaign.starts_at) > now) return false;
  if (campaign.ends_at && Date.parse(campaign.ends_at) < now) return false;
  return true;
}

export async function listKamCampaigns(db) {
  const rows = await db.prepare(`
    SELECT id, code, name, campaign_type, status, budget_points, distributed_points,
           reward_points, invitee_reward_points, starts_at, ends_at, created_at, updated_at
    FROM kam_reward_campaigns
    ORDER BY created_at DESC
    LIMIT 100
  `).all();
  return (rows?.results || []).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.campaign_type,
    status: row.status,
    budgetPoints: Number(row.budget_points || 0),
    distributedPoints: Number(row.distributed_points || 0),
    remainingPoints: Math.max(0, Number(row.budget_points || 0) - Number(row.distributed_points || 0)),
    rewardPoints: Number(row.reward_points || 0),
    inviteeRewardPoints: Number(row.invitee_reward_points || 0),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createKamCampaign(db, adminId, input) {
  const code = normalizeCode(input.code);
  const name = String(input.name || '').trim();
  const type = normalizeCode(input.type);
  const status = normalizeCode(input.status || 'PAUSED');
  const budgetPoints = Math.trunc(Number(input.budgetPoints));
  const rewardPoints = Math.trunc(Number(input.rewardPoints));
  const inviteeRewardPoints = Math.trunc(Number(input.inviteeRewardPoints || 0));
  const startsAt = input.startsAt ? new Date(input.startsAt).toISOString() : null;
  const endsAt = input.endsAt ? new Date(input.endsAt).toISOString() : null;

  if (!/^[A-Z0-9_-]{3,64}$/.test(code)) throw new Error('Invalid campaign code');
  if (!name || name.length > 120) throw new Error('Invalid campaign name');
  if (!['COMMUNITY', 'REFERRAL'].includes(type)) throw new Error('Invalid campaign type');
  if (!['ACTIVE', 'PAUSED', 'CLOSED'].includes(status)) throw new Error('Invalid campaign status');
  if (!Number.isSafeInteger(budgetPoints) || budgetPoints < 1 || budgetPoints > 1000000000) throw new Error('Invalid campaign budget');
  if (!Number.isSafeInteger(rewardPoints) || rewardPoints < 1 || rewardPoints > 100000) throw new Error('Invalid reward amount');
  if (!Number.isSafeInteger(inviteeRewardPoints) || inviteeRewardPoints < 0 || inviteeRewardPoints > 100000) throw new Error('Invalid invitee reward');
  if (type !== 'REFERRAL' && inviteeRewardPoints !== 0) throw new Error('Invitee reward only applies to referral campaigns');
  if (startsAt && endsAt && Date.parse(startsAt) >= Date.parse(endsAt)) throw new Error('Campaign end must be after start');

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.prepare(`
    INSERT INTO kam_reward_campaigns (
      id, code, name, campaign_type, status, budget_points, distributed_points,
      reward_points, invitee_reward_points, starts_at, ends_at, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, code, name, type, status, budgetPoints, rewardPoints, inviteeRewardPoints, startsAt, endsAt, adminId, now, now).run();
  return id;
}

export async function updateKamCampaignStatus(db, codeValue, statusValue) {
  const code = normalizeCode(codeValue);
  const status = normalizeCode(statusValue);
  if (!['ACTIVE', 'PAUSED', 'CLOSED'].includes(status)) throw new Error('Invalid campaign status');
  const now = new Date().toISOString();
  const result = await db.prepare(`UPDATE kam_reward_campaigns SET status = ?, updated_at = ? WHERE code = ?`).bind(status, now, code).run();
  return Boolean(result?.meta?.changes);
}

export async function getActiveReferralCampaign(db) {
  const rows = await db.prepare(`
    SELECT * FROM kam_reward_campaigns
    WHERE campaign_type = 'REFERRAL' AND status = 'ACTIVE'
    ORDER BY created_at DESC
    LIMIT 20
  `).all();
  return (rows?.results || []).find((row) => campaignIsActive(row)) || null;
}

export async function registerReferral(db, inviteeUser, referralCode) {
  const code = normalizeCode(referralCode);
  if (!/^KA[A-Z0-9]{6}$/.test(code)) throw new Error('Invalid referral code');
  if (!inviteeUser?.id) throw new Error('Invitee required');

  const existing = await db.prepare('SELECT id, status FROM kam_referrals WHERE invitee_user_id = ? LIMIT 1').bind(inviteeUser.id).first();
  if (existing) return { created: false, status: existing.status };

  const referrer = await db.prepare('SELECT id, email FROM auth_users WHERE referral_code = ? LIMIT 1').bind(code).first();
  if (!referrer) throw new Error('Referral code not found');
  if (referrer.id === inviteeUser.id) throw new Error('Self-referral is not allowed');

  const campaign = await getActiveReferralCampaign(db);
  if (!campaign) throw new Error('No active referral campaign');

  const now = new Date().toISOString();
  await db.prepare(`
    INSERT INTO kam_referrals (
      id, invitee_user_id, referrer_user_id, referral_code, campaign_id, status, created_at
    ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
  `).bind(crypto.randomUUID(), inviteeUser.id, referrer.id, code, campaign.id, now).run();
  return { created: true, status: 'PENDING', campaignCode: campaign.code };
}

export async function evaluateReferralReward(db, inviteeUser) {
  if (!inviteeUser?.id) return { awarded: false, reason: 'no-user' };
  const referral = await db.prepare(`
    SELECT r.*, c.code AS campaign_code, c.status AS campaign_status, c.reward_points,
           c.invitee_reward_points, c.budget_points, c.distributed_points, c.starts_at, c.ends_at
    FROM kam_referrals r
    JOIN kam_reward_campaigns c ON c.id = r.campaign_id
    WHERE r.invitee_user_id = ?
    LIMIT 1
  `).bind(inviteeUser.id).first();
  if (!referral || referral.status === 'REWARDED' || referral.status === 'REJECTED') return { awarded: false, reason: referral?.status || 'no-referral' };
  if (!campaignIsActive(referral)) return { awarded: false, reason: 'campaign-inactive' };
  if (!inviteeUser.email_verified || inviteeUser.kycStatus !== 'approved') return { awarded: false, reason: 'not-qualified' };

  const totalAward = Number(referral.reward_points || 0) + Number(referral.invitee_reward_points || 0);
  const remaining = Number(referral.budget_points || 0) - Number(referral.distributed_points || 0);
  if (remaining < totalAward) return { awarded: false, reason: 'budget-exhausted' };

  const qualifiedAt = new Date().toISOString();
  await db.prepare(`UPDATE kam_referrals SET status = 'QUALIFIED', qualified_at = ? WHERE id = ? AND status = 'PENDING'`).bind(qualifiedAt, referral.id).run();

  const referrerGrant = await awardKamPointsOnce(db, {
    userId: referral.referrer_user_id,
    amount: Number(referral.reward_points),
    reason: 'Referral terverifikasi',
    source: 'reward.referral',
    referenceId: `referral:${referral.id}:referrer`,
    metadata: { campaignId: referral.campaign_code, inviteeUserId: inviteeUser.id, ruleVersion: 1 },
  });

  let inviteeGrant = { awarded: false };
  if (Number(referral.invitee_reward_points || 0) > 0) {
    inviteeGrant = await awardKamPointsOnce(db, {
      userId: inviteeUser.id,
      amount: Number(referral.invitee_reward_points),
      reason: 'Referral welcome reward',
      source: 'reward.referral',
      referenceId: `referral:${referral.id}:invitee`,
      metadata: { campaignId: referral.campaign_code, referrerUserId: referral.referrer_user_id, ruleVersion: 1 },
    });
  }

  if (referrerGrant.awarded || inviteeGrant.awarded) {
    const distributed = (referrerGrant.awarded ? Number(referral.reward_points) : 0)
      + (inviteeGrant.awarded ? Number(referral.invitee_reward_points || 0) : 0);
    const now = new Date().toISOString();
    await db.batch([
      db.prepare(`UPDATE kam_referrals SET status = 'REWARDED', rewarded_at = ? WHERE id = ?`).bind(now, referral.id),
      db.prepare(`UPDATE kam_reward_campaigns SET distributed_points = distributed_points + ?, updated_at = ? WHERE id = ?`).bind(distributed, now, referral.campaign_id),
    ]);
    return { awarded: true, campaignCode: referral.campaign_code, distributed };
  }

  return { awarded: false, reason: 'duplicate' };
}
