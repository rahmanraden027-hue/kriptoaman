import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Generates an HTML receipt and uploads it to Google Drive.
 * Called after OTP verification succeeds.
 * Payload: { requestId }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { requestId } = await req.json();
    if (!requestId) return Response.json({ error: 'requestId diperlukan' }, { status: 400 });

    // Fetch withdrawal request
    const requests = await base44.entities.WithdrawalRequest.filter({ id: requestId });
    const wr = requests[0];
    if (!wr || wr.userEmail !== user.email) {
      return Response.json({ error: 'Request tidak ditemukan' }, { status: 404 });
    }

    // Build HTML receipt
    const now = new Date().toISOString();
    const receiptHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Withdrawal Receipt - ${requestId}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #1e293b; background: #f8fafc; }
    .header { background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 4px 0 0; opacity: 0.85; font-size: 13px; }
    .body { background: white; padding: 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .label { color: #64748b; }
    .value { font-weight: 600; color: #0f172a; }
    .status { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; background: #fef3c7; color: #92400e; }
    .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔐 KriptoAman</h1>
    <p>Bukti Penarikan Aset Kripto</p>
  </div>
  <div class="body">
    <div class="row"><span class="label">Receipt ID</span><span class="value">${requestId}</span></div>
    <div class="row"><span class="label">Tanggal</span><span class="value">${new Date(now).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</span></div>
    <div class="row"><span class="label">Email Pengguna</span><span class="value">${wr.userEmail}</span></div>
    <div class="row"><span class="label">Aset</span><span class="value">${wr.coin}</span></div>
    <div class="row"><span class="label">Jaringan</span><span class="value">${wr.network || '-'}</span></div>
    <div class="row"><span class="label">Jumlah Penarikan</span><span class="value">${wr.amount} ${wr.coin}</span></div>
    <div class="row"><span class="label">Biaya Jaringan</span><span class="value">${wr.fee || 0} ${wr.coin}</span></div>
    <div class="row"><span class="label">Jumlah Bersih</span><span class="value">${wr.netAmount || (wr.amount - (wr.fee || 0))} ${wr.coin}</span></div>
    <div class="row"><span class="label">Alamat Tujuan</span><span class="value" style="word-break:break-all;">${wr.toAddress}</span></div>
    <div class="row"><span class="label">Status</span><span class="value"><span class="status">Menunggu Proses Admin</span></span></div>
  </div>
  <div class="footer">Dokumen ini digenerate otomatis oleh sistem KriptoAman &bull; ${now}</div>
</body>
</html>`;

    // Upload to Google Drive
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    const fileName = `Withdrawal_Receipt_${requestId}_${Date.now()}.html`;

    // Multipart upload: metadata + file content
    const boundary = 'kriptoaman_receipt_boundary';
    const metadata = JSON.stringify({ name: fileName, mimeType: 'text/html' });
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      metadata,
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      '',
      receiptHtml,
      `--${boundary}--`,
    ].join('\r\n');

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('Drive upload error:', errText);
      return Response.json({ error: 'Gagal upload ke Google Drive', detail: errText }, { status: 500 });
    }

    const driveFile = await uploadRes.json();
    console.log('Receipt uploaded to Drive:', driveFile.id, driveFile.webViewLink);

    // Save drive file reference back to the WithdrawalRequest
    await base44.entities.WithdrawalRequest.update(wr.id, {
      adminNote: (wr.adminNote ? wr.adminNote + ' | ' : '') + `DriveReceipt: ${driveFile.webViewLink}`,
    });

    return Response.json({
      success: true,
      driveFileId: driveFile.id,
      driveFileName: driveFile.name,
      driveLink: driveFile.webViewLink,
    });
  } catch (error) {
    console.error('saveWithdrawalReceiptToDrive error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});