import test from 'node:test';
import assert from 'node:assert/strict';
import {exportBuild,importBuild,buildFilename,MAX_BUILD_SIZE} from '../app/core/transfer.js';
const config=()=>({classId:'/Medic',rank:5,abilities:{primary:'/station',secondary:'/stims',passive:'/guardian'},requests:[{id:'/missing-perk',required:false},{id:'/required-perk',required:true}]});
test('portable round trip preserves order, Required flags, unknown IDs, name, class, rank and abilities',()=>{
  const c=config(),text=exportBuild(' Test priorities ',c,'26090957'),parsed=importBuild(text);
  assert.deepEqual(parsed,{format:'afe2-perk-build',version:1,name:'Test priorities',gameVersion:'26090957',config:c});
  c.requests.reverse();c.requests[0].required=false;assert.deepEqual(parsed.config.requests,[{id:'/missing-perk',required:false},{id:'/required-perk',required:true}]);
  assert.deepEqual(importBuild('\uFEFF'+text),parsed);assert.equal(importBuild(exportBuild('',config(),'old-version')).name,'');
});
test('malformed, future and foreign documents fail before touching the current build',()=>{
  for(const text of ['{broken','null','[]','{}',JSON.stringify({format:'afe2-perk-build',version:2}),JSON.stringify({format:'other',version:1})])assert.throws(()=>importBuild(text));
  assert.throws(()=>importBuild(' '.repeat(MAX_BUILD_SIZE+1)),/1 MiB/);assert.throws(()=>importBuild(null),/text/);
});
test('portable validation rejects invalid settings and excessive or duplicate priorities',()=>{
  const base=JSON.parse(exportBuild('Test',config(),'v1'));
  const bad=[{name:2},{name:'x'.repeat(81)},{gameVersion:null},{gameVersion:'x'.repeat(101)},{config:{}},
    {config:{...config(),classId:''}},{config:{...config(),classId:'x'.repeat(601)}},{config:{...config(),rank:0}},
    {config:{...config(),abilities:{}}},{config:{...config(),abilities:{primary:'',secondary:'s',passive:'p'}}},
    {config:{...config(),abilities:{primary:'x'.repeat(601),secondary:'s',passive:'p'}}},
    {config:{...config(),requests:[{id:'a',required:'yes'}]}},{config:{...config(),requests:[{id:'a',required:true},{id:'a',required:false}]}},
    {config:{...config(),requests:Array.from({length:101},(_,i)=>({id:String(i),required:false}))}}];
  for(const patch of bad)assert.throws(()=>importBuild(JSON.stringify({...base,...patch})));
});
test('unknown extra fields cannot import old placements or a result as authoritative state',()=>{
  const base=JSON.parse(exportBuild('Test',config(),'v1'));base.config.requests[0].placed=true;base.config.result={status:'optimal'};base.result={};
  assert.deepEqual(importBuild(JSON.stringify(base)).config,config());
});
test('portable filenames are safe and use class/rank when the name is blank',()=>{
  assert.equal(buildFilename('Medic <local>','Medic',5),'medic-local.afe2.json');assert.equal(buildFilename('','Machinist',10),'machinist-rank-10.afe2.json');assert.equal(buildFilename('☃','Medic',5),'perk-build.afe2.json');
});

test('portable connection choices preserve unknown host IDs and reject malformed host choices',()=>{
  const c=config();c.requests[0].coreId='/Missing/Host';const text=exportBuild('Pinned',c,'v1');assert.deepEqual(importBuild(text).config,c);
  for(const coreId of [null,0,'','x'.repeat(600)]){const p=config();p.requests[0].coreId=coreId;assert.throws(()=>exportBuild('Bad target',p,'v1'));}
});
