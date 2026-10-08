// ZVQ public evidence inventory. Observational only; never authorizes trading.
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const explorer='https://explorer.kriptoaman.com';
const rpcUrl='https://rpc.kriptoaman.com/';
const reportDir=resolve(process.env.ZVQ_EVIDENCE_DIR||'zvq-four-scope-evidence');
await mkdir(reportDir,{recursive:true});
const report={schemaVersion:1,checkedAt:new Date().toISOString(),classification:'READ_ONLY_NOT_RELEASE_APPROVAL',
  expectedChainId:'0x560c',expectedValidatorCount:4,scopes:{},readyForFullLaunch:false};
const address=/^0x[0-9a-fA-F]{40}$/,hash=/^0x[0-9a-fA-F]{64}$/;
const integer=x=>/^0x[0-9a-fA-F]+$/.test(x||'')&&Number.isSafeInteger(parseInt(x,16))?parseInt(x,16):null;
let rid=0;
const get=async url=>{
 const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000),cache:'no-store'});
 if(!r.ok)throw Error('HTTP '+r.status);
 return r.json();
};
const rpc=async (method,params=[])=>{
 if(!['eth_chainId','eth_blockNumber','eth_getBlockByNumber'].includes(method))throw Error('METHOD_BLOCKED');
 const r=await fetch(rpcUrl,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:++rid,method,params}),signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error('RPC HTTP '+r.status);
 const data=await r.json();if(data.error||!('result' in data))throw Error('RPC unavailable '+method);
 return data.result;
};
let rpcHead=null;
try{
 const id=await rpc('eth_chainId');
 if(String(id).toLowerCase()!=='0x560c')throw Error('CHAIN_ID_MISMATCH');
 const h1=integer(await rpc('eth_blockNumber'));
 if(h1===null)throw Error('HEAD_INVALID');
 const latest=await rpc('eth_getBlockByNumber',['0x'+h1.toString(16),false]);
 if(integer(latest?.number)!==h1||!hash.test(latest?.hash||''))throw Error('HEAD_HASH_MISMATCH');
 await new Promise(r=>setTimeout(r,12000));
 const h2=integer(await rpc('eth_blockNumber'));
 rpcHead=h2;
 const progressing=h2!==null&&h2>h1;
 let finality=null;
 try{
  const tagged=await rpc('eth_getBlockByNumber',['finalized',false]);
  const height=integer(tagged?.number);
  if(height!==null&&height<=h2&&hash.test(tagged?.hash||'')){
   const canonical=await rpc('eth_getBlockByNumber',[tagged.number,false]);
   if(canonical&&integer(canonical.number)===height&&String(canonical.hash).toLowerCase()===tagged.hash.toLowerCase())
    finality={height,hash:tagged.hash,source:'finalized tag + canonical hash'};
  }
 }catch{/* Unsupported finalized tag is not proof of missing QBFT finality. */}
 report.scopes.finality={status:finality?'VERIFIED':progressing?'PARTIAL':'UNAVAILABLE',chainId:id,headFirst:h1,headSecond:h2,progressing,
  finalizedProof:finality,verifiedFinality:!!finality,warning:'Progress/confirmations/proposers are not finality certificates.'};
}catch(e){
 const reason=String(e.message||e).slice(0,150);
 report.scopes.finality={status:'UNAVAILABLE',reason,verifiedFinality:false};
 if(/CHAIN_ID_MISMATCH|HEAD_HASH_MISMATCH/.test(reason))report.safetyAlert=reason;
}
try{
 const blocks=await get(explorer+'/api/v2/blocks');
 if(!Array.isArray(blocks.items))throw Error('Blockscout blocks schema unavailable');
 const tip=Number(blocks.items[0]?.height);
 const proposers=[...new Set(blocks.items.map(b=>b.miner?.hash?.toLowerCase()).filter(x=>address.test(x||'')))];
 const delta=Number.isSafeInteger(rpcHead)&&Number.isSafeInteger(tip)?rpcHead-tip:null;
 report.scopes.validators={status:proposers.length?'PARTIAL':'UNAVAILABLE',expectedValidatorCount:4,
  observedUniqueProposers:proposers.length,observedProposerAddresses:proposers,sampledIndexedBlocks:blocks.items.length,
  indexerTip:Number.isSafeInteger(tip)?tip:null,rpcMinusIndexer:delta,
  authoritativeValidatorSet:'UNVERIFIED',allFourHostsHealthy:'UNVERIFIED',privateEvidenceRequired:true,
  warning:'Observed proposers cannot attest individual validator services or independent host health.'};
 report.scopes.indexer={status:Number.isSafeInteger(tip)?'PARTIAL':'UNAVAILABLE',
  tip:Number.isSafeInteger(tip)?tip:null,rpcMinusIndexer:delta,fullHistoryReconciled:false};
}catch(e){
 report.scopes.validators={status:'UNAVAILABLE',reason:String(e.message||e).slice(0,150),allFourHostsHealthy:'UNVERIFIED'};
 report.scopes.indexer={status:'UNAVAILABLE',fullHistoryReconciled:false};
}
try{
 const found=new Set();let pageNumber=0,next=null,exhausted=false,capHit=false;
 while(pageNumber<4){
  const qs=new URLSearchParams({type:'ERC-20'});
  if(next)for(const [key,value] of Object.entries(next))qs.set(key,String(value));
  const d=await get(explorer+'/api/v2/tokens?'+qs);
  if(!Array.isArray(d.items))throw Error('Token index schema unavailable');
  for(const token of d.items){
   const raw=token.address?.hash||token.address_hash||token.address;
   if(typeof raw==='string'&&address.test(raw))found.add(raw.toLowerCase());
  }
  pageNumber++;
  next=d.next_page_params&&typeof d.next_page_params==='object'?d.next_page_params:null;
  if(!next){exhausted=true;break;}
 }
 capHit=!!next;
 report.scopes.tokens={status:'PARTIAL',scannedPages:pageNumber,uniqueAddresses:found.size,paginationExhausted:exhausted,
  pageCapReached:capHit,legacyWKAMInScannedPages:found.has('0x0d8848ce88bb09a81a4248efdd574d50b98b544a'),
  completeHistoricalERC20Index:'UNVERIFIED',historicalReceiptsReconciled:false,
  warning:'Bounded directory scan does not establish full historical index completeness.'};
}catch(e){report.scopes.tokens={status:'UNAVAILABLE',reason:String(e.message||e).slice(0,150),completeHistoricalERC20Index:'UNVERIFIED'};}
try{
 const d=await get('https://kriptoaman.com/api/zvq-liquidity-evidence');
 let proven=false;
 try{proven=d.chainId===22028&&d.chainIdHex==='0x560c'&&d.poolEvidence==='FIRST_PARTY_ON_CHAIN'
  &&d.liquidityEvidence==='RESERVES_PRESENT'&&address.test(d.pair||'')
  &&BigInt(d.reserve0)>0n&&BigInt(d.reserve1)>0n;}catch{}
 report.scopes.liquidity={status:proven?'PARTIAL':'UNAVAILABLE',
  onChainPositiveReserves:proven,poolEvidence:d.poolEvidence||'UNAVAILABLE',liquidityEvidence:d.liquidityEvidence||'UNAVAILABLE',
  pair:proven?d.pair:null,reserve0Raw:proven?String(d.reserve0):null,reserve1Raw:proven?String(d.reserve1):null,
  counterAssetBacking:'UNVERIFIED',treasuryOwnership:'UNVERIFIED',lockVesting:'UNVERIFIED',commercialTradingApproved:false,
  warning:'Pool reserves alone are not verified market liquidity, price, backing, or approval.'};
 if(d.executionEnabled===true)report.safetyAlert='UNEXPECTED_EXECUTION_ENABLED';
}catch(e){report.scopes.liquidity={status:'UNAVAILABLE',reason:String(e.message||e).slice(0,150),
  onChainPositiveReserves:false,commercialTradingApproved:false};}
