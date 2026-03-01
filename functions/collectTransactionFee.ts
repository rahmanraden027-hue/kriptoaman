import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { transactionType, currency, transactionAmount, transactionId } = body;

    if (!transactionType || !currency) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const feeAmount = 0.50;

    const profit = await base44.asServiceRole.entities.AdminProfit.create({
      transactionType,
      userEmail: user.email,
      amount: feeAmount,
      transactionId: transactionId || `tx_${Date.now()}`,
      currency,
      transactionAmount: transactionAmount || 0,
      status: 'collected',
      notes: `Fee for ${transactionType} transaction in ${currency}`
    });

    return Response.json({ success: true, profit, feeAmount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});