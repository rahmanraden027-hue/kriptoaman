// Bounded, public, read-only ZEVARYQ RPC/browser preflight diagnostic.
// No signing, submission, credential access, SSH, server configuration or retries.
import {writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const RPC='https://rpc.kriptoaman.com/';
const BLOCKS='https://explorer.kriptoaman.com/api/v2/blocks';
const APPROVED=['https://explorer.kriptoaman.com','https://kriptoaman.com'];
const UNAPPROVED='https://untrusted.invalid';
const tokens=value=>String(value||'').toLowerCase().split(',').map(s=>s.trim());
export function evaluatePreflight(status,headers,origin){
 const allowOrigin=headers.get('access-control-allow-origin');
 const methods=tokens(headers.get('access-control-allow-methods'));
 const allowedHeaders=tokens(headers.get('access-control-allow-headers'));
 return {status,approvedOrigin:allowOrigin===origin,postAllowed:methods.includes('post'),
  contentTypeAllowed:allowedHeaders.includes('content-type'),
  pass:status===204&&allowOrigin===origin&&methods.includes('post')&&allowedHeaders.includes('content-type')};
}
export function evaluateUnapprovedPreflight(status,headers){
 const allowOrigin=headers.get('access-control-allow-origin');
 return {status,exposedToBrowser:allowOrigin==='*'||allowOrigin===UNAPPROVED,pass:status===403&&!allowOrigin};
}
export function parseRpcResult(value,method){
 if(!value||value.jsonrpc!=='2.0'||value.error||typeof value.result!=='string')
  throw new Error(method+': missing verified JSON-RPC result');
 if(method==='eth_chainId'&&value.result.toLowerCase()!=='0x560c')throw new Error('Unexpected Chain ID');
 if(method==='eth_blockNumber'&&!/^0x[0-9a-f]+$/i.test(value.result))throw new Error('Invalid block height');
 return value.result;
}
export function classifyAdminResponse(status,body){
 const error=body?.jsonrpc==='2.0'&&body.error&&typeof body.error==='object'&&!Object.prototype.hasOwnProperty.call(body,'result')?body.error:null;
 const denied=!!error&&[-32601,-32604,-32000,-32001].includes(Number(error.code))&&
  /method.*(not found|not enabled|disabled|not allowed|denied|unsupported)|forbidden|unauthori[sz]ed|access denied/.test(String(error.message||'').toLowerCase());
 return {httpStatus:status,errorCode:error?Number(error.code):null,
  resultPresent:body?Object.prototype.hasOwnProperty.call(body,'result'):null,
  blocked:status===403||status===200&&denied};
}
async function request(url,init={}){
 return fetch(url,{...init,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(12000)});
}
async function rpc(method,id){
 const response=await request(RPC,{method:'POST',
  headers:{'content-type':'application/json',origin:APPROVED[0]},
  body:JSON.stringify({jsonrpc:'2.0',id,method,params:[]})});
 if(response.status!==200)throw new Error(method+': HTTP '+response.status);
 return parseRpcResult(await response.json(),method);
}
export async function collectEvidence(){
 const e={checkedAt:new Date().toISOString(),scope:'public-read-only',chainIdExpected:'0x560c',
  requestsMaximum:8,preflight:{},unapproved:null,rpc:{},indexer:{},privilegedBlocked:null,failures:[]};
 const run=async(name,fn)=>{try{return await fn();}catch(err){
   e.failures.push(name+': '+(err?.name==='TimeoutError'?'timeout':String(err?.message||err)));return null;
 }};
 for(const origin of APPROVED)await run('preflight '+origin,async()=>{
  const response=await request(RPC,{method:'OPTIONS',headers:{
   origin,'access-control-request-method':'POST','access-control-request-headers':'content-type'}});
  const result=evaluatePreflight(response.status,response.headers,origin);
  e.preflight[origin]=result;
  if(!result.pass)throw new Error('HTTP '+result.status+' allow-origin='+result.approvedOrigin+
    ' POST='+result.postAllowed+' Content-Type='+result.contentTypeAllowed);
 });
 await run('unapproved preflight',async()=>{
  const response=await request(RPC,{method:'OPTIONS',headers:{
   origin:UNAPPROVED,'access-control-request-method':'POST','access-control-request-headers':'content-type'}});
  e.unapproved=evaluateUnapprovedPreflight(response.status,response.headers);
  if(!e.unapproved.pass)throw new Error('unexpected origin handling HTTP '+response.status);
 });
 await run('RPC Chain ID',async()=>{e.rpc.chainId=await rpc('eth_chainId',1);});
 await run('RPC block head',async()=>{e.rpc.blockNumber=Number(BigInt(await rpc('eth_blockNumber',2)));});
 await run('privileged method rejection',async()=>{
  const response=await request(RPC,{method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({jsonrpc:'2.0',id:3,method:'admin_peers',params:[]})});
  const payload=response.status===200?await response.json().catch(()=>null):null;
  e.adminProbe=classifyAdminResponse(response.status,payload);
  e.privilegedBlocked=e.adminProbe.blocked;
  if(!e.privilegedBlocked)throw new Error('admin_peers not confirmed denied; HTTP '+response.status);
 });
 await run('indexed block tip',async()=>{
  const response=await request(BLOCKS);
  e.indexer.status=response.status;
  if(response.status!==200)throw new Error('HTTP '+response.status);
  const payload=await response.json();
  const tip=Number(payload?.items?.[0]?.height);
  if(!Number.isSafeInteger(tip)||tip<0)throw new Error('indexed block height unavailable');
  e.indexer.latestBlock=tip;
 });
 e.rpcIndexerGap=Number.isSafeInteger(e.rpc.blockNumber)&&Number.isSafeInteger(e.indexer.latestBlock)?
  e.rpc.blockNumber-e.indexer.latestBlock:null;
 if(e.rpcIndexerGap!==null&&(e.rpcIndexerGap < -5||e.rpcIndexerGap>5))
  e.failures.push('RPC/indexer gap '+e.rpcIndexerGap+' exceeds ±5');
 e.pass=e.failures.length===0;
 return e;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const output=resolve(process.env.ZVQ_CORS_AUDIT_PATH||'zvq-rpc-cors-audit.json');
 const result=await collectEvidence();
 await mkdir(dirname(output),{recursive:true});
 await writeFile(output,JSON.stringify(result,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify(result));
 if(!result.pass)process.exitCode=1;
}
