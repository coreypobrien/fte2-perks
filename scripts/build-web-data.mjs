import fs from 'node:fs';
import path from 'node:path';
import {plainText} from '../app/core/model.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read('data/extracted/perks.json'),catalog=read('data/perks/catalog.json');
const classes=read('data/extracted/classes.json'),boards=read('data/extracted/boards.json');
const rules=read('data/native/mod-chip-rules.json');
if(rules.buildId!==catalog.buildId)throw new Error('Native rules and catalog builds differ');
const packageOf=p=>p?.split('.')[0]??null;
const enumName=p=>p?.split('::').at(-1);
const base=boards.find(b=>b.properties.BaseShape).properties.BaseShape;
const fixedIds=new Set(boards.flatMap(b=>(b.properties.BoardLockedPlacements??[]).map(p=>packageOf(p.LockedSpecificChip)).filter(Boolean)));
const shapeById=new Map(catalog.perks.map(p=>[p.assetPath,p.shapes]));
const slotOf=p=>{const replace=enumName(p.ReplacerType);if(replace==='ClassAbility1')return 'primary';if(replace==='ClassAbility2')return 'secondary';if(replace==='ClassAbility3')return 'passive';return null;};
const perks=source.map(raw=>{
  const p=raw.properties,kind=enumName(p.Type)??rules.defaults.Type;
  const explicit=slotOf(p);
  const slot=explicit??(fixedIds.has(raw.assetPath)?({Ultimate:'primary',Tactical:'secondary',Passive:'passive'}[enumName(p.ClassAbilityType)]??null):null);
  const auto=kind==='Modifier' && !(p.bDoNotAutoPopulateCompatibilityTags??rules.defaults.bDoNotAutoPopulateCompatibilityTags);
  const tags=[...new Set([...(p.Tags??[]),...(auto?(p.Modifiers??[]).map(m=>m.ModifierTag?.TagName).filter(Boolean):[])])];
  return {id:raw.assetPath,name:raw.name,description:plainText(raw.description),kind,slot,replacer:!!explicit,
    shapes:shapeById.get(raw.assetPath).map(s=>({width:s.width,height:s.height,cells:s.occupiedCells})),
    tags,accepts:p.ModifierCompatability??[],override:p.GrantedAbilityOverride&&p.GrantedAbilityOverride!=='None'?p.GrantedAbilityOverride:null,
    restriction:enumName(p.RestrictionType)??rules.defaults.RestrictionType,kitRestriction:p.KitRestriction??null,
    alternativeKits:p.AlternativeKitsAllowed??[],originKit:p.OriginKit??null,unlockSources:raw.catalogEvidence,
    legacy:raw.assetPath.includes('/PerksOld/')&&!raw.catalogEvidence.length,
    source:{asset:raw.assetPath,build:raw.source.buildId,nativeDefaults:!p.Type||!p.RestrictionType}};
});
const output={schemaVersion:1,version:catalog.buildId,rulesVersion:'native-groups-v1',
  scope:'Known selected-class perk unlock ranks are enforced; other-class and unknown/shared unlocks are assumed available. Native class restrictions and modifier group compatibility are translated for the installed build. Runtime parity for all catalog/replacement edge cases is not certified.',
  rulesSource:{executableSha256:rules.source.executableSha256,document:'docs/native-chip-rules.md'},
  board:{width:base.Width,height:base.Height,rankMask:base.CollisionMask},
  classes:classes.map(c=>{const board=boards.find(b=>b.assetPath===packageOf(c.board));return {id:c.assetPath,name:c.name,lineage:[],slots:board.properties.BoardLockedPlacements.map(s=>({key:s.Column===0?'primary':s.Column===9?'secondary':'passive',label:s.Column===0?'Primary':s.Column===9?'Secondary':'Passive',x:s.Column,y:s.Row,defaultId:packageOf(s.LockedSpecificChip)}))};}),perks};
for(const c of output.classes)for(const s of c.slots)if(!perks.some(p=>p.id===s.defaultId))throw new Error('Unresolved fixed ability');
const outputArg=process.argv.indexOf('--output'),destination=outputArg>=0?process.argv[outputArg+1]:'app/data/game.json';
if(!destination)throw new Error('Missing --output path');
fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(output)+'\n');
console.log(`Built static browser data: ${perks.length} chips, ${output.classes.length} classes, ${Buffer.byteLength(JSON.stringify(output))} bytes.`);
