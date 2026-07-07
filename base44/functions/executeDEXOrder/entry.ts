import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MAX_RETRIES = 3;

// CoinGecko API mapping
const COINGECKO_IDS = {
  ETH: 'ethereum',
  BTC: 'bitcoin',
  BNB: 'binancecoin',
  USDT: 'tether',
  USDC: 'usd-coin',
  WBTC: 'wrapped-bitcoin',
  POL: 'polygon',
  MATIC: 'polygon',
  UNI: 'uniswap',
  LINK: 'chainlink',
  AVAX: 'avalanche-2',
  FTM: 'fantom',
  ARB: 'arbitrum',
  OP: 'optimism',
};

// Cache for prices (TTL: 30 seconds)
const priceCache = new Map();
const cacheExpiry = new Map();
const CACHE_TTL = 30000;

async function getRealtimePrice(symbol) {
  const coinId = COINGECKO_IDS[symbol];
  if (!coinId) return null;

  const now = Date.now();
  if (priceCache.has(symbol) && cacheExpiry.get(symbol) > now) {
    return priceCache.get(symbol);
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    );
    const data = await response.json();
    const price = data[coinId]?.usd;
    
    if (price) {
      priceCache.set(symbol, price);
      cacheExpiry.set(symbol, now + CACHE_TTL);
      return price;
    }
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error.message);
  }
  
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, executionPrice } = await req.json();

    if (!orderId || !executionPrice) {
      return Response.json(
        { error: 'Missing orderId or executionPrice' },
        { status: 400 }
      );
    }

    // Fetch order through the caller's permissions first, then enforce ownership before any service-role writes.
    const order = await base44.entities.DEXOrder.get(orderId);

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (user.role !== 'admin' && order.created_by_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const notificationEmail = order.userEmail || user.email;

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
      await sendFailureNotification(base44, notificationEmail, order, 'Max retries exceeded');

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
          notificationEmail,
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
          notificationEmail,
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