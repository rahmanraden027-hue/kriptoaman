import { PublicKey } from '@solana/web3.js';
import { json } from '../../../server/auth/http.js';
import {
  APPROVED_WALLET,
  MINT_DECIMALS,
  TOKEN_PROGRAM_ID,
  TOTAL_SUPPLY_BASE_UNITS,
  requireVerifiedAdmin,
  withSolanaProvider,
} from './_skam-admin.js';

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/;

function validPublicKey(value) {
  if (typeof value !== 'string' || value.length < 32 || value.length > 44 || !BASE58_RE.test(value)) return false;
  try {
    return new PublicKey(value).toBase58() === value;
  } catch {
    return false;
  }
}

function validSignature(value) {
  return typeof value === 'string' && value.length >= 64 && value.length <= 100 && BASE58_RE.test(value);
}

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireVerifiedAdmin(request, env);
    if (auth.response) return auth.response;

    const url = new URL(request.url);
    const mint = String(url.searchParams.get('mint') || '').trim();
    const signature = String(url.searchParams.get('signature') || '').trim();
    if (!validPublicKey(mint) || !validSignature(signature)) {
      return json({ error: 'Mint address atau signature tidak valid.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    const state = await withSolanaProvider(async (rpc) => {
      const [statuses, mintAccount, tokenAccounts, transaction] = await Promise.all([
        rpc('getSignatureStatuses', [[signature], { searchTransactionHistory: true }]),
        rpc('getAccountInfo', [mint, { encoding: 'jsonParsed', commitment: 'confirmed' }]),
        rpc('getTokenAccountsByOwner', [APPROVED_WALLET, { mint }, { encoding: 'jsonParsed', commitment: 'confirmed' }]),
        rpc('getTransaction', [signature, { encoding: 'jsonParsed', commitment: 'confirmed', maxSupportedTransactionVersion: 0 }]),
      ]);

      const status = statuses?.value?.[0] || null;
      if (!status || !mintAccount?.value || !transaction) return { pending: true };
      if (status.err || transaction?.meta?.err) throw new Error('Mint transaction failed on-chain');

      const accountKeys = Array.isArray(transaction?.transaction?.message?.accountKeys)
        ? transaction.transaction.message.accountKeys.map((item) => typeof item === 'string' ? item : item?.pubkey).filter(Boolean)
        : [];
      if (!accountKeys.includes(APPROVED_WALLET) || !accountKeys.includes(mint)) {
        throw new Error('Transaction does not match approved wallet and mint');
      }

      if (mintAccount.value.owner !== TOKEN_PROGRAM_ID) throw new Error('Mint is not owned by the canonical Token Program');
      const parsed = mintAccount.value?.data?.parsed;
      if (parsed?.type !== 'mint') throw new Error('Account is not a parsed SPL mint');
      const info = parsed.info || {};
      if (Number(info.decimals) !== MINT_DECIMALS) throw new Error('Mint decimals mismatch');
      if (String(info.supply) !== TOTAL_SUPPLY_BASE_UNITS) throw new Error('Mint supply mismatch');
      if (info.mintAuthority !== APPROVED_WALLET) throw new Error('Mint authority mismatch');
      if (info.freezeAuthority !== APPROVED_WALLET) throw new Error('Freeze authority mismatch');
      if (info.isInitialized === false) throw new Error('Mint is not initialized');

      const accounts = Array.isArray(tokenAccounts?.value) ? tokenAccounts.value : [];
      let ownedBaseUnits = 0n;
      const tokenAccountAddresses = [];
      for (const account of accounts) {
        const tokenAmount = account?.account?.data?.parsed?.info?.tokenAmount;
        if (!tokenAmount?.amount) continue;
        ownedBaseUnits += BigInt(tokenAmount.amount);
        if (account?.pubkey) tokenAccountAddresses.push(account.pubkey);
      }
      if (ownedBaseUnits.toString() !== TOTAL_SUPPLY_BASE_UNITS) {
        throw new Error('Wallet does not hold the full minted supply');
      }

      return {
        pending: false,
        confirmed: true,
        confirmationStatus: status.confirmationStatus || null,
        ownedBaseUnits: ownedBaseUnits.toString(),
        tokenAccountAddresses,
      };
    });

    if (state.pending) {
      return json({
        mode: 'SKAM_MINT_VERIFY_READ_ONLY',
        mint,
        signature,
        verified: false,
        pending: true,
        provider: state.provider,
      }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
    }

    return json({
      mode: 'SKAM_MINT_VERIFY_READ_ONLY',
      owner: APPROVED_WALLET,
      mint,
      signature,
      verified: true,
      pending: false,
      decimals: MINT_DECIMALS,
      supplyBaseUnits: TOTAL_SUPPLY_BASE_UNITS,
      ownedBaseUnits: state.ownedBaseUnits,
      mintAuthority: APPROVED_WALLET,
      freezeAuthority: APPROVED_WALLET,
      authorityState: 'ACTIVE_PENDING_METADATA_AND_REVOCATION',
      tokenAccountAddresses: state.tokenAccountAddresses,
      confirmationStatus: state.confirmationStatus,
      provider: state.provider,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('sKAM mint verification failed', error);
    return json({ error: 'Verifikasi mint sKAM gagal atau belum konsisten di Solana.' }, { status: 409, headers: { 'Cache-Control': 'no-store' } });
  }
}