const assessed=['validators','finality','tokens','liquidity'].map(name=>({scope:name,status:report.scopes[name]?.status||'UNAVAILABLE'}));
report.fullFourScopeVerified=false;
report.nextRequirements=['Private 4-host QBFT topology and per-host/peer evidence','Canonical explicit finalized-tag proof',
 'Historical token event/receipt reconciliation','On-chain pair/bridge/LP custody and lock proofs with explicit commercial approval'];
await writeFile(join(reportDir,'four-scope.json'),JSON.stringify(report,null,2));
await writeFile(join(reportDir,'SUMMARY.md'),[
 '# ZEVARYQ four-scope public evidence — not a launch approval','Checked: '+report.checkedAt,
 ...assessed.map(x=>'- '+x.scope+': '+x.status),
 '- Full four-scope verified: NO', '- Safety alert: '+(report.safetyAlert||'none observed')].join('\n'));
console.log('ZVQ_PUBLIC_EVIDENCE '+JSON.stringify({checkedAt:report.checkedAt,scopes:assessed,fullFourScopeVerified:false,safetyAlert:report.safetyAlert||null}));
console.log('ZVQ_SCOPE_DETAILS '+JSON.stringify({
 rpcHeadStart:report.scopes.finality?.headFirst??null,rpcHeadEnd:report.scopes.finality?.headSecond??null,
 headProgress:report.scopes.finality?.progressing??false,explicitFinalizedTagVerified:report.scopes.finality?.verifiedFinality??false,
 sampleBlocks:report.scopes.validators?.sampledIndexedBlocks??null,
 uniqueProposers:report.scopes.validators?.observedUniqueProposers??null,
 validatorSetVerified:report.scopes.validators?.allFourHostsHealthy==='VERIFIED',
 indexerHeight:report.scopes.indexer?.tip??null,headMinusIndexer:report.scopes.indexer?.rpcMinusIndexer??null,
 tokenPages:report.scopes.tokens?.scannedPages??null,indexedTokenAddresses:report.scopes.tokens?.uniqueAddresses??null,
 directoryExhausted:report.scopes.tokens?.paginationExhausted??false,
 historicalTokenCompleteness:'UNVERIFIED',
 poolState:report.scopes.liquidity?.poolEvidence||'UNAVAILABLE',
 reserveEvidence:report.scopes.liquidity?.liquidityEvidence||'UNAVAILABLE',
 liquidityReason:report.scopes.liquidity?.reason||null
}));
if(report.safetyAlert)process.exitCode=1;
