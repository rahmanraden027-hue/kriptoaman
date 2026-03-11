import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Generate TOTP secret + QR code untuk user setup 2FA
 * Menggunakan speakeasy untuk TOTP (industry standard)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Import speakeasy untuk TOTP generation
    const speakeasy = (await import('npm:speakeasy@2.0.0')).default;
    const QRCode = (await import('npm:qrcode@1.5.3')).default;

    // Generate secret TOTP
    const secret = speakeasy.generateSecret({
      name: `KriptoAman (${user.email})`,
      issuer: 'KriptoAman',
      length: 32
    });

    // Generate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Generate 10 backup codes
    const backupCodes = Array.from({ length: 10 }, () => {
      return Math.random().toString(36).substr(2, 8).toUpperCase();
    });

    console.log(`[TOTP] Generated secret for user: ${user.email}`);

    return Response.json({
      success: true,
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
      manualEntryKey: secret.base32,
      message: 'Scan QR code dengan Google Authenticator atau simpan secret key',
      userId: user.id,
      userEmail: user.email
    });

  } catch (error) {
    console.error('[setupTOTP] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});