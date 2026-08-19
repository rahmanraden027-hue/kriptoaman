import { awardKamPointsOnce } from './kamPoints.js';

export const KAM_REWARD_RULES = Object.freeze({
  EMAIL_VERIFIED: { amount: 100, label: 'Email terverifikasi' },
  PROFILE_COMPLETE: { amount: 50, label: 'Profil dasar lengkap' },
  KYC_APPROVED: { amount: 500, label: 'KYC terverifikasi' },
});

function profileComplete(user) {
  return Boolean(String(user?.full_name || '').trim() && String(user?.phone || '').trim());
}

export async function syncEligibleKamRewards(db, user) {
  if (!user?.id) return [];
  const granted = [];

  if (user.email_verified) {
    const result = await awardKamPointsOnce(db, {
      userId: user.id,
      amount: KAM_REWARD_RULES.EMAIL_VERIFIED.amount,
      reason: KAM_REWARD_RULES.EMAIL_VERIFIED.label,
      source: 'reward.email_verified',
      referenceId: `user:${user.id}:email_verified:v1`,
      metadata: { ruleVersion: 1, category: 'verification' },
    });
    if (result.awarded) granted.push({ rule: 'EMAIL_VERIFIED', amount: result.amount });
  }

  if (profileComplete(user)) {
    const result = await awardKamPointsOnce(db, {
      userId: user.id,
      amount: KAM_REWARD_RULES.PROFILE_COMPLETE.amount,
      reason: KAM_REWARD_RULES.PROFILE_COMPLETE.label,
      source: 'reward.profile_complete',
      referenceId: `user:${user.id}:profile_complete:v1`,
      metadata: { ruleVersion: 1, category: 'engagement' },
    });
    if (result.awarded) granted.push({ rule: 'PROFILE_COMPLETE', amount: result.amount });
  }

  if (user.kycStatus === 'approved') {
    const result = await awardKamPointsOnce(db, {
      userId: user.id,
      amount: KAM_REWARD_RULES.KYC_APPROVED.amount,
      reason: KAM_REWARD_RULES.KYC_APPROVED.label,
      source: 'reward.kyc_approved',
      referenceId: `user:${user.id}:kyc_approved:v1`,
      metadata: { ruleVersion: 1, category: 'verification' },
    });
    if (result.awarded) granted.push({ rule: 'KYC_APPROVED', amount: result.amount });
  }

  return granted;
}
