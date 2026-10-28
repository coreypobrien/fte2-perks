import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {canEquip,availability,createConfig,reconcileConfig,slotOptions,prepareProblem,dependencyHint,equippedEffects,plainText} from '../app/core/model.js';
import {solve,compatible} from '../app/core/solver.js';
const game=JSON.parse(fs.readFileSync(new URL('../app/data/game.json',import.meta.url)));
const byName=(name,predicate=()=>true)=>game.perks.find(p=>p.name===name&&predicate(p));
const medic=game.classes.find(c=>c.name==='Medic'),marauder=game.classes.find(c=>c.name==='Marauder');
test('universal-use restrictions are independent of origin class and active entitlement lists',()=>{
  const drive=byName('Drive');assert.equal(drive.restriction,'None');assert.ok(drive.originKit.includes('/Lancer/'));assert.ok(canEquip(drive,medic));assert.ok(canEquip(drive,marauder));
  const doctor=byName("Doctor's Orders");assert.ok(canEquip(doctor,medic));assert.ok(!canEquip(doctor,marauder));
  assert.ok(canEquip({restriction:'Kit',kitRestriction:'/Base.Base_C',alternativeKits:[]},{id:'/Child',lineage:['/Base']}));
  assert.ok(canEquip({restriction:'Kit',kitRestriction:'/Other.Other_C',alternativeKits:['/Medic.Medic_C']},{id:'/Medic'}));
  assert.ok(!canEquip({restriction:'Role'},medic));
});
test('missing, legacy, wrong-class and ability-slot entries have specific availability reasons',()=>{
  assert.match(availability(null,medic),/Missing/);assert.match(availability({legacy:true},medic),/Legacy/);
  assert.match(availability({restriction:'Kit',kitRestriction:'/No'},medic),/class/);
  assert.match(availability(byName('Advanced Trauma Station',p=>p.kitRestriction?.includes('Player_Medic')),medic),/slot/);
  assert.equal(availability(byName('CQW Weapon Training'),medic),null);
});
test('default setup and saved configuration reconciliation preserve unknown requests',()=>{
  const config=createConfig(game);assert.equal(config.classId,medic.id);assert.equal(config.rank,10);assert.equal(config.requests.length,0);
  assert.equal(createConfig(game,'no-class').classId,medic.id);
  const broken={...config,classId:'missing',abilities:{primary:'unknown'},requests:[{id:'missing-perk',required:true}]},r=reconcileConfig(game,broken);
  assert.equal(r.config.classId,medic.id);assert.equal(r.config.requests[0].id,'missing-perk');assert.ok(r.notices.length>=3);assert.equal(broken.abilities.primary,'unknown');
  assert.deepEqual(reconcileConfig(game,config).notices,[]);
});
test('ability alternatives replace fixed-slot core compatibility instead of unioning base tags',()=>{
  const config=createConfig(game),slot=medic.slots.find(s=>s.key==='primary'),options=slotOptions(game,medic,slot);
  assert.deepEqual(options.map(p=>p.name).sort(),['Advanced Trauma Station','Buffing Station','Poison Station']);
  const formula=byName('Concentrated Formula');
  assert.ok(compatible(byName('Advanced Trauma Station',p=>p.id===slot.defaultId),formula));
  assert.ok(compatible(byName('Poison Station',p=>p.kitRestriction?.includes('Player_Medic')),formula));
  assert.ok(!compatible(byName('Buffing Station',p=>p.kitRestriction?.includes('Player_Medic')),formula));
  config.abilities.primary=options.find(p=>p.name==='Poison Station').id;assert.equal(prepareProblem(game,config).fixed.find(p=>p.x===0).id,config.abilities.primary);
  assert.throws(()=>prepareProblem(game,{...config,classId:'unknown'}));assert.throws(()=>prepareProblem(game,{...config,abilities:{...config.abilities,primary:'missing'}}));
});
test('problem preparation preserves priority requirements and unavailable IDs',()=>{
  const config=createConfig(game),drive=byName('Drive');config.requests=[{id:drive.id,required:false},{id:'old-missing',required:true},{id:config.abilities.primary,required:false}];
  const p=prepareProblem(game,config);assert.equal(p.fixed.length,3);assert.equal(p.requests[1].required,true);assert.match(p.perks[1].unavailable,/Missing/);assert.match(p.perks[2].unavailable,/slot/);
});
test('effective tags include native auto-population, and current PerksOld references stay visible',()=>{
  const legacyReferenced=game.perks.filter(p=>p.id.includes('/PerksOld/'));assert.ok(legacyReferenced.length);assert.ok(legacyReferenced.every(p=>!p.legacy));
  const raw=JSON.parse(fs.readFileSync(new URL('../data/extracted/perks.json',import.meta.url)));
  const auto=raw.find(p=>p.properties.Type==='EModChipType::Modifier'&&!p.properties.bDoNotAutoPopulateCompatibilityTags&&p.properties.Modifiers?.some(m=>m.ModifierTag?.TagName));
  const normalized=game.perks.find(p=>p.id===auto.assetPath);for(const mod of auto.properties.Modifiers)if(mod.ModifierTag?.TagName)assert.ok(normalized.tags.includes(mod.ModifierTag.TagName));
});
test('description panel includes fixed abilities and included perks once; omitted bonuses never leak',()=>{
  const config=createConfig(game),resil=byName('Resiliency');config.rank=5;config.requests=[{id:resil.id,required:false}];
  const r=solve(prepareProblem(game,config));assert.equal(r.status,'optimal');assert.ok(!equippedEffects(game,config,r).some(e=>e.id===resil.id));assert.equal(equippedEffects(game,config,r).length,3);
  config.rank=10;const r2=solve(prepareProblem(game,config));assert.ok(equippedEffects(game,config,r2).some(e=>e.description.includes('300%')));
  assert.equal(equippedEffects(game,config,null).length,0);assert.equal(plainText('<Bold>Conditional</>\r\nbonus'),'Conditional\nbonus');assert.equal(plainText(null),'');
});
test('dependency hints distinguish standalone perks, compatible cores, and missing parents',()=>{
  const doctor=byName("Doctor's Orders"),formula=byName('Concentrated Formula');assert.equal(dependencyHint(doctor,[]),'No connection required');assert.match(dependencyHint(formula,[]),/Needs/);assert.match(dependencyHint(formula,prepareProblem(game,createConfig(game)).fixed),/Trauma/);
});
test('every class has valid fixed slots and native-derived same-class eligibility',()=>{
  for(const c of game.classes){const config=createConfig(game,c.id),p=prepareProblem(game,config);assert.equal(p.fixed.length,3);assert.equal(solve(p).status,'optimal',c.name);}
});

test('40-request game-data loadouts finish within a deterministic search-step bound',()=>{
  for(const name of ['Medic','Hunter','Machinist','Duelist']){
    const klass=game.classes.find(c=>c.name===name),config=createConfig(game,klass.id);
    config.requests=game.perks.filter(p=>!availability(p,klass)).slice(0,40).map(p=>({id:p.id,required:false}));
    if(name==='Duelist')config.requests=config.requests.slice(0,20);
    const result=solve(prepareProblem(game,config),{maxNodes:10000,timeLimitMs:10000});
    assert.equal(result.status,'optimal',name);assert.ok(result.included.length>=10,name);assert.ok(result.nodes<10000,name);
  }
});
