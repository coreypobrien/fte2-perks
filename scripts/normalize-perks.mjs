import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [requestedInput, output='data/extracted', requestedBuildId] = process.argv.slice(2);
const buildId=requestedBuildId??JSON.parse(fs.readFileSync('data/inventory/installed-game.json','utf8').replace(/^\uFEFF/,'')).buildId;
const input=requestedInput??`work/build-${buildId}/class-json`;
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
function reference(j,index,seen=new Set()) {
  if(index===0) return null;
  if(seen.has(index)) throw new Error('Cyclic object reference');
  seen.add(index);
  const o=index<0?j.Imports[-index-1]:j.Exports[index-1];
  if(!o) throw new Error(`Unresolved object index ${index}`);
  return o.OuterIndex ? `${reference(j,o.OuterIndex,seen)}.${o.ObjectName}` : o.ObjectName;
}
function properties(items,j) {
  const result={};
  for(const p of items??[]) {
    const key=p.ArrayIndex?`${p.Name}[${p.ArrayIndex}]`:p.Name;
    if(Object.hasOwn(result,key)) throw new Error(`Duplicate property ${key}`);
    result[key]=value(p,j);
  }
  return result;
}
function value(p,j) {
  const type=p.$type??'';
  if(type.includes('TextPropertyData')) return {text:p.CultureInvariantString??null,key:p.Value,namespace:p.Namespace,historyType:p.HistoryType};
  if(type.includes('SoftObjectPropertyData')) return p.Value?.AssetPath?.AssetName??null;
  if(type.includes('ObjectPropertyData')) return reference(j,p.Value);
  if(type.includes('BytePropertyData')) return p.EnumValue??p.Value;
  if(type.includes('GameplayTagContainerPropertyData')) return p.Value;
  if(type.includes('ArrayPropertyData')) return p.Value.map(x=>value(x,j));
  if(type.includes('StructPropertyData')) {
    if(p.Value.length===1 && p.Value[0].$type?.includes('GameplayTagContainerPropertyData')) return p.Value[0].Value;
    return properties(p.Value,j);
  }
  return p.Value??null;
}
const records=[];
for(const file of walk(input).filter(f=>f.endsWith('.json')&&!f.endsWith('export-report.json'))) {
  const j=read(file), stem=path.basename(file,'.json');
  const cdo=j.Exports?.find(e=>e.ObjectName===`Default__${stem}_C`);
  if(!cdo) continue;
  const assetPath='/Game/'+path.relative(input,file).replaceAll('\\','/').split('AFE2/Content/')[1].replace(/\.json$/,'');
  const classExport=j.Exports.find(e=>e.ObjectName===`${stem}_C`);
  records.push({assetPath,objectName:cdo.ObjectName,parentClass:classExport?reference(j,classExport.SuperIndex):null,
    source:{buildId,jsonPath:path.relative(input,file).replaceAll('\\','/'),jsonSha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')},
    properties:properties(cdo.Data,j),parseWarnings:j.Exports.filter(e=>e.$type?.includes('RawExport')).map(e=>`Raw export: ${e.ObjectName}`)});
}
records.sort((a,b)=>a.assetPath.localeCompare(b.assetPath));
const byPath=new Map(records.map(r=>[r.assetPath,r]));
const packagePath=ref=>ref?.split('.')[0]??null;
function effective(r,seen=new Set()) {
  if(seen.has(r.assetPath)) throw new Error('Class inheritance cycle');
  seen.add(r.assetPath);
  const parent=byPath.get(packagePath(r.parentClass));
  return {...(parent?effective(parent,seen):{}),...r.properties};
}
const perkNamed=records.filter(r=>path.basename(r.assetPath).startsWith('Perk_'));
const excluded=perkNamed.filter(r=>r.parentClass!=='/Script/Endeavor.ModChipDef');
const perks=perkNamed.filter(r=>r.parentClass==='/Script/Endeavor.ModChipDef').map(r=>{
  const p=effective(r);
  const shapes=(p.PossibleShapes??[]).map(s=>{
    // Column-major is inferred from board placements; retain the original mask for later verification.
    const valid=Number.isInteger(s.Width)&&s.Width>0&&Number.isInteger(s.Height)&&s.Height>0&&s.CollisionMask?.length===s.Width*s.Height;
    return {width:s.Width??null,height:s.Height??null,collisionMask:s.CollisionMask??null,
      occupiedCellsColumnMajor:valid?s.CollisionMask.flatMap((v,i)=>v!==0?[[Math.floor(i/s.Height),i%s.Height]]:[]):null,
      coordinateInterpretation:'column_major_inferred_from_board_layout',
      maskDimensionsValid:valid};
  });
  return {assetPath:r.assetPath,name:p.Name?.text??null,description:p.Description?.text??null,
    shapes,tags:p.Tags??null,modifierCompatibility:p.ModifierCompatability??null,
    modifiers:p.Modifiers??null,restrictionType:p.RestrictionType??null,kitRestriction:p.KitRestriction??null,
    parentClass:r.parentClass,source:r.source,properties:r.properties,parseWarnings:r.parseWarnings,
    verification:'serialized_properties_only',
    catalogEvidence:[]};
});
const classes=records.filter(r=>path.basename(r.assetPath).startsWith('Player_')).map(r=>{
  const p=effective(r);
  return {assetPath:r.assetPath,name:p.ClassDisplayName?.text??null,board:p.ChipBoardDef??null,
    chipEntitlements:p.ChipEntitlements??[],source:r.source};
});
const boards=records.filter(r=>/^(BasePerkBoard|PerkBoard_)/.test(path.basename(r.assetPath)));
for(const perk of perks) perk.catalogEvidence=classes.flatMap(c=>c.chipEntitlements.filter(e=>packagePath(e.ChipCDO)===perk.assetPath).map(e=>({class:c.name,requiredRank:e.RequiredRank??null,grantedBy:e.GrantedBy??null})));
const linked=new Set(classes.flatMap(c=>c.chipEntitlements.map(e=>packagePath(e.ChipCDO))));
const report={buildId,exportedRecords:records.length,perkNamedAssets:perkNamed.length,perkAssets:perks.length,
  excludedNonChipAssets:excluded.map(r=>({assetPath:r.assetPath,parentClass:r.parentClass})),classDefinitions:classes.length,boardDefinitions:boards.length,
  withName:perks.filter(p=>p.name).length,withDescription:perks.filter(p=>p.description).length,withShapes:perks.filter(p=>p.shapes.length).length,
  malformedShapes:perks.flatMap(p=>p.shapes.filter(s=>!s.maskDimensionsValid).map(()=>p.assetPath)),
  nonBinaryMasks:perks.filter(p=>p.shapes.some(s=>s.collisionMask?.some(v=>v!==0&&v!==1))).map(p=>({assetPath:p.assetPath,name:p.name})),
  parseWarnings:records.flatMap(r=>r.parseWarnings.map(w=>({assetPath:r.assetPath,warning:w}))),
  referencedPerks:linked.size,referencedButNotExtracted:[...linked].filter(p=>!byPath.has(p)).sort(),
  perksNotInClassEntitlements:perks.filter(p=>!linked.has(p.assetPath)).map(p=>p.assetPath),
  limitations:['Native class defaults are not available in these exports. Missing properties remain unknown.',
    'Class entitlements describe catalog/unlock references, not proof of full current equip eligibility.',
    'Column-major cell interpretation is inferred from board layout; runtime compatibility, unlock progression, and stacking rules require further verification.']};
fs.mkdirSync(output,{recursive:true});
for(const [name,data] of Object.entries({perks,classes,boards,'extraction-report':report})) fs.writeFileSync(path.join(output,name+'.json'),JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({...report,perksNotInClassEntitlements:report.perksNotInClassEntitlements.length},null,2));
if(report.malformedShapes.length||report.parseWarnings.length) process.exitCode=1;
