import React, { useEffect, useState } from 'react';

const TICKER_ASSETS=[
  {id:'BTC',symbol:'BTC/USD',color:'#F7931A'},
  {id:'ETH',symbol:'ETH/USD',color:'#627EEA'},
  {id:'SOL',symbol:'SOL/USD',color:'#9945FF'},
  {id:'XRP',symbol:'XRP/USD',color:'#00AAE4'},
  {id:'ADA',symbol:'ADA/USD',color:'#0033AD'},
  {id:'DOGE',symbol:'DOGE/USD',color:'#C2A633'},
  {id:'AVAX',symbol:'AVAX/USD',color:'#E84142'},
  {id:'DOT',symbol:'DOT/USD',color:'#E6007A'},
  {id:'LINK',symbol:'LINK/USD',color:'#375BD2'},
  {id:'LTC',symbol:'LTC/USD',color:'#A0A0A0'},
];
const POLL_MS=5000;

function formatTickerPrice(price){
  if(!Number.isFinite(price))return '—';
  if(price>=10000)return '$'+price.toLocaleString('en-US',{maximumFractionDigits:0});
  if(price>=100)return '$'+price.toFixed(2);
  if(price>=1)return '$'+price.toFixed(3);
  if(price>=0.01)return '$'+price.toFixed(4);
  return '$'+price.toFixed(6);
}

export default function LiveTickerBar(){
  const [prices,setPrices]=useState({});
  const [connected,setConnected]=useState(false);

  useEffect(()=>{
    let alive=true;
    let timer;
    const poll=async()=>{
      try{
        const response=await fetch('/api/market-feed-hot',{headers:{Accept:'application/json'},cache:'no-store'});
        if(!response.ok)throw new Error('hot feed unavailable');
        const payload=await response.json();
        if(!Array.isArray(payload?.assets))throw new Error('invalid hot feed');
        const next={};
        for(const item of payload.assets){
          const symbol=String(item?.symbol||'').toUpperCase();
          const price=Number(item?.price);
          const change24h=Number(item?.change24h);
          if(!symbol||!Number.isFinite(price)||!Number.isFinite(change24h))continue;
          next[symbol]={price,change24h,quality:item?.quality||null,venues:Array.isArray(item?.venues)?item.venues:[]};
        }
        if(!alive)return;
        setPrices(previous=>{
          const merged={...previous};
          for(const [symbol,data] of Object.entries(next)){
            merged[symbol]={...data,tick:previous[symbol]?.price?data.price>previous[symbol].price?'up':data.price<previous[symbol].price?'down':null:null};
          }
          return merged;
        });
        setConnected(['live','degraded'].includes(payload?.status));
      }catch{
        if(alive)setConnected(false);
      }finally{
        if(alive)timer=setTimeout(poll,POLL_MS);
      }
    };
    poll();
    return()=>{alive=false;clearTimeout(timer);};
  },[]);

  const liveAssets=TICKER_ASSETS.filter(asset=>{
    const data=prices[asset.id];
    return Number.isFinite(data?.price)&&Number.isFinite(data?.change24h);
  });

  if(!connected||liveAssets.length<2)return null;
  const items=[...liveAssets,...liveAssets];

  return(
    <div className="relative h-8 w-full overflow-hidden border-b border-slate-800/60 bg-slate-950/90" aria-label="KriptoAman live cryptocurrency market ticker">
      <div className="ticker-scroll flex h-full items-center gap-6 whitespace-nowrap px-4">
        {items.map((asset,index)=>{
          const data=prices[asset.id];
          const change=data.change24h;
          const isUp=change>=0;
          return(
            <div key={`${asset.id}-${index}`} className="flex shrink-0 items-center gap-1.5 text-xs" title={`KriptoAman feed · ${(data.venues||[]).join(' + ')}`}>
              <div className="h-3 w-3 shrink-0 rounded-full" style={{background:asset.color}} aria-hidden="true"/>
              <span className="font-medium text-slate-400">{asset.symbol}</span>
              <span className={`font-bold transition-colors duration-300 ${data.tick==='up'?'text-green-300':data.tick==='down'?'text-red-300':'text-white'}`}>{formatTickerPrice(data.price)}</span>
              <span className={`text-[10px] font-semibold ${isUp?'text-green-400':'text-red-400'}`}>{isUp?'▲':'▼'}{Math.abs(change).toFixed(2)}%</span>
            </div>
          );
        })}
      </div>
      <style>{`
        .ticker-scroll { animation: ticker-move 60s linear infinite; }
        .ticker-scroll:hover { animation-play-state: paused; }
        @keyframes ticker-move { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}
