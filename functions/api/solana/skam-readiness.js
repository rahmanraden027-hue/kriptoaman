import { json, requireBindings } from '../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../server/auth/session.js';
import { getActiveSession } from '../../../server/auth/sessions.js';
import { getTotpSettings } from '../../../server/auth/totp.js';
import { getUserById } from '../../../server/auth/users.js';

const APPROVED_WALLET = '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK';
const PUBLIC_SOLANA_RPCS = [
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet-beta.solana.com',
];
const MIN_PLANNED_SOL = 0.44;
const RPC_TIMEOUT_MS = 4_000;

async function requireVerifiedAdmin(request, env) {
  requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
  await ensureAuthSchema(env.AUTH_DB);

  const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
  if (!session?.sub || !session?.sid) return { response: json({ error: 'Authentication required' }, { status: 401 }) };

  const activeSession = await getActiveSession(env.AUTH_DB, session.sid, session.sub);
  if (!activeSession) return { response: json({ error: 'Session inactive' }, { status: 401 }) };

  const user = await getUserById(env.AUTH_DB, session.sub);
  if (!user || user.role !== 'admin') return { response: json({ error: 'Admin access required' }, { status: 403 }) };

  const totp = await getTotpSettings(env.AUTH_DB, user.id);
  if (!totp?.enabled || !totp?.secret_enc) {
    return { response: json({ error: 'Admin 2FA required' }, { status: 403 }) };
  }

  return { user };
}

async function readBalance(rpcUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'user-agent': 'KriptoAman-sKAM-Readiness/1.0',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [APPROVED_WALLET, { commitment: 'confirmed' }],
      }),
    });
    if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
    const payload = await response.json();
    if (payload?.error) throw new Error(payload.error.message || 'Solana RPC error');
    const lamports = Number(payload?.result?.value);
    if (!Number.isFinite(lamports) || lamports < 0) throw new Error('Invalid balance response');
    return lamports / 1e9;
  } finally {
    clearTimeout(timer);
  }
}

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireVerifiedAdmin(request, env);
    if (auth.response) return auth.response;

    let balanceSol = null;
    try {
      balanceSol = await Promise.any(PUBLIC_SOLANA_RPCS.map((rpcUrl) => readBalance(rpcUrl)));
    } catch (aggregate) {
      const reasons = Array.isArray(aggregate?.errors)
        ? aggregate.errors.map((error) => error?.name === 'AbortError' ? 'timeout' : 'unavailable')
        : ['unavailable'];
      console.error('sKAM Solana readiness RPC providers unavailable', reasons);
    }

    if (balanceSol == null) {
      return json({ error: 'Solana balance temporarily unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }

    return json({
      mode: 'READ_ONLY_SKAM_ADMIN_READINESS',
      owner: APPROVED_WALLET,
      balanceSol,
      minimumPlannedSol: MIN_PLANNED_SOL,
      ready: balanceSol >= MIN_PLANNED_SOL,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('sKAM admin readiness failed', error);
    return json({ error: 'sKAM readiness unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
