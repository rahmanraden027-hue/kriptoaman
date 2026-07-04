import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { nik, name, birth_date } = await req.json();

    if (!nik || !name || !birth_date) {
      return Response.json({ error: 'nik, name, and birth_date are required' }, { status: 400 });
    }

    const appId = Deno.env.get('VERIHUBS_APP_ID');
    const apiKey = Deno.env.get('VERIHUBS_API_KEY');

    if (!appId || !apiKey) {
      return Response.json({ error: 'Verihubs credentials not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.verihubs.com/data-verification/id-verification/verify', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'App-ID': appId,
        'API-Key': apiKey,
      },
      body: JSON.stringify({
        nik,
        name,
        birth_date,
        reference_id: `kriptoaman-kyc-${user.id}-${Date.now()}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Verihubs API error:', response.status, data);
      return Response.json({
        verified: false,
        error: data?.detail || data?.message || 'Verihubs verification failed',
        status_code: response.status,
      }, { status: 200 });
    }

    return Response.json({
      verified: true,
      data,
    });
  } catch (error) {
    console.error('verifyKYCWithVerihubs error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});