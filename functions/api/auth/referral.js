import { json, requireBindings, requireSameOrigin } from '../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../server/auth/session.js';
import { getActiveSession } from '../../../server/auth/sessions.js';
import { getUserById } from '../../../server/auth/users.js';
import { evaluateReferralReward, registerReferral } from '../../../server/auth/kamCampaigns.js';

async function requireUser(request, env) {
  const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
  if (!session?.sub || !session?.sid) return null;
  const active = await getActiveSession(env.AUTH_DB, session.sid, session.sub);
  if (!active) return null;
  return getUserById(env.AUTH_DB, session.sub);
}

export async function onRequestGet({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    await ensureAuthSchema(env.AUTH_DB);
    const user = await requireUser(request, env);
    if (!user) return json({ authenticated: false }, { status: 401 });
    await evaluateReferralReward(env.AUTH_DB, user);
    const row = await env.AUTH_DB.prepare(`
      SELECT r.status, r.referral_code, r.created_at, r.qualified_at, r.rewarded_at, c.code AS campaign_code
      FROM kam_referrals r JOIN kam_reward_campaigns c ON c.id = r.campaign_id
      WHERE r.invitee_user_id = ? LIMIT 1
    `).bind(user.id).first();
    return json({ referral: row ? {
      status: row.status, referralCode: row.referral_code, campaignCode: row.campaign_code,
      createdAt: row.created_at, qualifiedAt: row.qualified_at, rewardedAt: row.rewarded_at,
    } : null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Referral lookup failed', error);
    return json({ error: 'Referral service unavailable' }, { status: 503 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    requireSameOrigin(request, env);
    await ensureAuthSchema(env.AUTH_DB);
    const user = await requireUser(request, env);
    if (!user) return json({ authenticated: false }, { status: 401 });
    const body = await request.json();
    const result = await registerReferral(env.AUTH_DB, user, body?.referralCode);
    const reward = await evaluateReferralReward(env.AUTH_DB, user);
    return json({ ...result, reward }, { status: result.created ? 201 : 200 });
  } catch (error) {
    console.error('Referral registration failed', error);
    const message = String(error?.message || '');
    const status = /Invalid|not found|Self-referral|No active/.test(message) ? 400 : 503;
    return json({ error: message || 'Referral service unavailable' }, { status });
  }
}
