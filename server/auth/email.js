import { requireBindings } from './http.js';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function send(env, { to, subject, html, text, idempotencyKey }) {
  requireBindings(env, ['RESEND_API_KEY', 'AUTH_EMAIL_FROM']);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ from: env.AUTH_EMAIL_FROM, to: [to], subject, html, text }),
  });
  if (!response.ok) throw new Error(`Email delivery failed with status ${response.status}`);
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
