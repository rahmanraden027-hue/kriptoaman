import { requireBindings } from './http.js';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function send(env, { to, subject, html, text, idempotencyKey }) {
  requireBindings(env, ['RESEND_API_KEY', 'AUTH_EMAIL_FROM']);

  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({ from: env.AUTH_EMAIL_FROM, to: [to], subject, html, text }),
      });

      if (response.ok) {
        const payload = await response.json().catch(() => null);
        return { accepted: true, id: payload?.id || null };
      }

      const payload = await response.json().catch(() => null);
      const error = new Error(payload?.message || `Email delivery failed with status ${response.status}`);
      error.status = response.status;
      error.provider = 'resend';
      lastError = error;

      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === 2) throw error;
      await sleep(700);
    } catch (error) {
      lastError = error;
      const retryableNetworkError = !error?.status;
      if (!retryableNetworkError || attempt === 2) throw error;
      await sleep(700);
    }
  }

  throw lastError || new Error('Email delivery failed');
}

export function sendVerificationEmail(env, email, otp) {
  const safeOtp = escapeHtml(otp);
  return send(env, {
    to: email,
    subject: 'Kode verifikasi KriptoAman',
    html: `<p>Kode verifikasi KriptoAman Anda:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${safeOtp}</p><p>Kode berlaku 10 menit. Abaikan email ini jika Anda tidak membuat akun.</p>`,
    text: `Kode verifikasi KriptoAman Anda: ${otp}. Kode berlaku 10 menit.`,
    idempotencyKey: `verify-${crypto.randomUUID()}`,
  });
}

export function sendPasswordResetEmail(env, email, resetUrl) {
  const safeUrl = escapeHtml(resetUrl);
  return send(env, {
    to: email,
    subject: 'Reset password KriptoAman',
    html: `<p>Kami menerima permintaan reset password KriptoAman.</p><p><a href="${safeUrl}">Reset password</a></p><p>Tautan berlaku 30 menit. Abaikan email ini jika Anda tidak meminta reset.</p>`,
    text: `Reset password KriptoAman: ${resetUrl}\nTautan berlaku 30 menit.`,
    idempotencyKey: `reset-${crypto.randomUUID()}`,
  });
}

export function sendAdminMagicLinkEmail(env, email, loginUrl) {
  const safeUrl = escapeHtml(loginUrl);
  return send(env, {
    to: email,
    subject: 'Tautan masuk admin KriptoAman',
    html: '<p>Gunakan tautan berikut untuk masuk ke panel admin KriptoAman tanpa kata sandi:</p><p><a href="' + safeUrl + '">Masuk sebagai admin</a></p><p>Tautan hanya dapat digunakan sekali dan berlaku 5 menit. Abaikan email ini jika Anda tidak memintanya.</p>',
    text: 'Masuk sebagai admin KriptoAman: ' + loginUrl + '\nTautan berlaku 5 menit dan hanya dapat digunakan sekali.',
    idempotencyKey: 'admin-login-' + crypto.randomUUID(),
  });
}
