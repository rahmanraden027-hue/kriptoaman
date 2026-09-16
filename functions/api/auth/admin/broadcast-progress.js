import { json, requireBindings, requireSameOrigin } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { getActiveSession } from '../../../../server/auth/sessions.js';
import { getUserById } from '../../../../server/auth/users.js';
import { recordAdminAudit } from '../../../../server/auth/adminAudit.js';

const CAMPAIGN_ID = 'global-expansion-2026-09-16';
const SUBJECT = 'KriptoAman Memasuki Fase Ekspansi Global — 16 September 2026';
const CONFIRMATION = 'KIRIM UPDATE EKSPANSI GLOBAL 16 SEPTEMBER 2026';
const LOGO_URL = 'https://kriptoaman.com/kriptoaman-logo-primary.png';
const IMAGE_URL = 'https://kriptoaman.com/assets/kriptoaman-ecosystem-progress-september-2026.svg';
const MAX_RECIPIENTS = 100;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMAIL_TEXT = `Yth. Pengguna KriptoAman,

Dengan semangat besar dan penuh optimisme, kami menyampaikan perkembangan terbaru KriptoAman. Kami terus bergerak maju dengan arah yang semakin kuat: membangun KriptoAman sebagai platform informasi, intelijen pasar, dan analisis aset digital yang modern, aman, luas, dan siap berkembang secara internasional.

Berdasarkan data internal yang disampaikan untuk materi komunikasi ini, KriptoAman mencatat lebih dari 2.000 akun terdaftar lintas kanal serta 78.542 calon pengguna dalam daftar tunggu dari berbagai negara di dunia. Angka tersebut masih memerlukan rekonsiliasi dan verifikasi terhadap sumber data produksi sebelum dipublikasikan sebagai data pengguna terverifikasi.

Memasuki fase pengembangan berikutnya, KriptoAman menyiapkan roadmap ekspansi bertahap ke 25 negara. Langkah ini dirancang untuk memperluas jangkauan layanan, meningkatkan kesiapan multi-bahasa, memperkuat akses terhadap informasi pasar global, serta membangun fondasi produk yang dapat digunakan oleh komunitas internasional.

Kami juga sedang memperluas cakupan Market Intelligence KriptoAman. Selain aset kripto, platform akan dikembangkan untuk mencakup data dan analisis Forex serta berbagai kelas aset global. Arah pengembangan multi-asset ini mencakup pasangan mata uang utama dunia, emas dan logam mulia, komoditas, indeks pasar, serta aset global lainnya secara bertahap sesuai kesiapan data, integrasi, dan kepatuhan yang berlaku.

Visi kami jelas: KriptoAman tidak berhenti sebagai platform pemantauan kripto. Kami sedang membangun fondasi ekosistem intelijen pasar global yang menghubungkan teknologi blockchain, data pasar real-time, analisis multi-aset, keamanan, dan pengalaman pengguna dalam satu platform yang semakin terpadu.

Sejumlah kemajuan penting terus berjalan, termasuk peningkatan dashboard administrasi, verifikasi data pengguna, penyempurnaan infrastruktur produksi, penguatan keamanan, pengembangan aplikasi Android, perluasan Market Intelligence, serta peningkatan kesiapan ekosistem jaringan KriptoAman.

Kami antusias menyambut fase berikutnya. Setiap peningkatan yang dilakukan hari ini merupakan bagian dari langkah yang lebih besar untuk membawa KriptoAman menuju skala internasional dengan standar yang semakin tinggi, lebih profesional, lebih kuat, dan lebih siap menghadapi kebutuhan pasar global.

Terima kasih telah menjadi bagian dari perjalanan KriptoAman. Dukungan dan kepercayaan Anda menjadi bagian penting dari pertumbuhan ekosistem ini.

KriptoAman — Global by Design. Built for the Future.

Hormat kami,

PT KRIPTO AMAN INDONESIA

KriptoAman

https://kriptoaman.com

Catatan: Ekspansi 25 negara dan penambahan cakupan Forex/multi-asset merupakan roadmap pengembangan bertahap dan akan diterapkan sesuai kesiapan teknis, data, operasional, serta ketentuan yang berlaku.`;

