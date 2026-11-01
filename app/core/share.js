import {exportBuild,importBuild,MAX_BUILD_SIZE} from './transfer.js';
export const MAX_LINK_SIZE=65536;
// Compress stable IDs together; links remain independent of catalog index ordering.
async function transform(bytes,stream,limit){
  const reader=new Blob([bytes]).stream().pipeThrough(stream).getReader();
  const chunks=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw new Error('Build link is too large. Use a JSON file instead.');chunks.push(value);}}
  finally{await reader.cancel();}
  const output=new Uint8Array(size);let offset=0;for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.length;}return output;
}
export async function createBuildLink(base,name,config,gameVersion){
  const b=importBuild(exportBuild(name,config,gameVersion)),c=b.config;
  const tuple=[b.name,b.gameVersion,c.classId,c.rank,...['primary','secondary','passive'].map(k=>c.abilities[k]),c.requests.map(r=>[r.id,r.required?1:0,...(r.coreId===undefined?[]:[r.coreId])])];
  const bytes=await transform(new TextEncoder().encode(JSON.stringify(tuple)),new CompressionStream('deflate'),MAX_LINK_SIZE);
  const encoded=btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
  const url=new URL(base);url.hash='build=1.'+encoded;
  if(url.href.length>MAX_LINK_SIZE)throw new Error('Build link is too large. Use a JSON file instead.');
  return url.href;
}
export async function readBuildLink(hash){
  if(!hash.startsWith('#build='))return null;
  if(hash.length>MAX_LINK_SIZE)throw new Error('Build link is too large.');
  const match=/^#build=([^.]+)\.([A-Za-z0-9_-]+)$/.exec(hash);
  if(!match)throw new Error('Invalid build link. Your current build was kept.');
  if(match[1]!=='1')throw new Error('Unsupported build link version. Your current build was kept.');
  try{
    const bytes=Uint8Array.from(atob(match[2].replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
    const text=new TextDecoder('utf-8',{fatal:true}).decode(await transform(bytes,new DecompressionStream('deflate'),MAX_BUILD_SIZE));
    const t=JSON.parse(text);
    if(!Array.isArray(t)||t.length!==8||!Array.isArray(t[7]))throw new Error('Invalid fields');
    const requests=t[7].map(r=>{if(!Array.isArray(r)||r.length<2||r.length>3||![0,1].includes(r[1]))throw new Error('Invalid priority');return {id:r[0],required:r[1]===1,...(r.length===3?{coreId:r[2]}:{})};});
    return importBuild(JSON.stringify({format:'afe2-perk-build',version:1,name:t[0],gameVersion:t[1],config:{classId:t[2],rank:t[3],abilities:{primary:t[4],secondary:t[5],passive:t[6]},requests}}));
  }catch{throw new Error('Invalid or oversized build link. Your current build was kept.');}
}
