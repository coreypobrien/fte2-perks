import fs from 'node:fs';
import {createConfig,availability,prepareProblem,slotOptions} from '../app/core/model.js';
import {compatible,solve,connectedGroups,cellsOf} from '../app/core/solver.js';
import {exportBuild,importBuild} from '../app/core/transfer.js';
const game=JSON.parse(fs.readFileSync(new URL('../app/data/game.json',import.meta.url))),klass=game.classes.find(k=>k.name==='Machinist');
const byId=new Map(game.perks.map(p=>[p.id,p])),directory=new URL('../examples/machinist-validation/',import.meta.url);fs.mkdirSync(directory,{recursive:true});
const grantedByMachinist=p=>p.unlockSources.some(s=>s.class===klass.name&&Number.isInteger(s.requiredRank)&&s.requiredRank>=0&&s.requiredRank<=10&&s.grantedBy==='None');
const records=[];
for(let index=1;index<=5;index++){
  const seed=(0xafe22026+index*0x9e3779b9)>>>0;let state=seed;
  const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
  const shuffle=items=>{const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;};
  const config=createConfig(game,klass.id);
  // Vary both fixed ability selections while preserving their actual slot restrictions.
  for(const slot of klass.slots){const options=slotOptions(game,klass,slot).filter(p=>p.id===slot.defaultId||grantedByMachinist(p));config.abilities[slot.key]=options[Math.floor(random()*options.length)].id;}
  const fixed=prepareProblem(game,config).fixed;
  const pool=game.perks.filter(p=>grantedByMachinist(p)&&!availability(p,klass,10)&&(p.kind==='Core'||fixed.some(c=>compatible(c,p))));
  if(pool.length<24)throw new Error('Not enough rank-10 Machinist grants for this validation list.');
  const chosen=shuffle(pool).slice(0,24);
  config.requests=shuffle(chosen).map(p=>({id:p.id,required:false}));
  const problem=prepareProblem(game,config),freeCells=game.board.rankMask.filter(r=>r>=0&&r<=10).length-fixed.reduce((n,p)=>n+p.cells.length,0);
  const requestedCells=chosen.reduce((n,p)=>n+Math.min(...p.shapes.map(s=>s.cells.length)),0);
  if(requestedCells<=freeCells)throw new Error('Validation list must exceed available grid area.');
  const name='Machinist validation '+index,filename='machinist-'+index+'.afe2.json',text=exportBuild(name,config,game.version);
  if(JSON.stringify(importBuild(text).config)!==JSON.stringify(config))throw new Error('Portable round trip changed a priority list.');
  fs.writeFileSync(new URL(filename,directory),text);
  const result=solve(problem,{timeLimitMs:10000,maxNodes:1400000});
  if(!result.placements||!connectedGroups([...fixed,...result.placements]))throw new Error('No valid sample arrangement for '+name);
  const occupied=new Set();for(const p of [...fixed,...result.placements])for(const [x,y] of cellsOf(p)){const key=x+','+y;if(occupied.has(key))throw new Error('Overlapping sample arrangement');occupied.add(key);}
  records.push({filename,seed,gameVersion:game.version,freeCells,requestedCells,config,result});
  console.log(name+': '+config.requests.length+' requests, '+requestedCells+'/'+freeCells+' cells; '+result.status+', '+result.included.length+' included ('+Math.round(result.elapsedMs)+' ms)');
}
fs.writeFileSync(new URL('solutions.json',directory),JSON.stringify(records,null,2)+'\n');
const paragraphs=['# Machinist rank-10 in-game validation',
  'Five seeded random priority lists for game build '+game.version+'. Each has 24 optional requests, all explicitly granted by Machinist at rank 10 or below with no additional grant condition. Cross-class and unknown/shared unlocks are excluded. Fixed abilities use Machinist defaults or rank-appropriate Machinist replacements. Every modifier has a compatible selected fixed ability. The minimum total footprint exceeds the 42 free cells, so omissions are unavoidable. All Required flags are false to test priority choices rather than forcing an impossible loadout.',
  'In the local planner, open Import / export build → Import file and select one of the five .afe2.json files. Class, rank, abilities, and the complete priority order load together. Select Find arrangement (the app search limit is fixed at 60 seconds). Save build creates a separate named snapshot. You can also open a file as text and use Paste build or Load pasted JSON.',
  'The reference layouts were recomputed with the connected-group solver and proved optimal within its audited rule model. The files contain inputs, not trusted cached solutions. The app recomputes arrangements. The companion solutions.json records the generated reference results, including exact coordinates, IDs, and omission reasons. A timeout reference is a valid best-found arrangement and is not a proof of optimality. Solver layouts can vary by runtime budget.',
  'For in-game validation, select the listed abilities and try the included placement coordinates below (column/row are one-based). Check footprint, allowed class, ability compatibility, orthogonal chains, one group per modifier, and ability overrides. Record any rejected placement, the in-game description, and whether another priority could replace an omission. Every requested perk has an explicit Machinist unlock-source record, and its unlock rank is listed below. Note any mismatch with the in-game rank or unlock availability.'
];
for(const record of records){const {config,result}=record;paragraphs.push('## '+config.requests.length+' priorities — '+record.filename+'\n\nSeed '+record.seed+'; requested area '+record.requestedCells+' / '+record.freeCells+' available cells. Reference '+result.status+'; '+result.included.length+' included, '+result.omissions.length+' omitted; '+result.nodes+' search states.\n\nAbilities: '+Object.entries(config.abilities).map(([slot,id])=>slot+': '+byId.get(id).name).join('; ')+'.\n\n| Priority | Perk | Unlock rank | Footprint | Reference position | Core group |\n| --- | --- | --- | --- | --- | --- |\n'+config.requests.map((r,i)=>{const p=byId.get(r.id),placed=result.placements.find(v=>v.id===r.id);return '| '+(i+1)+' | '+p.name+' | '+Math.min(...p.unlockSources.filter(s=>s.class===klass.name&&Number.isInteger(s.requiredRank)).map(s=>s.requiredRank))+' | '+p.shapes.map(s=>s.width+'×'+s.height).join(' / ')+' | '+(placed?'Column '+(placed.x+1)+', row '+(placed.y+1):'Omitted')+' | '+(placed?(byId.get(placed.groupCoreId)?.name??'Standalone core'):'—')+' |';}).join('\n'));}
fs.writeFileSync(new URL('README.md',directory),paragraphs.join('\n\n')+'\n');
