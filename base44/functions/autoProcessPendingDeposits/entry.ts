import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Auto-process pending deposits — berjalan setiap 30 menit via scheduled automation.
 * 
 * Tugasnya:
 * 1. Deposit KRIPTO yang sudah pending > 2 jam: re-verify tx hash otomatis
 * 2. Deposit BANK yang bukti sudah diupload > 30 menit: notifikasi admin via email
 * 3. Deposit yang pending > 48 jam tanpa action: tandai sebagai 'stale' + notifikasi admin
 * 
 * Admin tidak perlu online — sistem tetap berjalan & menginformasikan secara otomatis.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const log = [];

    // Ambil semua deposit pending
    const pending = await base44.asServiceRole.entities.DepositRequest.filter({ status: 'pending' });
    console.log(`[autoProcessPendingDeposits] Found ${pending.length} pending deposits`);

    const results = { autoVerified: 0, adminNotified: 0, staleMarked: 0, skipped: 0 };

    for (const dep of pending) {
      const ageMs = now - new Date(dep.created_date);
      const ageHours = ageMs / (1000 * 60 * 60);

      // ── KRIPTO: re-verify tx hash setelah >2 jam pending ──
      if (dep.type === 'crypto' && dep.txHash && ageHours >= 2 && !dep.pendingReason?.includes('re-verified')) {
        try {
          const isEVM = ['ETH','USDT','BNB','MATIC'].includes(dep.coin);
          const isSol = dep.coin === 'SOL';
          const isBtc = dep.coin === 'BTC';
          let verified = false;
          let errorMsg = '';

          if (isEVM) {
            const isBNB = dep.coin === 'BNB';
            const apiBase = isBNB ? 'https://api.bscscan.com/api' : 'https://api.etherscan.io/api';
            const url = `${apiBase}?module=proxy&action=eth_getTransactionByHash&txhash=${dep.txHash}`;
            const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
            const data = await res.json();
            if (data?.result && data.result !== null) {
              verified = true; // TX ditemukan di chain
            } else {
              errorMsg = 'TX belum ditemukan di blockchain.';
            }
          } else if (isSol) {
            const res = await fetch('https://api.mainnet-beta.solana.com', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'getTransaction', params:[dep.txHash, {encoding:'json',maxSupportedTransactionVersion:0}] }),
              signal: AbortSignal.timeout(8000),
            });
            const data = await res.json();
            if (data?.result && !data.result.meta?.err) verified = true;
            else errorMsg = 'TX Solana tidak valid atau belum confirmed.';
          } else if (isBtc) {
            const res = await fetch(`https://blockstream.info/api/tx/${dep.txHash}`, { signal: AbortSignal.timeout(8000) });
            if (res.ok) {
              const tx = await res.json();
              if (tx?.status?.confirmed) verified = true;
              else errorMsg = 'BTC TX belum terkonfirmasi.';
            } else errorMsg = 'BTC TX tidak ditemukan.';
          }

          if (verified) {
            // Update status → automation autoConfirmDeposit akan credit saldo
            await base44.asServiceRole.entities.DepositRequest.update(dep.id, {
              status: 'confirmed',
              confirmedAt: now.toISOString(),
              adminNote: `Auto-verified by scheduler after ${ageHours.toFixed(1)}h pending.`,
            });
            results.autoVerified++;
            log.push(`✅ Auto-confirmed: ${dep.userEmail} ${dep.amountCrypto} ${dep.coin}`);
          } else {
            await base44.asServiceRole.entities.DepositRequest.update(dep.id, {
              pendingReason: `[re-verified ${now.toISOString().slice(0,16)}] ${errorMsg || 'TX belum terkonfirmasi.'}`,
            });
            results.skipped++;
          }
        } catch (e) {
          console.warn(`[autoProcessPendingDeposits] Error re-verifying ${dep.id}:`, e.message);
        }
      }

      // ── BANK: deposit dengan bukti foto sudah >30 menit — pastikan admin tahu ──
      else if (dep.type === 'bank' && dep.proofNote?.includes('Bukti:') && ageHours >= 0.5 && ageHours < 2) {
        // Sudah ada bukti tapi masih pending — ini mungkin admin belum lihat
        // Tidak perlu email tiap run, cukup update pendingReason agar user tahu
        if (!dep.pendingReason) {
          await base44.asServiceRole.entities.DepositRequest.update(dep.id, {
            pendingReason: 'Bukti transfer sudah diterima. Admin sedang memverifikasi. Estimasi 1-2 jam.',
          });
        }
        results.skipped++;
      }

      // ── STALE: pending > 48 jam tanpa action apapun ──
      else if (ageHours >= 48) {
        const alreadyNotified = dep.pendingReason?.includes('STALE');
        if (!alreadyNotified) {
          await base44.asServiceRole.entities.DepositRequest.update(dep.id, {
            pendingReason: `[STALE] Deposit pending > 48 jam sejak ${dep.created_date?.slice(0,10)}. Butuh review admin segera.`,
          });

          // Email notifikasi admin
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: 'rahmanraden027@gmail.com',
              subject: `⚠️ [KriptoAman] Deposit STALE > 48 jam — ${dep.userEmail}`,
              body: `
                <div style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;border-radius:12px;">
                  <h2 style="color:#f59e0b;">⚠️ Deposit Stale — Butuh Review Admin</h2>
                  <p>Deposit berikut sudah pending lebih dari 48 jam dan belum diproses:</p>
                  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                    <tr><td style="color:#94a3b8;padding:4px 0;">User:</td><td style="color:#fff;font-weight:bold;">${dep.userEmail}</td></tr>
                    <tr><td style="color:#94a3b8;padding:4px 0;">Tipe:</td><td style="color:#fff;">${dep.type}</td></tr>
                    <tr><td style="color:#94a3b8;padding:4px 0;">Jumlah:</td><td style="color:#4ade80;font-weight:bold;">${dep.type === 'bank' ? 'IDR ' + (dep.amountIDR || 0).toLocaleString() : (dep.amountCrypto || 0) + ' ' + dep.coin}</td></tr>
                    <tr><td style="color:#94a3b8;padding:4px 0;">Dibuat:</td><td style="color:#fff;">${new Date(dep.created_date).toLocaleString('id-ID')}</td></tr>
                    <tr><td style="color:#94a3b8;padding:4px 0;">TX Hash:</td><td style="color:#94a3b8;font-family:monospace;font-size:11px;">${dep.txHash || '-'}</td></tr>
                  </table>
                  <p style="color:#f87171;">Silakan login ke admin panel dan proses deposit ini segera.</p>
                  <p style="color:#64748b;font-size:11px;margin-top:20px;">© KriptoAman Auto-Monitor System</p>
                </div>
              `,
            });
          } catch (emailErr) {
            console.warn('[autoProcessPendingDeposits] Email stale gagal:', emailErr.message);
          }

          results.staleMarked++;
          log.push(`⚠️ Stale marked: ${dep.userEmail} ${dep.type} (${ageHours.toFixed(0)}h)`);
        }
      }
    }

    console.log(`[autoProcessPendingDeposits] Done. Verified: ${results.autoVerified}, Stale: ${results.staleMarked}, Skipped: ${results.skipped}`);
    return Response.json({ success: true, results, log, processedAt: now.toISOString() });

  } catch (error) {
    console.error('[autoProcessPendingDeposits] Fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});