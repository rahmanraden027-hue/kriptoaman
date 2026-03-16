import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// Paket top-up IDR (dalam Rupiah)
const IDR_PACKAGES = {
  50000:   { idr: 50000,   usdCents: 350  },
  100000:  { idr: 100000,  usdCents: 680  },
  200000:  { idr: 200000,  usdCents: 1350 },
  500000:  { idr: 500000,  usdCents: 3300 },
  1000000: { idr: 1000000, usdCents: 6500 },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amountIDR, successUrl, cancelUrl } = await req.json();

    const pkg = IDR_PACKAGES[amountIDR];
    if (!pkg) {
      return Response.json({ error: 'Nominal tidak valid. Pilih: 50000, 100000, 200000, 500000, atau 1000000' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Top-up Saldo IDR Rp ${amountIDR.toLocaleString('id-ID')}`,
            description: `Tambah saldo IDR sebesar Rp ${amountIDR.toLocaleString('id-ID')} ke akun KriptoAman`,
          },
          unit_amount: pkg.usdCents,
        },
        quantity: 1,
      }],
      customer_email: user.email,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: user.email,
        topup_type: 'idr_wallet',
        amount_idr: String(amountIDR),
      },
      success_url: successUrl || 'https://app.base44.com/success',
      cancel_url: cancelUrl || 'https://app.base44.com/cancel',
    });

    console.log(`[IDR_TOPUP] Checkout created for ${user.email}: Rp ${amountIDR} → session ${session.id}`);

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('[IDR_TOPUP] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});