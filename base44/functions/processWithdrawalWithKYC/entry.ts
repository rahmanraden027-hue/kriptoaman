import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Process withdrawal dengan KYC + cold wallet hold logic
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { withdrawalRequestId, coin, amount, toAddress } = await req.json();

    // Step 0: Validasi withdrawal request exists & milik user
    const withdrawalRequest = await base44.entities.WithdrawalRequest.get(withdrawalRequestId);
    if (!withdrawalRequest) {
      return Response.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }
    if (withdrawalRequest.userEmail !== user.email) {
      return Response.json({ error: 'Forbidden — withdrawal request does not belong to this user' }, { status: 403 });
    }

    // Step 1: Cek KYC status
    const kycRecords = await base44.entities.KYCVerification.filter({
      userEmail: user.email,
      status: 'verified'
    });

    if (kycRecords.length === 0) {
      return Response.json({
        error: 'KYC Verification Required',
        message: 'Lakukan verifikasi KYC sebelum melakukan withdrawal'
      }, { status: 403 });
    }

    const kyc = kycRecords[0];

    // Step 2: Cek withdrawal limit berdasarkan KYC tier
    const dailyLimit = kyc.verificationLevel === 'advanced' ? 100000 : kyc.verificationLevel === 'intermediate' ? 50000 : 10000;
    
    const todayWithdrawals = await base44.asServiceRole.entities.WithdrawalRequest.filter({
      userEmail: user.email,
      status: 'completed',
      created_date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
    });

    const todayTotal = todayWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    
    if (todayTotal + amount > dailyLimit) {
      return Response.json({
        error: 'Daily Limit Exceeded',
        limit: dailyLimit,
        used: todayTotal,
        message: `Daily limit $${dailyLimit}. Sudah digunakan $${todayTotal}.`
      }, { status: 400 });
    }

    // Step 3: Create withdrawal hold (24-48 jam)
    const holdDuration = kyc.verificationLevel === 'advanced' ? 24 * 60 * 60 * 1000 : 48 * 60 * 60 * 1000;
    
    const holdRecord = await base44.asServiceRole.entities.WithdrawalHold.create({
      withdrawalRequestId,
      userEmail: user.email,
      coin,
      amount,
      holdUntil: new Date(Date.now() + holdDuration).toISOString(),
      reason: 'aml_check',
      status: 'holding'
    });

    // Step 4: Check cold wallet balance
    const coldWallets = await base44.asServiceRole.entities.ColdWallet.filter({
      coin,
      isActive: true
    });

    if (coldWallets.length === 0 || coldWallets[0].availableAmount < amount) {
      // Not enough in cold wallet — flag for admin
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: Deno.env.get('ADMIN_NOTIFY_EMAIL') || 'admin@kriptoaman.id',
        subject: `⚠️ Cold Wallet Insufficient Balance — ${coin}`,
        body: `
          <p>Withdrawal request dari <strong>${user.email}</strong> tapi cold wallet tidak cukup.</p>
          <table>
            <tr><td>Requested:</td><td>$${amount}</td></tr>
            <tr><td>Available:</td><td>$${coldWallets[0]?.availableAmount || 0}</td></tr>
          </table>
          <p>Require topup cold wallet atau transfer dari hot wallet.</p>
        `
      });
    }

    // Step 5: Update withdrawal status
    await base44.asServiceRole.entities.WithdrawalRequest.update(withdrawalRequestId, {
      status: 'pending',
      adminNote: `Hold until ${holdRecord.holdUntil}`
    });

    console.log(`[WITHDRAWAL] Created hold for ${user.email}: ${amount} ${coin}`);

    return Response.json({
      success: true,
      holdId: holdRecord.id,
      holdUntil: holdRecord.holdUntil,
      message: `Withdrawal di-hold untuk verifikasi. Akan diproses dalam ${holdDuration / 60 / 60 / 1000} jam.`,
      kycTier: kyc.verificationLevel,
      dailyLimit
    });

  } catch (error) {
    console.error('[processWithdrawalWithKYC] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});