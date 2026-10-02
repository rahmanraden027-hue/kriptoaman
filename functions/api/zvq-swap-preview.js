const FEE_NUMERATOR = 997n;
const FEE_DENOMINATOR = 1000n;
const BPS = 10000n;
const MAX_SLIPPAGE_BPS = 500n;

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
const positiveInteger = value => typeof value === 'string' && /^[1-9][0-9]*$/.test(value) ? BigInt(value) : null;

export async function onRequestGet({ request }) {
  const observationId = crypto.randomUUID();
  try {
    const url = new URL(request.url);
    const amountIn = positiveInteger(url.searchParams.get('amountIn'));
    const direction = url.searchParams.get('direction') || 'token0-to-token1';
    const slippageRaw = positiveInteger(url.searchParams.get('slippageBps') || '50');
    if (!amountIn) return json({ status: 'unavailable', code: 'INVALID_AMOUNT', executionEnabled: false, observationId }, 400);
    if (!['token0-to-token1', 'token1-to-token0'].includes(direction)) return json({ status: 'unavailable', code: 'INVALID_DIRECTION', executionEnabled: false, observationId }, 400);
    const slippageBps = slippageRaw && slippageRaw <= MAX_SLIPPAGE_BPS ? slippageRaw : 50n;

    const evidenceUrl = new URL('/api/zvq-liquidity-evidence', url.origin);
    const evidenceResponse = await fetch(evidenceUrl.toString(), { headers: { Accept: 'application/json' } });
    const evidence = await evidenceResponse.json();
    if (!evidenceResponse.ok || evidence?.status !== 'live') throw new Error(evidence?.code || 'LIQUIDITY_EVIDENCE_UNAVAILABLE');
    if (evidence.poolEvidence !== 'FIRST_PARTY_ON_CHAIN' || evidence.liquidityEvidence !== 'RESERVES_PRESENT' || !evidence.pair) {
      return json({ status: 'unavailable', code: 'NON_ZERO_RESERVES_NOT_PROVEN', executionEnabled: false, observationId }, 409);
    }

    const reserve0 = BigInt(evidence.reserve0);
    const reserve1 = BigInt(evidence.reserve1);
    const reserveIn = direction === 'token0-to-token1' ? reserve0 : reserve1;
    const reserveOut = direction === 'token0-to-token1' ? reserve1 : reserve0;
    if (reserveIn <= 0n || reserveOut <= 0n) return json({ status: 'unavailable', code: 'ZERO_RESERVES', executionEnabled: false, observationId }, 409);

    const amountInWithFee = amountIn * FEE_NUMERATOR;
    const amountOut = (amountInWithFee * reserveOut) / (reserveIn * FEE_DENOMINATOR + amountInWithFee);
    if (amountOut <= 0n || amountOut >= reserveOut) return json({ status: 'unavailable', code: 'NO_EXECUTABLE_PREVIEW_OUTPUT', executionEnabled: false, observationId }, 409);
    const minimumOut = amountOut * (BPS - slippageBps) / BPS;

    return json({
      status: 'live', mode: 'READ_ONLY_PREVIEW', chainId: 22028, pair: evidence.pair,
      direction, tokenIn: direction === 'token0-to-token1' ? evidence.token0 : evidence.token1,
      tokenOut: direction === 'token0-to-token1' ? evidence.token1 : evidence.token0,
      amountIn: amountIn.toString(), amountOut: amountOut.toString(), minimumOut: minimumOut.toString(),
      feeBps: 30, slippageBps: Number(slippageBps), reserveIn: reserveIn.toString(), reserveOut: reserveOut.toString(),
      liquidityObservationId: evidence.observationId, observedHead: evidence.head,
      formula: 'x*y=k; amountInWithFee=amountIn*997; denominator=reserveIn*1000+amountInWithFee',
      executionEnabled: false, approvalEnabled: false, signingEnabled: false,
      provenance: { ownership: 'first-party', liquidityEndpoint: '/api/zvq-liquidity-evidence', chainTransport: 'JSON-RPC' },
      observedAt: Date.now(), observationId,
    });
  } catch (error) {
    return json({ status: 'unavailable', code: 'SWAP_PREVIEW_UNAVAILABLE', message: error?.message || 'Swap preview unavailable', executionEnabled: false, approvalEnabled: false, signingEnabled: false, observationId }, 503);
  }
}