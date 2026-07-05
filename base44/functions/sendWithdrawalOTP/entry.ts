import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { coin, network, toAddress, amount, fee, netAmount } = await req.json();

    if (!coin || !toAddress || !amount) {
      return Response.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // =============================================
    // GATE KYC: Cek status verifikasi sebelum OTP
    // =============================================
    const kycRecords = await base44.entities.KYCVerification.filter(
      { userEmail: user.email, status: 'verified' }, '-created_date', 1
    );

    if (kycRecords.length === 0) {
      // Cek apakah ada yang pending
      const pendingKyc = await base44.entities.KYCVerification.filter(
        { userEmail: user.email, status: 'pending' }, '-created_date', 1
      );
      if (pendingKyc.length > 0) {
        return Response.json({
          error: 'KYC_PENDING',
          message: 'Verifikasi KYC Anda masih dalam proses (1×24 jam). Withdrawal akan diaktifkan setelah KYC disetujui.'
        }, { status: 403 });
      }
      return Response.json({
        error: 'KYC_REQUIRED',
        message: 'Verifikasi KYC diperlukan sebelum melakukan withdrawal. Selesaikan KYC terlebih dahulu.'
      }, { status: 403 });
    }

    const kyc = kycRecords[0];

    // Cek daily withdrawal limit
    const dailyLimit = kyc.verificationLevel === 'advanced' ? 100000 : 50000;
    const todayWithdrawals = await base44.entities.WithdrawalRequest.filter({
      userEmail: user.email,
      status: 'completed',
    });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayTotal = todayWithdrawals
      .filter(w => new Date(w.created_date) >= today)
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    if (todayTotal + amount > dailyLimit) {
      return Response.json({
        error: 'DAILY_LIMIT_EXCEEDED',
        message: `Limit penarikan harian Anda $${dailyLimit.toLocaleString()} (sudah digunakan $${todayTotal.toFixed(2)}).`
      }, { status: 400 });
    }

    // Ambil nomor telepon dari KYC
    const phoneNumber = kyc.phoneNumber;
    if (!phoneNumber) {
      return Response.json({
        error: 'PHONE_REQUIRED',
        message: 'Nomor telepon belum terdaftar di KYC. Hubungi support untuk memperbarui nomor telepon.'
      }, { status: 400 });
    }

    const appId = Deno.env.get('VERIHUBS_APP_ID');
    const apiKey = Deno.env.get('VERIHUBS_API_KEY');
    if (!appId || !apiKey) {
      return Response.json({ error: 'Verihubs credentials not configured' }, { status: 500 });
    }

    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const challenge = `withdrawal-${user.id}-${Date.now()}`;

    // Hapus request pending_otp sebelumnya
    const existing = await base44.entities.WithdrawalRequest.filter({
      userEmail: user.email,
      status: 'pending_otp'
    });
    for (const r of existing) {
      await base44.entities.WithdrawalRequest.delete(r.id);
    }

    // Buat draft withdrawal dengan challenge Verihubs
    const request = await base44.entities.WithdrawalRequest.create({
      userEmail: user.email,
      coin,
      network,
      toAddress,
      amount,
      fee,
      netAmount,
      otpCode: challenge,
      otpExpiry,
      status: 'pending_otp',
    });

    // Kirim OTP via Verihubs SMS
    const otpResponse = await fetch('https://api.verihubs.com/v2/otp/send', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'App-ID': appId,
        'API-Key': apiKey,
      },
      body: JSON.stringify({
        msisdn: phoneNumber,
        template: 'KriptoAman: Kode OTP penarikan Anda adalah $OTP. Jangan bagikan kode ini. Berlaku 5 menit.',
        time_limit: '300',
        challenge,
      }),
    });

    const otpResult = await otpResponse.json();

    if (!otpResponse.ok) {
      console.error('[sendWithdrawalOTP] Verihubs SMS error:', otpResponse.status, otpResult);
      // Fallback ke email jika SMS gagal
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `[KriptoAman] Kode OTP Penarikan ${coin}`,
        body: `<p>Permintaan OTP via SMS gagal. Silakan coba lagi atau hubungi support.</p><p>Error: ${otpResult.message || 'Unknown'}</p>`,
      });
      await base44.entities.WithdrawalRequest.delete(request.id);
      return Response.json({
        error: 'SMS_OTP_FAILED',
        message: otpResult.message || 'Gagal mengirim OTP via SMS. Silakan coba lagi.'
      }, { status: 502 });
    }

    console.log(`[sendWithdrawalOTP] SMS OTP sent to ${phoneNumber} — KYC level: ${kyc.verificationLevel}`);
    return Response.json({ success: true, requestId: request.id, kycLevel: kyc.verificationLevel });
  } catch (error) {
    console.error('[sendWithdrawalOTP] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});