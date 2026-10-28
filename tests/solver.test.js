import test from 'node:test';
import assert from 'node:assert/strict';
import {solve,compatible,tagMatches,adjacent,connectedGroups,cellsOf} from '../app/core/solver.js';
import {chip,placed,board} from './helpers.js';
test('hierarchical tag matching is directional and compatible only between core and modifier',()=>{
  assert.ok(tagMatches('A.B.C','A.B'));assert.ok(tagMatches('A.B','A.B'));assert.ok(!tagMatches('A','A.B'));
  assert.ok(compatible(chip('c',1,1,{accepts:['A']}),chip('m',1,1,{kind:'Modifier',tags:['A.B']})));
  assert.ok(!compatible(chip('c'),chip('m',1,1,{kind:'Modifier',tags:['A']})));
  assert.ok(!compatible(chip('c',1,1,{kind:'Modifier',accepts:['A']}),chip('m',1,1,{kind:'Modifier',tags:['A']})));
});
test('adjacency uses occupied orthogonal cells, not diagonals or bounding boxes',()=>{
  assert.ok(adjacent(placed(chip('a')),placed(chip('b'),1,0)));assert.ok(!adjacent(placed(chip('a')),placed(chip('b'),1,1)));
  assert.deepEqual(cellsOf(placed(chip('a',2,1),3,2)),[[3,2],[4,2]]);
  const hole=placed(chip('hole',3,3,{shapes:[{width:3,height:3,cells:[[0,0]]}]}));assert.ok(!adjacent(hole,placed(chip('b'),2,2)));
});
test('fixed orientation cannot rotate a 4x1 into 1x4',()=>{
  assert.equal(solve(board(1,4,[chip('strip',4,1)],[{id:'strip',required:true}])).status,'infeasible');
  assert.deepEqual(solve(board(4,1,[chip('strip',4,1)])).included,['strip']);
});
test('rank and unusable cells constrain placement, including non-square column-major masks',()=>{
  const p=chip('p',2,1),problem=board(2,2,[p],undefined,{rank:5,rankMask:[10,-1,10,0]});
  assert.deepEqual(solve(problem).included,[]);problem.rank=10;assert.deepEqual(solve(problem).included,['p']);
});
test('required perks never drop and outrank optional priorities',()=>{
  const p=board(2,1,[chip('optional',2),chip('required')],[{id:'optional',required:false},{id:'required',required:true}]);
  assert.deepEqual(solve(p).included,['required']);
  p.requests=[{id:'optional',required:true},{id:'required',required:true}];assert.equal(solve(p).status,'infeasible');
});
test('one higher preference wins over multiple lower priorities',()=>{
  const p=board(2,1,[chip('large',2),chip('low1'),chip('low2')]);assert.deepEqual(solve(p).included,['large']);
});
test('dependency can be a lower-priority requested core',()=>{
  const core=chip('core',1,1,{accepts:['mod']}),mod=chip('mod',1,1,{kind:'Modifier',tags:['mod']});
  assert.deepEqual(new Set(solve(board(2,1,[mod,core])).included),new Set(['mod','core']));
  const absent=solve(board(2,1,[mod]));assert.deepEqual(absent.included,[]);assert.match(absent.omissions[0].reason,/compatible/);
  const required=solve(board(2,1,[mod],[{id:'mod',required:true}]));assert.equal(required.status,'infeasible');assert.match(required.omissions[0].reason,/compatible/);
});
test('a required modifier can need an optional bridge to be feasible',()=>{
  const core=chip('core',1,1,{accepts:['A']}),required=chip('required',2,2,{kind:'Modifier',tags:['A']}),bridge=chip('bridge',1,1,{kind:'Modifier',tags:['A']});
  const p=board(4,2,[required,bridge],[{id:'required',required:true},{id:'bridge',required:false}],{rankMask:[0,-1,0,-1,0,0,0,0],fixed:[placed(core)]});
  assert.deepEqual(new Set(solve(p).included),new Set(['required','bridge']));
});
test('modifiers can chain but each must match its group core',()=>{
  const c=placed(chip('c',1,1,{accepts:['M']})),a=placed(chip('a',1,1,{kind:'Modifier',tags:['M']}),1),b=placed(chip('b',1,1,{kind:'Modifier',tags:['M.Child']}),2);
  assert.ok(connectedGroups([c,a,b]));b.tags=['Wrong'];assert.ok(!connectedGroups([c,a,b]));assert.ok(!connectedGroups([a,b]));
});
test('a group cannot contain two ability overrides, including its core',()=>{
  const core=placed(chip('c',1,1,{accepts:['M']})),a=placed(chip('a',1,1,{kind:'Modifier',tags:['M'],override:'A'}),1),b=placed(chip('b',1,1,{kind:'Modifier',tags:['M'],override:'B'}),2);
  assert.ok(!connectedGroups([core,a,b]));b.override=null;assert.ok(connectedGroups([core,a,b]));core.override='C';assert.ok(!connectedGroups([core,a,b]));
});
test('different core groups may each have one override',()=>{
  const c1=placed(chip('c1',1,1,{accepts:['A']})),m1=placed(chip('m1',1,1,{kind:'Modifier',tags:['A'],override:'a'}),1),c2=placed(chip('c2',1,1,{accepts:['B']}),4),m2=placed(chip('m2',1,1,{kind:'Modifier',tags:['B'],override:'b'}),3);
  assert.ok(connectedGroups([c1,m1,c2,m2]));
});
test('shared bridge cannot belong to two groups simultaneously',()=>{
  // A -- bridge -- B, with A-only and B-only leaves both accessible only via bridge.
  const a=placed(chip('A',1,1,{accepts:['common','a']}),0,1),b=placed(chip('B',1,1,{accepts:['common','b']}),2,1),bridge=placed(chip('bridge',1,1,{kind:'Modifier',tags:['common']}),1,1),x=placed(chip('x',1,1,{kind:'Modifier',tags:['a']}),1,0),y=placed(chip('y',1,1,{kind:'Modifier',tags:['b']}),1,2);
  assert.ok(!connectedGroups([a,b,bridge,x,y]));assert.ok(connectedGroups([a,b,bridge,x]));
});
test('fixed slots block overlap, are not rotated, and connect modifiers',()=>{
  const c=chip('fixed',1,1,{accepts:['M']}),m=chip('m',1,1,{kind:'Modifier',tags:['M']});
  assert.deepEqual(solve(board(2,1,[m],undefined,{fixed:[placed(c)]})).included,['m']);
  assert.equal(solve(board(2,1,[m],undefined,{fixed:[placed(c),placed(chip('overlap'))]})).status,'invalid');
});
test('missing and unavailable requests are preserved as omissions and requirements fail',()=>{
  const p=chip('bad',1,1,{unavailable:'Wrong class'}),spec=board(2,1,[p],[{id:'bad',required:false},{id:'missing',required:false}]);
  const r=solve(spec);assert.equal(r.omissions.length,2);assert.equal(r.status,'optimal');spec.requests[0].required=true;assert.equal(solve(spec).status,'infeasible');
  assert.equal(solve(board(1,1,[chip('x')],[{id:'x'},{id:'x'}])).status,'invalid');
});
test('invalid board and footprint fail safely',()=>{
  assert.equal(solve(board(0,1,[])).status,'invalid');assert.equal(solve(board(2,1,[],undefined,{rankMask:[]})).status,'invalid');
  assert.equal(solve(board(1,1,[chip('x',1,1,{shapes:[{width:1,height:1,cells:[[2,0]]}]})])).status,'invalid');
  assert.deepEqual(solve(board(2,1,[chip('x',2,1,{shapes:[{width:2,height:1,cells:[[0,0],[0,0]]}]})])).included,[]);
});
test('search budget never masquerades as optimal or impossible',()=>{
  const r=solve(board(3,3,[chip('a')]),{timeLimitMs:0});assert.equal(r.status,'timeout');assert.equal(r.complete,false);
  const r2=solve(board(3,3,[chip('a')]),{maxNodes:2});assert.equal(r2.status,'timeout');
});
test('placement is deterministic and respects all requested cells',()=>{
  const p=board(3,2,[chip('a',2),chip('b',1,2)]);assert.deepEqual(solve(p).placements,solve(p).placements);
});
test('small independent exhaustive oracle agrees on lexicographic selection for all request orders',()=>{
  const shapes=[chip('wide',2,1),chip('tall',1,2),chip('dot')];
  const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  function brute(items,selected,index,occupied){if(index===selected.length)return true;const p=items[selected[index]],s=p.shapes[0];for(let y=0;y<=2-s.height;y++)for(let x=0;x<=2-s.width;x++){const cells=s.cells.map(([cx,cy])=>(y+cy)*2+x+cx);if(cells.every(c=>!occupied.has(c))&&brute(items,selected,index+1,new Set([...occupied,...cells])))return true;}return false;}
  for(const order of permutations){const items=order.map(i=>shapes[i]);let expected=[];for(let subset=7;subset>=0;subset--){const selected=items.map((p,i)=>i).filter(i=>subset&(1<<(2-i)));if(brute(items,selected,0,new Set())){expected=selected.map(i=>items[i].id);break;}}
    assert.deepEqual(new Set(solve(board(2,2,items)).included),new Set(expected));}
});

