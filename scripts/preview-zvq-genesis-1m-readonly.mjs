#!/usr/bin/env node
// One-time read-only preparation. Public chain data only. No wallet, key, signature or send methods.
import { RPCS, hexBigInt, format18, compareBlock } from './verify-zvq-same-block-balances.mjs';
const SOURCE = '0xd74ea7d92bbb40d475bcea170367b85971acb0f'; // user-supplied Genesis label, NOT ownership verified
const DEST = '0x9d4b034758202ce555504d038f92a344540d47b0'; // current ownership unverified
const AMOUNT = 1000000n * 10n ** 18n;
const READ = new Set(['eth_chainId','eth_blockNumber','eth_getBlockByNumber','eth_getBalance','eth_getCode','eth_gasPrice','eth_estimateGas']);
let calls = 0;
export const previewParameters = Object.freeze({source:SOURCE,destination:DEST,amountWei:AMOUNT.toString(),chainId:22028});
export async function rpc(url,method,params=[],fetchFn=fetch) {
  if (!RPCS.includes(url) || !READ.has(method) || ++calls>28) throw new Error('Read-only request refused');
  const response=await fetchFn(url,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jsonrpc:'2.0',id:calls,method,params}),signal:AbortSignal.timeout(12000)});
  if(!response.ok) throw new Error(method+' HTTP '+response.status);
  const data=await response.json();
  if(data?.error||data?.result===undefined||data?.result===null)throw new Error(method+' rejected: '+(data?.error?.message||'missing result'));
  return data.result;
}
export async function makePreview({read=rpc,sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}) {
  if(!/^0x[0-9a-f]{40}$/i.test(SOURCE)||!/^0x[0-9a-f]{40}$/i.test(DEST)||SOURCE===DEST)throw Error('Invalid addresses');
  const chains=await Promise.all(RPCS.map(url=>read(url,'eth_chainId')));
  if(chains.some(x=>String(x).toLowerCase()!=='0x560c'))throw Error('Wrong network; refuse transfer preview');
  const first=await Promise.all(RPCS.map(url=>read(url,'eth_blockNumber')));
  await sleep(15000);
  const latest=await Promise.all(RPCS.map(url=>read(url,'eth_blockNumber')));
  const f=first.map(hexBigInt),l=latest.map(hexBigInt);
  if(l.some((x,i)=>x<=f[i]))throw Error('One or both RPC nodes stopped advancing');
  const gap=l[0]>=l[1]?l[0]-l[1]:l[1]-l[0];
  if(gap>5n)throw Error('RPC heights diverged by over five blocks');
  const height=(l[0]<l[1]?l[0]:l[1])-2n;
  if(height<=0n)throw Error('No stable shared block');
  const tag='0x'+height.toString(16);
  const blocks=await Promise.all(RPCS.map(url=>read(url,'eth_getBlockByNumber',[tag,false])));
  const hash=compareBlock(blocks[0],blocks[1],height);
  const pair=async(method,params)=>{
    const x=await Promise.all(RPCS.map(url=>read(url,method,params)));
    return x;
  };
  const [sourceA,sourceB]=await pair('eth_getBalance',[SOURCE,tag]);
  const [destA,destB]=await pair('eth_getBalance',[DEST,tag]);
  const balances=[hexBigInt(sourceA),hexBigInt(sourceB),hexBigInt(destA),hexBigInt(destB)];
  if(balances[0]!==balances[1]||balances[2]!==balances[3])throw Error('RPC balance mismatch at common block');
  const [codeA,codeB]=await pair('eth_getCode',[DEST,tag]);
  if(String(codeA).toLowerCase()!==String(codeB).toLowerCase())throw Error('Recipient code disagrees between RPCs');
  const recipientIsEOA=String(codeA).toLowerCase()==='0x';
  const [priceA,priceB]=await pair('eth_gasPrice');
  const prices=[hexBigInt(priceA),hexBigInt(priceB)];
  const conservativePrice=prices[0]>prices[1]?prices[0]:prices[1];
  const tx={from:SOURCE,to:DEST,value:'0x'+AMOUNT.toString(16)};
  let gasEstimate=null, estimateError=null;
  try {
    const [gasA,gasB]=await pair('eth_estimateGas',[tx]);
    const g=[hexBigInt(gasA),hexBigInt(gasB)];
    gasEstimate=g[0]>g[1]?g[0]:g[1];
    if(gasEstimate<21000n || gasEstimate>1000000n)throw Error('Gas estimate outside expected bound');
  } catch(error) {estimateError=String(error.message).slice(0,160);}
  // An EOA native transfer normally costs 21000 gas, even if a node rejects simulation for insufficient funds.
  const suggestedLimit=gasEstimate===null?(recipientIsEOA?21000n:null):(gasEstimate*12n+9n)/10n;
  const reserved=suggestedLimit===null?null:suggestedLimit*conservativePrice;
  const sufficient=reserved===null?null:balances[0]>=AMOUNT+reserved;
  return {
    checked_at:new Date().toISOString(), status:sufficient===null?'gas-unverified':sufficient?'balance-and-fee-sufficient':'insufficient-balance',
    chain_id:22028,network:'ZEVARYQ',user_labelled_genesis_ownership_verified:false,
    source:SOURCE,destination:DEST,amount_zvq:'1000000.000000000000000000',
    amount_wei:AMOUNT.toString(),at_block:tag,block_hash:hash,
    both_rpc_heads_advanced:true,head_gap_blocks:gap.toString(),providers_agree:true,
    source_balance_zvq:format18(balances[0]),destination_balance_zvq:format18(balances[2]),
    recipient_is_eoa:recipientIsEOA,
    gas_price_wei:conservativePrice.toString(),gas_price_gwei:format18(conservativePrice*1000000000n),
    gas_estimate:gasEstimate===null?null:gasEstimate.toString(),gas_limit_for_reserve:suggestedLimit===null?null:suggestedLimit.toString(),
    max_reserved_fee_zvq:reserved===null?null:format18(reserved),
    required_source_zvq:reserved===null?null:format18(AMOUNT+reserved),
    balance_sufficient:sufficient,estimate_warning:estimateError,
    simulated_only:true,signature_created:false,transactions_sent:0,
    note:'Preview based on public data at a specific block, not a guarantee of current ownership, finality or future gas.'
  };
}
if(process.argv[1] && import.meta.url.endsWith('/'+process.argv[1].split('/').pop())){
  try{const result=await makePreview();console.log(JSON.stringify(result));if(result.status==='gas-unverified')process.exitCode=2;}
  catch(error){console.error('ZVQ_PREVIEW_UNVERIFIED '+String(error.message));process.exitCode=1;}
}
