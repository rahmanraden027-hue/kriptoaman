/** Public read-only ZEVARYQ treasury reconciliation. No signing, transfers or host changes. */
const RPC = 'https://rpc.kriptoaman.com';
const EXPLORER = 'https://explorer.kriptoaman.com';
const EXPECTED_CHAIN_ID = '0x560c';
const ADDRESSES = [
  { role:'repository-labelled official treasury / operator MetaMask', address:'0xab481451eaf642384d2d9888b355f10d327c5de9', provenance:'functions/api/kam/address-profile/[address].js' },
  { role:'reconstructed-genesis CANDIDATE, not independently verified', address:'0xd74ea7d92bbb40d475bccea170367b85971acb0f', provenance:'historical operator incident notes; protected-host confirmation required' }
];
const TRANSACTIONS = [
  { hash:'0x1b597a6ad4556e5d1be09effd2d79f2659379006dfc492060e3fed30678883d6', provenance:'historically reported transfer, current-chain inclusion not established' },
  { hash:'0x9854d90159013d488190d0f1847596a5dfb7582812f880102f167a1b172b163a', provenance:'known Explorer reference transaction, treasury relation unproven' }
];
if(!ADDRESSES.every(x=>/^0x[0-9a-f]{40}$/i.test(x.address))) throw new Error('Invalid address');
if(!TRANSACTIONS.every(x=>/^0x[0-9a-f]{64}$/i.test(x.hash))) throw new Error('Invalid hash');
let rpcCount=0;
let rateLimited=false;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const errorText=err=>String(err?.message??err).slice(0,260);
async function publicFetch(url,options={}) {
  const response=await fetch(url,{...options,signal:AbortSignal.timeout(12000),headers:{accept:'application/json','user-agent':'KriptoAman-ZVQ-Treasury-ReadOnly-Audit/1.0',...options.headers}});
  if(response.status===429)rateLimited=true;
  if(!response.ok)throw new Error('HTTP '+response.status);
  return response.json();
}
async function rpc(method,params=[]) {
  if(rateLimited)throw new Error('STOP: HTTP 429; no more probes');
  if(++rpcCount>14)throw new Error('Read-only request budget exceeded');
  await sleep(550);
  const result=await publicFetch(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:rpcCount,method,params})});
  if(result.error)throw new Error('JSON-RPC '+result.error.code+': '+result.error.message);
  if(!('result' in result))throw new Error('Missing JSON-RPC result');
  return result.result;
}
async function probe(fn){try{return{ok:true,value:await fn()};}catch(e){return{ok:false,error:errorText(e)};}}
function formatWei(input){const v=BigInt(input),unit=10n**18n;const frac=(v%unit).toString().padStart(18,'0').replace(/0+$/,'');return String(v/unit)+(frac?'.'+frac:'');}
const report={
 schema:'kriptoaman-zvq-treasury-readonly-v1', collectedAtUtc:new Date().toISOString(),
 expectedChainId:EXPECTED_CHAIN_ID,sourceUrls:{rpc:RPC,explorer:EXPLORER},
 caveat:'Public evidence only; cannot establish original-chain allocations, signer custody, or recovery of funds.',
 rpc:{},addresses:[],transactions:[],blockscout:{},gates:{}
};
report.rpc.chainId=await probe(()=>rpc('eth_chainId'));
const identityOk=report.rpc.chainId.ok&&String(report.rpc.chainId.value).toLowerCase()===EXPECTED_CHAIN_ID;
report.gates.chainIdentityMatches=identityOk;
if(identityOk){
  report.rpc.firstHead=await probe(()=>rpc('eth_blockNumber'));
  report.rpc.genesisHeader=await probe(async()=>{const x=await rpc('eth_getBlockByNumber',['0x0',false]);return x?{hash:x.hash,number:x.number,stateRoot:x.stateRoot,transactionsRoot:x.transactionsRoot}:null;});
  for(const candidate of ADDRESSES){
    const row={...candidate};
    row.nativeBalance=await probe(async()=>{const hex=await rpc('eth_getBalance',[candidate.address,'latest']);return{wei:BigInt(hex).toString(),zvq:formatWei(hex)};});
    row.nonce=await probe(async()=>Number(BigInt(await rpc('eth_getTransactionCount',[candidate.address,'latest']))));
    report.addresses.push(row);
    if(rateLimited)break;
  }
  for(const tx of TRANSACTIONS){
    const entry={...tx,receipt:await probe(async()=>{const r=await rpc('eth_getTransactionReceipt',[tx.hash]);return r?{blockHash:r.blockHash,blockNumber:r.blockNumber,from:r.from,to:r.to,status:r.status,transactionHash:r.transactionHash}:null;})};
    report.transactions.push(entry);
    if(rateLimited)break;
  }
  if(!rateLimited){
    await sleep(3300);
    report.rpc.secondHead=await probe(()=>rpc('eth_blockNumber'));
    if(report.rpc.firstHead?.ok&&report.rpc.secondHead?.ok)report.gates.blockAdvanced=BigInt(report.rpc.secondHead.value)>BigInt(report.rpc.firstHead.value);
  }
}
const inspected=[];
for(const candidate of ADDRESSES){
 if(rateLimited)break;
 const address=candidate.address;
 const account=await probe(async()=>{const p=await publicFetch(EXPLORER+'/api/v2/addresses/'+address);return{hash:p.hash,coin_balance:p.coin_balance,transactions_count:p.transactions_count,token_transfers_count:p.token_transfers_count};});
 await sleep(550);
 const txs=await probe(async()=>{const p=await publicFetch(EXPLORER+'/api/v2/addresses/'+address+'/transactions');return{returnedCount:Array.isArray(p.items)?p.items.length:null,nextPageParams:p.next_page_params??null,samples:(p.items??[]).slice(0,3).map(t=>({hash:t.hash,from:t.from?.hash,to:t.to?.hash,value:t.value,block_number:t.block_number}))};});
 inspected.push({role:candidate.role,address,account,transactions:txs});
 await sleep(550);
}
report.blockscout.addresses=inspected;
report.blockscout.latestBlock=await probe(async()=>{const p=await publicFetch(EXPLORER+'/api/v2/blocks');const b=p.items?.[0];return b?{height:b.height,hash:b.hash,transactions_count:b.tx_count}:null;});
report.gates.officialTreasuryBalanceObserved=report.addresses.some(x=>x.address===ADDRESSES[0].address&&x.nativeBalance?.ok);
report.gates.reconstructedCandidateBalanceObserved=report.addresses.some(x=>x.address===ADDRESSES[1].address&&x.nativeBalance?.ok);
report.gates.noRateLimit=!rateLimited;
report.disposition=identityOk&&report.gates.officialTreasuryBalanceObserved&&report.gates.reconstructedCandidateBalanceObserved?'PUBLIC_SNAPSHOT_COLLECTED__HISTORICAL_GENESIS_RECONCILIATION_REQUIRED':'INCOMPLETE__NO_FUNDS_LOCATION_CONCLUSION';
console.log(JSON.stringify(report,null,2));