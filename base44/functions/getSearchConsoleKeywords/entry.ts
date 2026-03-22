import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');

    // First, get list of verified sites
    const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const sitesData = await sitesRes.json();

    if (!sitesData.siteEntry || sitesData.siteEntry.length === 0) {
      return Response.json({ error: 'No verified sites found in Search Console', sites: [] }, { status: 404 });
    }

    // Use first site or find kriptoaman site
    const sites = sitesData.siteEntry;
    const targetSite = sites.find(s => s.siteUrl.includes('kriptoaman')) || sites[0];
    const siteUrl = targetSite.siteUrl;

    // Date range: last 90 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    const fmt = (d) => d.toISOString().split('T')[0];

    // Query top keywords
    const queryRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ['query'],
          rowLimit: 25,
          startRow: 0
        })
      }
    );

    const queryData = await queryRes.json();

    if (queryData.error) {
      return Response.json({ error: queryData.error.message, siteUrl }, { status: 400 });
    }

    const keywords = (queryData.rows || []).map(row => ({
      keyword: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: parseFloat((row.ctr * 100).toFixed(2)),
      position: parseFloat(row.position.toFixed(1))
    }));

    return Response.json({
      siteUrl,
      dateRange: { from: fmt(startDate), to: fmt(endDate) },
      totalKeywords: keywords.length,
      keywords
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});