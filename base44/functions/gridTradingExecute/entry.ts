import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Live grid execution is disabled until order and cancellation receipts are verified.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    return Response.json({
      success: false,
      status: 'UNAVAILABLE',
      error: 'Live grid trading is not available in the production release.',
    }, { status: 503 });
  } catch (error) {
    console.error('[gridTradingExecute] Error:', error.message);
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }
});
