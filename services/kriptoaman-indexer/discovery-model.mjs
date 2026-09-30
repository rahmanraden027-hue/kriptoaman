const ADDRESS_RE=/^0x[0-9a-f]{40}$/i;
const HASH_RE=/^0x[0-9a-f]{64}$/i;
export function normalizeAddress(v){return typeof v==='string'&&ADDRESS_RE.test(v)?v.toLowerCase():null}
export function normalizeHash(v){return typeof v==='string'&&HASH_RE.test(v)?v.toLowerCase():null}
export function assetPassport(event,metadata={}){
 const address=normalizeAddress(event?.contractAddress);
 if(!address) return null;
 const type=String(metadata?.type||'').toUpperCase();
 const symbol=typeof metadata?.symbol==='string'?metadata.symbol.trim().slice(0,32):'';
 const name=typeof metadata?.name==='string'?metadata.name.trim().slice(0,96):'';
 const proven=type==='ERC-20'&&symbol.length>0&&name.length>0;
 return {schema:'kriptoaman.asset-passport.v1',chainId:22028,address,name:proven?name:null,symbol:proven?symbol:null,
  tokenStandard:proven?'ERC-20':null,classification:proven?'verified-token':'unclassified-contract',
  provenance:{source:'ZEVARYQ first-party indexer',blockNumber:event.blockNumber??null,blockHash:normalizeHash(event.blockHash),
   txHash:normalizeHash(event.txHash),creator:normalizeAddress(event.from),observedAt:event.observedAt??null,
   confirmationState:event.confirmationState||'observed'}};
}
export function launchDNA(passport,{bytecode=null,headNumber=null}={}){
 if(!passport) return null;
 const block=passport.provenance.blockNumber;
 const confirmations=Number.isSafeInteger(headNumber)&&Number.isSafeInteger(block)?Math.max(0,headNumber-block):null;
 const code=typeof bytecode==='string'&&/^0x[0-9a-f]*$/i.test(bytecode)?bytecode:null;
 return {schema:'kriptoaman.launch-dna.v1',address:passport.address,chainId:passport.chainId,
  fingerprint:{creator:passport.provenance.creator,creationTx:passport.provenance.txHash,creationBlock:block,
   confirmations,bytecodeBytes:code?Math.max(0,(code.length-2)/2):null,metadataProven:passport.classification==='verified-token'},
  labels:[passport.classification,confirmations!=null&&confirmations<12?'early-confirmation':'established-confirmation'].filter(Boolean),
  disclaimer:'Technical discovery fingerprint only; not an audit, listing approval, liquidity proof, or investment recommendation.'};
}
export function discoveryRecord(event,metadata,evidence={}){
 const passport=assetPassport(event,metadata); if(!passport)return null;
 return {schema:'qoryvex.discovery.v1',kind:passport.classification==='verified-token'?'NEW_TOKEN':'NEW_CONTRACT',
  passport,launchDNA:launchDNA(passport,evidence)};
}