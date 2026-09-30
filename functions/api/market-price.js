import { readSession } from '../_shared/d1-session.js';

const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:HEADERS});

function requestedSymbols(request){
  const url=new URL(request.url);
  return [...new Set((url.searchParams.get('symbols')||'').split(',').map(s=>s.trim().toUpperCase()).filter(s=>/^[A-Z0-9]{2,12}$/.test(s)))].slice(0,50);
}

function normalizeSnapshotRows(rows){
  const map=new Map();
  for(const row of Array.isArray(rows)?rows:[]){
    const symbol=String(row?.symbol||'').toUpperCase();
    const price=Number(row?.current_price);
    if(!symbol||!Number.isFinite(price)||price<=0||map.has(symbol))continue;
    map.set(symbol,{
      symbol,
      price,
      change24h:Number.isFinite(Number(row?.price_change_percentage_24h))?Number(row.price_change_percentage_24h):null,
      marketCap:Number.isFinite(Number(row?.market_cap))?Number(row.market_cap):null,
      volume24h:Number.isFinite(Number(row?.total_volume))?Number(row.total_volume):null,
      high24h:Number.isFinite(Number(row?.high_24h))?Number(row.high_24h):null,
      low24h:Number.isFinite(Number(row?.low_24h))?Number(row.low_24h):null,
      sourceLayer:'market-snapshot',
    });
  }
  return map;
}

export async function onRequestGet({request,env}){
  const symbols=requestedSymbols(request);
  if(!symbols.length)return json({error:'symbols query is required',code:'MARKET_PRICE_SYMBOLS_REQUIRED'},400);
  if(!env?.AUTH_DB)return json({status:'unavailable',code:'MARKET_DB_MISSING'},503);

  try{
    const db=readSession(env.AUTH_DB);
    const result=new Map();
    let snapshotCapturedAt=null;
    let hotCapturedAt=null;

    const snapshot=await db.prepare("SELECT captured_at,payload FROM market_snapshots WHERE id='global'").first();
    if(snapshot?.payload){
      try{
        const rows=JSON.parse(snapshot.payload);
        const normalized=normalizeSnapshotRows(rows);
        for(const symbol of symbols)if(normalized.has(symbol))result.set(symbol,normalized.get(symbol));
        snapshotCapturedAt=Number(snapshot.captured_at)||null;
      }catch{}
    }

    try{
      const hot=await db.prepare("SELECT captured_at,payload FROM market_feed_hot WHERE id='global'").first();
      const hotAt=Number(hot?.captured_at)||0;
      if(hot?.payload&&Date.now()-hotAt<=60_000){
        const payload=JSON.parse(hot.payload);
        for(const asset of Array.isArray(payload?.assets)?payload.assets:[]){
          const symbol=String(asset?.symbol||'').toUpperCase();
          if(!symbols.includes(symbol))continue;
          const price=Number(asset?.price);
          if(!Number.isFinite(price)||price<=0)continue;
          result.set(symbol,{
            ...(result.get(symbol)||{symbol}),
            symbol,
            price,
            change24h:Number.isFinite(Number(asset?.change24h))?Number(asset.change24h):result.get(symbol)?.change24h??null,
            volume24h:Number.isFinite(Number(asset?.volume24h))?Number(asset.volume24h):result.get(symbol)?.volume24h??null,
            high24h:Number.isFinite(Number(asset?.high24h))?Number(asset.high24h):result.get(symbol)?.high24h??null,
            low24h:Number.isFinite(Number(asset?.low24h))?Number(asset.low24h):result.get(symbol)?.low24h??null,
            sourceLayer:'market-feed',
            venues:Array.isArray(asset?.venues)?asset.venues:[],
            quality:asset?.quality||null,
          });
        }
        hotCapturedAt=hotAt;
      }
    }catch{}

    const data=symbols.map(symbol=>result.get(symbol)).filter(Boolean);
    if(!data.length)return json({status:'unavailable',symbols,code:'MARKET_PRICE_UNAVAILABLE'},503);
    return json({
      status:'available',
      data,
      provenance:{apiOwnership:'KriptoAman',browserDirectProviderAccess:false,hotCapturedAt,snapshotCapturedAt},
      generatedAt:Date.now(),
    });
  }catch(error){
    console.error('Market price lookup failed',error);
    return json({status:'unavailable',code:'MARKET_PRICE_LOOKUP_FAILED'},503);
  }
}
