import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const EMAIL_TEMPLATES = {
  pending: {
    subject: '⏳ KYC Anda Sedang Diproses — KriptoAman',
    body: (name) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #38bdf8; font-size: 24px; margin: 0;">🛡️ KriptoAman</h1>
  </div>
  <h2 style="color: #fbbf24; font-size: 20px;">Verifikasi KYC Sedang Diproses</h2>
  <p style="color: #94a3b8;">Halo <strong style="color: #e2e8f0;">${name}</strong>,</p>
  <p style="color: #94a3b8;">Kami telah menerima dokumen verifikasi identitas (KYC) Anda. Tim kami sedang melakukan pengecekan dan verifikasi data Anda.</p>
  <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0;">
    <p style="margin: 0; color: #fbbf24; font-weight: bold;">⏱️ Estimasi Waktu</p>
    <p style="margin: 8px 0 0; color: #94a3b8;">Proses verifikasi membutuhkan waktu <strong style="color: #e2e8f0;">1×24 jam kerja</strong>. Anda akan mendapat notifikasi email begitu proses selesai.</p>
  </div>
  <p style="color: #94a3b8;">Jika ada pertanyaan, silakan hubungi <a href="mailto:support@kriptoaman.com" style="color: #38bdf8;">support@kriptoaman.com</a></p>
  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1e293b; text-align: center; color: #475569; font-size: 12px;">
    <p>© 2025 KriptoAman · Platform Kripto Terpercaya Indonesia</p>
  </div>
</div>
    `.trim()
  },
  approved: {
    subject: '🎉 KYC Anda Telah Diverifikasi — KriptoAman',
    body: (name) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #38bdf8; font-size: 24px; margin: 0;">🛡️ KriptoAman</h1>
  </div>
  <h2 style="color: #34d399; font-size: 20px;">🎉 Selamat! KYC Anda Berhasil Diverifikasi</h2>
  <p style="color: #94a3b8;">Halo <strong style="color: #e2e8f0;">${name}</strong>,</p>
  <p style="color: #94a3b8;">Identitas Anda telah berhasil diverifikasi oleh tim KriptoAman. Akun Anda kini memiliki akses <strong style="color: #34d399;">Level 2 — Full Access</strong>.</p>
  <div style="background: #064e3b; border: 1px solid #065f46; border-radius: 12px; padding: 20px; margin: 24px 0;">
    <p style="margin: 0; color: #34d399; font-weight: bold;">✅ Fitur yang Kini Aktif:</p>
    <ul style="color: #94a3b8; margin: 12px 0 0; padding-left: 20px; line-height: 1.8;">
      <li>Deposit & Withdraw hingga Rp 500 juta/hari</li>
      <li>Semua metode pembayaran (Bank, QRIS, e-wallet)</li>
      <li>Akses P2P Lending</li>
      <li>Perlindungan identitas & anti-fraud aktif</li>
    </ul>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="https://kriptoaman.com" style="background: #2563eb; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block;">Buka Wallet Sekarang →</a>
  </div>
  <p style="color: #94a3b8;">Terima kasih telah mempercayakan verifikasi Anda kepada KriptoAman.</p>
  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1e293b; text-align: center; color: #475569; font-size: 12px;">
    <p>© 2025 KriptoAman · Platform Kripto Terpercaya Indonesia</p>
  </div>
</div>
    `.trim()
  },
  rejected: {
    subject: '❌ KYC Anda Memerlukan Perbaikan — KriptoAman',
    body: (name) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #38bdf8; font-size: 24px; margin: 0;">🛡️ KriptoAman</h1>
  </div>
  <h2 style="color: #f87171; font-size: 20px;">Verifikasi KYC Memerlukan Perbaikan</h2>
  <p style="color: #94a3b8;">Halo <strong style="color: #e2e8f0;">${name}</strong>,</p>
  <p style="color: #94a3b8;">Mohon maaf, verifikasi KYC Anda belum dapat kami proses. Dokumen yang Anda kirimkan memerlukan perbaikan.</p>
  <div style="background: #450a0a; border: 1px solid #7f1d1d; border-radius: 12px; padding: 20px; margin: 24px 0;">
    <p style="margin: 0; color: #f87171; font-weight: bold;">📋 Kemungkinan Penyebab:</p>
    <ul style="color: #94a3b8; margin: 12px 0 0; padding-left: 20px; line-height: 1.8;">
      <li>Foto KTP/dokumen buram atau tidak jelas</li>
      <li>Data yang diisi tidak sesuai dengan dokumen</li>
      <li>Foto selfie tidak memenuhi syarat</li>
      <li>Dokumen tidak valid atau sudah kadaluarsa</li>
    </ul>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="https://kriptoaman.com/kyc" style="background: #dc2626; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block;">Ajukan KYC Ulang →</a>
  </div>
  <p style="color: #94a3b8;">Jika ada pertanyaan, silakan hubungi <a href="mailto:support@kriptoaman.com" style="color: #38bdf8;">support@kriptoaman.com</a></p>
  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1e293b; text-align: center; color: #475569; font-size: 12px;">
    <p>© 2025 KriptoAman · Platform Kripto Terpercaya Indonesia</p>
  </div>
</div>
    `.trim()
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Called from entity automation (User update)
    const { event, data, old_data } = payload;

    if (!data || !old_data) {
      return Response.json({ skipped: true, reason: 'No data or old_data' });
    }

    const newStatus = data.kycStatus;
    const oldStatus = old_data.kycStatus;

    // Only send email if kycStatus actually changed
    if (newStatus === oldStatus || !newStatus || newStatus === 'none') {
      return Response.json({ skipped: true, reason: 'KYC status unchanged or not relevant' });
    }

    const template = EMAIL_TEMPLATES[newStatus];
    if (!template) {
      return Response.json({ skipped: true, reason: `No template for status: ${newStatus}` });
    }

    const userEmail = data.email;
    const userName = data.full_name || 'Pengguna';

    if (!userEmail) {
      return Response.json({ skipped: true, reason: 'No email found' });
    }

    console.log(`Sending KYC email to ${userEmail}, status: ${oldStatus} → ${newStatus}`);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: userEmail,
      subject: template.subject,
      body: template.body(userName),
      from_name: 'KriptoAman'
    });

    console.log(`KYC email sent successfully to ${userEmail}`);
    return Response.json({ success: true, email: userEmail, status: newStatus });

  } catch (error) {
    console.error('sendKYCStatusEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});