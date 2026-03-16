import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Generates an HTML receipt and uploads it to a dedicated
 * "KriptoAman - Withdrawal Receipts" folder in Google Drive.
 * Saves driveReceiptFileId, driveReceiptLink, driveReceiptSavedAt
 * directly on the WithdrawalRequest record.
 * Payload: { requestId }
 */

const DRIVE_FOLDER_NAME = 'KriptoAman - Withdrawal Receipts';

async function getOrCreateFolder(accessToken) {
  // Search for existing folder created by this app
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D%27${encodeURIComponent(DRIVE_FOLDER_NAME)}%27+and+mimeType%3D%27application%2Fvnd.google-apps.folder%27+and+trashed%3Dfalse&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: DRIVE_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  const folder = await createRes.json();
  console.log('Created Drive folder:', folder.id);
  return folder.id;
}

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

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // Get or create dedicated folder
    const folderId = await getOrCreateFolder(accessToken);

    const fileName = `Withdrawal_Receipt_${requestId}_${Date.now()}.html`;
    const boundary = 'kriptoaman_receipt_boundary';
    const metadata = JSON.stringify({
      name: fileName,
      mimeType: 'text/html',
      parents: [folderId],
    });
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
    console.log('Receipt uploaded to Drive folder:', folderId, '| file:', driveFile.id, driveFile.webViewLink);

    // Save dedicated fields on the WithdrawalRequest record
    await base44.entities.WithdrawalRequest.update(wr.id, {
      driveReceiptFileId: driveFile.id,
      driveReceiptLink: driveFile.webViewLink,
      driveReceiptSavedAt: now,
    });

    return Response.json({
      success: true,
      driveFileId: driveFile.id,
      driveFileName: driveFile.name,
      driveLink: driveFile.webViewLink,
      folderId,
    });
  } catch (error) {
    console.error('saveWithdrawalReceiptToDrive error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});