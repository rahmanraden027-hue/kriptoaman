const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' },
});

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const expected = env.XENDIT_CALLBACK_TOKEN;
    if (!expected) return json({ ok: false, error: 'WEBHOOK_NOT_CONFIGURED' }, 503);

    const provided = request.headers.get('x-callback-token');
    if (!provided || provided !== expected) {
      return json({ ok: false, error: 'INVALID_WEBHOOK_TOKEN' }, 401);
    }

    const event = await request.json();
    const externalId = String(event?.external_id || '').trim();
    const status = String(event?.status || '').toUpperCase();
    const paidAmount = Number(event?.paid_amount || event?.amount || 0);

    if (!externalId || !status) {
      return json({ ok: false, error: 'INVALID_EVENT' }, 400);
    }

    // Intentionally no balance/entitlement mutation here yet. The verified event
    // is acknowledged only after server-side validation. Persisting payment state
    // should be wired to the project's canonical database in the next migration.
    console.log('payment_webhook_verified', {
      externalId,
      status,
      paidAmount,
      provider: 'xendit',
      receivedAt: new Date().toISOString(),
    });

    return json({ ok: true });
  } catch (error) {
    console.error('payment_webhook_exception', error?.message || error);
    return json({ ok: false, error: 'WEBHOOK_FAILED' }, 500);
  }
}
