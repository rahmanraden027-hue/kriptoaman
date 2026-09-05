import { json, requireBindings } from '../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../server/auth/session.js';
import { getActiveSession } from '../../../server/auth/sessions.js';
import { getTotpSettings } from '../../../server/auth/totp.js';
import { getUserById } from '../../../server/auth/users.js';

export const APPROVED_WALLET = '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK';
export const MIN_PLANNED_SOL = 0.44;
export const MINT_DECIMALS = 9;
export const MINT_SIZE = 82;
export const TOTAL_SUPPLY = 1_000_000_000;
export const TOTAL_SUPPLY_BASE_UNITS = '1000000000000000000';
export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

const PUBLIC_SOLANA_RPCS = [
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet-beta.solana.com',
];
const RPC_TIMEOUT_MS = 4_000;

export async function requireVerifiedAdmin(request, env) {
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

async function rpcOn(rpcUrl, method, params = []) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'user-agent': 'KriptoAman-sKAM-Admin/2.0',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
    const payload = await response.json().catch(() => null);
    if (!payload || payload.error) throw new Error(payload?.error?.message || 'Solana RPC error');
    return payload.result;
  } finally {
    clearTimeout(timer);
  }
}

export async function withSolanaProvider(handler) {
  try {
    return await Promise.any(PUBLIC_SOLANA_RPCS.map(async (rpcUrl) => {
      const rpc = (method, params = []) => rpcOn(rpcUrl, method, params);
      const result = await handler(rpc);
      return { ...result, provider: new URL(rpcUrl).hostname };
    }));
  } catch (aggregate) {
    const reasons = Array.isArray(aggregate?.errors)
      ? aggregate.errors.map((error) => error?.name === 'AbortError' ? 'timeout' : 'unavailable')
      : ['unavailable'];
    console.error('sKAM Solana providers unavailable', reasons);
    throw new Error('Solana RPC temporarily unavailable');
  }
}
