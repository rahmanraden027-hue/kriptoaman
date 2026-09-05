import { json, requireBindings } from '../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../server/auth/session.js';
import { getActiveSession } from '../../../server/auth/sessions.js';
import { getTotpSettings } from '../../../server/auth/totp.js';
import { getUserById } from '../../../server/auth/users.js';

const APPROVED_WALLET = '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK';
const PUBLIC_SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const MIN_PLANNED_SOL = 0.44;

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
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
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
}

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireVerifiedAdmin(request, env);
    if (auth.response) return auth.response;

    const candidates = [];
    if (typeof env.SOLANA_RPC_URL === 'string' && env.SOLANA_RPC_URL.startsWith('https://')) {
      candidates.push(env.SOLANA_RPC_URL);
    }
    candidates.push(PUBLIC_SOLANA_RPC);

    let balanceSol = null;
    let lastError = null;
    for (const rpcUrl of [...new Set(candidates)]) {
      try {
        balanceSol = await readBalance(rpcUrl);
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (balanceSol == null) {
      console.error('sKAM Solana readiness RPC failed', lastError);
      return json({ error: 'Solana balance temporarily unavailable' }, { status: 503 });
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
    return json({ error: 'sKAM readiness unavailable' }, { status: 503 });
  }
}
