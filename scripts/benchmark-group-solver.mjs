import fs from 'node:fs';import {pathToFileURL} from 'node:url';import {solve,connectedGroups} from '../app/core/solver.js';import {prepareProblem} from '../app/core/model.js';
const args=process.argv.slice(2),baseline=args[args.indexOf('--baseline')+1],previous=(await import(pathToFileURL(fs.realpathSync(baseline)))).solve;
const game=JSON.parse(fs.readFileSync('app/data/game.json')),cases=[];
for(let i=1;i<=5;i++){
  const build=JSON.parse(fs.readFileSync('examples/machinist-validation/machinist-'+i+'.afe2.json')),problem=prepareProblem(game,build.config),options={timeLimitMs:10000,maxNodes:Number.MAX_SAFE_INTEGER};
  const before=previous(problem,options),after=solve(problem,options);if(after.status!=='optimal'||!connectedGroups([...problem.fixed,...after.placements]))throw new Error('New solver did not prove a valid optimum for case '+i);
  const a=new Set(after.included),b=new Set(before.included),first=build.config.requests.find(r=>a.has(r.id)!==b.has(r.id));if(first&&b.has(first.id))throw new Error('New optimum is worse than an old valid incumbent');
  const compact=r=>({status:r.status,nodes:r.nodes,included:r.included.length,ms:r.elapsedMs,work:r.work});const row={case:i,before:compact(before),after:compact(after)};cases.push(row);console.log(JSON.stringify(row));
}
fs.mkdirSync('work/evidence',{recursive:true});fs.writeFileSync('work/evidence/group-solver-benchmarks.json',JSON.stringify({budgetMs:10000,cases},null,2)+'\n');
