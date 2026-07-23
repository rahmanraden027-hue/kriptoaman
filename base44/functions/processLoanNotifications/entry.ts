import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { loanId, type, userEmail, message } = await req.json();

    if (!loanId || !type || !userEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (user.role !== 'admin' && user.email !== userEmail) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Notifikasi mapping
    const notificationMap = {
      loan_request: {
        title: 'Permintaan Pinjaman Baru',
        message: message || 'Anda menerima permintaan pinjaman baru'
      },
      loan_accepted: {
        title: 'Pinjaman Diterima',
        message: message || 'Permintaan pinjaman Anda telah diterima'
      },
      loan_disbursed: {
        title: 'Dana Telah Dicairkan',
        message: message || 'Dana pinjaman telah masuk ke akun Anda'
      },
      payment_received: {
        title: 'Pembayaran Diterima',
        message: message || 'Pembayaran cicilan telah diterima'
      },
      payment_due_soon: {
        title: 'Reminder Pembayaran',
        message: message || 'Pembayaran cicilan Anda akan jatuh tempo dalam 3 hari'
      },
      payment_overdue: {
        title: 'Pembayaran Terlambat',
        message: message || 'Pembayaran cicilan Anda sudah terlambat'
      },
      loan_completed: {
        title: 'Pinjaman Selesai',
        message: message || 'Pinjaman Anda telah lunas'
      },
      default_warning: {
        title: 'Peringatan Default',
        message: message || 'Risiko default pinjaman Anda tinggi'
      }
    };

    const notifTemplate = notificationMap[type] || { title: 'Notifikasi Pinjaman', message };

    // Create notification
    const notification = await base44.asServiceRole.entities.LoanNotification.create({
      userEmail,
      type,
      loanId,
      title: notifTemplate.title,
      message: notifTemplate.message,
      actionRequired: ['loan_request', 'payment_overdue', 'default_warning'].includes(type),
      sentAt: new Date().toISOString()
    });

    return Response.json({ success: true, notificationId: notification.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});