async function requireAdmin(request, env) {
  const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
  if (!session?.sub || !session?.sid) return null;
  const activeSession = await getActiveSession(env.AUTH_DB, session.sid, session.sub);
  if (!activeSession) return null;
  const user = await getUserById(env.AUTH_DB, session.sub);
  if (!user || user.role !== 'admin') return null;
  return user;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildHtml() {
  const lines = EMAIL_TEXT.split('\n');
  const rendered = lines.map((line) => {
    const safe = escapeHtml(line);
    if (!line) return '<div style="height:14px;line-height:14px">&nbsp;</div>';
    if (line.startsWith('• ')) {
      return `<p style="margin:0 0 14px;color:#dbeafe;font-size:15px;line-height:1.7"><span style="color:#38bdf8;font-weight:700">•</span> ${safe.slice(2)}</p>`;
    }
    if (line === 'PT KRIPTO AMAN INDONESIA') return `<p style="margin:0;color:#ffffff;font-weight:700;font-size:15px">${safe}</p>`;
    if (line === 'KriptoAman' || line === 'https://kriptoaman.com') {
      return `<p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.6">${safe}</p>`;
    }
    return `<p style="margin:0;color:#dbeafe;font-size:15px;line-height:1.7">${safe}</p>`;
  }).join('');

  return `<!doctype html><html><body style="margin:0;padding:0;background:#071225;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#071225;padding:28px 12px"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:760px;background:#0b1930;border:1px solid #1e3a5f;border-radius:18px;overflow:hidden">
      <tr><td align="center" style="padding:24px 24px 18px;background:#061328;border-bottom:1px solid #16304d">
        <img src="${LOGO_URL}" alt="KriptoAman" width="196" style="display:block;width:196px;max-width:72%;height:auto;border:0;margin:0 auto 8px" />
        <div style="font-size:11px;line-height:1.4;letter-spacing:1.4px;text-transform:uppercase;color:#7dd3fc;font-weight:700">Official Global Expansion Update</div>
      </td></tr>
      <tr><td style="padding:0;background:#08172c">
        <img src="${IMAGE_URL}" alt="Kemajuan Positif Ekosistem KriptoAman" width="760" style="display:block;width:100%;max-width:760px;height:auto;border:0" />
      </td></tr>
      <tr><td style="padding:30px 30px 34px">${rendered}</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

async function getCampaignAudit(db) {
  return db.prepare(`
    SELECT created_at, metadata_json
    FROM auth_admin_audit
    WHERE action = 'broadcast.progress.sent'
      AND target_type = 'broadcast'
      AND target_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(CAMPAIGN_ID).first();
}

async function getRecipientCount(db) {
  const row = await db.prepare(`
    SELECT COUNT(DISTINCT LOWER(TRIM(email))) AS count
    FROM auth_users
    WHERE email_verified = 1
      AND email IS NOT NULL
      AND LENGTH(TRIM(email)) > 3
  `).first();
  return Number(row?.count || 0);
}

export async function onRequestGet({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    await ensureAuthSchema(env.AUTH_DB);
    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: 'Admin access required' }, { status: 403 });

    const [recipientCount, previous] = await Promise.all([
      getRecipientCount(env.AUTH_DB),
      getCampaignAudit(env.AUTH_DB),
    ]);

    return json({
      campaignId: CAMPAIGN_ID,
      subject: SUBJECT,
      recipientCount,
      maxRecipients: MAX_RECIPIENTS,
      alreadySent: Boolean(previous),
      sentAt: previous?.created_at || null,
      logoUrl: LOGO_URL,
      imageUrl: IMAGE_URL,
    });
  } catch (error) {
    console.error('Admin progress broadcast preview failed', error);
    return json({ error: 'Broadcast preview unavailable' }, { status: 503 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET', 'RESEND_API_KEY', 'AUTH_EMAIL_FROM']);
    requireSameOrigin(request, env);
    await ensureAuthSchema(env.AUTH_DB);

    const admin = await requireAdmin(request, env);
    if (!admin) return json({ error: 'Admin access required' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    if (String(body?.confirmation || '') !== CONFIRMATION) {
      return json({ error: 'Broadcast confirmation required' }, { status: 400 });
    }

    const previous = await getCampaignAudit(env.AUTH_DB);
    if (previous) {
      return json({
        error: 'Campaign already sent',
        campaignId: CAMPAIGN_ID,
        sentAt: previous.created_at,
      }, { status: 409 });
    }

    const rows = await env.AUTH_DB.prepare(`
      SELECT LOWER(TRIM(email)) AS email
      FROM auth_users
      WHERE email_verified = 1
        AND email IS NOT NULL
        AND LENGTH(TRIM(email)) > 3
      GROUP BY LOWER(TRIM(email))
      ORDER BY email ASC
    `).all();

    const recipients = (rows.results || [])
      .map((row) => String(row.email || '').trim().toLowerCase())
      .filter((email) => EMAIL_RE.test(email));

    if (!recipients.length) return json({ error: 'No verified recipients available' }, { status: 409 });
    if (recipients.length > MAX_RECIPIENTS) {
      return json({
        error: 'Recipient count exceeds guarded campaign limit',
        recipientCount: recipients.length,
        maxRecipients: MAX_RECIPIENTS,
      }, { status: 409 });
    }

    const html = buildHtml();
    const payload = recipients.map((email) => ({
      from: env.AUTH_EMAIL_FROM,
      to: [email],
      subject: SUBJECT,
      html,
      text: EMAIL_TEXT,
      tags: [
        { name: 'category', value: 'product_update' },
        { name: 'campaign', value: 'global_expansion_20260916' },
      ],
    }));

    const response = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `broadcast-${CAMPAIGN_ID}`,
      },
      body: JSON.stringify(payload),
    });

    const providerPayload = await response.json().catch(() => null);
    if (!response.ok) {
      const providerMessage = providerPayload?.message || providerPayload?.error?.message || `Resend batch failed with status ${response.status}`;
      console.error('Admin progress broadcast provider failure', {
        status: response.status,
        message: providerMessage,
        recipientCount: recipients.length,
      });
      return json({ error: 'Broadcast delivery unavailable' }, { status: 503 });
    }

    const acceptedCount = Array.isArray(providerPayload?.data) ? providerPayload.data.length : recipients.length;

    await recordAdminAudit(env.AUTH_DB, request, admin, 'broadcast.progress.sent', {
      targetType: 'broadcast',
      targetId: CAMPAIGN_ID,
      metadata: {
        subject: SUBJECT,
        recipientCount: recipients.length,
        acceptedCount,
        logoUrl: LOGO_URL,
        imageUrl: IMAGE_URL,
      },
    });

    return json({
      sent: true,
      campaignId: CAMPAIGN_ID,
      subject: SUBJECT,
      recipientCount: recipients.length,
      acceptedCount,
    });
  } catch (error) {
    console.error('Admin progress broadcast failed', {
      name: error?.name,
      message: error?.message,
      status: error?.status,
    });
    return json({ error: 'Broadcast service unavailable' }, { status: 503 });
  }
}
