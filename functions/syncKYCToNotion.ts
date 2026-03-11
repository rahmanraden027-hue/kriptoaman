import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

async function notionRequest(accessToken, method, path, body = null) {
  const res = await fetch(`${NOTION_API}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Notion API error: ${JSON.stringify(data)}`);
  return data;
}

// Find or create the KYC database in Notion
async function getOrCreateDatabase(accessToken) {
  // Search for existing KYC database
  const searchRes = await notionRequest(accessToken, 'POST', '/search', {
    query: 'KriptoAman KYC Status',
    filter: { value: 'database', property: 'object' },
  });

  if (searchRes.results && searchRes.results.length > 0) {
    return searchRes.results[0].id;
  }

  // Create a new page to host the database
  const pagesRes = await notionRequest(accessToken, 'POST', '/search', {
    filter: { value: 'page', property: 'object' },
  });

  // Use first available page as parent, or use a workspace-level database
  const parentPageId = pagesRes.results?.[0]?.id;

  const dbBody = {
    parent: parentPageId
      ? { type: 'page_id', page_id: parentPageId }
      : { type: 'workspace', workspace: true },
    title: [{ type: 'text', text: { content: 'KriptoAman KYC Status' } }],
    properties: {
      'Nama': { title: {} },
      'Email': { email: {} },
      'KYC Status': {
        select: {
          options: [
            { name: 'pending', color: 'yellow' },
            { name: 'approved', color: 'green' },
            { name: 'rejected', color: 'red' },
          ],
        },
      },
      'Tanggal Update': { date: {} },
      'Role': { rich_text: {} },
    },
  };

  const db = await notionRequest(accessToken, 'POST', '/databases', dbBody);
  return db.id;
}

// Find existing page for a user by email
async function findUserPage(accessToken, databaseId, email) {
  const res = await notionRequest(accessToken, 'POST', `/databases/${databaseId}/query`, {
    filter: {
      property: 'Email',
      email: { equals: email },
    },
  });
  return res.results?.[0] || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { data, old_data } = payload;

    if (!data) {
      return Response.json({ skipped: true, reason: 'No data' });
    }

    const newStatus = data.kycStatus;
    const oldStatus = old_data?.kycStatus;

    if (newStatus === oldStatus || !newStatus) {
      return Response.json({ skipped: true, reason: 'KYC status unchanged' });
    }

    const userEmail = data.email;
    const userName = data.full_name || userEmail;

    if (!userEmail) {
      return Response.json({ skipped: true, reason: 'No email' });
    }

    console.log(`Syncing KYC to Notion: ${userEmail} → ${newStatus}`);

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('notion');

    const databaseId = await getOrCreateDatabase(accessToken);
    console.log(`Using Notion database: ${databaseId}`);

    const existingPage = await findUserPage(accessToken, databaseId, userEmail);

    const pageProperties = {
      'Nama': { title: [{ text: { content: userName } }] },
      'Email': { email: userEmail },
      'KYC Status': { select: { name: newStatus } },
      'Tanggal Update': { date: { start: new Date().toISOString() } },
      'Role': { rich_text: [{ text: { content: data.role || 'user' } }] },
    };

    if (existingPage) {
      // Update existing page
      await notionRequest(accessToken, 'PATCH', `/pages/${existingPage.id}`, {
        properties: pageProperties,
      });
      console.log(`Updated Notion page for ${userEmail}`);
    } else {
      // Create new page in database
      await notionRequest(accessToken, 'POST', '/pages', {
        parent: { database_id: databaseId },
        properties: pageProperties,
      });
      console.log(`Created Notion page for ${userEmail}`);
    }

    return Response.json({ success: true, email: userEmail, status: newStatus });

  } catch (error) {
    console.error('syncKYCToNotion error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});