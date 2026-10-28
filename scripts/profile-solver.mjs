import fs from 'node:fs';import {pathToFileURL} from 'node:url';
import {solve} from '../app/core/solver.js';import {prepareProblem} from '../app/core/model.js';
const args=process.argv.slice(2),arg=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const game=JSON.parse(fs.readFileSync('app/data/game.json')),nodeLimit=Number(arg('--nodes','4000'));
const baseline=arg('--baseline',null),previous=baseline?(await import(pathToFileURL(fs.realpathSync(baseline)))).solve:null,rows=[];
for(let i=1;i<=5;i++){
  const build=JSON.parse(fs.readFileSync('examples/machinist-validation/machinist-'+i+'.afe2.json')),problem=prepareProblem(game,build.config);
  const run=fn=>{const r=fn(problem,{timeLimitMs:60000,maxNodes:nodeLimit});return {status:r.status,nodes:r.nodes,included:r.included,ms:r.elapsedMs,work:r.work};};
  const before=previous?run(previous):null,after=run(solve);if(args.includes('--require-identical')&&before&&JSON.stringify(before.included)!==JSON.stringify(after.included))throw new Error('Fixed-work inclusion changed for case '+i);
  const row={case:i,...(before?{before}:{}),after};rows.push(row);console.log(JSON.stringify({case:i,beforeMs:before?.ms,afterMs:after.ms,nodes:after.nodes,work:after.work}));
}
fs.mkdirSync('work/evidence',{recursive:true});fs.writeFileSync('work/evidence/machinist-fixed-work.json',JSON.stringify({nodeLimit,cases:rows},null,2)+'\n');
const longCase=Number(arg('--long-case','0'));if(longCase){const build=JSON.parse(fs.readFileSync('examples/machinist-validation/machinist-'+longCase+'.afe2.json'));console.log('Starting 60-second case '+longCase);const result=solve(prepareProblem(game,build.config),{timeLimitMs:60000,maxNodes:Number.MAX_SAFE_INTEGER});fs.writeFileSync('work/evidence/machinist-60-seconds.json',JSON.stringify({case:longCase,result},null,2)+'\n');console.log(JSON.stringify({case:longCase,status:result.status,nodes:result.nodes,included:result.included.length,ms:result.elapsedMs,work:result.work}));}
