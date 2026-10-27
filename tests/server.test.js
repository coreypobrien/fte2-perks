import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../scripts/serve.mjs';
test('static server serves modules/data with correct types and contains request paths',async()=>{
  const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
  try{
    const page=await fetch(url);assert.equal(page.status,200);assert.match(await page.text(),/Perk planner/i);
    const data=await fetch(url+'/data/game.json');assert.equal(data.status,200);assert.equal((await data.json()).version,'26090957');
    assert.match((await fetch(url+'/core/solver.js')).headers.get('Content-Type'),/javascript/);
    assert.equal((await fetch(url+'/missing')).status,404);assert.equal((await fetch(url,{method:'POST'})).status,405);
    assert.equal((await fetch(url+'/styles.css',{method:'HEAD'})).status,200);
    assert.equal((await fetch(url+'/%')).status,400);assert.equal((await fetch(url+'/%00')).status,400);assert.equal((await fetch(url+'/%5csecret')).status,400);
    assert.equal((await fetch(url+'/%2e%2e%2fpackage.json')).status,403);
  }finally{await new Promise(r=>server.close(r));}
});
