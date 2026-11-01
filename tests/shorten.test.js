import test from 'node:test';
import assert from 'node:assert/strict';
import {createShortener} from '../app/core/shorten.js';
const link='https://example.org/planner/?q=1&other=2#build=1.abc_def';
const response=(data,ok=true)=>({ok,status:ok?200:502,json:async()=>data});
test('optional shortening preserves the full fragment, omits credentials/stats, bounds time and caches exact links',async()=>{
  let calls=0;
  const shorten=createShortener({fetcher:async(url,options)=>{
    calls++;const endpoint=new URL(url);assert.equal(endpoint.origin,'https://is.gd');assert.equal(endpoint.pathname,'/create.php');
    assert.equal(endpoint.searchParams.get('url'),link);assert.equal(endpoint.searchParams.get('format'),'json');assert.equal(endpoint.searchParams.has('logstats'),false);
    assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');assert.ok(options.signal instanceof AbortSignal);
    return response({shorturl:'https://is.gd/Abc123'});
  }});
  assert.equal(await shorten(link),'https://is.gd/Abc123');assert.equal(await shorten(link),'https://is.gd/Abc123');assert.equal(calls,1);
});
test('shortening rejects invalid destinations and oversized input before sending any request',async()=>{
  let called=false;const shorten=createShortener({fetcher:()=>{called=true;}});
  for(const url of ['invalid','file:///test','https://example.org/'+'a'.repeat(5000)])await assert.rejects(shorten(url));
  assert.equal(called,false);
});
test('service errors and unexpected returned URLs cannot replace the original build link',async()=>{
  for(const data of [null,{}, {errorcode:1},{shorturl:'https://evil.example/build'},{shorturl:'javascript:alert(1)'},{shorturl:'https://is.gd/a?bad=1'},{shorturl:12}])await assert.rejects(createShortener({fetcher:async()=>response(data)})(link),/could not shorten/);
  for(const fetcher of [async()=>{throw new Error('offline');},async()=>response({},false),async()=>({ok:true,json:async()=>{throw new Error('broken JSON');}})])await assert.rejects(createShortener({fetcher})(link),/could not be reached/);
});
test('rate limits prevent further network calls for one minute but allow cached links',async()=>{
  let time=0,calls=0;
  const shorten=createShortener({now:()=>time,fetcher:async()=>++calls===2?response({errorcode:3},false):response({shorturl:'https://is.gd/Abc123'})});
  await shorten(link);await assert.rejects(shorten(link+'new'),/rate limit/);
  assert.equal(await shorten(link),'https://is.gd/Abc123');await assert.rejects(shorten(link+'third'),/rate limit/);assert.equal(calls,2);
  time=60000;await shorten(link+'new');assert.equal(calls,3);
});
test('the session cache is bounded and network waits abort',async()=>{
  let calls=0;const shorten=createShortener({fetcher:async()=>{calls++;return response({shorturl:'https://is.gd/Abc123'});}});
  for(let i=0;i<21;i++)await shorten(link+i);await shorten(link+'0');assert.equal(calls,22);
  const timeout=createShortener({timeoutMs:1,fetcher:async(url,{signal})=>{await new Promise(resolve=>setTimeout(resolve,15));assert.ok(signal.aborted);throw signal.reason;}});
  await assert.rejects(timeout(link),/could not be reached/);
});
