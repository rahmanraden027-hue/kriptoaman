import { json, requireBindings, requireSameOrigin } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { getActiveSession } from '../../../../server/auth/sessions.js';
import { getTotpSettings } from '../../../../server/auth/totp.js';
import { getUserById } from '../../../../server/auth/users.js';
import { createKamCampaign, listKamCampaigns, updateKamCampaignStatus } from '../../../../server/auth/kamCampaigns.js';
import { recordAdminAudit } from '../../../../server/auth/adminAudit.js';

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

function normalizeAdminDateTime(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // datetime-local values contain no timezone. KriptoAman admin operations currently use WIB (UTC+07:00).
  // Preserve already-offset/UTC timestamps, but normalize naive local values explicitly to +07:00.
  const hasExplicitZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const candidate = hasExplicitZone ? raw : `${raw}:00+07:00`;
  const parsed = Date.parse(candidate);
  if (!Number.isFinite(parsed)) throw new Error('Invalid campaign schedule');
  return new Date(parsed).toISOString();
}

export async function onRequestGet({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    await ensureAuthSchema(env.AUTH_DB);
    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: 'Admin access with 2FA required' }, { status: 403 });
    return json({ campaigns: await listKamCampaigns(env.AUTH_DB) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('KAM campaign list failed', error);
    return json({ error: 'Campaign service unavailable' }, { status: 503 });
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
    const normalizedBody = {
      ...(body || {}),
      startsAt: normalizeAdminDateTime(body?.startsAt),
      endsAt: normalizeAdminDateTime(body?.endsAt),
    };
    const id = await createKamCampaign(env.AUTH_DB, admin.id, normalizedBody);
    await recordAdminAudit(env.AUTH_DB, request, admin, 'kam_campaign.create', {
      targetType: 'kam_campaign', targetId: id,
      metadata: {
        code: normalizedBody?.code,
        type: normalizedBody?.type,
        budgetPoints: normalizedBody?.budgetPoints,
        startsAt: normalizedBody?.startsAt,
        endsAt: normalizedBody?.endsAt,
        adminTimezone: 'Asia/Jakarta',
      },
    });
    return json({ created: true, id, campaigns: await listKamCampaigns(env.AUTH_DB) }, { status: 201 });
  } catch (error) {
    console.error('KAM campaign create failed', error);
    const message = String(error?.message || '');
    const status = message.includes('Invalid') || message.includes('must') || message.includes('only applies') ? 400 : 503;
    return json({ error: message || 'Campaign service unavailable' }, { status });
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    requireSameOrigin(request, env);
    await ensureAuthSchema(env.AUTH_DB);
    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: 'Admin access with 2FA required' }, { status: 403 });
    const body = await request.json();
    const changed = await updateKamCampaignStatus(env.AUTH_DB, body?.code, body?.status);
    if (!changed) return json({ error: 'Campaign not found' }, { status: 404 });
    await recordAdminAudit(env.AUTH_DB, request, admin, 'kam_campaign.status', {
      targetType: 'kam_campaign', targetId: String(body?.code || ''), metadata: { status: body?.status },
    });
    return json({ updated: true, campaigns: await listKamCampaigns(env.AUTH_DB) });
  } catch (error) {
    console.error('KAM campaign update failed', error);
    const message = String(error?.message || '');
    return json({ error: message || 'Campaign service unavailable' }, { status: message.includes('Invalid') ? 400 : 503 });
  }
}
