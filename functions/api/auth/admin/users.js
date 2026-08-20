import { json, requireBindings, requireSameOrigin } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { getActiveSession } from '../../../../server/auth/sessions.js';
import { getUserById, updateUserProfile } from '../../../../server/auth/users.js';
import { recordAdminAudit } from '../../../../server/auth/adminAudit.js';

const KYC_STATUSES = new Set(['none', 'pending', 'approved', 'rejected']);

async function requireAdmin(request, env) {
  const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
  if (!session?.sub || !session?.sid) return null;
  const activeSession = await getActiveSession(env.AUTH_DB, session.sid, session.sub);
  if (!activeSession) return null;
  const user = await getUserById(env.AUTH_DB, session.sub);
  if (!user || user.role !== 'admin') return null;
  return user;
}

function normalizeRow(row) {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    email_verified: Boolean(row.email_verified),
    kycStatus: row.kyc_status || 'none',
    created_date: row.created_at,
    updated_date: row.updated_at,
  };
}

export async function onRequestGet({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    await ensureAuthSchema(env.AUTH_DB);
    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: 'Admin access required' }, { status: 403 });

    const url = new URL(request.url);
    const requestedLimit = Number(url.searchParams.get('limit') || 200);
    const limit = Math.max(1, Math.min(500, Number.isFinite(requestedLimit) ? requestedLimit : 200));

    const result = await env.AUTH_DB.prepare(`
      SELECT id, email, full_name, role, email_verified, kyc_status, created_at, updated_at
      FROM auth_users
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(limit).all();

    const users = (result.results || []).map(normalizeRow);
    return json({ users, count: users.length });
  } catch (error) {
    console.error('Admin user list failed', error);
    return json({ error: 'Admin user service unavailable' }, { status: 503 });
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    requireSameOrigin(request, env);
    await ensureAuthSchema(env.AUTH_DB);
    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: 'Admin access required' }, { status: 403 });

    const body = await request.json().catch(() => null);
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    const kycStatus = typeof body?.kycStatus === 'string' ? body.kycStatus.trim() : '';
    if (!userId || !KYC_STATUSES.has(kycStatus)) {
      return json({ error: 'Invalid user or KYC status' }, { status: 400 });
    }

    const target = await getUserById(env.AUTH_DB, userId);
    if (!target) return json({ error: 'User not found' }, { status: 404 });

    const previousStatus = target.kycStatus || 'none';
    const updated = await updateUserProfile(env.AUTH_DB, userId, { kycStatus });

    await recordAdminAudit(env.AUTH_DB, request, admin, 'user.kyc.update', {
      targetType: 'user',
      targetId: userId,
      metadata: {
        email: target.email,
        before: previousStatus,
        after: kycStatus,
      },
    });

    return json({ user: updated });
  } catch (error) {
    console.error('Admin KYC update failed', error);
    return json({ error: 'Admin user service unavailable' }, { status: 503 });
  }
}
