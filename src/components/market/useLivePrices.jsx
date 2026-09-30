import { useEffect, useRef, useState } from 'react';

const LIVE_CACHE_KEY='ka_live_prices_v2';
const HOT_FEED_ENDPOINT='/api/market-feed-hot';
const SNAPSHOT_ENDPOINT='/api/market-hot';
const DISPLAY_FX_ENDPOINT='/api/display-usd-idr';
const HOT_POLL_INTERVAL_MS=5000;
const SNAPSHOT_POLL_INTERVAL_MS=15000;
const REQUEST_TIMEOUT_MS=7000;

const loadCache=()=>{
  try{
    const cached=JSON.parse(localStorage.getItem(LIVE_CACHE_KEY)||'null');
    return cached&&typeof cached==='object'?cached:null;
  }catch{return null;}
};

const normalizeCollector=(payload)=>{
  const next={};
  if(!Array.isArray(payload?.assets))return next;
  for(const item of payload.assets){
    const symbol=String(item?.symbol||'').toUpperCase();
    const price=Number(item?.price);
    if(!symbol||!Number.isFinite(price)||price<=0)continue;
    next[symbol]={
      price,
      change24h:Number.isFinite(Number(item?.change24h))?Number(item.change24h):null,
      high24h:Number.isFinite(Number(item?.high24h))?Number(item.high24h):null,
      low24h:Number.isFinite(Number(item?.low24h))?Number(item.low24h):null,
      volume24h:Number.isFinite(Number(item?.volume24h))?Number(item.volume24h):null,
      provenance:{venues:Array.isArray(item?.venues)?item.venues:[],quality:item?.quality||null,observedAt:Number(item?.observedAt)||null},
    };
  }
  return next;
};

const normalizeSnapshot=(payload)=>{
  const next={};
  if(!Array.isArray(payload?.data))return next;
  for(const item of payload.data){
    const symbol=String(item?.symbol||'').toUpperCase();
    const price=Number(item?.price);
    if(!symbol||!Number.isFinite(price)||price<=0)continue;
    next[symbol==='POL'?'MATIC':symbol]={
      price,
      change24h:Number.isFinite(Number(item?.change24h))?Number(item.change24h):null,
      high24h:Number.isFinite(Number(item?.high24h))?Number(item.high24h):null,
      low24h:Number.isFinite(Number(item?.low24h))?Number(item.low24h):null,
      volume24h:Number.isFinite(Number(item?.volume24h))?Number(item.volume24h):null,
    };
  }
  return next;
};

async function fetchJson(url){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT_MS);
  try{
    const response=await fetch(url,{headers:{Accept:'application/json'},cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error(`${url} HTTP ${response.status}`);
    return await response.json();
  }finally{clearTimeout(timer);}
}

export default function useLivePrices(){
  const cached=loadCache();
  const [prices,setPrices]=useState(cached?.prices||{});
  const [connected,setConnected]=useState(false);
  const [idrRate,setIdrRate]=useState(Number.isFinite(Number(cached?.idrRate))?Number(cached.idrRate):null);
  const [feedSource,setFeedSource]=useState(cached?.feedSource||'cache');
  const [lastLiveUpdate,setLastLiveUpdate]=useState(Number(cached?.savedAt)||null);
  const mounted=useRef(true);
  const persistAt=useRef(0);

  useEffect(()=>{
    const now=Date.now();
    if(!Object.keys(prices).length||now-persistAt.current<15000)return;
    try{
      localStorage.setItem(LIVE_CACHE_KEY,JSON.stringify({savedAt:now,idrRate,feedSource,prices}));
      persistAt.current=now;
    }catch{}
  },[prices,idrRate,feedSource]);

  useEffect(()=>{
    let timer;
    let alive=true;
    const loadFx=async()=>{
      try{
        const payload=await fetchJson(DISPLAY_FX_ENDPOINT);
        const rate=Number(payload?.rate);
        if(alive&&Number.isFinite(rate)&&rate>0)setIdrRate(rate);
      }catch{}
      finally{if(alive)timer=setTimeout(loadFx,5*60*1000);}
    };
    loadFx();
    return()=>{alive=false;clearTimeout(timer);};
  },[]);

  useEffect(()=>{
    mounted.current=true;
    let hotTimer;
    let snapshotTimer;

    const apply=(next,source,isConnected)=>{
      if(!mounted.current||!Object.keys(next).length)return;
      setPrices(prev=>{
        const merged={...prev};
        for(const [symbol,data] of Object.entries(next)){
          merged[symbol]={
            ...prev[symbol],
            ...data,
            tick:prev[symbol]?.price?data.price>prev[symbol].price?'up':data.price<prev[symbol].price?'down':null:null,
          };
        }
        return merged;
      });
      setFeedSource(source);
      setConnected(isConnected);
      setLastLiveUpdate(Date.now());
    };

    const pollHot=async()=>{
      try{
        const payload=await fetchJson(HOT_FEED_ENDPOINT);
        const next=normalizeCollector(payload);
        if(!Object.keys(next).length)throw new Error('empty collector feed');
        apply(next,'kriptoaman-market-feed',payload.status==='live'||payload.status==='degraded');
      }catch{
        if(mounted.current)setConnected(false);
      }finally{
        if(mounted.current)hotTimer=setTimeout(pollHot,HOT_POLL_INTERVAL_MS);
      }
    };

    const pollSnapshot=async()=>{
      try{
        const payload=await fetchJson(SNAPSHOT_ENDPOINT);
        const next=normalizeSnapshot(payload);
        apply(next,'kriptoaman-market-hot',false);
      }catch{}
      finally{
        if(mounted.current)snapshotTimer=setTimeout(pollSnapshot,SNAPSHOT_POLL_INTERVAL_MS);
      }
    };

    pollHot();
    pollSnapshot();

    return()=>{
      mounted.current=false;
      clearTimeout(hotTimer);
      clearTimeout(snapshotTimer);
    };
  },[]);

  return {prices,connected,idrRate,feedSource,lastLiveUpdate};
}
