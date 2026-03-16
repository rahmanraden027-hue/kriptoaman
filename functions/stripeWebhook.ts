import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature error:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const session = event.data.object;

    if (event.type === 'checkout.session.completed') {
      const userEmail = session.metadata?.user_email || session.customer_email;
      const topupType = session.metadata?.topup_type;

      // === IDR Wallet Top-up ===
      if (topupType === 'idr_wallet' && userEmail) {
        const amountIDR = parseInt(session.metadata?.amount_idr || '0');
        if (amountIDR > 0) {
          console.log(`[IDR_TOPUP] Processing Rp ${amountIDR} for ${userEmail}`);
          const existing = await base44.asServiceRole.entities.UserBalance.filter({ userEmail, coin: 'IDR' });
          if (existing.length > 0) {
            await base44.asServiceRole.entities.UserBalance.update(existing[0].id, {
              amount: (existing[0].amount || 0) + amountIDR,
            });
          } else {
            await base44.asServiceRole.entities.UserBalance.create({ userEmail, coin: 'IDR', amount: amountIDR });
          }
          // Catat deposit request sebagai confirmed
          await base44.asServiceRole.entities.DepositRequest.create({
            userEmail,
            type: 'bank',
            coin: 'IDR',
            amountIDR,
            senderName: 'Stripe Payment',
            proofNote: `Stripe session: ${session.id}`,
            status: 'confirmed',
            confirmedAt: new Date().toISOString(),
            adminNote: `Auto-confirmed via Stripe checkout. Session ID: ${session.id}`,
          });
          // Catat fee platform (1%)
          const fee = Math.round(amountIDR * 0.01);
          await base44.asServiceRole.entities.AdminProfit.create({
            transactionType: 'deposit',
            userEmail,
            amount: fee / 15500,
            transactionId: session.id,
            currency: 'IDR',
            transactionAmount: amountIDR,
            status: 'collected',
            notes: `Stripe IDR top-up fee 1%`,
          });
          console.log(`[IDR_TOPUP] ✅ Credited Rp ${amountIDR} to ${userEmail}`);
        }
        return Response.json({ received: true });
      }

      // === Premium subscription ===
      console.log(`[PREMIUM] Subscription activated for: ${userEmail}`);
      if (userEmail) {
        const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            premium_analytics: true,
            premium_since: new Date().toISOString(),
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
          });
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const customerId = session.customer;
      console.log(`[PREMIUM] Subscription cancelled for customer: ${customerId}`);

      const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });
      if (users.length > 0) {
        await base44.asServiceRole.entities.User.update(users[0].id, {
          premium_analytics: false,
          premium_since: null,
        });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});