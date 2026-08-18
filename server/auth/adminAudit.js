function maskIp(ip) {
  if (!ip) return null;
  if (ip.includes('.')) {
    const parts = ip.split('.');
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.xxx` : null;
  }
  if (ip.includes(':')) {
    const parts = ip.split(':').filter(Boolean);
    return `${parts.slice(0, 3).join(':')}::xxxx`;
  }
  return null;
}

function readIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || null;
}

export async function recordAdminAudit(db, request, admin, action, details = {}) {
  if (!db || !admin?.id || !admin?.email || !action) return;

  const safeMetadata = details.metadata && typeof details.metadata === 'object' ? details.metadata : {};
  const userAgent = (request.headers.get('User-Agent') || '').slice(0, 500) || null;
  const createdAt = new Date().toISOString();

  await db.prepare(`
    INSERT INTO auth_admin_audit
      (id, admin_user_id, admin_email, action, target_type, target_id, metadata_json, ip_masked, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    admin.id,
    admin.email,
    String(action).slice(0, 120),
    details.targetType ? String(details.targetType).slice(0, 120) : null,
    details.targetId ? String(details.targetId).slice(0, 200) : null,
    JSON.stringify(safeMetadata).slice(0, 10000),
    maskIp(readIp(request)),
    userAgent,
    createdAt,
  ).run();
}
