import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const OWNER_EMAIL = Deno.env.get('ADMIN_NOTIFY_EMAIL') || 'admin@kriptoaman.id';

// ── Rate limiting sederhana (in-memory per instance) ─────────────────────────
const ipRateMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const entry = ipRateMap.get(ip) || { count: 0, resetAt: now + 60000 };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 60000; }
  entry.count++;
  ipRateMap.set(ip, entry);
  return entry.count > 20; // max 20 req/menit per IP
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

Deno.serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  // Rate limiting
  if (isRateLimited(ip)) {
    console.warn(`[SECURITY] Rate limit exceeded from IP: ${ip}`);
    return Response.json({ error: 'Too Many Requests' }, { status: 429 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Triple lock: authenticated + admin role + owner email
    if (!user || user.role !== 'admin' || user.email !== OWNER_EMAIL) {
      const attemptEmail = user?.email || 'unauthenticated';
      console.warn(`[SECURITY][${new Date().toISOString()}] UNAUTHORIZED ACCESS from: ${attemptEmail} | IP: ${ip}`);

      // Alert ke owner jika ada user yang login tapi bukan owner
      if (user && user.email !== OWNER_EMAIL) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: OWNER_EMAIL,
          subject: '🚨 [KriptoAman] Unauthorized Admin Access Attempt',
          body: `
            <div style="font-family:sans-serif;max-width:500px">
              <h2 style="color:#ef4444">⚠️ Percobaan Akses Admin Tidak Sah</h2>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:6px;color:#888">Email</td><td style="padding:6px;color:#fff;background:#1e293b">${escapeHtml(user.email)}</td></tr>
                <tr><td style="padding:6px;color:#888">Nama</td><td style="padding:6px">${escapeHtml(user.full_name || '-')}</td></tr>
                <tr><td style="padding:6px;color:#888">Role</td><td style="padding:6px">${escapeHtml(user.role)}</td></tr>
                <tr><td style="padding:6px;color:#888">IP</td><td style="padding:6px;font-family:monospace">${escapeHtml(ip)}</td></tr>
                <tr><td style="padding:6px;color:#888">Waktu</td><td style="padding:6px">${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</td></tr>
              </table>
              <p style="color:#ef4444;margin-top:16px"><strong>Tindakan:</strong> Akses ditolak otomatis. Jika bukan Anda, segera periksa akun.</p>
            </div>
          `
        });
      }

      return Response.json({ error: 'Forbidden', authorized: false }, { status: 403 });
    }

    // ── Full security audit ───────────────────────────────────────────────────
    const [users, withdrawals, deposits, openPositions] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.WithdrawalRequest.filter({ status: 'pending' }),
      base44.asServiceRole.entities.DepositRequest.filter({ status: 'pending' }),
      base44.asServiceRole.entities.OpenPosition.filter({ status: 'open' }),
    ]);

    // Deteksi rogue admins
    const rogueAdmins = users.filter(u => u.role === 'admin' && u.email !== OWNER_EMAIL);

    // Auto-downgrade semua rogue admin
    const downgradeResults = await Promise.all(
      rogueAdmins.map(async (rogue) => {
        await base44.asServiceRole.entities.User.update(rogue.id, { role: 'user' });
        console.warn(`[SECURITY] Downgraded rogue admin: ${rogue.email}`);
        return rogue.email;
      })
    );

    // Kirim satu email ringkasan jika ada rogue admin
    if (rogueAdmins.length > 0) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: OWNER_EMAIL,
        subject: `🚨 [KriptoAman] ${rogueAdmins.length} Rogue Admin Dinonaktifkan`,
        body: `
          <div style="font-family:sans-serif;max-width:500px">
            <h2 style="color:#ef4444">⚠️ ${rogueAdmins.length} Admin Tidak Sah Ditemukan & Dinonaktifkan</h2>
            <ul>${rogueAdmins.map(r => `<li>${escapeHtml(r.email)} — downgraded ke "user"</li>`).join('')}</ul>
            <p style="color:#888">Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</p>
          </div>
        `
      });
    }

    // Deteksi withdrawal besar (> $1000) yang perlu perhatian
    const largeWithdrawals = withdrawals.filter(w => (w.amount || 0) > 1000);

    const securityReport = {
      authorized: true,
      owner: user.email,
      checkedAt: new Date().toISOString(),
      security: {
        rogueAdminsFound: rogueAdmins.length,
        rogueAdminsRemoved: downgradeResults,
        pendingWithdrawals: withdrawals.length,
        largeWithdrawals: largeWithdrawals.length,
        pendingDeposits: deposits.length,
        openPositions: openPositions.length,
        totalUsers: users.length,
        adminCount: users.filter(u => u.role === 'admin').length,
        riskLevel: rogueAdmins.length > 0 ? 'HIGH' : largeWithdrawals.length > 0 ? 'MEDIUM' : 'LOW',
      }
    };

    console.log('[SECURITY] Audit complete:', JSON.stringify(securityReport.security));
    return Response.json(securityReport);

  } catch (error) {
    console.error('[adminSecurityCheck] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});