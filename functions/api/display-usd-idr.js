const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=300, s-maxage=900, stale-while-revalidate=3600','X-Content-Type-Options':'nosniff'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:HEADERS});
let memory=null;
let memoryAt=0;

export async function onRequestGet(){
  const now=Date.now();
  if(memory && now-memoryAt<15*60*1000) return json({...memory,cache:'memory'});
  try{
    const response=await fetch('https://api.exchangerate-api.com/v4/latest/USD',{headers:{Accept:'application/json','User-Agent':'KriptoAman-Display-FX/1.0'},signal:AbortSignal.timeout(7000)});
    if(!response.ok) throw new Error(`FX HTTP ${response.status}`);
    const payload=await response.json();
    const rate=Number(payload?.rates?.IDR);
    if(!Number.isFinite(rate)||rate<=0) throw new Error('IDR rate unavailable');
    memory={status:'live',base:'USD',quote:'IDR',rate,source:'exchange-rate-reference',displayOnly:true,capturedAt:now};
    memoryAt=now;
    return json(memory);
  }catch{
    if(memory) return json({...memory,status:'stale',cache:'last-verified'});
    return json({status:'unavailable',displayOnly:true,code:'DISPLAY_FX_UNAVAILABLE'},503);
  }
}
