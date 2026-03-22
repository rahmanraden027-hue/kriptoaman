import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Verify TOTP code saat login atau konfirmasi 2FA
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { totpCode, secret } = await req.json();

    if (!totpCode || !secret) {
      return Response.json({ error: 'Missing TOTP code or secret' }, { status: 400 });
    }

    const speakeasy = (await import('npm:speakeasy@2.0.0')).default;

    // Verify TOTP code (allow 1 window tolerance = ±30 detik)
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: totpCode,
      window: 1
    });

    if (!verified) {
      console.warn(`[TOTP] Verification failed for: ${user.email}`);
      return Response.json({ error: 'Invalid TOTP code' }, { status: 401 });
    }

    console.log(`[TOTP] Verified for user: ${user.email}`);

    // Simpan TOTP secret ke user profile (encrypted backend nantinya)
    await base44.auth.updateMe({ 
      totp_enabled: true,
      // Note: Jangan simpan secret plaintext di user — ideally di separate table terenkripsi
    });

    return Response.json({
      success: true,
      message: '2FA TOTP berhasil diaktifkan',
      userId: user.id
    });

  } catch (error) {
    console.error('[verifyTOTP] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});