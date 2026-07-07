import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Automation: triggered by DepositRequest entity update
 * - Saat status berubah ke 'confirmed': credit saldo, catat AdminProfit, kirim email ke user
 * - Saat status berubah ke 'rejected': kirim email notifikasi ke user
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    const { event, data, old_data } = body;

    if (event?.type !== 'update') {
      return Response.json({ skipped: true, reason: 'Not an update event' });
    }

    const depositId = event?.entity_id || data?.id;
    if (!depositId) {
      return Response.json({ error: 'Missing deposit id' }, { status: 400 });
    }

    const deposits = await base44.asServiceRole.entities.DepositRequest.filter({ id: depositId });
    const deposit = deposits[0];
    if (!deposit) {
      return Response.json({ error: 'Deposit not found' }, { status: 404 });
    }

    const { userEmail, coin, amountCrypto, amountIDR, type, status } = deposit;

    if (!userEmail || !coin) {
      return Response.json({ error: 'Missing userEmail or coin' }, { status: 400 });
    }

    // ── CONFIRMED: credit saldo + AdminProfit + email ──
    if (status === 'confirmed' && old_data?.status !== 'confirmed') {
      let creditAmount = 0;
      let creditCoin = coin;

      if (type === 'crypto') {
        creditAmount = amountCrypto || 0;
      } else if (type === 'bank') {
        creditAmount = amountIDR || 0;
        creditCoin = 'IDR';
      }

      if (creditAmount <= 0) {
        return Response.json({ skipped: true, reason: 'No amount to credit' });
      }

      const alreadyCredited = await base44.asServiceRole.entities.AdminProfit.filter({
        transactionType: 'deposit',
        transactionId: deposit.id,
        status: 'collected',
      });
      if (alreadyCredited.length > 0) {
        return Response.json({ skipped: true, reason: 'Deposit already credited' });
      }

      // 1. Credit UserBalance
      const existing = await base44.asServiceRole.entities.UserBalance.filter({ userEmail, coin: creditCoin });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.UserBalance.update(existing[0].id, {
          amount: (existing[0].amount || 0) + creditAmount,
        });
      } else {
        await base44.asServiceRole.entities.UserBalance.create({ userEmail, coin: creditCoin, amount: creditAmount });
      }

      // 2. Catat AdminProfit sebagai idempotency marker (fee deposit 0.1%)
      const feeAmount = parseFloat((creditAmount * 0.001).toFixed(8));
      await base44.asServiceRole.entities.AdminProfit.create({
        transactionType: 'deposit',
        userEmail,
        amount: feeAmount,
        transactionId: deposit.id,
        currency: creditCoin,
        transactionAmount: creditAmount,
        status: 'collected',
        notes: `Fee deposit ${type} — ${creditAmount} ${creditCoin}`,
      });

      // 3. Kirim email konfirmasi ke user (tidak gagalkan flow jika error)
      const amountDisplay = type === 'bank'
        ? `Rp ${creditAmount.toLocaleString('id-ID')}`
        : `${creditAmount} ${creditCoin}`;

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: userEmail,
          subject: '✅ Deposit Dikonfirmasi — KriptoAman',
          body: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;">
              <h2 style="color: #4ade80; margin: 0 0 16px;">✅ Deposit Berhasil Dikonfirmasi</h2>
              <p>Halo <strong>${userEmail}</strong>,</p>
              <p>Deposit Anda telah dikonfirmasi dan saldo telah dikreditkan ke akun Anda.</p>
              <div style="background: #1e293b; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <p style="margin: 4px 0; color: #94a3b8;">Jumlah Deposit:</p>
                <p style="margin: 4px 0; font-size: 24px; font-weight: bold; color: #4ade80;">${amountDisplay}</p>
                <p style="margin: 8px 0 0; color: #94a3b8; font-size: 12px;">Metode: ${type === 'crypto' ? 'Kripto (' + coin + ')' : 'Transfer Bank'}</p>
              </div>
              <p style="color: #94a3b8; font-size: 12px;">Saldo Anda sekarang sudah tersedia. Silakan login ke KriptoAman untuk melihat saldo.</p>
              <p style="color: #64748b; font-size: 11px; margin-top: 24px;">© KriptoAman · Platform kripto terdaftar Bappebti & OJK</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.warn(`[autoConfirmDeposit] Email gagal dikirim ke ${userEmail}:`, emailErr.message);
      }

      console.log(`[autoConfirmDeposit] Credited ${creditAmount} ${creditCoin} to ${userEmail}, fee: ${feeAmount}`);
      return Response.json({ success: true, credited: { userEmail, coin: creditCoin, amount: creditAmount, fee: feeAmount } });
    }

    // ── REJECTED: kirim email notifikasi ke user ──
    if (status === 'rejected' && old_data?.status !== 'rejected') {
      const reason = deposit.adminNote || 'Deposit tidak memenuhi syarat verifikasi.';

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: userEmail,
          subject: '❌ Deposit Ditolak — KriptoAman',
          body: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;">
              <h2 style="color: #f87171; margin: 0 0 16px;">❌ Deposit Ditolak</h2>
              <p>Halo <strong>${userEmail}</strong>,</p>
              <p>Maaf, deposit Anda tidak dapat dikonfirmasi.</p>
              <div style="background: #1e293b; border-radius: 12px; padding: 16px; margin: 20px 0; border-left: 3px solid #f87171;">
                <p style="margin: 4px 0; color: #94a3b8;">Alasan:</p>
                <p style="margin: 4px 0; color: #fca5a5;">${reason}</p>
              </div>
              <p style="color: #94a3b8; font-size: 12px;">Jika ada pertanyaan, silakan hubungi support KriptoAman.</p>
              <p style="color: #64748b; font-size: 11px; margin-top: 24px;">© KriptoAman · Platform kripto terdaftar Bappebti & OJK</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.warn(`[autoConfirmDeposit] Email gagal dikirim ke ${userEmail}:`, emailErr.message);
      }

      console.log(`[autoConfirmDeposit] Deposit rejected for ${userEmail}, reason: ${reason}`);
      return Response.json({ success: true, notified: 'rejected', userEmail });
    }

    return Response.json({ skipped: true, reason: 'Status unchanged or not relevant' });

  } catch (error) {
    if (error.message?.includes('Object not found')) {
      return Response.json({ error: 'Deposit not found' }, { status: 404 });
    }
    console.error('[autoConfirmDeposit] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});