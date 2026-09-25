// Bounded, read-only public RPC recovery proof; no keys, signing, or writes.
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';

const rpcUrl='https://rpc.kriptoaman.com/';
const explorerOrigin='https://explorer.kriptoaman.com';
const report={checkedAt:new Date().toISOString(),scope:'read-only public RPC browser preflight, chain identity and indexer parity',checks:{},ready:false};
let rateLimited=false;
async function read(url,options={}){
  if(rateLimited)throw Error('Stopped after HTTP 429');
  const response=await fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(12000)});
  if(response.status===429)rateLimited=true;
  return response;
}
async function probe(label,fn){
  try{report.checks[label]=await fn();}
  catch(error){report.checks[label]={ok:false,error:String(error?.message||error).slice(0,180)};}
}
const post=async(method,params=[])=>{
  const response=await read(rpcUrl,{method:'POST',headers:{'content-type':'application/json',origin:explorerOrigin},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
  const payload=await response.json().catch(()=>null);
  return {response,payload};
};
await probe('browserPreflight',async()=>{
  const response=await read(rpcUrl,{method:'OPTIONS',headers:{origin:explorerOrigin,'access-control-request-method':'POST','access-control-request-headers':'content-type'}});
  const origin=response.headers.get('access-control-allow-origin');
  const methods=response.headers.get('access-control-allow-methods')||'';
  const headers=response.headers.get('access-control-allow-headers')||'';
  const credentials=response.headers.get('access-control-allow-credentials');
  return {ok:response.status===204&&(origin==='*'||origin===explorerOrigin)&&/\bPOST\b/i.test(methods)&&/\bcontent-type\b/i.test(headers)&&!(origin==='*'&&credentials==='true'),
    status:response.status,allowedOrigin:origin,allowedMethods:methods,allowedHeaders:headers};
});
await probe('rpcChainId',async()=>{
  const {response,payload}=await post('eth_chainId');
  const allowOrigin=response.headers.get('access-control-allow-origin');
  return {ok:response.status===200&&payload?.result==='0x560c'&&(allowOrigin==='*'||allowOrigin===explorerOrigin),
    status:response.status,chainId:payload?.result??null,allowedOrigin:allowOrigin};
});
let currentHeight=null;
await probe('blockProgress',async()=>{
  const first=await post('eth_blockNumber');
  if(first.response.status!==200||!/^0x[0-9a-f]+$/i.test(first.payload?.result||''))return {ok:false,status:first.response.status};
  await new Promise(done=>setTimeout(done,4000));
  const second=await post('eth_blockNumber');
  if(second.response.status!==200||!/^0x[0-9a-f]+$/i.test(second.payload?.result||''))return {ok:false,status:second.response.status};
  const start=parseInt(first.payload.result,16);
  currentHeight=parseInt(second.payload.result,16);
  return {ok:currentHeight>start,from:start,to:currentHeight};
});
await probe('privilegedMethodDenied',async()=>{
  const {response,payload}=await post('admin_peers');
  return {ok:response.status===403||response.status===200&&payload?.error?.code===-32601,status:response.status,errorCode:payload?.error?.code??null};
});
await probe('explorerParity',async()=>{
  const response=await read(explorerOrigin+'/api/v2/blocks',{headers:{accept:'application/json'}});
  if(!response.ok)return {ok:false,status:response.status};
  const data=await response.json();
  const indexHeight=Number(data?.items?.[0]?.height);
  const distance=Number.isInteger(currentHeight)?Math.abs(currentHeight-indexHeight):null;
  return {ok:Number.isInteger(indexHeight)&&distance!==null&&distance<=5,status:response.status,indexHeight,rpcHeight:currentHeight,distance};
});
report.ready=Object.values(report.checks).every(v=>v?.ok===true);
const dir=resolve(process.env.ZVQ_BROWSER_EVIDENCE_DIR||'zvq-public-browser-proof');
await mkdir(dir,{recursive:true});
await writeFile(join(dir,'rpc-cors-proof.json'),JSON.stringify(report,null,2));
console.log('ZVQ_RPC_PUBLIC_PROOF='+JSON.stringify(report));
if(!report.ready)process.exitCode=1;
