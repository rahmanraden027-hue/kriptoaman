import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Never evaluate or trigger orders from synthetic prices.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    return Response.json({
      status: 'UNAVAILABLE',
      checked: 0,
      triggered: 0,
      error: 'DEX order monitoring is disabled until verified pricing is configured.',
    }, { status: 503 });
  } catch (error) {
    console.error('[monitorDEXOrders] Error:', error.message);
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }
});
