import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// CoinGecko API mapping for token symbols to IDs
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
  CAKE: 'pancakeswap-token',
};

// Cache for prices (TTL: 30 seconds)
const priceCache = new Map();
const cacheExpiry = new Map();
const CACHE_TTL = 30000; // 30 seconds

// Utility: Fetch real market price from CoinGecko
async function getMarketPrice(symbol) {
  const coinId = COINGECKO_IDS[symbol];
  if (!coinId) {
    console.warn(`No CoinGecko ID for symbol: ${symbol}`);
    return null;
  }

  // Check cache
  const now = Date.now();
  if (priceCache.has(symbol) && cacheExpiry.get(symbol) > now) {
    return priceCache.get(symbol);
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false`
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

// Utility: Send notification to user
async function sendNotification(base44, userId, title, message, type = 'info') {
  try {
    await base44.integrations.Core.SendEmail({
      to: userId,
      subject: `DEX Order - ${title}`,
      body: message,
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

// Utility: Execute swap via 1inch
async function executeSwap(order, currentPrice) {
  // Simulate swap execution (in production, call real 1inch API)
  const swapSuccess = Math.random() > 0.1; // 90% success rate simulation
  
  if (swapSuccess) {
    return {
      success: true,
      txHash: '0x' + Math.random().toString(16).slice(2, 66),
      executionPrice: currentPrice,
    };
  } else {
    throw new Error('Swap execution failed - insufficient liquidity or network error');
  }
}

// Main execution logic
async function executeOrderMonitor() {
  const base44 = createClientFromRequest(new Request('http://localhost'));
  
  try {
    // 1. Fetch all pending orders
    const pendingOrders = await base44.asServiceRole.entities.DEXOrder.filter({
      status: 'pending'
    });

    console.log(`Found ${pendingOrders.length} pending orders`);

    // 2. Process each order
    for (const order of pendingOrders) {
      try {
        // Get current market price
        const currentPrice = getMarketPrice(order.fromTokenSymbol);
        
        // Check if trigger price is hit
        const isTriggered = order.orderType === 'take-profit'
          ? currentPrice >= order.triggerPrice
          : currentPrice <= order.triggerPrice;

        if (!isTriggered) {
          // Update lastCheckedAt without changing status
          await base44.asServiceRole.entities.DEXOrder.update(order.id, {
            lastCheckedAt: new Date().toISOString(),
          });
          continue;
        }

        console.log(`Order ${order.id} triggered at price ${currentPrice}`);

        // 3. Execute swap
        const swapResult = await executeSwap(order, currentPrice);

        // Update order to executed
        await base44.asServiceRole.entities.DEXOrder.update(order.id, {
          status: 'executed',
          executionPrice: swapResult.executionPrice,
          executionHash: swapResult.txHash,
          lastCheckedAt: new Date().toISOString(),
          retryCount: 0,
          lastError: null,
        });

        // Send success notification
        await sendNotification(
          base44,
          order.created_by,
          `${order.orderType === 'take-profit' ? '📈 Take-Profit' : '⛔ Stop-Loss'} Executed`,
          `Order berhasil dieksekusi!\n\nToken: ${order.fromTokenSymbol} → ${order.toTokenSymbol}\nAmount: ${order.amount}\nTrigger Price: $${order.triggerPrice}\nExecution Price: $${swapResult.executionPrice.toFixed(4)}\nTx Hash: ${swapResult.txHash}`
        );

        console.log(`Order ${order.id} executed successfully`);

      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error.message);

        // Increment retry count
        const retries = (order.retryCount || 0) + 1;
        const maxRetries = 3;

        if (retries < maxRetries) {
          // Update with error and retry count
          await base44.asServiceRole.entities.DEXOrder.update(order.id, {
            retryCount: retries,
            lastError: error.message,
            lastCheckedAt: new Date().toISOString(),
          });

          console.log(`Order ${order.id} - retry ${retries}/${maxRetries}`);
        } else {
          // Mark as failed after max retries
          await base44.asServiceRole.entities.DEXOrder.update(order.id, {
            status: 'cancelled',
            retryCount: retries,
            lastError: `Failed after ${maxRetries} retries: ${error.message}`,
            lastCheckedAt: new Date().toISOString(),
          });

          // Send failure notification
          await sendNotification(
            base44,
            order.created_by,
            `${order.orderType === 'take-profit' ? '📈 Take-Profit' : '⛔ Stop-Loss'} Failed`,
            `Order gagal dieksekusi setelah ${maxRetries} retry attempts.\n\nToken: ${order.fromTokenSymbol} → ${order.toTokenSymbol}\nAmount: ${order.amount}\nError: ${error.message}`
          );

          console.log(`Order ${order.id} marked as cancelled after max retries`);
        }
      }
    }

    return {
      success: true,
      message: `Processed ${pendingOrders.length} pending orders`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Monitor execution failed:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// Deno serve handler
Deno.serve(async (req) => {
  try {
    const result = await executeOrderMonitor();
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});