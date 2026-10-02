const FEE_NUMERATOR = 997n;
const FEE_DENOMINATOR = 1000n;
const BPS = 10000n;
const MAX_SLIPPAGE_BPS = 500n;
const DECIMALS_SELECTOR = '0x313ce567';
const SYMBOL_SELECTOR = '0x95d89b41';

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
const positiveInteger = value => typeof value === 'string' && /^[1-9][0-9]*$/.test(value) ? BigInt(value) : null;
const decodeUint = value => { try { return Number(BigInt(value)); } catch { return null; } };
const decodeSymbol = value => { try { if (!value || value === '0x') return null; const hex=value.slice(2); const offset=Number(BigInt('0x'+hex.slice(0,64))); if (offset===32) { const len=Number(BigInt('0x'+hex.slice(64,128))); const body=hex.slice(128,128+len*2); return decodeURIComponent(body.match(/.{2}/g).map(x=>'%'+x).join('')); } return null; } catch { return null; } };
const humanToRaw = (value, decimals) => { if (typeof value !== 'string' || !/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(value)) return null; const [whole, frac='']=value.split('.'); if (frac.length>decimals) return null; const raw=BigInt(whole)*10n**BigInt(decimals)+BigInt((frac+'0'.repeat(decimals)).slice(0,decimals)||'0'); return raw>0n?raw:null; };
const rawToHuman = (raw, decimals) => { const s=BigInt(raw).toString().padStart(decimals+1,'0'); if (!decimals) return s; const whole=s.slice(0,-decimals)||'0'; const frac=s.slice(-decimals).replace(/0+$/,''); return frac?`${whole}.${frac}`:whole; };

export async function onRequestGet({ request }) {
  const observationId = crypto.randomUUID();
  try {
    const url = new URL(request.url);
    let amountIn = positiveInteger(url.searchParams.get('amountIn'));
    const amountHuman = url.searchParams.get('amount');
    const direction = url.searchParams.get('direction') || 'token0-to-token1';
    const slippageRaw = positiveInteger(url.searchParams.get('slippageBps') || '50');
    if (!amountIn && !amountHuman) return json({ status: 'unavailable', code: 'INVALID_AMOUNT', executionEnabled: false, observationId }, 400);
    if (!['token0-to-token1', 'token1-to-token0'].includes(direction)) return json({ status: 'unavailable', code: 'INVALID_DIRECTION', executionEnabled: false, observationId }, 400);
    const slippageBps = slippageRaw && slippageRaw <= MAX_SLIPPAGE_BPS ? slippageRaw : 50n;

    const evidenceUrl = new URL('/api/zvq-liquidity-evidence', url.origin);
    const evidenceResponse = await fetch(evidenceUrl.toString(), { headers: { Accept: 'application/json' } });
    const evidence = await evidenceResponse.json();
    if (!evidenceResponse.ok || evidence?.status !== 'live') throw new Error(evidence?.code || 'LIQUIDITY_EVIDENCE_UNAVAILABLE');
    if (evidence.poolEvidence !== 'FIRST_PARTY_ON_CHAIN' || evidence.liquidityEvidence !== 'RESERVES_PRESENT' || !evidence.pair) {
      return json({ status: 'unavailable', code: 'NON_ZERO_RESERVES_NOT_PROVEN', executionEnabled: false, observationId }, 409);
    }

    const tokenInAddress = direction === 'token0-to-token1' ? evidence.token0 : evidence.token1;
    const tokenOutAddress = direction === 'token0-to-token1' ? evidence.token1 : evidence.token0;
    const rpcBody = (to, data, id) => JSON.stringify({ jsonrpc:'2.0', id, method:'eth_call', params:[{to,data}, evidence.head || 'latest'] });
    const rpcHeaders = { Accept:'application/json', 'Content-Type':'application/json', Origin:url.origin };
    const calls = await Promise.all([tokenInAddress,tokenOutAddress].flatMap((to,i)=>[fetch('https://rpc.kriptoaman.com/',{method:'POST',headers:rpcHeaders,body:rpcBody(to,DECIMALS_SELECTOR,i*2+1)}),fetch('https://rpc.kriptoaman.com/',{method:'POST',headers:rpcHeaders,body:rpcBody(to,SYMBOL_SELECTOR,i*2+2)})]));
    const results = await Promise.all(calls.map(x=>x.json()));
    const decimalsIn=decodeUint(results[0]?.result), symbolIn=decodeSymbol(results[1]?.result), decimalsOut=decodeUint(results[2]?.result), symbolOut=decodeSymbol(results[3]?.result);
    if (!Number.isInteger(decimalsIn) || decimalsIn<0 || decimalsIn>255 || !Number.isInteger(decimalsOut) || decimalsOut<0 || decimalsOut>255) return json({status:'unavailable',code:'TOKEN_DECIMALS_UNPROVEN',executionEnabled:false,observationId},409);
    if (!amountIn) amountIn=humanToRaw(amountHuman,decimalsIn);
    if (!amountIn) return json({ status:'unavailable', code:'INVALID_HUMAN_AMOUNT', executionEnabled:false, observationId },400);

    const reserve0 = BigInt(evidence.reserve0);
    const reserve1 = BigInt(evidence.reserve1);
    const reserveIn = direction === 'token0-to-token1' ? reserve0 : reserve1;
    const reserveOut = direction === 'token0-to-token1' ? reserve1 : reserve0;
    if (reserveIn <= 0n || reserveOut <= 0n) return json({ status: 'unavailable', code: 'ZERO_RESERVES', executionEnabled: false, observationId }, 409);

    const amountInWithFee = amountIn * FEE_NUMERATOR;
    const amountOut = (amountInWithFee * reserveOut) / (reserveIn * FEE_DENOMINATOR + amountInWithFee);
    if (amountOut <= 0n || amountOut >= reserveOut) return json({ status: 'unavailable', code: 'NO_EXECUTABLE_PREVIEW_OUTPUT', executionEnabled: false, observationId }, 409);
    const minimumOut = amountOut * (BPS - slippageBps) / BPS;
    const reserveInAfter = reserveIn + amountIn;
    const reserveOutAfter = reserveOut - amountOut;
    const idealOut = amountIn * reserveOut / reserveIn;
    const priceImpactBps = idealOut > 0n && idealOut > amountOut ? Number((idealOut - amountOut) * BPS / idealOut) : 0;

    return json({
      status: 'live', mode: 'READ_ONLY_PREVIEW', chainId: 22028, pair: evidence.pair,
      direction, tokenIn: tokenInAddress, tokenOut: tokenOutAddress,
      tokenInSymbol: symbolIn, tokenOutSymbol: symbolOut, tokenInDecimals: decimalsIn, tokenOutDecimals: decimalsOut,
      amountIn: amountIn.toString(), amountOut: amountOut.toString(), minimumOut: minimumOut.toString(),
      amountInHuman: rawToHuman(amountIn,decimalsIn), amountOutHuman: rawToHuman(amountOut,decimalsOut), minimumOutHuman: rawToHuman(minimumOut,decimalsOut),
      reserveInAfter: reserveInAfter.toString(), reserveOutAfter: reserveOutAfter.toString(), priceImpactBps,
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