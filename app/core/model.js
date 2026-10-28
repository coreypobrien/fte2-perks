import { compatible } from './solver.js';
export const plainText=text=>(text??'').replace(/<[^>]*>/g,'').replace(/\r\n/g,'\n').trim();
const pathOf=ref=>ref?.split('.')[0]??null;
export function canEquip(perk,klass){
  if(perk.restriction==='None')return true;
  if(perk.restriction!=='Kit')return false;
  const lineage=new Set([klass.id,...(klass.lineage??[])]);
  return lineage.has(pathOf(perk.kitRestriction))||(perk.alternativeKits??[]).some(id=>lineage.has(pathOf(id)));
}
export function rankUnlockReason(perk,klass,rank){
  const sources=(perk.unlockSources??[]).filter(s=>s.class===klass.name);
  if(!sources.length||sources.some(s=>!Number.isInteger(s.requiredRank)||s.requiredRank<=rank))return null;
  return 'Unlocks in '+klass.name+' at rank '+Math.min(...sources.map(s=>s.requiredRank))+'.';
}
export function availability(perk,klass,rank=10){
  if(!perk)return 'Missing from the current catalog.';
  if(perk.legacy)return 'Legacy/internal asset; not part of the active library.';
  if(!canEquip(perk,klass))return 'Not usable by the selected class.';
  if(perk.slot)return 'Choose this ability in its fixed slot.';
  return rankUnlockReason(perk,klass,rank);
}
export function createConfig(game,classId){
  const klass=game.classes.find(c=>c.id===classId)??game.classes.find(c=>c.name==='Medic')??game.classes[0];
  return {classId:klass.id,rank:10,abilities:Object.fromEntries(klass.slots.map(s=>[s.key,s.defaultId])),requests:[]};
}
export function reconcileConfig(game,config){
  const known=game.classes.find(c=>c.id===config.classId);
  const selected=known??game.classes.find(c=>c.name==='Medic')??game.classes[0];
  const result={...config,classId:selected.id,abilities:{...config.abilities},requests:config.requests.map(r=>({...r}))};
  const notices=[];
  if(!known)notices.push('The saved class is unavailable; Medic was selected. Requested perks were preserved.');
  for(const slot of selected.slots){if(!game.perks.some(p=>p.id===result.abilities[slot.key]&&p.slot===slot.key&&canEquip(p,selected))){result.abilities[slot.key]=slot.defaultId;notices.push(`${slot.label} was reset to its available default.`);}}
  if(result.requests.some(r=>!game.perks.some(p=>p.id===r.id)))notices.push('Some requested perks are missing from this catalog; they remain in the priority list.');
  return {config:result,notices};
}
export function slotOptions(game,klass,slot){
  return game.perks.filter(p=>!p.legacy&&p.slot===slot.key&&canEquip(p,klass)&& (p.id===slot.defaultId||p.replacer||klass.name==='Specialist'));
}
export function prepareProblem(game,config){
  const klass=game.classes.find(c=>c.id===config.classId);if(!klass)throw new Error('Unknown class.');
  const byId=new Map(game.perks.map(p=>[p.id,p]));
  const fixed=klass.slots.map(slot=>{
    const p=byId.get(config.abilities[slot.key]);if(!p||!canEquip(p,klass)||p.slot!==slot.key)throw new Error('Selected ability is incompatible with its class or slot.');
    const shape=p.shapes[0];return {...p,x:slot.x,y:slot.y,width:shape.width,height:shape.height,cells:shape.cells};
  });
  const perks=config.requests.map(r=>{const p=byId.get(r.id);return p?{...p,unavailable:fixed.some(f=>f.id===p.id)?'Already in an ability slot.':availability(p,klass,config.rank)}:{id:r.id,unavailable:'Missing from current game catalog.',kind:'Core',shapes:[]};});
  return {width:game.board.width,height:game.board.height,rankMask:game.board.rankMask,rank:config.rank,fixed,requests:config.requests.map(r=>({...r})),perks};
}
export function dependencyHint(perk,equipped){
  if(perk.kind!=='Modifier')return 'No connection required';
  const parents=equipped.filter(p=>compatible(p,perk));
  return parents.length?'Connects to '+parents.map(p=>p.name).join(', '):'Needs a compatible core or ability';
}
export function equippedEffects(game,config,result){
  if(!result?.placements)return [];
  const ids=config.requests.filter(r=>result.included.includes(r.id)).map(r=>r.id);
  const byId=new Map(game.perks.map(p=>[p.id,p]));
  return [...new Set(ids)].map(id=>byId.get(id)).filter(p=>p&&!p.slot).map(p=>({id:p.id,description:p.description,source:p.name}));
}
