import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── OWNER EMAIL — SATU-SATUNYA YANG BISA AKSES FUNGSI ADMIN ─────────────────
const OWNER_EMAIL = 'rahmanraden027@gmail.com';

/**
 * Backend security check:
 * - Verifikasi user adalah owner berdasarkan email (bukan hanya role)
 * - Cek integritas admin panel
 * - Log akses tidak sah
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Double lock: harus admin DAN email harus cocok dengan owner
    if (!user || user.role !== 'admin' || user.email !== OWNER_EMAIL) {
      // Log unauthorized access attempt
      console.warn(`[SECURITY] Unauthorized admin access attempt from: ${user?.email || 'unknown'} at ${new Date().toISOString()}`);

      // Kirim alert ke owner jika ada upaya akses tidak sah
      if (user && user.email !== OWNER_EMAIL) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: OWNER_EMAIL,
          subject: '🚨 [KriptoAman] Unauthorized Admin Access Attempt',
          body: `
            <h2 style="color:#ef4444">⚠️ Percobaan Akses Admin Tidak Sah</h2>
            <p>Seseorang mencoba mengakses panel admin:</p>
            <ul>
              <li><strong>Email:</strong> ${user.email}</li>
              <li><strong>Role:</strong> ${user.role}</li>
              <li><strong>Waktu:</strong> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</li>
            </ul>
            <p style="color:#ef4444"><strong>Tindakan:</strong> Akses ditolak secara otomatis.</p>
          `
        });
      }

      return Response.json({ error: 'Forbidden', authorized: false }, { status: 403 });
    }

    // ── Audit: cek status keamanan platform ───────────────────────────────────
    const [users, withdrawals, deposits] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.WithdrawalRequest.filter({ status: 'pending' }),
      base44.asServiceRole.entities.DepositRequest.filter({ status: 'pending' }),
    ]);

    // Cek apakah ada akun admin selain owner
    const rogueAdmins = users.filter(u => u.role === 'admin' && u.email !== OWNER_EMAIL);

    // Auto-downgrade rogue admins
    for (const rogue of rogueAdmins) {
      await base44.asServiceRole.entities.User.update(rogue.id, { role: 'user' });
      console.warn(`[SECURITY] Downgraded rogue admin: ${rogue.email}`);
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: OWNER_EMAIL,
        subject: '🚨 [KriptoAman] Rogue Admin Terdeteksi & Dinonaktifkan',
        body: `
          <h2 style="color:#ef4444">⚠️ Admin Tidak Sah Ditemukan & Dinonaktifkan</h2>
          <p>Akun berikut memiliki role admin tanpa otorisasi Anda:</p>
          <ul>
            <li><strong>Email:</strong> ${rogue.email}</li>
            <li><strong>Nama:</strong> ${rogue.full_name}</li>
            <li><strong>Tindakan:</strong> Downgraded ke role "user" secara otomatis</li>
            <li><strong>Waktu:</strong> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</li>
          </ul>
        `
      });
    }

    return Response.json({
      authorized: true,
      owner: user.email,
      security: {
        rogueAdminsFound: rogueAdmins.length,
        rogueAdminsRemoved: rogueAdmins.map(u => u.email),
        pendingWithdrawals: withdrawals.length,
        pendingDeposits: deposits.length,
        totalUsers: users.length,
        adminCount: users.filter(u => u.role === 'admin').length,
        checkedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('[adminSecurityCheck] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});