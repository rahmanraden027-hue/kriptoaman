async function keyDigest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function checkRateLimit(db, request, scope, subject, limit, windowSeconds) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = await keyDigest(`${scope}:${ip}:${subject.toLowerCase()}`);
  const now = Date.now();
  const row = await db.prepare('SELECT count, window_started_at FROM auth_rate_limits WHERE key = ?')
    .bind(key)
    .first();

  if (!row || Date.parse(row.window_started_at) + windowSeconds * 1000 <= now) {
    await db.prepare(`
      INSERT INTO auth_rate_limits (key, count, window_started_at)
      VALUES (?, 1, ?)
      ON CONFLICT(key) DO UPDATE SET count = 1, window_started_at = excluded.window_started_at
    `).bind(key, new Date(now).toISOString()).run();
    return true;
  }

  if (row.count >= limit) return false;
  await db.prepare('UPDATE auth_rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();
  return true;
}
