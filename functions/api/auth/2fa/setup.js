import { json, requireBindings, requireSameOrigin } from '../../../../server/auth/http.js';
import { ensureAuthSchema } from '../../../../server/auth/schema.js';
import { getSessionToken, verifySessionToken } from '../../../../server/auth/session.js';
import { getUserById } from '../../../../server/auth/users.js';
import {
  encryptTotpSecret,
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCode,
  otpauthUri,
} from '../../../../server/auth/totp.js';

export async function onRequestPost({ request, env }) {
  try {
    requireBindings(env, ['AUTH_DB', 'SESSION_SECRET']);
    requireSameOrigin(request, env);
    await ensureAuthSchema(env.AUTH_DB);
    const session = await verifySessionToken(env.SESSION_SECRET, getSessionToken(request));
    if (!session) return json({ authenticated: false }, { status: 401 });
    const user = await getUserById(env.AUTH_DB, session.sub);
    if (!user) return json({ authenticated: false }, { status: 401 });

    const secret = generateTotpSecret();
    const encrypted = await encryptTotpSecret(secret, env.SESSION_SECRET);
    const backupCodes = generateBackupCodes();
    const backupHashes = await Promise.all(backupCodes.map(hashBackupCode));
    const now = new Date().toISOString();

    await env.AUTH_DB.prepare(`
      INSERT INTO auth_totp (user_id, secret_enc, enabled, backup_hashes, created_at, updated_at)
      VALUES (?, ?, 0, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        secret_enc = excluded.secret_enc,
        enabled = 0,
        backup_hashes = excluded.backup_hashes,
        updated_at = excluded.updated_at
    `).bind(user.id, encrypted, JSON.stringify(backupHashes), now, now).run();

    return json({
      secret,
      otpauthUri: otpauthUri(user.email, secret),
      backupCodes,
    });
  } catch (error) {
    console.error('2FA setup failed', error);
    return json({ error: 'Unable to start two-factor authentication setup' }, { status: 503 });
  }
}
