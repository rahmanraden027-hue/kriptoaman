/**
 * KriptoAman Market Data Service
 *
 * Browser boundary: all customer-facing price history is loaded from
 * KriptoAman-owned API paths. The backend history API serves persisted,
 * provenance-bearing candles only and never fills missing intervals with
 * generated values.
 */

const SUPPORTED_HISTORY_ASSETS=new Set(['BTC','ETH','BNB','SOL','XRP','USDT','USDC']);
const CACHE_TTL=5*60*1000;
const _historyCache=new Map();

const getCached=key=>{
  const cached=_historyCache.get(key);
  return cached&&Date.now()-cached.ts<CACHE_TTL?cached.data:null;
};
const putCached=(key,data)=>{
  _historyCache.set(key,{data,ts:Date.now()});
  return data;
};

function intervalFor(days,requested){
  if(['1h','4h','1d'].includes(requested))return requested;
  if(days<=31)return '1h';
  if(days<=180)return '4h';
  return '1d';
}

async function loadCandles(coinId,days=7,requestedInterval){
  const asset=String(coinId||'').toUpperCase();
  if(!SUPPORTED_HISTORY_ASSETS.has(asset))return [];
  const interval=intervalFor(days,requestedInterval);
  const to=Date.now();
  const from=to-Math.max(1,Number(days)||7)*24*60*60*1000;
  const url=new URL('/api/market-history',window.location.origin);
  url.searchParams.set('asset',asset);
  url.searchParams.set('interval',interval);
  url.searchParams.set('from',String(from));
  url.searchParams.set('to',String(to));
  url.searchParams.set('limit','500');

  const response=await fetch(url.pathname+url.search,{headers:{Accept:'application/json'},cache:'no-store'});
  if(!response.ok)return [];
  const payload=await response.json();
  return Array.isArray(payload?.candles)?payload.candles:[];
}

export async function getHistoricalData(coinId,days=7,interval='daily'){
  const key=`ohlc-${String(coinId).toUpperCase()}-${days}-${interval}`;
  const cached=getCached(key);
  if(cached)return cached;
  try{
    const candles=await loadCandles(coinId,days,intervalFor(days,interval));
    const data=candles.map(c=>({
      timestamp:Number(c.openTime),
      date:new Date(Number(c.openTime)).toLocaleDateString('en-US',{month:'short',day:'numeric'}),
      open:Number(c.open),
      high:Number(c.high),
      low:Number(c.low),
      close:Number(c.close),
      volume:c.volume==null?null:Number(c.volume),
      source:'kriptoaman-market-history',
      provider:c.provider||null,
    })).filter(row=>[row.timestamp,row.open,row.high,row.low,row.close].every(Number.isFinite));
    return putCached(key,data);
  }catch{return [];}
}

export async function getMarketChart(coinId,days=7,interval){
  const key=`chart-${String(coinId).toUpperCase()}-${days}-${interval||'auto'}`;
  const cached=getCached(key);
  if(cached)return cached;
  try{
    const candles=await loadCandles(coinId,days,interval);
    const data=candles.map(c=>({
      timestamp:Number(c.openTime),
      date:new Date(Number(c.openTime)).toLocaleString('en-US',days<=1?{hour:'2-digit',minute:'2-digit'}:{month:'short',day:'numeric'}),
      price:Number(c.close),
      source:'kriptoaman-market-history',
      provider:c.provider||null,
    })).filter(row=>Number.isFinite(row.timestamp)&&Number.isFinite(row.price));
    return putCached(key,data);
  }catch{return [];}
}

export async function getCurrentMarketPrice(coinId){
  const symbol=String(coinId||'').toUpperCase();
  if(!/^[A-Z0-9]{2,12}$/.test(symbol))return {price:null,change24h:null};
  try{
    const response=await fetch(`/api/market-price?symbols=${encodeURIComponent(symbol)}`,{headers:{Accept:'application/json'},cache:'no-store'});
    if(!response.ok)return {price:null,change24h:null};
    const payload=await response.json();
    const row=Array.isArray(payload?.data)?payload.data.find(item=>item?.symbol===symbol):null;
    return {
      price:Number.isFinite(Number(row?.price))?Number(row.price):null,
      change24h:Number.isFinite(Number(row?.change24h))?Number(row.change24h):null,
    };
  }catch{return {price:null,change24h:null};}
}

export async function getMultiAssetSnapshot(coinIds,days=30){
  const results={};
  await Promise.allSettled(coinIds.map(async id=>{results[id]=await getMarketChart(id,days);}));
  return results;
}

export function getForexRates(){return {};}
export function getForexHistory(){return [];}
export function getCommodityRates(){return {};}

const _subscribers=new Map();
export function subscribeToPrice(coinId,callback){
  if(!_subscribers.has(coinId))_subscribers.set(coinId,new Set());
  _subscribers.get(coinId).add(callback);
  return()=>_subscribers.get(coinId)?.delete(callback);
}
export function publishPrice(coinId,priceData){
  _subscribers.get(coinId)?.forEach(callback=>callback(priceData));
}
