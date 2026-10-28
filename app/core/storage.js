export const STORAGE_KEY='afe2.perk-planner.v0';
export const SCHEMA_VERSION=1;
export function validConfig(value) {
  return value && typeof value.classId==='string' && Number.isInteger(value.rank) && value.rank>=1&&value.rank<=10 &&
    value.abilities && typeof value.abilities==='object' && !Array.isArray(value.abilities) &&
    Object.values(value.abilities).every(v=>typeof v==='string') && Array.isArray(value.requests) && value.requests.length<=100 &&
    value.requests.every(r=>r&&typeof r.id==='string'&&r.id.length<600&&typeof r.required==='boolean'&&(r.coreId===undefined||typeof r.coreId==='string'&&r.coreId.length>0&&r.coreId.length<600)) &&
    new Set(value.requests.map(r=>r.id)).size===value.requests.length;
}
const clone=value=>JSON.parse(JSON.stringify(value));
export function loadState(storage) {
  try{
    const text=storage.getItem(STORAGE_KEY);if(!text)return {draft:null,builds:[],error:null};
    const data=JSON.parse(text);
    if(data.schemaVersion!==SCHEMA_VERSION)return {draft:null,builds:[],error:'Saved data uses an unsupported version. Existing saves were left untouched.',blocked:true};
    if(!Array.isArray(data.builds)||data.builds.some(b=>!b||typeof b.id!=='string'||typeof b.name!=='string'||!validConfig(b.config)) || data.draft!==null&&!validConfig(data.draft))
      return {draft:null,builds:[],error:'Saved data is malformed. Existing saves were left untouched.',blocked:true};
    return {draft:data.draft,builds:data.builds,error:null};
  }catch(error){return {draft:null,builds:[],error:'Browser saves could not be read. Existing data was left untouched.',blocked:true};}
}
export function persistState(storage,{draft,builds},gameVersion) {
  if(draft!==null&&!validConfig(draft) || !Array.isArray(builds) || builds.some(b=>!b||!validConfig(b.config)))return {ok:false,error:'The current build could not be saved because its data is invalid.'};
  try{storage.setItem(STORAGE_KEY,JSON.stringify({schemaVersion:SCHEMA_VERSION,gameVersion,draft,builds}));return {ok:true};}
  catch(error){return {ok:false,error:'Browser storage is unavailable or full. Your current work is still open.'};}
}
export function saveNamed(builds,name,config,gameVersion,{id=()=>crypto.randomUUID(),date=()=>new Date().toISOString(),existingId=null}={}) {
  if(!name.trim()||name.length>80||!validConfig(config))throw new Error('Enter a build name (up to 80 characters) and a valid configuration.');
  const entry={id:existingId??id(),name:name.trim(),gameVersion,savedAt:date(),config:clone(config)};
  return [...builds.filter(b=>b.id!==entry.id),entry];
}
export function cloneConfig(config){return clone(config);}
