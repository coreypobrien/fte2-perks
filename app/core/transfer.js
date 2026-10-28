import {validConfig} from './storage.js';
export const BUILD_FORMAT='afe2-perk-build';
export const BUILD_VERSION=1;
export const MAX_BUILD_SIZE=1024*1024;
const portableConfig=config=>({classId:config.classId,rank:config.rank,abilities:{...config.abilities},requests:config.requests.map(r=>({id:r.id,required:r.required,...(r.coreId!==undefined?{coreId:r.coreId}:{})}))});
function validate(build){
  if(!build||build.format!==BUILD_FORMAT)throw new Error('This is not an AFE2 perk build file.');
  if(build.version!==BUILD_VERSION)throw new Error('Unsupported build format version. Your current build was kept.');
  if(typeof build.name!=='string'||build.name.length>80||typeof build.gameVersion!=='string'||build.gameVersion.length>100||!validConfig(build.config))throw new Error('The build contains invalid settings or priorities.');
  const c=build.config;
  if(!c.classId.length||c.classId.length>600||['primary','secondary','passive'].some(k=>typeof c.abilities[k]!=='string'||!c.abilities[k].length||c.abilities[k].length>600))throw new Error('The build contains invalid class or ability IDs.');
  return {format:BUILD_FORMAT,version:BUILD_VERSION,name:build.name,gameVersion:build.gameVersion,config:portableConfig(c)};
}
/** Portable inputs only: request order and Required flags are authoritative; placements are recomputed. */
export function exportBuild(name,config,gameVersion){
  return JSON.stringify(validate({format:BUILD_FORMAT,version:BUILD_VERSION,name:name.trim(),gameVersion,config}),null,2)+'\n';
}
export function importBuild(text){
  if(typeof text!=='string'||text.length>MAX_BUILD_SIZE)throw new Error('Build JSON must be text smaller than 1 MiB.');
  let data;try{data=JSON.parse(text.replace(/^\uFEFF/,''));}catch{throw new Error('The build is not valid JSON. Your current build was kept.');}
  return validate(data);
}
export function buildFilename(name,className,rank){
  const stem=(name.trim()||className+' rank '+rank).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'perk-build';
  return stem+'.afe2.json';
}
