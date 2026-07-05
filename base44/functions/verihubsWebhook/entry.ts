import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    // Validate webhook authenticity via shared secret header
    const webhookSecret = Deno.env.get('VERIHUBS_WEBHOOK_SECRET');
    const providedSecret = req.headers.get('X-Webhook-Secret') || req.headers.get('webhook-secret');

    if (!webhookSecret) {
      console.error('VERIHUBS_WEBHOOK_SECRET not configured');
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (providedSecret !== webhookSecret) {
      console.error('Invalid webhook secret');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    console.log('Verihubs webhook received:', JSON.stringify(payload));

    const base44 = createClientFromRequest(req);

    // Extract verification result from callback
    const referenceId = payload.reference_id || payload.referenceId || '';
    const verificationData = payload.data || payload;

    const nikValid = verificationData.nik === true;
    const nameValid = verificationData.name === true;
    const birthDateValid = verificationData.birth_date === true || verificationData.birthDate === true;
    const allVerified = nikValid && nameValid && birthDateValid;

    // Find KYC record by reference_id stored in description field
    if (referenceId) {
      const kycRecords = await base44.asServiceRole.entities.KYCVerification.filter({
        description: { $regex: referenceId, $options: 'i' }
      });

      if (kycRecords && kycRecords.length > 0) {
        const kyc = kycRecords[0];

        if (allVerified) {
          await base44.asServiceRole.entities.KYCVerification.update(kyc.id, {
            status: 'verified',
            verificationLevel: 'intermediate',
            withdrawalLimit: 10000,
            verifiedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            adminNotes: 'Auto-verified via Verihubs webhook callback',
            description: `Verihubs ref: ${referenceId} | Transaction: ${verificationData.id || 'N/A'}`
          });
          console.log(`KYC ${kyc.id} auto-verified via webhook for ref ${referenceId}`);
        } else {
          const failures = [];
          if (!nikValid) failures.push('NIK');
          if (!nameValid) failures.push('Name');
          if (!birthDateValid) failures.push('Birth Date');

          await base44.asServiceRole.entities.KYCVerification.update(kyc.id, {
            status: 'rejected',
            rejectionReason: `Verihubs verification failed: ${failures.join(', ')} did not match`,
            adminNotes: `Auto-rejected via Verihubs webhook. Fields: nik=${nikValid}, name=${nameValid}, birth_date=${birthDateValid}`,
            description: `Verihubs ref: ${referenceId} | REJECTED`
          });
          console.log(`KYC ${kyc.id} rejected via webhook for ref ${referenceId}`);
        }
      } else {
        console.log(`No KYC record found for reference_id: ${referenceId}`);
      }
    }

    return Response.json({ received: true, processed: true });
  } catch (error) {
    console.error('verihubsWebhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});