import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // This function is called by entity automation on DepositRequest update
    const { event, data, old_data } = body;

    // Only process when status changes TO 'confirmed'
    if (
      event?.type !== 'update' ||
      data?.status !== 'confirmed' ||
      old_data?.status === 'confirmed'
    ) {
      return Response.json({ skipped: true, reason: 'Not a confirmation event' });
    }

    const deposit = data;
    const { userEmail, coin, amountCrypto, amountIDR, type } = deposit;

    if (!userEmail || !coin) {
      return Response.json({ error: 'Missing userEmail or coin' }, { status: 400 });
    }

    // Determine credit amount
    let creditAmount = 0;
    let creditCoin = coin;

    if (type === 'crypto') {
      creditAmount = amountCrypto || 0;
    } else if (type === 'bank') {
      creditAmount = amountIDR || 0;
      creditCoin = 'IDR';
    }

    if (creditAmount <= 0) {
      return Response.json({ skipped: true, reason: 'No amount to credit' });
    }

    // Find existing balance record
    const existing = await base44.asServiceRole.entities.UserBalance.filter({
      userEmail,
      coin: creditCoin,
    });

    if (existing.length > 0) {
      const newAmount = (existing[0].amount || 0) + creditAmount;
      await base44.asServiceRole.entities.UserBalance.update(existing[0].id, {
        amount: newAmount,
      });
    } else {
      await base44.asServiceRole.entities.UserBalance.create({
        userEmail,
        coin: creditCoin,
        amount: creditAmount,
      });
    }

    return Response.json({
      success: true,
      credited: { userEmail, coin: creditCoin, amount: creditAmount },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});