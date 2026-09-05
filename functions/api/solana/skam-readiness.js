import { json } from '../../../server/auth/http.js';
import { APPROVED_WALLET, MIN_PLANNED_SOL, requireVerifiedAdmin, withSolanaProvider } from './_skam-admin.js';

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireVerifiedAdmin(request, env);
    if (auth.response) return auth.response;

    const state = await withSolanaProvider(async (rpc) => {
      const result = await rpc('getBalance', [APPROVED_WALLET, { commitment: 'confirmed' }]);
      const lamports = Number(result?.value);
      if (!Number.isFinite(lamports) || lamports < 0) throw new Error('Invalid balance response');
      return { balanceSol: lamports / 1e9 };
    });

    return json({
      mode: 'READ_ONLY_SKAM_ADMIN_READINESS',
      owner: APPROVED_WALLET,
      balanceSol: state.balanceSol,
      minimumPlannedSol: MIN_PLANNED_SOL,
      ready: state.balanceSol >= MIN_PLANNED_SOL,
      provider: state.provider,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('sKAM admin readiness failed', error);
    return json({ error: 'Solana balance temporarily unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
