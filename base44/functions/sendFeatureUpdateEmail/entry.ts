import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const payload = await req.json();
    const { featureTitle, featureDescription, featureLink } = payload;

    if (!featureTitle || !featureLink) {
      return Response.json({ error: 'featureTitle dan featureLink wajib diisi' }, { status: 400 });
    }

    // Ambil semua user
    const users = await base44.asServiceRole.entities.User.list();
    const allUsers = [];
    let hasMore = users.has_more !== false;
    let skip = users.data?.length || 0;
    allUsers.push(...(users.data || []));
    while (hasMore) {
      const next = await base44.asServiceRole.entities.User.list('-created_date', 100, skip);
      allUsers.push(...(next.data || []));
      hasMore = next.has_more === true;
      skip += next.data?.length || 0;
    }

    const recipients = allUsers.filter(u => u.email);
    const results = [];

    for (const recipient of recipients) {
      const name = recipient.full_name || 'Pengguna';
      const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #38bdf8; font-size: 24px; margin: 0;">🛡️ KriptoAman</h1>
  </div>
  <h2 style="color: #34d399; font-size: 20px;">✨ Fitur Baru Tersedia!</h2>
  <p style="color: #94a3b8;">Halo <strong style="color: #e2e8f0;">${name}</strong>,</p>
  <p style="color: #94a3b8;">Kami telah merilis pembaruan fitur terbaru di KriptoAman:</p>
  <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0;">
    <h3 style="margin: 0 0 12px; color: #38bdf8; font-size: 18px;">${featureTitle}</h3>
    ${featureDescription ? `<p style="margin: 0; color: #94a3b8;">${featureDescription}</p>` : ''}
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <a href="${featureLink}" style="background: #2563eb; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block;">Lihat Fitur Sekarang →</a>
  </div>
  <p style="color: #94a3b8;">Segera coba fitur terbaru ini dan rasakan pengalaman bertransaksi kripto yang lebih aman dan cepat.</p>
  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1e293b; text-align: center; color: #475569; font-size: 12px;">
    <p>© 2025 KriptoAman · Platform Kripto Terpercaya Indonesia</p>
  </div>
</div>
      `.trim();

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: recipient.email,
          subject: `✨ ${featureTitle} — Pembaruan Fitur KriptoAman`,
          body: htmlBody,
          from_name: 'KriptoAman'
        });
        results.push({ email: recipient.email, status: 'sent' });
      } catch (err) {
        console.error(`Failed to send to ${recipient.email}:`, err.message);
        results.push({ email: recipient.email, status: 'failed', error: err.message });
      }
    }

    const sentCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    return Response.json({
      success: true,
      totalRecipients: recipients.length,
      sent: sentCount,
      failed: failedCount,
      results
    });
  } catch (error) {
    console.error('sendFeatureUpdateEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});