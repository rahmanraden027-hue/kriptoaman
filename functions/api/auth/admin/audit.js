import { json, requireBindings } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { getActiveSession } from '../../../../server/auth/sessions.js';
import { getUserById } from '../../../../server/auth/users.js';

async function requireAdmin(request, env) {
  const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
  if (!session?.sub || !session?.sid) return null;
  const activeSession = await getActiveSession(env.AUTH_DB, session.sid, session.sub);
  if (!activeSession) return null;
  const user = await getUserById(env.AUTH_DB, session.sub);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function onRequestGet({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    await ensureAuthSchema(env.AUTH_DB);
    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: 'Admin access required' }, { status: 403 });

    const url = new URL(request.url);
    const requestedLimit = Number(url.searchParams.get('limit') || 50);
    const limit = Math.max(1, Math.min(100, Number.isFinite(requestedLimit) ? requestedLimit : 50));

    const result = await env.AUTH_DB.prepare(`
      SELECT id, admin_email, action, target_type, target_id, metadata_json, ip_masked, user_agent, created_at
      FROM auth_admin_audit
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(limit).all();

    const logs = (result.results || []).map((row) => ({
      id: row.id,
      admin_email: row.admin_email,
      action: row.action,
      target_type: row.target_type,
      target_id: row.target_id,
      metadata: (() => { try { return JSON.parse(row.metadata_json || '{}'); } catch { return {}; } })(),
      ip_masked: row.ip_masked,
      user_agent: row.user_agent,
      created_at: row.created_at,
    }));

    return json({ logs, count: logs.length });
  } catch (error) {
    console.error('Admin audit lookup failed', error);
    return json({ error: 'Audit log unavailable' }, { status: 503 });
  }
}
