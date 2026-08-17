const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' },
});

function requireEnv(env, key) {
  const value = env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

function buildOrderId(userId = 'guest') {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `KAM-${stamp}-${String(userId).slice(0, 8)}-${suffix}`;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const amount = Number(body?.amount);
    const purpose = String(body?.purpose || 'service').trim();
    const userId = String(body?.userId || 'guest').trim();
    const customer = body?.customer || {};

    if (!Number.isFinite(amount) || amount < 1000 || amount > 100000000) {
      return json({ ok: false, error: 'INVALID_AMOUNT' }, 400);
    }

    const provider = String(env.PAYMENT_PROVIDER || 'xendit').toLowerCase();
    if (provider !== 'xendit') {
      return json({ ok: false, error: 'UNSUPPORTED_PROVIDER' }, 503);
    }

    const secretKey = requireEnv(env, 'XENDIT_SECRET_KEY');
    const externalId = buildOrderId(userId);
    const origin = new URL(request.url).origin;

    const payload = {
      external_id: externalId,
      amount: Math.round(amount),
      payer_email: customer?.email || undefined,
      description: `KriptoAman - ${purpose}`,
      success_redirect_url: `${origin}/PaymentResult?status=success&order=${encodeURIComponent(externalId)}`,
      failure_redirect_url: `${origin}/PaymentResult?status=failed&order=${encodeURIComponent(externalId)}`,
      currency: 'IDR',
    };

    const upstream = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        authorization: `Basic ${btoa(`${secretKey}:`)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('payment_create_failed', { status: upstream.status, externalId });
      return json({ ok: false, error: 'PROVIDER_ERROR' }, 502);
    }

    // Never return provider credentials. Only expose checkout-safe fields.
    return json({
      ok: true,
      provider: 'xendit',
      orderId: externalId,
      invoiceId: result.id,
      amount: result.amount,
      status: result.status,
      checkoutUrl: result.invoice_url,
      expiryDate: result.expiry_date,
    }, 201);
  } catch (error) {
    console.error('payment_create_exception', error?.message || error);
    return json({ ok: false, error: 'PAYMENT_CREATE_FAILED' }, 500);
  }
}
