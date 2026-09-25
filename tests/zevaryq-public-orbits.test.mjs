import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {runInNewContext} from 'node:vm';
import {CATALOG,normalizeOmm,collectPublicOrbits,isRecentSnapshot,DATASET} from '../scripts/update-zvq-public-orbits.mjs';

const now=Date.parse('2026-09-25T11:00:00Z');
const example=(id=25544)=>({
 NORAD_CAT_ID:id,OBJECT_NAME:id===25544?'ISS (ZARYA)':id===20580?'HST':'NOAA 19',
 EPOCH:new Date(now-3600000).toISOString(),INCLINATION:51.64,
 ECCENTRICITY:0.0007,MEAN_MOTION:15.51,RA_OF_ASC_NODE:64.2
});
test('OMM parser rejects incorrect catalog numbers, stale epochs, missing fields and markup',()=>{
 assert.deepEqual(CATALOG,[25544,20580,33591]);
 const record=normalizeOmm(example(),25544,now);
 assert.equal(record.catalog_number,25544);
 assert.equal(record.mean_motion_rev_per_day,15.51);
 assert.equal(normalizeOmm(example(20580),25544,now),null);
 assert.equal(normalizeOmm({...example(),EPOCH:new Date(now-15*86400000).toISOString()},25544,now),null);
 assert.equal(normalizeOmm({...example(),OBJECT_NAME:'<script>alert(1)</script>'},25544,now),null);
 assert.equal(normalizeOmm({...example(),ECCENTRICITY:2},25544,now),null);
 assert.equal(normalizeOmm({...example(),MEAN_MOTION:null},25544,now),null);
});
test('publisher fetches allowlisted catalog objects and never claims physical telemetry',async()=>{
 const requests=[];
 const fakeFetch=async url=>{
  requests.push(url);
  const id=Number(new URL(url).searchParams.get('CATNR'));
  return {ok:true,text:async()=>JSON.stringify([example(id)])};
 };
 const {snapshot}=await collectPublicOrbits({httpFetch:fakeFetch,now});
 assert.deepEqual(requests.map(url=>Number(new URL(url).searchParams.get('CATNR'))),CATALOG);
 assert.ok(requests.every(url=>new URL(url).hostname==='celestrak.org'));
 assert.equal(snapshot.schema,DATASET);
 assert.equal(snapshot.provider,'CelesTrak');
 assert.equal(snapshot.source_type,'public_orbital_elements');
 assert.equal(snapshot.is_satellite_link_telemetry,false);
 assert.equal(snapshot.affiliation,'none_claimed');
 assert.deepEqual(snapshot.records.map(x=>x.catalog_number),CATALOG);
 assert.ok(isRecentSnapshot(snapshot,now+1000));
 assert.equal(isRecentSnapshot(snapshot,now+3*3600000+1),false);
 const reuse=await collectPublicOrbits({httpFetch:()=>{throw Error('Cached requests must be suppressed')},now:now+1000,cached:snapshot});
 assert.equal(reuse.skipped,true);
});
test('provider failures do not create mock measurements or retries',async()=>{
 let count=0;
 await assert.rejects(collectPublicOrbits({now,httpFetch:async()=>{count++;return {ok:false,status:403};}}),/unavailable/i);
 assert.equal(count,3);
 const partial=await collectPublicOrbits({now,httpFetch:async url=>{
  const id=Number(new URL(url).searchParams.get('CATNR'));
  if(id===20580)return {ok:false,status:503};
  return {ok:true,text:async()=>JSON.stringify([example(id)])};
 }});
 assert.equal(partial.snapshot.records.length,2);
 assert.deepEqual(partial.snapshot.unavailable_catalog_numbers,[20580]);
});
test('browser rejects stale or spoofed snapshots and deployment has exact fail-closed orbit route',async()=>{
 const js=await readFile(new URL('../explorer-dashboard/assets/zvq-v2.js',import.meta.url),'utf8');
 const html=await readFile(new URL('../explorer-dashboard/zevaryq-production.html',import.meta.url),'utf8');
 const css=await readFile(new URL('../explorer-dashboard/assets/zvq-v2.css',import.meta.url),'utf8');
 const deploy=await readFile(new URL('../scripts/deploy-zevaryq-explorer.sh',import.meta.url),'utf8');
 const sandbox={window:{}};runInNewContext(js,sandbox);
 const normalize=sandbox.window.ZVQv2.validOrbitSnapshot;
 assert.equal(typeof normalize,'function');
 const snap=(await collectPublicOrbits({now,httpFetch:async url=>({
  ok:true,text:async()=>JSON.stringify([example(Number(new URL(url).searchParams.get('CATNR')))])
 })})).snapshot;
 assert.equal(normalize(snap,now)?.records.length,3);
 assert.equal(normalize({...snap,is_satellite_link_telemetry:true},now),null);
 assert.equal(normalize({...snap,provider:'KriptoAman'},now),null);
 assert.equal(normalize({...snap,affiliation:'kriptoaman'},now),null);
 assert.equal(normalize({...snap,checked_at:new Date(now-49*3600000).toISOString()},now),null);
 assert.equal(normalize({...snap,records:[{...snap.records[0],inclination_deg:999}]},now),null);
 assert.equal(normalize({...snap,records:[snap.records[0],snap.records[0]]},now),null);
 assert.match(html,/data-zvq-public-orbits="celestrak-gp-v1"/);
 assert.match(html,/zvq-v2\.js\?v=20260925-orbit1/);
 assert.match(css,/\.zvq-public-orbits/);
 assert.match(js,/Physical satellite telemetry: UNAVAILABLE/);
 assert.match(js,/public_orbital_elements/);
 assert.match(deploy,/ZVQ_PUBLIC_ORBITS_V1/);
 assert.match(deploy,/try_files \/kam-dashboard\/zevaryq-assets\/public-orbits\.json =404/);
 assert.doesNotMatch(js,/eth_sendRawTransaction|eth_sendTransaction/);
});
