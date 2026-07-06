import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const isSafeIdentifier = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { projectId, datasetId, tableId, startDate, endDate } = await req.json().catch(() => ({}));

    if (!isSafeIdentifier(projectId) || !isSafeIdentifier(datasetId) || !isSafeIdentifier(tableId)) {
      return Response.json({ error: 'Project, dataset, dan table BigQuery wajib diisi dengan format valid.' }, { status: 400 });
    }

    const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);
    const tableRef = `\`${projectId}.${datasetId}.${tableId}\``;

    const query = `
      WITH base AS (
        SELECT
          DATE(created_date) AS report_date,
          COALESCE(status, 'unknown') AS status,
          COALESCE(verificationLevel, 'unknown') AS verification_level,
          COALESCE(idType, 'unknown') AS id_type,
          SAFE_CAST(riskScore AS FLOAT64) AS risk_score,
          rejectionReason AS rejection_reason
        FROM ${tableRef}
        WHERE DATE(created_date) BETWEEN @startDate AND @endDate
      )
      SELECT
        report_date,
        status,
        verification_level,
        id_type,
        COUNT(*) AS total_requests,
        COUNTIF(status = 'verified') AS verified_count,
        COUNTIF(status = 'rejected') AS rejected_count,
        COUNTIF(status = 'pending') AS pending_count,
        COUNTIF(status = 'expired') AS expired_count,
        ROUND(AVG(risk_score), 2) AS average_risk_score,
        ARRAY_AGG(rejection_reason IGNORE NULLS ORDER BY rejection_reason LIMIT 5) AS top_rejection_reasons
      FROM base
      GROUP BY report_date, status, verification_level, id_type
      ORDER BY report_date DESC, total_requests DESC
    `;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlebigquery');
    const response = await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        useLegacySql: false,
        parameterMode: 'NAMED',
        queryParameters: [
          { name: 'startDate', parameterType: { type: 'DATE' }, parameterValue: { value: start } },
          { name: 'endDate', parameterType: { type: 'DATE' }, parameterValue: { value: end } },
        ],
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('[queryBigQueryKYCTrends] BigQuery error:', response.status, result);
      return Response.json({ error: result.error?.message || 'BigQuery query failed' }, { status: response.status });
    }

    const fields = result.schema?.fields || [];
    const rows = (result.rows || []).map((row) => {
      const item = {};
      fields.forEach((field, index) => {
        const raw = row.f[index]?.v;
        item[field.name] = field.type === 'INTEGER' || field.type === 'FLOAT' ? Number(raw || 0) : raw;
      });
      return item;
    });

    const summary = rows.reduce((acc, row) => {
      acc.totalRequests += row.total_requests || 0;
      acc.verified += row.verified_count || 0;
      acc.rejected += row.rejected_count || 0;
      acc.pending += row.pending_count || 0;
      acc.expired += row.expired_count || 0;
      return acc;
    }, { totalRequests: 0, verified: 0, rejected: 0, pending: 0, expired: 0 });

    return Response.json({ success: true, rows, summary, startDate: start, endDate: end });
  } catch (error) {
    console.error('[queryBigQueryKYCTrends] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});