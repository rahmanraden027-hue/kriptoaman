import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get Google Sheets access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Fetch all users
    const users = await base44.asServiceRole.entities.User.list('-created_date', 500);

    // Prepare spreadsheet data
    const headers = ['No', 'Nama Lengkap', 'Email', 'Role', 'Tanggal Daftar', 'Status Verifikasi', 'Referral Code'];
    const rows = users.map((u, i) => [
      i + 1,
      u.full_name || '',
      u.email || '',
      u.role || 'user',
      u.created_date ? new Date(u.created_date).toLocaleDateString('id-ID') : '',
      u.is_verified ? 'Terverifikasi' : 'Belum Verifikasi',
      u.data?.referralCode || ''
    ]);

    const values = [headers, ...rows];

    // 1. Create new spreadsheet
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: `KriptoAman KYC Waitlist - ${new Date().toLocaleDateString('id-ID')}`
        },
        sheets: [{
          properties: { title: 'KYC Waitlist' }
        }]
      })
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error('Create spreadsheet error:', err);
      return Response.json({ error: 'Gagal membuat spreadsheet', detail: err }, { status: 500 });
    }

    const spreadsheet = await createRes.json();
    const spreadsheetId = spreadsheet.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    // 2. Write data to spreadsheet
    const writeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/KYC%20Waitlist!A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!writeRes.ok) {
      const err = await writeRes.text();
      console.error('Write data error:', err);
      return Response.json({ error: 'Gagal menulis data', detail: err }, { status: 500 });
    }

    // 3. Format header row (bold + background)
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.07, green: 0.33, blue: 0.61 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          },
          {
            autoResizeDimensions: {
              dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 7 }
            }
          }
        ]
      })
    });

    console.log(`Exported ${users.length} users to ${spreadsheetUrl}`);

    return Response.json({
      success: true,
      totalExported: users.length,
      spreadsheetUrl,
      spreadsheetId
    });

  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});