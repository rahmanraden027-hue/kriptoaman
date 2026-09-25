import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Fail closed until a reviewed DEX adapter returns a verifiable receipt.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    return Response.json({
      success: false,
      status: 'UNAVAILABLE',
      error: 'DEX execution is disabled until verified on-chain execution is available.',
    }, { status: 503 });
  } catch (error) {
    console.error('[executeDEXOrder] Error:', error.message);
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }
});
