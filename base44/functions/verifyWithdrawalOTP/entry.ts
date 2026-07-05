import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { requestId, otpInput } = await req.json();

    if (!requestId || !otpInput) {
      return Response.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Ambil request
    const requests = await base44.entities.WithdrawalRequest.filter({ id: requestId });
    const request = requests[0];

    if (!request || request.userEmail !== user.email) {
      return Response.json({ error: 'Request tidak ditemukan' }, { status: 404 });
    }

    if (request.status !== 'pending_otp') {
      return Response.json({ error: 'Request sudah diproses atau tidak valid' }, { status: 400 });
    }

    // Cek kadaluarsa
    if (new Date(request.otpExpiry) < new Date()) {
      await base44.entities.WithdrawalRequest.update(request.id, { status: 'expired', otpCode: '' });
      return Response.json({ error: 'Kode OTP sudah kadaluarsa. Silakan ulangi.' }, { status: 400 });
    }

    // Verifikasi OTP via Verihubs API
    const appId = Deno.env.get('VERIHUBS_APP_ID');
    const apiKey = Deno.env.get('VERIHUBS_API_KEY');
    if (!appId || !apiKey) {
      return Response.json({ error: 'Verihubs credentials not configured' }, { status: 500 });
    }

    const challenge = request.otpCode;
    const kycRecords = await base44.entities.KYCVerification.filter(
      { userEmail: user.email, status: 'verified' }, '-created_date', 1
    );
    const phoneNumber = kycRecords[0]?.phoneNumber;

    if (!phoneNumber) {
      return Response.json({ error: 'Nomor telepon tidak ditemukan' }, { status: 400 });
    }

    const verifyResponse = await fetch('https://api.verihubs.com/v2/otp/verify', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'App-ID': appId,
        'API-Key': apiKey,
      },
      body: JSON.stringify({
        msisdn: phoneNumber,
        otp: otpInput.trim(),
        challenge,
      }),
    });

    const verifyResult = await verifyResponse.json();

    if (!verifyResponse.ok) {
      console.error('[verifyWithdrawalOTP] Verihubs verify error:', verifyResponse.status, verifyResult);
      return Response.json({
        error: 'Kode OTP salah atau tidak valid',
        details: verifyResult.message || 'Verification failed'
      }, { status: 400 });
    }

    // OTP valid - update status ke pending (menunggu admin)
    await base44.entities.WithdrawalRequest.update(request.id, {
      status: 'pending',
      otpCode: '', // hapus challenge setelah digunakan
    });

    // Save receipt to Google Drive (fire-and-forget, non-blocking)
    base44.functions.invoke('saveWithdrawalReceiptToDrive', { requestId: request.id }).catch(err => {
      console.error('Failed to save receipt to Drive:', err.message);
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});