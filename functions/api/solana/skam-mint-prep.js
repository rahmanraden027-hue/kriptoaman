import { json } from '../../../server/auth/http.js';
import {
  APPROVED_WALLET,
  MIN_PLANNED_SOL,
  MINT_DECIMALS,
  MINT_SIZE,
  TOTAL_SUPPLY,
  TOTAL_SUPPLY_BASE_UNITS,
  requireVerifiedAdmin,
  withSolanaProvider,
} from './_skam-admin.js';

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireVerifiedAdmin(request, env);
    if (auth.response) return auth.response;

    const state = await withSolanaProvider(async (rpc) => {
      const [latest, rentLamports, balance] = await Promise.all([
        rpc('getLatestBlockhash', [{ commitment: 'confirmed' }]),
        rpc('getMinimumBalanceForRentExemption', [MINT_SIZE, { commitment: 'confirmed' }]),
        rpc('getBalance', [APPROVED_WALLET, { commitment: 'confirmed' }]),
      ]);

      const blockhash = latest?.value?.blockhash;
      const lastValidBlockHeight = Number(latest?.value?.lastValidBlockHeight);
      const mintRentLamports = Number(rentLamports);
      const balanceLamports = Number(balance?.value);
      if (typeof blockhash !== 'string' || blockhash.length < 20) throw new Error('Invalid blockhash');
      if (!Number.isInteger(lastValidBlockHeight) || lastValidBlockHeight <= 0) throw new Error('Invalid block height');
      if (!Number.isInteger(mintRentLamports) || mintRentLamports <= 0) throw new Error('Invalid mint rent');
      if (!Number.isFinite(balanceLamports) || balanceLamports < 0) throw new Error('Invalid balance');

      return {
        blockhash,
        lastValidBlockHeight,
        mintRentLamports,
        balanceSol: balanceLamports / 1e9,
      };
    });

    if (state.balanceSol < MIN_PLANNED_SOL) {
      return json({ error: 'Saldo SOL tidak lagi memenuhi minimum launch.' }, { status: 409, headers: { 'Cache-Control': 'no-store' } });
    }

    return json({
      mode: 'SKAM_MINT_PREP_READ_ONLY',
      owner: APPROVED_WALLET,
      decimals: MINT_DECIMALS,
      totalSupply: TOTAL_SUPPLY,
      totalSupplyBaseUnits: TOTAL_SUPPLY_BASE_UNITS,
      mintSize: MINT_SIZE,
      mintRentLamports: state.mintRentLamports,
      balanceSol: state.balanceSol,
      blockhash: state.blockhash,
      lastValidBlockHeight: state.lastValidBlockHeight,
      provider: state.provider,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('sKAM mint prep failed', error);
    return json({ error: 'Persiapan transaksi mint sementara tidak tersedia.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
