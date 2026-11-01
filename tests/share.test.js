import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {deflateSync} from 'node:zlib';
import {createBuildLink,readBuildLink,MAX_LINK_SIZE} from '../app/core/share.js';
const config={classId:'/Medic',rank:5,abilities:{primary:'/station',secondary:'/stims',passive:'/guardian'},requests:[{id:'/unknown',required:true,coreId:'/unknown-host'},{id:'/second',required:false}]};
const hash=value=>'#build=1.'+deflateSync(Buffer.from(JSON.stringify(value))).toString('base64url');
test('share links preserve Unicode names, unknown IDs, ordered requests and exact hosts without a catalog',async()=>{
  const url=await createBuildLink('https://example.org/project/?test=1#old',' Test 👽 ',config,'old');
  assert.match(url,/^https:\/\/example.org\/project\/\?test=1#build=1\.[\w-]+$/);
  const build=await readBuildLink(new URL(url).hash);assert.deepEqual(build.config,config);assert.equal(build.name,'Test 👽');assert.equal(build.gameVersion,'old');
  assert.equal(await readBuildLink('#other'),null);
});
test('links reject corruption, future versions, invalid tuples and decompression bombs',async()=>{
  for(const h of ['#build=', '#build=1.***','#build=2.abc','#build=1.a', '#build=1.'+'a'.repeat(MAX_LINK_SIZE),hash(null),hash([]),hash(['','','',1,'a','b','c',null]),hash(['','','',1,'a','b','c',[[]]]),hash(['','','',1,'a','b','c',[[1,2]]]),hash(['','','',1,'a','b','c',[[1,0]]]),hash('a'.repeat(1048577))])await assert.rejects(readBuildLink(h));
  await assert.rejects(createBuildLink('https://example.org/'+'a'.repeat(MAX_LINK_SIZE),'',config,'v1'),/too large/);
  await assert.rejects(createBuildLink('https://example.org/','',{...config,rank:11},'v1'));
});
test('all five full Machinist links round-trip in fewer than 800 characters',async()=>{
  for(let i=1;i<=5;i++){
    const build=JSON.parse(fs.readFileSync(new URL('../examples/machinist-validation/machinist-'+i+'.afe2.json',import.meta.url)));
    const url=await createBuildLink('https://coreypobrien.github.io/fte2-perks/',build.name,build.config,build.gameVersion);
    assert.ok(url.length<800,'length '+url.length);assert.deepEqual(await readBuildLink(new URL(url).hash),build);
  }
});
