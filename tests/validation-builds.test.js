import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {importBuild} from '../app/core/transfer.js';
import {availability,prepareProblem} from '../app/core/model.js';
import {solve,compatible,connectedGroups,cellsOf} from '../app/core/solver.js';
const game=JSON.parse(fs.readFileSync(new URL('../app/data/game.json',import.meta.url)));
test('five portable lists contain only explicit rank-10 Machinist grants and exceed available area',()=>{
  const signatures=new Set(),klass=game.classes.find(k=>k.name==='Machinist');
  const records=JSON.parse(fs.readFileSync(new URL('../examples/machinist-validation/solutions.json',import.meta.url)));
  for(let i=1;i<=5;i++){
    const build=importBuild(fs.readFileSync(new URL('../examples/machinist-validation/machinist-'+i+'.afe2.json',import.meta.url),'utf8'));
    assert.equal(build.config.classId,klass.id);assert.equal(build.config.rank,10);assert.equal(build.config.requests.length,24);assert.ok(build.config.requests.every(r=>r.required===false));
    const problem=prepareProblem(game,build.config),free=game.board.rankMask.filter(r=>r>=0&&r<=10).length-problem.fixed.reduce((n,p)=>n+p.cells.length,0);
    assert.ok(problem.perks.every(p=>p.unlockSources.some(s=>s.class==='Machinist'&&Number.isInteger(s.requiredRank)&&s.requiredRank>=0&&s.requiredRank<=10&&s.grantedBy==='None')),'Every requested perk must be granted by Machinist by rank 10');
    assert.ok(problem.fixed.every(p=>klass.slots.some(s=>s.defaultId===p.id)||p.unlockSources.some(s=>s.class==='Machinist'&&Number.isInteger(s.requiredRank)&&s.requiredRank<=10)));
    assert.ok(problem.perks.every(p=>!availability(p,klass,10)));assert.ok(problem.perks.filter(p=>p.kind==='Modifier').every(p=>problem.fixed.some(c=>compatible(c,p))));
    assert.ok(problem.perks.reduce((n,p)=>n+Math.min(...p.shapes.map(s=>s.cells.length)),0)>free);signatures.add(JSON.stringify(build.config.requests));
    const reference=records[i-1];assert.deepEqual(reference.config,build.config);assert.ok(['optimal','timeout'].includes(reference.result.status));assert.ok(reference.result.included.length>0);assert.ok(reference.result.omissions.length>0);
    assert.ok(connectedGroups([...problem.fixed,...reference.result.placements]));const occupied=new Set();
    for(const p of [...problem.fixed,...reference.result.placements])for(const [x,y] of cellsOf(p)){assert.ok(x>=0&&x<problem.width&&y>=0&&y<problem.height);assert.ok(problem.rankMask[x*problem.height+y]>=0);const key=x+','+y;assert.ok(!occupied.has(key));occupied.add(key);}
  }
  assert.equal(signatures.size,5);
});

test('all five oversized Machinist examples prove optimality within a bounded search',async()=>{
  const {solve}=await import('../app/core/solver.js');
  for(let i=1;i<=5;i++){const build=importBuild(fs.readFileSync(new URL('../examples/machinist-validation/machinist-'+i+'.afe2.json',import.meta.url),'utf8')),problem=prepareProblem(game,build.config),r=solve(problem,{timeLimitMs:10000,maxNodes:200000});assert.equal(r.status,'optimal','example '+i);assert.ok(r.included.length>=14);assert.ok(connectedGroups([...problem.fixed,...r.placements]));assert.ok(r.placements.filter(p=>p.kind==='Modifier').every(p=>typeof p.groupCoreId==='string'));}
});

test('reported movable-root timeout proves the same priority optimum within a bounded search',()=>{
  const build=importBuild(fs.readFileSync(new URL('./fixtures/machinist-movable-roots.afe2.json',import.meta.url),'utf8'));
  assert.equal(build.config.requests.length,25);
  const problem=prepareProblem(game,build.config),r=solve(problem,{timeLimitMs:10000,maxNodes:50000});
  assert.equal(r.status,'optimal');
  assert.deepEqual(new Set(r.included),new Set(build.config.requests.slice(0,14).map(r=>r.id)));
  assert.equal(r.omissions.length,11);
  assert.ok(connectedGroups([...problem.fixed,...r.placements]));
  assert.equal(r.placements.find(p=>p.id===build.config.requests[0].id).groupCoreId,build.config.abilities.primary);
  const occupied=new Set();
  for(const p of [...problem.fixed,...r.placements])for(const [x,y] of cellsOf(p)){
    assert.ok(x>=0&&y>=0&&x<problem.width&&y<problem.height);
    assert.ok(problem.rankMask[x*problem.height+y]>=0&&problem.rankMask[x*problem.height+y]<=problem.rank);
    const key=x+','+y;assert.ok(!occupied.has(key));occupied.add(key);
  }
});
