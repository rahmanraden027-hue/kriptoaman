/**
 * Read-only public orbital ELEMENTS, not spacecraft communications telemetry.
 * CelesTrak GP OMM JSON: fetch only three specifically selected catalog objects,
 * at most once per three hours, using a single server-side publisher.
 */
import {readFile,writeFile,rename,chmod} from 'node:fs/promises';
import {resolve,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';

export const DATASET='zvq-public-orbits/v1';
export const DOCUMENTATION='https://celestrak.org/NORAD/documentation/gp-data-formats.php';
export const CATALOG=[25544,20580,33591]; // ISS, Hubble, NOAA-19; PUBLIC objects, not KriptoAman satellites.
const THREE_HOURS=3*60*60*1000, FOURTEEN_DAYS=14*24*60*60*1000;

function finiteBetween(value,min,max){
  const n=Number(value);
  return value!==null&&value!==undefined&&value!==''&&Number.isFinite(n)&&n>=min&&n<=max?n:null;
}
export function normalizeOmm(input,expectedCatalog,now=Date.now()){
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  const catalog=Number(input.NORAD_CAT_ID);
  if(!CATALOG.includes(expectedCatalog)||catalog!==expectedCatalog)return null;
  if(typeof input.OBJECT_NAME!=='string'||!/^[A-Za-z0-9 .()/-]{2,64}$/.test(input.OBJECT_NAME))return null;
  const epoch=typeof input.EPOCH==='string'?Date.parse(input.EPOCH):NaN;
  if(!Number.isFinite(epoch)||epoch>now+10*60*1000||now-epoch>FOURTEEN_DAYS)return null;
  const inclination=finiteBetween(input.INCLINATION,0,180);
  const eccentricity=finiteBetween(input.ECCENTRICITY,0,0.99999999);
  const meanMotion=finiteBetween(input.MEAN_MOTION,0.000001,18);
  const raan=finiteBetween(input.RA_OF_ASC_NODE,0,360);
  if([inclination,eccentricity,meanMotion,raan].some(x=>x===null))return null;
  return {
    catalog_number:catalog,object_name:input.OBJECT_NAME.trim(),epoch:new Date(epoch).toISOString(),
    inclination_deg:inclination,eccentricity,mean_motion_rev_per_day:meanMotion,
    ascending_node_deg:raan,
    source_url:'https://celestrak.org/NORAD/elements/gp.php?CATNR='+catalog+'&FORMAT=JSON'
  };
}
export function isRecentSnapshot(value,now=Date.now()){
  if(!value||value.schema!==DATASET||value.provider!=='CelesTrak'||value.is_satellite_link_telemetry!==false)return false;
  const time=Date.parse(value.checked_at);
  return Number.isFinite(time)&&time<=now+5*60*1000&&time>=now-THREE_HOURS&&
    Array.isArray(value.records)&&value.records.length>0;
}
export async function collectPublicOrbits({httpFetch=fetch,now=Date.now(),cached=null}={}){
  if(isRecentSnapshot(cached,now))return {skipped:true,snapshot:cached};
  const results=await Promise.allSettled(CATALOG.map(async number=>{
    const url='https://celestrak.org/NORAD/elements/gp.php?CATNR='+number+'&FORMAT=JSON';
    const response=await httpFetch(url,{
      method:'GET',headers:{accept:'application/json'},
      signal:AbortSignal.timeout(18000),redirect:'follow'
    });
    if(!response.ok)throw Error('CelesTrak '+number+' HTTP '+response.status);
    const body=await response.text();
    if(body.length>64000)throw Error('Oversized GP response for '+number);
    let json;try{json=JSON.parse(body)}catch{throw Error('Invalid GP JSON for '+number)}
    if(!Array.isArray(json)||json.length!==1)throw Error('Unexpected GP catalog response for '+number);
    const record=normalizeOmm(json[0],number,now);
    if(!record)throw Error('Invalid or stale GP elements for '+number);
    return record;
  }));
  const records=[],unavailable=[];
  results.forEach((r,i)=>{if(r.status==='fulfilled')records.push(r.value);else unavailable.push(CATALOG[i]);});
  if(!records.length){
    const causes=results.map((result,i)=>CATALOG[i]+':'+String(result.reason?.name||'Error')+'/'+String(result.reason?.message||'unknown').replace(/[^a-zA-Z0-9 .:_/-]/g,'').slice(0,95));
    throw Error('CelesTrak orbital catalog unavailable; no fabricated data. '+causes.join(' | '));
  }
  return {
    skipped:false,
    snapshot:{
      schema:DATASET,provider:'CelesTrak',source_type:'public_orbital_elements',
      source_documentation:DOCUMENTATION,is_satellite_link_telemetry:false,
      affiliation:'none_claimed',checked_at:new Date(now).toISOString(),
      records,unavailable_catalog_numbers:unavailable
    }
  };
}
async function main(){
  const args=process.argv.slice(2);
  const option=key=>{const i=args.indexOf(key);return i<0?null:args[i+1]};
  const output=option('--output'),cache=option('--cache');
  if(!output||!cache||args.length!==4)throw Error('Required: --output <file> --cache <existing-public-file>');
  const safeDir=dirname(resolve(output));
  if(resolve(cache)===resolve(output))throw Error('Output must be distinct from existing public cache');
  let existing=null;
  try{existing=JSON.parse(await readFile(cache,'utf8'));}catch{existing=null;}
  const {skipped,snapshot}=await collectPublicOrbits({cached:existing});
  if(skipped){console.log('PUBLIC_ORBITS_REUSE: checked_at='+snapshot.checked_at);return;}
  const tmp=resolve(safeDir,'.'+basename(output)+'.staged-'+process.pid);
  const payload=JSON.stringify(snapshot,null,2)+'\n';
  await writeFile(tmp,payload,{encoding:'utf8',mode:0o644,flag:'wx'});
  await chmod(tmp,0o644);
  await rename(tmp,resolve(output));
  console.log('PUBLIC_ORBITS_READY: catalog_records='+snapshot.records.length+
    ' unavailable_catalogs='+snapshot.unavailable_catalog_numbers.join(',')+
    ' checked_at='+snapshot.checked_at+' source=CelesTrak; NOT spacecraft link telemetry');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(err=>{console.error('PUBLIC_ORBITS_UNAVAILABLE: '+String(err.message||err));process.exitCode=1;});
}
