import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { coin, network, toAddress, amount, fee, netAmount } = await req.json();

    if (!coin || !toAddress || !amount) {
      return Response.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 menit

    // Hapus request pending_otp sebelumnya jika ada
    const existing = await base44.entities.WithdrawalRequest.filter({
      userEmail: user.email,
      status: 'pending_otp'
    });
    for (const r of existing) {
      await base44.entities.WithdrawalRequest.delete(r.id);
    }

    // Buat draft withdrawal dengan OTP
    const request = await base44.entities.WithdrawalRequest.create({
      userEmail: user.email,
      coin,
      network,
      toAddress,
      amount,
      fee,
      netAmount,
      otpCode: otp,
      otpExpiry,
      status: 'pending_otp',
    });

    // Kirim OTP via email
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `[CoinVault] Kode OTP Penarikan ${coin} - ${otp}`,
      body: `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0f172a;color:#f8fafc;padding:32px;border-radius:16px">
  <h2 style="color:#60a5fa;margin-bottom:4px">🔐 Konfirmasi Penarikan</h2>
  <p style="color:#94a3b8;font-size:14px;margin-bottom:24px">CoinVault Security</p>

  <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;margin-bottom:24px">
    <p style="color:#94a3b8;font-size:12px;margin:0 0 4px">Detail Penarikan</p>
    <p style="color:#f8fafc;font-size:14px;margin:4px 0"><strong>Aset:</strong> ${amount} ${coin}</p>
    <p style="color:#f8fafc;font-size:14px;margin:4px 0"><strong>Tujuan:</strong> ${toAddress.slice(0,16)}...${toAddress.slice(-6)}</p>
    <p style="color:#f8fafc;font-size:14px;margin:4px 0"><strong>Jaringan:</strong> ${network || '-'}</p>
  </div>

  <p style="color:#94a3b8;font-size:14px;margin-bottom:8px">Kode OTP Anda:</p>
  <div style="text-align:center;background:#1d4ed8;border-radius:12px;padding:20px;letter-spacing:12px;font-size:32px;font-weight:bold;color:#ffffff;margin-bottom:16px">
    ${otp}
  </div>

  <p style="color:#ef4444;font-size:12px;text-align:center">⏱ Berlaku 10 menit. Jangan bagikan kode ini kepada siapapun.</p>
  <p style="color:#475569;font-size:11px;text-align:center;margin-top:16px">Jika Anda tidak melakukan permintaan ini, abaikan email ini.</p>
</div>
      `.trim(),
    });

    return Response.json({ success: true, requestId: request.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});