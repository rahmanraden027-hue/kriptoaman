import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Legacy automatic execution is intentionally disabled. A future implementation
// must prove pricing freshness and return a verifiable transaction receipt.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    return Response.json({
      status: 'UNAVAILABLE',
      checked: 0,
      executed: 0,
      error: 'Automatic order execution is disabled in production.',
    }, { status: 503 });
  } catch (error) {
    console.error('[executeOrderMonitor] Error:', error.message);
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }
});