test('oversubscribed lists retain the lexicographic prefix and prune over-capacity branches',()=>{
  const items=Array.from({length:60},(_,i)=>chip('dot-'+i));const r=solve(board(6,6,items),{maxNodes:10000,timeLimitMs:5000});
  assert.equal(r.status,'optimal');assert.deepEqual(new Set(r.included),new Set(items.slice(0,36).map(p=>p.id)));assert.ok(r.nodes<10000);
});
test('budget exhaustion retains an improved valid incumbent with required perks',()=>{
  const items=Array.from({length:30},(_,i)=>chip('dot-'+i));const p=board(5,5,items,items.map((p,i)=>({id:p.id,required:i===0})));
  const r=solve(p,{maxNodes:60,timeLimitMs:5000});assert.equal(r.status,'timeout');assert.ok(r.included.length>1);assert.ok(r.included.includes('dot-0'));assert.ok(connectedGroups(r.placements));
});
test('fixed modifiers and disconnected footprints do not cause unsafe reachability pruning',()=>{
  const core=chip('core',1,1,{accepts:['A']}),bridge=chip('bridge',1,1,{kind:'Modifier',tags:['A']});
  const mod=chip('mod',1,1,{kind:'Modifier',tags:['A']}),dot=chip('dot');
  assert.equal(solve(board(4,1,[mod,dot],undefined,{fixed:[placed(core),placed(bridge,1)]})).included.length,2);
  const sparse=chip('sparse',3,1,{kind:'Modifier',tags:['A'],shapes:[{width:3,height:1,cells:[[0,0],[2,0]]}]});
  assert.equal(solve(board(5,1,[sparse,mod,dot],undefined,{fixed:[placed(core)]})).status,'optimal');
});
test('independent geometry and group-assignment oracle checks mixed requests and requirements',()=>{
  const items=[chip('root',1,1,{accepts:['A']}),chip('mod',1,1,{kind:'Modifier',tags:['A']}),chip('bridge',2,1,{kind:'Modifier',tags:['A']}),chip('other',1,2)];
  function legal(ps){const cores=ps.filter(p=>p.kind==='Core'),mods=ps.filter(p=>p.kind==='Modifier');
    const touches=(a,b)=>a.points.some(([x,y])=>b.points.some(([u,v])=>Math.abs(x-u)+Math.abs(y-v)===1));
    function assign(i,groups){if(i===mods.length)return groups.every((g,k)=>{const seen=new Set([cores[k]]);let changed=true;while(changed){changed=false;for(const m of g)if(!seen.has(m)&&[...seen].some(p=>touches(p,m))){seen.add(m);changed=true;}}return g.every(m=>seen.has(m));});
      return cores.some((c,k)=>c.accepts.includes('A')&&assign(i+1,groups.map((g,j)=>j===k?[...g,mods[i]]:g)));}
    return assign(0,cores.map(()=>[]));}
  function fits(selected,i=0,ps=[],used=new Set()){if(i===selected.length)return legal(ps);const p=selected[i],shape=p.shapes[0];for(let y=0;y<=2-shape.height;y++)for(let x=0;x<=3-shape.width;x++){const points=shape.cells.map(([u,v])=>[x+u,y+v]),keys=points.map(([u,v])=>u+','+v);if(keys.every(k=>!used.has(k))&&fits(selected,i+1,[...ps,{...p,points}],new Set([...used,...keys])))return true;}return false;}
  for(const order of [items,[...items].reverse(),[items[1],items[2],items[3],items[0]]])for(const required of [null,'mod','bridge']){
    let expected=null;for(let bits=15;bits>=0;bits--){const selected=order.filter((p,i)=>bits&(1<<(3-i)));if(required&&!selected.some(p=>p.id===required))continue;if(fits(selected)){expected=selected.map(p=>p.id);break;}}
    const r=solve(board(3,2,order,order.map(p=>({id:p.id,required:p.id===required}))));assert.equal(r.status,expected?'optimal':'infeasible');if(expected)assert.deepEqual(new Set(r.included),new Set(expected));
  }
});
