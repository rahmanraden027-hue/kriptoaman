import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const timestamp = new Date().toISOString();
    console.log(`[Monitor] Running suspicious activity check at ${timestamp}`);

    const alerts = [];

    // ── 1. Withdrawal besar dalam 24 jam terakhir ─────────────────────────
    const allWithdrawals = await base44.asServiceRole.entities.WithdrawalRequest.list();
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const recentWithdrawals = allWithdrawals.filter(w => w.created_date >= last24h);
    const largeWithdrawals = recentWithdrawals.filter(w => w.amount > 500); // > $500

    if (largeWithdrawals.length > 0) {
      alerts.push({
        type: 'LARGE_WITHDRAWAL',
        severity: 'HIGH',
        count: largeWithdrawals.length,
        detail: largeWithdrawals.map(w => `${w.userEmail}: $${w.amount} ${w.coin}`).join(', '),
        message: `⚠️ ${largeWithdrawals.length} penarikan besar (>$500) dalam 24 jam terakhir`
      });
    }

    // ── 2. Banyak withdrawal dari 1 user dalam 1 jam ──────────────────────
    const last1h = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentWith1h = allWithdrawals.filter(w => w.created_date >= last1h);
    const withdrawalByUser = {};
    recentWith1h.forEach(w => {
      withdrawalByUser[w.userEmail] = (withdrawalByUser[w.userEmail] || 0) + 1;
    });
    const spammingUsers = Object.entries(withdrawalByUser).filter(([, count]) => count >= 3);
    if (spammingUsers.length > 0) {
      alerts.push({
        type: 'WITHDRAWAL_SPAM',
        severity: 'HIGH',
        count: spammingUsers.length,
        detail: spammingUsers.map(([email, count]) => `${email}: ${count}x`).join(', '),
        message: `🚨 User melakukan banyak withdrawal dalam 1 jam: ${spammingUsers.map(([e, c]) => `${e} (${c}x)`).join(', ')}`
      });
    }

    // ── 3. Deposit pending terlalu lama (> 24 jam) ─────────────────────────
    const allDeposits = await base44.asServiceRole.entities.DepositRequest.list();
    const stalePending = allDeposits.filter(d => d.status === 'pending' && d.created_date < last24h);
    if (stalePending.length > 5) {
      alerts.push({
        type: 'STALE_DEPOSITS',
        severity: 'MEDIUM',
        count: stalePending.length,
        detail: `${stalePending.length} deposit pending lebih dari 24 jam`,
        message: `⏰ ${stalePending.length} deposit masih pending lebih dari 24 jam tanpa konfirmasi`
      });
    }

    // ── 4. P2P loan default / overdue ─────────────────────────────────────
    const allLoans = await base44.asServiceRole.entities.P2PLoan.list();
    const now = new Date().toISOString();
    const overdueLoans = allLoans.filter(l =>
      l.status === 'active' && l.dueDate && l.dueDate < now
    );
    if (overdueLoans.length > 0) {
      alerts.push({
        type: 'LOAN_OVERDUE',
        severity: 'MEDIUM',
        count: overdueLoans.length,
        detail: overdueLoans.map(l => `${l.borrowerEmail}: $${l.totalOwed}`).join(', '),
        message: `💸 ${overdueLoans.length} pinjaman P2P sudah jatuh tempo dan belum dibayar`
      });
    }

    // ── 5. Open position dengan unrealized loss besar ──────────────────────
    const allPositions = await base44.asServiceRole.entities.OpenPosition.list();
    const bigLossPositions = allPositions.filter(p =>
      p.status === 'open' && p.unrealizedPnLPercent < -20
    );
    if (bigLossPositions.length > 0) {
      alerts.push({
        type: 'LARGE_UNREALIZED_LOSS',
        severity: 'MEDIUM',
        count: bigLossPositions.length,
        detail: bigLossPositions.map(p => `${p.userEmail} ${p.pair}: ${p.unrealizedPnLPercent?.toFixed(1)}%`).join(', '),
        message: `📉 ${bigLossPositions.length} posisi trading dengan kerugian unrealized > 20%`
      });
    }

    // ── 6. User baru mendaftar massal (> 10 dalam 1 jam) ──────────────────
    const allUsers = await base44.asServiceRole.entities.User.list();
    const newUsers1h = allUsers.filter(u => u.created_date >= last1h);
    if (newUsers1h.length > 10) {
      alerts.push({
        type: 'MASS_REGISTRATION',
        severity: 'HIGH',
        count: newUsers1h.length,
        detail: newUsers1h.map(u => u.email).join(', '),
        message: `🤖 Kemungkinan bot: ${newUsers1h.length} user baru mendaftar dalam 1 jam terakhir`
      });
    }

    console.log(`[Monitor] Checks done. Alerts: ${alerts.length}`);

    // Kirim email jika ada alert
    if (alerts.length > 0) {
      const highAlerts = alerts.filter(a => a.severity === 'HIGH');
      const medAlerts = alerts.filter(a => a.severity === 'MEDIUM');

      const alertHtml = alerts.map(a => `
        <div style="border-left: 4px solid ${a.severity === 'HIGH' ? '#ef4444' : '#f59e0b'}; padding: 10px; margin: 10px 0; background: #1e293b; border-radius: 4px;">
          <strong style="color: ${a.severity === 'HIGH' ? '#ef4444' : '#f59e0b'}">[${a.severity}] ${a.type}</strong><br/>
          <span style="color: #cbd5e1">${a.message}</span><br/>
          <small style="color: #64748b">${a.detail}</small>
        </div>
      `).join('');

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'rahmanraden027@gmail.com',
        subject: `🚨 [KriptoAman] ${highAlerts.length > 0 ? 'ALERT TINGGI' : 'Peringatan'} - ${alerts.length} Aktivitas Mencurigakan`,
        body: `
          <div style="font-family: sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; border-radius: 8px;">
            <h2 style="color: #ef4444;">🚨 Monitoring Alert - KriptoAman</h2>
            <p><strong>Waktu Pengecekan:</strong> ${timestamp}</p>
            <p><strong>Total Alert:</strong> ${alerts.length} (${highAlerts.length} Tinggi, ${medAlerts.length} Sedang)</p>
            <hr style="border-color: #334155"/>
            <h3>Detail Alert:</h3>
            ${alertHtml}
            <hr style="border-color: #334155"/>
            <p style="color: #64748b; font-size: 12px;">Email ini dikirim otomatis oleh sistem monitoring KriptoAman.</p>
          </div>
        `
      });

      console.log(`[Monitor] Alert email sent. HIGH: ${highAlerts.length}, MEDIUM: ${medAlerts.length}`);
    } else {
      console.log('[Monitor] No suspicious activity detected.');
    }

    return Response.json({
      success: true,
      checkedAt: timestamp,
      alertsFound: alerts.length,
      alerts
    });

  } catch (error) {
    console.error('[Monitor] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});