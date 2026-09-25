import test from 'node:test';
import assert from 'node:assert/strict';
import {collectPublicOrbits,normalizeOmm,isRecentSnapshot} from '../scripts/update-zvq-public-orbits.mjs';

const now=Date.parse('2026-09-25T09:00:00Z');
const sample=id=>({OBJECT_NAME:id===25544?'ISS (ZARYA)':id===20580?'HST':'NOAA 19',NORAD_CAT_ID:id,EPOCH:'2026-09-25T07:30:00.000Z',INCLINATION:51.64,ECCENTRICITY:.0004,MEAN_MOTION:15.5,RA_OF_ASC_NODE:120.25});
test('normalizes only allowlisted fresh CelesTrak OMM records',()=>{
 assert.equal(normalizeOmm(sample(25544),25544,now).catalog_number,25544);
 assert.equal(normalizeOmm({...sample(25544),NORAD_CAT_ID:99999},25544,now),null);
 assert.equal(normalizeOmm({...sample(25544),EPOCH:'2025-01-01T00:00:00Z'},25544,now),null);
});
test('collector marks feed explicitly as public orbital elements, never satellite link telemetry',async()=>{
 const fake=async url=>({ok:true,text:async()=>JSON.stringify([sample(Number(new URL(url).searchParams.get('CATNR')))])});
 const out=await collectPublicOrbits({httpFetch:fake,now});
 assert.equal(out.snapshot.provider,'CelesTrak');assert.equal(out.snapshot.source_type,'public_orbital_elements');
 assert.equal(out.snapshot.is_satellite_link_telemetry,false);assert.equal(out.snapshot.affiliation,'none_claimed');
 assert.deepEqual(out.snapshot.records.map(x=>x.catalog_number),[25544,20580,33591]);
});
test('recent cache suppresses unnecessary upstream polling',async()=>{
 const cached={schema:'zvq-public-orbits/v1',provider:'CelesTrak',is_satellite_link_telemetry:false,checked_at:new Date(now-60000).toISOString(),records:[{x:1}]};
 assert.equal(isRecentSnapshot(cached,now),true);
 const out=await collectPublicOrbits({cached,now,httpFetch:async()=>{throw Error('must not fetch')}});
 assert.equal(out.skipped,true);
});
