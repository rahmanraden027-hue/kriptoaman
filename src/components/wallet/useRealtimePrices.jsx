import { useEffect, useRef, useState } from 'react';
import { getReadOnlyMarketPrices } from '@/lib/readOnlyMarketPrices';

const PRICE_ALIASES={BASE:'ETH',ARB:'ARB_TOKEN',OP:'OP_TOKEN'};
const HOT_ENDPOINT='/api/market-feed-hot';
const POLL_MS=5000;

function normalize(payload){
  const next={};
  if(!Array.isArray(payload?.assets)) return next;
  for(const item of payload.assets){
    const symbol=String(item?.symbol||'').toUpperCase();
    const price=Number(item?.price);
    if(!symbol||!Number.isFinite(price)||price<=0) continue;
    next[symbol]={
      price,
      change24h:Number.isFinite(Number(item?.change24h))?Number(item.change24h):null,
      high24h:Number.isFinite(Number(item?.high24h))?Number(item.high24h):null,
      low24h:Number.isFinite(Number(item?.low24h))?Number(item.low24h):null,
      volume24h:Number.isFinite(Number(item?.volume24h))?Number(item.volume24h):null,
      venues:Array.isArray(item?.venues)?item.venues:[],
    };
  }
  if(next.ARB) next.ARB_TOKEN={...next.ARB};
  if(next.OP) next.OP_TOKEN={...next.OP};
  Object.entries(PRICE_ALIASES).forEach(([alias,source])=>{if(next[source])next[alias]={...next[source]};});
  return next;
}

export default function useRealtimePrices(){
  const [prices,setPrices]=useState({});
  const [wsConnected,setWsConnected]=useState(false);
  const mounted=useRef(true);

  useEffect(()=>{
    mounted.current=true;
    getReadOnlyMarketPrices().then(initial=>{if(mounted.current)setPrices(initial);}).catch(()=>{});
    let timer;
    const poll=async()=>{
      try{
        const response=await fetch(HOT_ENDPOINT,{headers:{Accept:'application/json'},cache:'no-store'});
        if(!response.ok) throw new Error('hot feed unavailable');
        const payload=await response.json();
        const next=normalize(payload);
        if(!mounted.current||Object.keys(next).length===0) throw new Error('empty hot feed');
        setPrices(prev=>{
          const merged={...prev};
          for(const [id,data] of Object.entries(next)){
            merged[id]={...data,tick:prev[id]?.price?data.price>prev[id].price?'up':data.price<prev[id].price?'down':null:null};
          }
          return merged;
        });
        setWsConnected(payload.status==='live'||payload.status==='degraded');
      }catch{
        if(mounted.current)setWsConnected(false);
      }finally{
        if(mounted.current)timer=setTimeout(poll,POLL_MS);
      }
    };
    poll();
    return()=>{mounted.current=false;clearTimeout(timer);};
  },[]);

  return {prices,wsConnected};
}
