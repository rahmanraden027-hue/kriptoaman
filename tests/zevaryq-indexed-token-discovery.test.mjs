import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext, Script } from 'node:vm';

const html=await readFile(new URL('../explorer-dashboard/zevaryq-production.html',import.meta.url),'utf8');
const from=html.indexOf('function indexedTokenAddress(');
const to=html.indexOf('\nasync function probe(){',from);
assert.ok(from>=0&&to>from,'token discovery functions must remain independently testable');
const tokenSource=html.slice(from,to);
assert.doesNotThrow(()=>new Script(tokenSource));
const ADDRESS='0x'+'a'.repeat(40);

async function exercise({blocks, getJSON}){
 const nodes={'#tokens':{innerHTML:''},'#token-note':{textContent:''}};
 const state={tokens:[],tokenProbeInFlight:false,tokenError:null,blocks};
 const calls=[];
 const context={state,API:'/api/v2',
   $:key=>nodes[key],
   esc:value=>String(value??'').replaceAll('<','&lt;').replaceAll('>','&gt;'),
   short:value=>String(value).slice(0,12),
   getJSON:async url=>{calls.push(url);return getJSON(url);}
 };
 const functions=runInNewContext(tokenSource+';({probeTokens,indexedTokenAddress})',context);
 await functions.probeTokens();
 return {state,nodes,calls};
}

test('latest supported per-block contract creation is displayed only after ERC-20 metadata proof',async()=>{
 const x=await exercise({
  blocks:[{height:120}],
  getJSON:async url=>{
   if(url==='/api/v2/blocks/120/transactions?type=contract_creation')return {items:[{created_contract:{hash:ADDRESS},block_number:120}]};
   if(url==='/api/v2/tokens/'+ADDRESS)return {address:ADDRESS,type:'ERC-20',name:'Proven Token',symbol:'PRV'};
   throw Error('unsupported request '+url);
  }
 });
 assert.equal(x.state.tokens.length,1);
 assert.equal(x.state.tokens[0].origin,'creation');
 assert.equal(x.state.tokens[0].block,120);
 assert.match(x.nodes['#tokens'].innerHTML,/VERIFIED CREATION/);
 assert.match(x.nodes['#token-note'].textContent,/1 sampled indexed block/);
 assert.equal(x.calls.some(url=>url.includes('token_creation')),false);
 assert.equal(x.calls.some(url=>url.includes('/tokens?type=ERC-20')),false,'proven creation need not request fallback directory');
});

test('HTTP 200 empty creation and token directory responses produce explicit verified-empty state',async()=>{
 const x=await exercise({
  blocks:[{height:121},{height:120}],
  getJSON:async url=>{
   if(url.includes('/transactions?type=contract_creation'))return {items:[]};
   if(url==='/api/v2/tokens?type=ERC-20')return {items:[]};
   throw Error('unexpected request '+url);
  }
 });
 assert.equal(x.state.tokens.length,0);
 assert.equal(x.state.tokenError,null);
 assert.match(x.nodes['#tokens'].innerHTML,/No independently verified ERC-20 tokens/);
 assert.match(x.nodes['#token-note'].textContent,/2 of 2 recent creation-block probes succeeded/);
 assert.equal(x.calls.length,3);
 assert.equal(x.calls.some(url=>url.includes('token_creation')),false);
});

test('directory fallback distinguishes indexed tokens from verified creation and rejects non-ERC20',async()=>{
 const OTHER='0x'+'b'.repeat(40);
 const x=await exercise({
  blocks:[{height:121}],
  getJSON:async url=>{
   if(url.includes('/transactions?type=contract_creation'))throw Error('temporary block API error');
   if(url==='/api/v2/tokens?type=ERC-20')return {items:[{address:ADDRESS,type:'ERC-20'},{address:OTHER,type:'ERC-20'}]};
   if(url==='/api/v2/tokens/'+ADDRESS)return {address:ADDRESS,type:'ERC-20',name:'Indexed',symbol:'IDX'};
   if(url==='/api/v2/tokens/'+OTHER)return {address:OTHER,type:'ERC-721',name:'NFT',symbol:'NFT'};
   throw Error('unsupported request '+url);
  }
 });
 assert.equal(x.state.tokens.length,1);
 assert.equal(x.state.tokens[0].origin,'directory');
 assert.equal(x.state.tokens[0].block,null);
 assert.match(x.nodes['#tokens'].innerHTML,/INDEXED DIRECTORY/);
 assert.doesNotMatch(x.nodes['#tokens'].innerHTML,/VERIFIED CREATION/);
 assert.match(x.nodes['#token-note'].textContent,/Creation time, listing, liquidity, audit and trading are not verified/);
});

test('metadata mismatch or unsupported upstream never creates a synthetic token listing',async()=>{
 const OTHER='0x'+'b'.repeat(40);
 const mismatched=await exercise({
  blocks:[{height:120}],
  getJSON:async url=>{
   if(url.includes('contract_creation'))return {items:[{created_contract:{hash:ADDRESS}}]};
   if(url==='/api/v2/tokens/'+ADDRESS)return {address:OTHER,type:'ERC-20',name:'Spoof',symbol:'BAD'};
   if(url==='/api/v2/tokens?type=ERC-20')return {items:[]};
   throw Error('unsupported request '+url);
  }
 });
 assert.equal(mismatched.state.tokens.length,0);
 const outage=await exercise({
  blocks:[],
  getJSON:async()=>{throw Error('HTTP 503');}
 });
 assert.equal(outage.state.tokens.length,0);
 assert.match(outage.nodes['#token-note'].textContent,/unavailable/);
});
