import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MAX_RETRIES = 3;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, executionPrice, userId } = await req.json();

    if (!orderId || !executionPrice) {
      return Response.json(
        { error: 'Missing orderId or executionPrice' },
        { status: 400 }
      );
    }

    // Fetch order
    const order = await base44.asServiceRole.entities.DEXOrder.read(orderId);

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'pending' && order.status !== 'triggered') {
      return Response.json(
        { error: `Order status is ${order.status}, cannot execute` },
        { status: 400 }
      );
    }

    const retryCount = order.retryCount || 0;

    if (retryCount >= MAX_RETRIES) {
      // Max retries reached, mark as failed
      await base44.asServiceRole.entities.DEXOrder.update(orderId, {
        status: 'failed',
        lastError: `Max retries (${MAX_RETRIES}) exceeded`,
      });

      // Send failure notification email
      await sendFailureNotification(base44, userId, order, 'Max retries exceeded');

      return Response.json({
        success: false,
        error: 'Max retries exceeded',
        orderId,
      });
    }

    // Simulate swap execution (in real scenario, interact with DEX API)
    const executionResult = await executeSwap(order, executionPrice);

    if (executionResult.success) {
      // Update order status to executed
      await base44.asServiceRole.entities.DEXOrder.update(orderId, {
        status: 'executed',
        executionPrice: executionPrice,
        txHash: executionResult.txHash,
        retryCount: retryCount + 1,
      });

      console.log(`[Execute] Order ${orderId} executed successfully`);

      return Response.json({
        success: true,
        orderId,
        txHash: executionResult.txHash,
        executionPrice,
      });
    } else {
      // Execution failed, increment retry count and mark as triggered
      const newRetryCount = retryCount + 1;
      const errorMsg = executionResult.error || 'Execution failed';

      await base44.asServiceRole.entities.DEXOrder.update(orderId, {
        status: 'triggered',
        retryCount: newRetryCount,
        lastError: errorMsg,
      });

      console.log(
        `[Execute] Order ${orderId} failed (retry ${newRetryCount}/${MAX_RETRIES}): ${errorMsg}`
      );

      // Send retry notification if not last attempt
      if (newRetryCount < MAX_RETRIES) {
        await sendRetryNotification(
          base44,
          userId,
          order,
          errorMsg,
          newRetryCount
        );
      } else {
        // Last retry failed
        await base44.asServiceRole.entities.DEXOrder.update(orderId, {
          status: 'failed',
        });
        await sendFailureNotification(
          base44,
          userId,
          order,
          `Final attempt failed: ${errorMsg}`
        );
      }

      return Response.json({
        success: false,
        error: errorMsg,
        orderId,
        retryCount: newRetryCount,
      });
    }
  } catch (error) {
    console.error('[Execute] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function executeSwap(order, executionPrice) {
  // Simulate swap execution with 80% success rate
  const random = Math.random();

  if (random < 0.8) {
    // Success
    const txHash = '0x' + Math.random().toString(16).slice(2, 66);
    return {
      success: true,
      txHash,
    };
  } else {
    // Failure
    return {
      success: false,
      error: 'DEX liquidity insufficient or slippage exceeded',
    };
  }
}

async function sendRetryNotification(
  base44,
  userId,
  order,
  errorMsg,
  retryCount
) {
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: userId,
      subject: `Order Execution Retry - ${order.fromTokenSymbol}/${order.toTokenSymbol}`,
      body: `
Pesanan Anda gagal dieksekusi pada percobaan ${retryCount}.

Order Details:
- Type: ${order.orderType}
- Pair: ${order.fromTokenSymbol}/${order.toTokenSymbol}
- Amount: ${order.amount}
- Trigger Price: $${order.triggerPrice}
- Error: ${errorMsg}

Sistem akan mencoba lagi dalam waktu singkat.
Status: Retry ${retryCount}/${3}

Best regards,
DEX Trading Bot
      `,
    });
  } catch (err) {
    console.error('Failed to send retry notification:', err.message);
  }
}

async function sendFailureNotification(base44, userId, order, reason) {
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: userId,
      subject: `Order Execution Failed - ${order.fromTokenSymbol}/${order.toTokenSymbol}`,
      body: `
Pesanan Anda gagal dieksekusi setelah ${MAX_RETRIES} percobaan.

Order Details:
- Type: ${order.orderType}
- Pair: ${order.fromTokenSymbol}/${order.toTokenSymbol}
- Amount: ${order.amount}
- Trigger Price: $${order.triggerPrice}
- Chain: ${order.chainName}
- Reason: ${reason}

Silakan periksa pesanan Anda dan coba lagi atau buat pesanan baru.

Best regards,
DEX Trading Bot
      `,
    });
  } catch (err) {
    console.error('Failed to send failure notification:', err.message);
  }
}