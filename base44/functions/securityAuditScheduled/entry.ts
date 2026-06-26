import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const OWNER_EMAIL = Deno.env.get('ADMIN_NOTIFY_EMAIL') || 'admin@kriptoaman.id';

/**
 * Scheduled security audit — berjalan otomatis setiap 6 jam.
 * Tidak memerlukan user auth (dijalankan sebagai service role).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Jalankan sebagai service role (scheduled, tidak ada user context)
    const [users, withdrawals, deposits] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.WithdrawalRequest.filter({ status: 'pending' }),
      base44.asServiceRole.entities.DepositRequest.filter({ status: 'pending' }),
    ]);

    // ── Deteksi & auto-downgrade rogue admins ────────────────────────────────
    const rogueAdmins = users.filter(u => u.role === 'admin' && u.email !== OWNER_EMAIL);
    for (const rogue of rogueAdmins) {
      await base44.asServiceRole.entities.User.update(rogue.id, { role: 'user' });
      console.warn(`[SCHEDULED-SECURITY] Downgraded rogue admin: ${rogue.email}`);
    }

    // ── Deteksi deposit pending lebih dari 3 hari ─────────────────────────────
    const stalePendingDeposits = deposits.filter(d => {
      const createdAt = new Date(d.created_date).getTime();
      return Date.now() - createdAt > 3 * 24 * 60 * 60 * 1000; // > 3 hari
    });

    // ── Deteksi withdrawal pending lebih dari 24 jam ──────────────────────────
    const staleWithdrawals = withdrawals.filter(w => {
      const createdAt = new Date(w.created_date).getTime();
      return Date.now() - createdAt > 24 * 60 * 60 * 1000; // > 24 jam
    });

    const issues = [];
    if (rogueAdmins.length > 0) issues.push(`🚨 ${rogueAdmins.length} rogue admin dinonaktifkan`);
    if (stalePendingDeposits.length > 0) issues.push(`⏳ ${stalePendingDeposits.length} deposit pending > 3 hari`);
    if (staleWithdrawals.length > 0) issues.push(`⏳ ${staleWithdrawals.length} withdrawal pending > 24 jam`);

    // Kirim laporan hanya jika ada masalah atau setiap hari Senin (ringkasan mingguan)
    const isMonday = new Date().getDay() === 1;
    if (issues.length > 0 || isMonday) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: OWNER_EMAIL,
        subject: issues.length > 0
          ? `🔔 [KriptoAman] Security Alert — ${issues.length} masalah ditemukan`
          : '📊 [KriptoAman] Laporan Keamanan Mingguan',
        body: `
          <div style="font-family:sans-serif;max-width:560px;color:#334155">
            <h2 style="color:${issues.length > 0 ? '#ef4444' : '#3b82f6'}">
              ${issues.length > 0 ? '⚠️ Security Alert' : '✅ Security Report Mingguan'}
            </h2>
            <p>Waktu: <strong>${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</strong></p>

            ${issues.length > 0 ? `
              <h3 style="color:#ef4444">Masalah Ditemukan:</h3>
              <ul>${issues.map(i => `<li>${i}</li>`).join('')}</ul>
            ` : '<p style="color:#22c55e">✅ Tidak ada masalah keamanan ditemukan.</p>'}

            <h3>Ringkasan Platform:</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr style="background:#f1f5f9"><td style="padding:8px">Total Pengguna</td><td style="padding:8px"><strong>${users.length}</strong></td></tr>
              <tr><td style="padding:8px">Deposit Pending</td><td style="padding:8px">${deposits.length}</td></tr>
              <tr style="background:#f1f5f9"><td style="padding:8px">Withdrawal Pending</td><td style="padding:8px">${withdrawals.length}</td></tr>
              <tr><td style="padding:8px">Admin Aktif</td><td style="padding:8px">${users.filter(u => u.role === 'admin').length} (hanya owner)</td></tr>
              <tr style="background:#f1f5f9"><td style="padding:8px">Rogue Admin Dinonaktifkan</td><td style="padding:8px">${rogueAdmins.length}</td></tr>
            </table>

            <p style="margin-top:16px;color:#94a3b8;font-size:12px">
              Email ini dikirim otomatis oleh sistem keamanan KriptoAman setiap 6 jam.
            </p>
          </div>
        `
      });
    }

    console.log(`[SCHEDULED-SECURITY] Audit selesai. Issues: ${issues.length}, Users: ${users.length}`);
    return Response.json({
      success: true,
      issues: issues.length,
      details: { rogueAdmins: rogueAdmins.length, stalePendingDeposits: stalePendingDeposits.length, staleWithdrawals: staleWithdrawals.length },
      checkedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[securityAuditScheduled] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});