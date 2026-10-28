import fs from 'node:fs';
import {solve,compatible} from '../app/core/solver.js';
import {createConfig,prepareProblem,availability} from '../app/core/model.js';
import {chip,board} from '../tests/helpers.js';
const game=JSON.parse(fs.readFileSync('app/data/game.json'));
export function benchmarkCases(){
  const cases=[];
  for(const klass of game.classes)for(const count of [8,20,40]){const c=createConfig(game,klass.id);c.requests=game.perks.filter(p=>!availability(p,klass)).slice(0,count).map(p=>({id:p.id,required:false}));cases.push({name:klass.name+'-'+count,problem:prepareProblem(game,c)});}
  for(const count of [20,40])for(const rank of [5,10]){const c=createConfig(game);c.rank=rank;const klass=game.classes.find(k=>k.id===c.classId),fixed=prepareProblem(game,c).fixed;
    c.requests=game.perks.filter(p=>!availability(p,klass)&&(p.kind==='Core'||fixed.some(core=>compatible(core,p)))).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,count).map(p=>({id:p.id,required:false}));
    cases.push({name:'Medic-connected-'+count+'-rank-'+rank,problem:prepareProblem(game,c)});
  }
  cases.push({name:'overcapacity-60-dots',problem:board(6,6,Array.from({length:60},(_,i)=>chip('dot-'+i)))});
  cases.push({name:'fragmented-12-squares',problem:board(7,5,Array.from({length:12},(_,i)=>chip('square-'+i,2,2)))});
  cases.push({name:'required-overcapacity',problem:board(4,4,Array.from({length:5},(_,i)=>chip('required-'+i,2,2)),Array.from({length:5},(_,i)=>({id:'required-'+i,required:true})))});
  const reported=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/machinist-movable-roots.afe2.json',import.meta.url)));
  cases.push({name:'Machinist-reported-movable-roots',problem:prepareProblem(game,reported.config)});
  return cases;
}
const baselineIndex=process.argv.indexOf('--baseline');
const baseline=baselineIndex<0?null:(await import(new URL('../'+process.argv[baselineIndex+1],import.meta.url))).solve;
const budgetIndex=process.argv.indexOf('--budget-ms'),budgetMs=budgetIndex<0?1000:Number(process.argv[budgetIndex+1]);
const onlyIndex=process.argv.indexOf('--only'),only=onlyIndex<0?null:process.argv[onlyIndex+1];
const rows=[];
for(const c of benchmarkCases()){
  if(only&&!c.name.includes(only))continue;
  const run=fn=>{const r=fn(c.problem,{timeLimitMs:budgetMs,maxNodes:1400000});return {status:r.status,included:r.included.length,nodes:r.nodes,ms:Math.round(r.elapsedMs)};};
  const row={name:c.name,...(baseline?{before:run(baseline)}:{}),after:run(solve)};rows.push(row);console.log(JSON.stringify(row));
}
fs.mkdirSync('work/evidence',{recursive:true});fs.writeFileSync('work/evidence/solver-benchmarks'+(budgetMs===1000?'':'-'+budgetMs)+'.json',JSON.stringify({budgetMs,maxNodes:1400000,cases:rows},null,2)+'\n');
