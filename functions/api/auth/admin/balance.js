import { json, requireBindings, requireSameOrigin } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { getActiveSession } from '../../../../server/auth/sessions.js';
import { getUserById } from '../../../../server/auth/users.js';

const COINS = ['BTC', 'ETH', 'SOL', 'USDT'];
const EMPTY_BALANCES = Object.freeze({ BTC: 0, ETH: 0, SOL: 0, USDT: 0 });
const MAX_BALANCE = 1_000_000_000_000_000;

async function requireAdmin(request, env) {
  const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
  if (!session?.sub || !session?.sid) return null;
  const activeSession = await getActiveSession(env.AUTH_DB, session.sid, session.sub);
  if (!activeSession) return null;
  const user = await getUserById(env.AUTH_DB, session.sub);
  if (!user || user.role !== 'admin') return null;
  return user;
}

function parseStoredBalances(value) {
  try {
    const parsed = value ? JSON.parse(value) : {};
    return Object.fromEntries(COINS.map((coin) => [coin, Number(parsed?.[coin]) || 0]));
  } catch {
    return { ...EMPTY_BALANCES };
  }
}

function validateBalances(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const extraKeys = Object.keys(input).filter((key) => !COINS.includes(key));
  if (extraKeys.length) return null;

  const normalized = {};
  for (const coin of COINS) {
    const value = Number(input[coin] ?? 0);
    if (!Number.isFinite(value) || value < 0 || value > MAX_BALANCE) return null;
    normalized[coin] = value;
  }
  return normalized;
}

export async function onRequestGet({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    await ensureAuthSchema(env.AUTH_DB);
    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: 'Admin access required' }, { status: 403 });

    const row = await env.AUTH_DB.prepare(
      'SELECT balances_json, updated_at FROM auth_balances WHERE user_id = ? LIMIT 1',
    ).bind(admin.id).first();

    return json({
      balances: row ? parseStoredBalances(row.balances_json) : { ...EMPTY_BALANCES },
      updated_at: row?.updated_at || null,
    });
  } catch (error) {
    console.error('Admin balance lookup failed', error);
    return json({ error: 'Balance service unavailable' }, { status: 503 });
  }
}

export async function onRequestPut({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    requireSameOrigin(request, env);
    await ensureAuthSchema(env.AUTH_DB);
    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: 'Admin access required' }, { status: 403 });

    const body = await request.json();
    const balances = validateBalances(body?.balances);
    if (!balances) return json({ error: 'Invalid balance values' }, { status: 400 });

    const now = new Date().toISOString();
    await env.AUTH_DB.prepare(`
      INSERT INTO auth_balances (user_id, balances_json, updated_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        balances_json = excluded.balances_json,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at
    `).bind(admin.id, JSON.stringify(balances), admin.id, now, now).run();

    return json({ balances, updated_at: now });
  } catch (error) {
    console.error('Admin balance update failed', error);
    return json({ error: 'Balance service unavailable' }, { status: 503 });
  }
}
