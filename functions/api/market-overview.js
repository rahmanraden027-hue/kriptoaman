const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=30, s-maxage=60, stale-while-revalidate=300','X-Content-Type-Options':'nosniff'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:HEADERS});

async function fetchJson(url,label){
 const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'KriptoAman-Market-Overview/1.0'},signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw new Error(`${label} HTTP ${r.status}`);
 return r.json();
}

export async function onRequestGet(){
 const [globalResult,fngResult]=await Promise.allSettled([
   fetchJson('https://api.coingecko.com/api/v3/global','CoinGecko global'),
   fetchJson('https://api.alternative.me/fng/?limit=1','Fear and Greed'),
 ]);
 const global=globalResult.status==='fulfilled'?globalResult.value:null;
 const fng=fngResult.status==='fulfilled'?fngResult.value:null;
 const marketCap=Number(global?.data?.total_market_cap?.usd);
 const volume24h=Number(global?.data?.total_volume?.usd);
 const btcDominance=Number(global?.data?.market_cap_percentage?.btc);
 const fearGreed=Number(fng?.data?.[0]?.value);
 if(![marketCap,volume24h,btcDominance,fearGreed].some(Number.isFinite)){
   return json({status:'unavailable',code:'MARKET_OVERVIEW_UNAVAILABLE'},503);
 }
 return json({
   status:'available',
   marketCap:Number.isFinite(marketCap)?marketCap:null,
   marketCapChange24h:Number.isFinite(Number(global?.data?.market_cap_change_percentage_24h_usd))?Number(global.data.market_cap_change_percentage_24h_usd):null,
   volume24h:Number.isFinite(volume24h)?volume24h:null,
   btcDominance:Number.isFinite(btcDominance)?btcDominance:null,
   ethDominance:Number.isFinite(Number(global?.data?.market_cap_percentage?.eth))?Number(global.data.market_cap_percentage.eth):null,
   activeCryptocurrencies:Number.isFinite(Number(global?.data?.active_cryptocurrencies))?Number(global.data.active_cryptocurrencies):null,
   markets:Number.isFinite(Number(global?.data?.markets))?Number(global.data.markets):null,
   fearGreed:Number.isFinite(fearGreed)?fearGreed:null,
   fearGreedLabel:fng?.data?.[0]?.value_classification||null,
   fearGreedTimestamp:Number(fng?.data?.[0]?.timestamp)||null,
   provenance:{apiOwnership:'KriptoAman',marketDataOrigin:['CoinGecko Global','Alternative.me'],browserDirectProviderAccess:false},
   generatedAt:Date.now(),
 });
}
