import { json, requireBindings, requireSameOrigin } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { getActiveSession } from '../../../../server/auth/sessions.js';
import { getUserById } from '../../../../server/auth/users.js';
import { recordAdminAudit } from '../../../../server/auth/adminAudit.js';

const CAMPAIGN_ID = 'ecosystem-progress-2026-09-03';
const SUBJECT = 'Perkembangan Positif Ekosistem KriptoAman — September 2026';
const CONFIRMATION = 'KIRIM UPDATE SEPTEMBER 2026';
const LOGO_URL = 'https://kriptoaman.com/kriptoaman-logo-primary.png';
const IMAGE_URL = 'https://kriptoaman.com/assets/kriptoaman-ecosystem-progress-september-2026.svg';
const MAX_RECIPIENTS = 100;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMAIL_TEXT = `Halo,

Kami dengan senang hati membagikan perkembangan terbaru Ekosistem KriptoAman. Dalam beberapa waktu terakhir, kami telah mencapai sejumlah kemajuan penting yang memperkuat fondasi teknologi, operasional, jaringan blockchain, dan kesiapan pengembangan KriptoAman untuk tahap pertumbuhan berikutnya.

Beberapa capaian utama saat ini antara lain:

• Platform KriptoAman semakin matang secara operasional. Pemeriksaan production health, website publik, keamanan dasar, status sistem, database, login, serta pemulihan kata sandi telah berjalan dengan baik dalam pengujian produksi terbaru.

• Infrastruktur market intelligence semakin kuat. Mekanisme market snapshot, freshness monitoring, database market, serta sinkronisasi status publik telah diperkuat agar ketersediaan data tetap terjaga dan lebih konsisten.

• KAM Mainnet terus menunjukkan perkembangan positif. Jaringan menggunakan Chain ID 22028 (0x560c), dengan RPC publik, explorer, block progression, serta monitoring 24/7 yang sudah tersedia sebagai bagian dari infrastruktur jaringan.

• Identitas KAM Mainnet semakin dikenal di ekosistem Web3. Metadata KriptoAman Mainnet telah diterima dan digabungkan ke registry ethereum-lists/chains, memperkuat fondasi interoperabilitas dan pengenalan jaringan dalam tooling EVM.

• Sistem monitoring dan quality gate semakin lengkap. KriptoAman kini memiliki berbagai pemeriksaan otomatis untuk production health, live-site smoke, authentication, access resilience, market freshness, KAM promotion gate, serta evidence monitoring.

• Penguatan identitas perusahaan dan ekosistem digital terus dilakukan. Kehadiran PT Kripto Aman Indonesia, halaman legal, dokumentasi jaringan, research, sitemap, dan struktur SEO terus diperkuat agar informasi publik semakin mudah ditemukan dan diverifikasi.

• KriptoAman terus bergerak menuju fase distribusi dan adopsi yang lebih luas. Fokus berikutnya mencakup penguatan integrasi wallet, registry eksternal, distribusi aplikasi, kesiapan listing, peningkatan pengalaman pengguna, serta perluasan jangkauan internasional secara bertahap dan terukur.

Kami memandang seluruh kemajuan ini sebagai bagian dari perjalanan jangka panjang untuk membangun ekosistem blockchain dan financial intelligence yang aman, transparan, modern, mudah digunakan, dan berorientasi pada kebutuhan pengguna global.

Terima kasih telah menjadi bagian dari perjalanan KriptoAman. Kami akan terus menjaga kualitas, memperkuat teknologi, dan menghadirkan perkembangan yang semakin berarti bagi seluruh pengguna dan komunitas.

Salam,

Raden Abdul Rahman

Founder & CEO KriptoAman

PT Kripto Aman Indonesia

KriptoAman.com`;

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
    if (line === 'Raden Abdul Rahman') return `<p style="margin:0;color:#ffffff;font-weight:700;font-size:15px">${safe}</p>`;
    if (line === 'Founder & CEO KriptoAman' || line === 'PT Kripto Aman Indonesia' || line === 'KriptoAman.com') {
      return `<p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.6">${safe}</p>`;
    }
    return `<p style="margin:0;color:#dbeafe;font-size:15px;line-height:1.7">${safe}</p>`;
  }).join('');

  return `<!doctype html><html><body style="margin:0;padding:0;background:#071225;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#071225;padding:28px 12px"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:760px;background:#0b1930;border:1px solid #1e3a5f;border-radius:18px;overflow:hidden">
      <tr><td align="center" style="padding:24px 24px 18px;background:#061328;border-bottom:1px solid #16304d">
        <img src="${LOGO_URL}" alt="KriptoAman" width="196" style="display:block;width:196px;max-width:72%;height:auto;border:0;margin:0 auto 8px" />
        <div style="font-size:11px;line-height:1.4;letter-spacing:1.4px;text-transform:uppercase;color:#7dd3fc;font-weight:700">Official Ecosystem Update</div>
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
        { name: 'campaign', value: 'ecosystem_progress_sep2026' },
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
