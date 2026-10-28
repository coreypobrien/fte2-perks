import test from 'node:test';
import assert from 'node:assert/strict';
import {STORAGE_KEY,SCHEMA_VERSION,validConfig,loadState,persistState,saveNamed,cloneConfig} from '../app/core/storage.js';
const config=()=>({classId:'Medic',rank:5,abilities:{primary:'station',secondary:'stims',passive:'guardian'},requests:[{id:'included',required:true},{id:'omitted',required:false}]});
const memory=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),values};};
test('config validation rejects malformed and duplicate requests without dropping unknown IDs',()=>{
  assert.ok(validConfig(config()));assert.ok(validConfig({...config(),requests:[{id:'unknown-current-perk',required:false}]}));
  for(const bad of [null,{}, {...config(),rank:0},{...config(),rank:11},{...config(),rank:1.5},{...config(),classId:1},{...config(),abilities:[]},{...config(),abilities:{primary:3}},{...config(),requests:[{id:'x',required:'yes'}]},{...config(),requests:[{id:'x',required:true},{id:'x',required:false}]},{...config(),requests:Array.from({length:101},(_,i)=>({id:String(i),required:false}))}])assert.ok(!validConfig(bad));
});
test('empty store, complete round trip and independent draft versus named snapshot',()=>{
  const s=memory();assert.deepEqual(loadState(s),{draft:null,builds:[],error:null});
  const c=config(),builds=saveNamed([],'Medic <local>',c,'v1',{id:()=> 'one',date:()=> 'today'});
  c.rank=10;c.requests.reverse();assert.equal(builds[0].config.rank,5);assert.equal(builds[0].config.requests[0].id,'included');
  assert.ok(persistState(s,{draft:c,builds},'v1').ok);const loaded=loadState(s);assert.deepEqual(loaded.draft,c);assert.deepEqual(loaded.builds,builds);assert.equal(loaded.error,null);
  assert.equal(JSON.parse(s.getItem(STORAGE_KEY)).schemaVersion,SCHEMA_VERSION);
});
test('named updates preserve ID, save-copy creates a new one, and clones do not alias requests',()=>{
  const c=config(),one=saveNamed([],'Original',c,'v1',{id:()=> 'id1'}),updated=saveNamed(one,'Renamed',c,'v1',{existingId:'id1'});
  assert.equal(updated.length,1);assert.equal(updated[0].name,'Renamed');assert.equal(updated[0].id,'id1');
  assert.equal(saveNamed(updated,'Copy',c,'v1',{id:()=> 'id2'}).length,2);
  const clone=cloneConfig(c);clone.requests[0].required=false;assert.equal(c.requests[0].required,true);
  assert.throws(()=>saveNamed([],' ',c,'v1'));assert.throws(()=>saveNamed([],'x'.repeat(81),c,'v1'));assert.throws(()=>saveNamed([],'name',{},'v1'));
});
test('malformed and future saves are not overwritten on read',()=>{
  const s=memory();for(const text of ['{broken',JSON.stringify({schemaVersion:999,builds:[]}),JSON.stringify({schemaVersion:1,draft:config(),builds:[{}]}),JSON.stringify({schemaVersion:1,draft:2,builds:[]})]){
    s.setItem(STORAGE_KEY,text);const loaded=loadState(s);assert.ok(loaded.blocked);assert.ok(loaded.error);assert.equal(s.getItem(STORAGE_KEY),text);
  }
});
test('blocked reads, quota failures and invalid writes report errors without false success',()=>{
  assert.ok(loadState({getItem(){throw new Error('denied');}}).blocked);
  assert.equal(persistState({setItem(){throw new Error('quota');}},{draft:config(),builds:[]},'v1').ok,false);
  assert.equal(persistState(memory(),{draft:{},builds:[]},'v1').ok,false);
  assert.equal(persistState(memory(),{draft:null,builds:[{}]},'v1').ok,false);
  assert.equal(persistState(memory(),{draft:null,builds:[]},'v1').ok,true);
});

test('named and draft saves preserve optional modifier host choices independently',()=>{
  const c=config();c.requests[0].coreId='/Chosen/Core';const builds=saveNamed([],'Host choice',c,'v1',{id:()=> 'host'});delete c.requests[0].coreId;const s=memory();assert.ok(persistState(s,{draft:c,builds},'v1').ok);const loaded=loadState(s);assert.equal(loaded.builds[0].config.requests[0].coreId,'/Chosen/Core');assert.equal(loaded.draft.requests[0].coreId,undefined);
});
