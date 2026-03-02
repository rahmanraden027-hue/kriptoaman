import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    // Verifikasi OTP
    if (request.otpCode !== otpInput.trim()) {
      return Response.json({ error: 'Kode OTP salah' }, { status: 400 });
    }

    // OTP valid - update status ke pending (menunggu admin)
    await base44.entities.WithdrawalRequest.update(request.id, {
      status: 'pending',
      otpCode: '', // hapus OTP setelah digunakan
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});