const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=15, s-maxage=30, stale-while-revalidate=120','X-Content-Type-Options':'nosniff'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:HEADERS});

function geckoConfig(env={}){
  if(env.COINGECKO_PRO_API_KEY)return{base:'https://pro-api.coingecko.com/api/v3',headers:{'x-cg-pro-api-key':env.COINGECKO_PRO_API_KEY}};
  const demo=env.COINGECKO_DEMO_API_KEY||env.COINGECKO_API_KEY;
  return{base:'https://api.coingecko.com/api/v3',headers:demo?{'x-cg-demo-api-key':demo}:{}};
}

export async function onRequestGet({request,env}){
  const url=new URL(request.url);
  const chainId=Number(url.searchParams.get('chainId')||1);
  const address=String(url.searchParams.get('address')||'').toLowerCase();
  if(chainId!==1)return json({status:'unavailable',code:'TOKEN_PRICE_CHAIN_UNSUPPORTED'},400);
  if(!/^0x[0-9a-f]{40}$/.test(address))return json({status:'unavailable',code:'TOKEN_PRICE_ADDRESS_INVALID'},400);
  try{
    const cfg=geckoConfig(env);
    const params=new URLSearchParams({contract_addresses:address,vs_currencies:'usd',include_24hr_change:'true',include_market_cap:'true',include_24hr_vol:'true',include_last_updated_at:'true'});
    const response=await fetch(`${cfg.base}/simple/token_price/ethereum?${params.toString()}`,{headers:{Accept:'application/json','User-Agent':'KriptoAman-Token-Price/1.0',...cfg.headers},signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw new Error(`token price provider HTTP ${response.status}`);
    const payload=await response.json();
    const row=payload?.[address];
    if(!row)return json({status:'unavailable',address,chainId,code:'TOKEN_PRICE_NOT_FOUND'},404);
    return json({
      status:'available',address,chainId,
      data:{
        price:Number.isFinite(Number(row.usd))?Number(row.usd):null,
        change24h:Number.isFinite(Number(row.usd_24h_change))?Number(row.usd_24h_change):null,
        marketCap:Number.isFinite(Number(row.usd_market_cap))?Number(row.usd_market_cap):null,
        volume24h:Number.isFinite(Number(row.usd_24h_vol))?Number(row.usd_24h_vol):null,
        lastUpdated:Number(row.last_updated_at)||null,
      },
      provenance:{apiOwnership:'KriptoAman',marketDataOrigin:'CoinGecko',browserDirectProviderAccess:false,displayOnly:true},
    });
  }catch(error){
    console.error('Token price lookup failed',{address,chainId,error});
    return json({status:'unavailable',address,chainId,code:'TOKEN_PRICE_PROVIDER_UNAVAILABLE'},503);
  }
}
