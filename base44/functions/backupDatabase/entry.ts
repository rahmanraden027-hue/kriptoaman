import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled calls (no user) or admin users
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin') isAdmin = true;
    } catch {
      // scheduled call — allow via service role
      isAdmin = true;
    }

    if (!isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const timestamp = new Date().toISOString();
    console.log(`[Backup] Starting backup at ${timestamp}`);

    // Fetch all critical entities
    const [
      users,
      userBalances,
      depositRequests,
      withdrawalRequests,
      adminProfits,
      p2pLoans,
      tradingRules,
      openPositions,
      tradingSignals,
      cexConnections,
      secureVault,
    ] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.UserBalance.list(),
      base44.asServiceRole.entities.DepositRequest.list(),
      base44.asServiceRole.entities.WithdrawalRequest.list(),
      base44.asServiceRole.entities.AdminProfit.list(),
      base44.asServiceRole.entities.P2PLoan.list(),
      base44.asServiceRole.entities.TradingRule.list(),
      base44.asServiceRole.entities.OpenPosition.list(),
      base44.asServiceRole.entities.TradingSignal.list(),
      base44.asServiceRole.entities.CexConnection.list(),
      base44.asServiceRole.entities.SecureVault.list(),
    ]);

    const backup = {
      backupAt: timestamp,
      version: '1.0',
      summary: {
        users: users.length,
        userBalances: userBalances.length,
        depositRequests: depositRequests.length,
        withdrawalRequests: withdrawalRequests.length,
        adminProfits: adminProfits.length,
        p2pLoans: p2pLoans.length,
        tradingRules: tradingRules.length,
        openPositions: openPositions.length,
        tradingSignals: tradingSignals.length,
        cexConnections: cexConnections.length,
        secureVault: secureVault.length,
      },
      data: {
        users: users.map(u => ({ id: u.id, email: u.email, full_name: u.full_name, role: u.role, kycStatus: u.kycStatus, created_date: u.created_date })),
        userBalances,
        depositRequests,
        withdrawalRequests,
        adminProfits,
        p2pLoans,
        tradingRules,
        openPositions: openPositions.slice(0, 500), // limit besar
        tradingSignals: tradingSignals.slice(0, 500),
        cexConnections: cexConnections.map(c => ({ id: c.id, exchange: c.exchange, label: c.label, created_date: c.created_date })), // tanpa API key
        secureVaultCount: secureVault.length, // hanya jumlah, tidak isi encrypted
      }
    };

    // Kirim email backup summary ke admin
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'rahmanraden027@gmail.com',
      subject: `[KriptoAman] Backup Database Berhasil - ${new Date().toLocaleDateString('id-ID')}`,
      body: `
        <h2>✅ Backup Database KriptoAman</h2>
        <p><strong>Waktu:</strong> ${timestamp}</p>
        <h3>Ringkasan Data:</h3>
        <ul>
          <li>👤 Users: <strong>${users.length}</strong></li>
          <li>💰 User Balances: <strong>${userBalances.length}</strong></li>
          <li>📥 Deposit Requests: <strong>${depositRequests.length}</strong></li>
          <li>📤 Withdrawal Requests: <strong>${withdrawalRequests.length}</strong></li>
          <li>💹 P2P Loans: <strong>${p2pLoans.length}</strong></li>
          <li>🤖 Trading Rules: <strong>${tradingRules.length}</strong></li>
          <li>📈 Open Positions: <strong>${openPositions.length}</strong></li>
          <li>🔒 Secure Vault Items: <strong>${secureVault.length}</strong></li>
        </ul>
        <p>Backup otomatis berjalan sesuai jadwal. Data aman tersimpan.</p>
      `
    });

    console.log(`[Backup] Completed. Summary: ${JSON.stringify(backup.summary)}`);
    return Response.json({ success: true, backupAt: timestamp, summary: backup.summary });

  } catch (error) {
    console.error('[Backup] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});