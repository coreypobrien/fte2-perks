import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {createServer} from './serve.mjs';
const args=process.argv.slice(2),arg=(name,fallback=null)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
let playwright;
try{playwright=await import('playwright');}catch(error){const module=arg('--playwright-module');if(!module)throw new Error('Install dev dependencies (npm install), or pass --playwright-module PATH_TO_PLAYWRIGHT_INDEX_MJS.');playwright=await import(pathToFileURL(path.resolve(module)));}
const evidence=path.resolve(arg('--evidence','work/evidence'));fs.mkdirSync(evidence,{recursive:true});
const report={startedAt:new Date().toISOString(),browser:'Chromium',checks:[],pageErrors:[],consoleErrors:[],failedRequests:[],coverage:[]};
const check=async(name,run)=>{if(arg('--only')&&!name.includes(arg('--only')))return;try{await run();report.checks.push({name,status:'passed'});console.log('PASS '+name);}catch(error){report.checks.push({name,status:'failed'});const pages=browser?.contexts().flatMap(c=>c.pages())??[];const p=pages.at(-1);if(p){report.failurePage=await p.locator('body').innerText().catch(()=> 'Page unavailable');await p.screenshot({path:path.join(evidence,'failure.png'),fullPage:true}).catch(()=>{});}throw error;}};
let ownedServer=null,browser;
try{
  let base=arg('--base-url');if(!base){ownedServer=createServer(arg('--directory')??undefined);await new Promise(r=>ownedServer.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+ownedServer.address().port+'/';}
  report.baseUrl=base;assert.equal((await fetch(base)).status,200);
  const executablePath=arg('--browser-path');browser=await playwright.chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
  const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage();
  page.on('pageerror',e=>report.pageErrors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))report.consoleErrors.push(m.text());});page.on('requestfailed',r=>report.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
  await page.coverage.startJSCoverage({resetOnNavigation:false});
  await check('static page loads catalog and a keyboard-accessible library without server APIs',async()=>{
    await page.goto(base);await page.locator('.library-row').first().waitFor();assert.equal(await page.locator('#class-select').inputValue(),'/Game/Blueprints/Avocado_Classes/Medic/Player_Medic');
    assert.equal(await page.locator('#grid .tile.fixed').count(),3);await page.locator('#search').focus();await page.keyboard.type('Doctor');assert.ok(await page.getByRole('button',{name:"Add Doctor's Orders",exact:true}).isEnabled());
  });
  await check('empty build names are rejected without creating a saved snapshot',async()=>{
    await page.locator('#build-name').fill(' ');await page.locator('#save-build').click();assert.match(await page.locator('#save-status').innerText(),/Enter a build name/);assert.equal(await page.locator('#saved-builds').inputValue(),'');
  });
  async function add(name){await page.locator('#search').fill(name);await page.getByRole('button',{name:'Add '+name,exact:true}).click();}
  async function solve(){await page.locator('#solve').click();await page.locator('#cancel').waitFor({state:'hidden',timeout:16000});}
  await check('real worker solves required and prioritized perks with native connections',async()=>{
    await page.getByRole('button',{name:"Add Doctor's Orders",exact:true}).click();await page.getByRole('checkbox',{name:"Require Doctor's Orders",exact:true}).check();
    await add('Concentrated Formula');await add('CQW Weapon Training');await add('Resiliency');await page.locator('#rank-select').selectOption('5');await solve();
    assert.equal(await page.locator('#result-badge').innerText(),'Optimal fit');assert.match(await page.locator('#grid-summary').innerText(),/3 of 4/);
    assert.equal(await page.locator('.priority-row.included').count(),3);assert.match(await page.locator('#below-list').innerText(),/Resiliency/);assert.ok(!(await page.locator('#effects-list').innerText()).includes('300%'));
    const formula=page.locator('#grid .tile').filter({hasText:'Concentrated Formula'});assert.match(await formula.getAttribute('aria-label'),/column 2/);
  });
  await check('editing invalidates highlights and rank 10 restores the omitted effect exactly once',async()=>{
    await page.locator('#below-list').getByRole('button',{name:'Make required'}).click();await solve();assert.equal(await page.locator('#result-badge').innerText(),'No arrangement');await page.getByRole('checkbox',{name:'Require Resiliency',exact:true}).uncheck();
    await page.locator('#rank-select').selectOption('10');assert.equal(await page.locator('#result-badge').innerText(),'Out of date');assert.equal(await page.locator('.priority-row.included').count(),0);assert.match(await page.locator('#effects-note').innerText(),/previous/);
    await solve();assert.match(await page.locator('#grid-summary').innerText(),/4 of 4/);assert.equal(await page.locator('#effects-list li').filter({hasText:'300%'}).count(),1);
    assert.match(await page.locator('#grid .tile').filter({hasText:'Resiliency'}).getAttribute('aria-label'),/row 1/);
    await page.locator('#grid .tile').filter({hasText:"Doctor's Orders"}).click();assert.match(await page.locator('#selected-detail').innerText(),/5%/);
  });
  await check('named save, save copy, autosave, reorder, removal and reload preserve stable inputs',async()=>{
    await page.getByRole('button',{name:'Move Resiliency up',exact:true}).focus();await page.keyboard.press('Enter');assert.match(await page.locator('.priority-row').nth(2).innerText(),/Resiliency/);await solve();
    await page.locator('#build-name').fill('Medic local build');await page.locator('#save-build').click();assert.match(await page.locator('#save-status').innerText(),/^Saved/);
    await page.locator('#save-copy').click();assert.equal(await page.locator('#saved-builds option').count(),2);
    const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('afe2.perk-planner.v0')));assert.equal(stored.builds[0].config.requests.length,4);assert.equal(stored.builds[0].config.rank,10);
    await page.getByRole('button',{name:'Remove Resiliency',exact:true}).click();await solve();assert.ok(!(await page.locator('#effects-list').innerText()).includes('300%'));
    await page.reload();await page.locator('.library-row').first().waitFor();await page.locator('#cancel').waitFor({state:'hidden'});assert.equal(await page.locator('.priority-row').count(),3);
    await page.locator('#saved-builds').selectOption(stored.builds[0].id);await page.locator('#load-build').click();await page.locator('#cancel').waitFor({state:'hidden'});
    assert.equal(await page.locator('.priority-row').count(),4);assert.ok(await page.getByRole('checkbox',{name:"Require Doctor's Orders",exact:true}).isChecked());assert.match(await page.locator('#effects-list').innerText(),/300%/);
  });
  await check('ability replacements remove incompatible modifiers; required conflicts are explicit',async()=>{
    const options=await page.locator('#primary-select option').evaluateAll(nodes=>nodes.map(n=>({name:n.textContent,value:n.value})));const buff=options.find(o=>o.name==='Buffing Station');assert.ok(buff);
    await page.locator('#primary-select').selectOption(buff.value);await solve();assert.match(await page.locator('#below-list').innerText(),/Concentrated Formula/);assert.ok(!(await page.locator('#effects-list').innerText()).includes('poison by 75%'));
    await page.getByRole('checkbox',{name:'Require Concentrated Formula',exact:true}).check();await solve();assert.equal(await page.locator('#result-badge').innerText(),'No arrangement');assert.match(await page.locator('#below-list').innerText(),/Required|cannot/);assert.equal(await page.locator('.priority-row.included').count(),0);
    const original=options.find(o=>o.name==='Advanced Trauma Station');await page.locator('#primary-select').selectOption(original.value);await solve();assert.equal(await page.locator('#result-badge').innerText(),'Optimal fit');
  });
  await check('cross-class universal perks remain eligible while class-specific requests remain visible',async()=>{
    const marauder=await page.locator('#class-select option').filter({hasText:'Marauder'}).getAttribute('value');await page.locator('#class-select').selectOption(marauder);
    await page.getByRole('checkbox',{name:"Require Doctor's Orders",exact:true}).uncheck();await page.getByRole('checkbox',{name:'Require Concentrated Formula',exact:true}).uncheck();await solve();
    assert.match(await page.locator('#grid-summary').innerText(),/2 of 4/);assert.match(await page.locator('#below-list').innerText(),/Not usable by the selected class/);assert.equal(await page.locator('.priority-row').count(),4);
    await page.locator('#search').fill('Drive');assert.ok((await page.locator('#library-list').innerText()).includes('Universal use'));
    await page.locator('#show-unavailable').check();await page.locator('#search').fill("Doctor's Orders");assert.ok(await page.getByRole('button',{name:"Add Doctor's Orders",exact:true}).isDisabled());
  });
  await check('missing catalog IDs and old game versions survive load and get explicit reasons',async()=>{
    await page.evaluate(()=>{const k='afe2.perk-planner.v0',d=JSON.parse(localStorage.getItem(k));d.builds[0].gameVersion='old-build';d.builds[0].config.requests.push({id:'/Missing/OldPerk',required:false});localStorage.setItem(k,JSON.stringify(d));});
    await page.reload();await page.locator('.library-row').first().waitFor();await page.locator('#load-build').click();await page.locator('#cancel').waitFor({state:'hidden'});
    assert.match(await page.locator('#notice').innerText(),/different game-data version/);assert.match(await page.locator('#priority-list').innerText(),/Missing catalog perk/);assert.match(await page.locator('#below-list').innerText(),/Missing from current game catalog/);
  });
  await check('responsive desktop/mobile layouts do not overflow horizontally',async()=>{
    // Load clean named snapshot, remove only the deliberately missing test fixture.
    await page.getByRole('button',{name:'Remove perk',exact:true}).click();await page.locator('#rank-select').selectOption('5');await solve();await page.locator('#search').fill('');await page.locator('#show-unavailable').uncheck();
    for(const width of [1440,1024,736,390,320]){await page.setViewportSize({width,height:1100});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow at '+width);}
    await page.setViewportSize({width:1440,height:1100});await page.screenshot({path:path.join(evidence,'desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:1000});await page.screenshot({path:path.join(evidence,'mobile.png'),fullPage:true});
  });
  const coverage=await page.coverage.stopJSCoverage(),functions=new Map();
  for(const file of coverage.filter(f=>f.url.endsWith('/main.js')||/\/assets\/index-[\w-]+\.js$/.test(f.url)))for(const fn of file.functions){const key=fn.functionName+':'+fn.ranges[0].startOffset;functions.set(key,(functions.get(key)??false)||fn.ranges[0].count>0);}
  report.coverage.push({module:'browser entry (source or Vite bundle)',metric:'browser V8 function coverage across normal-flow navigations; not statement/branch coverage',totalFunctions:functions.size,executedFunctions:[...functions.values()].filter(Boolean).length});
  await check('blocked local storage reports failure without inventing a successful save',async()=>{
    const denied=await browser.newContext();await denied.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota full','QuotaExceededError');};});const p=await denied.newPage();p.on('pageerror',e=>report.pageErrors.push(e.message));await p.goto(base);await p.locator('.library-row').first().waitFor();await p.locator('#build-name').fill('Cannot save');await p.locator('#save-build').click();assert.match(await p.locator('#save-status').innerText(),/unavailable|full/);assert.equal(await p.locator('#saved-builds').inputValue(),'');await denied.close();
  });
  await check('malformed existing storage is preserved instead of being overwritten',async()=>{
    const isolated=await browser.newContext(),p=await isolated.newPage();await p.goto(base,{waitUntil:'networkidle'});await p.locator('.library-row').first().waitFor();await p.evaluate(()=>localStorage.setItem('afe2.perk-planner.v0','{broken-original'));await p.reload({waitUntil:'networkidle'});await p.locator('.library-row').first().waitFor();assert.match(await p.locator('#notice').innerText(),/could not be read/);await p.locator('#save-build').click();assert.equal(await p.evaluate(()=>localStorage.getItem('afe2.perk-planner.v0')),'{broken-original');await isolated.close();
  });
  await check('cancelling a worker leaves inputs intact and does not publish a late result',async()=>{
    const c=await browser.newContext(),p=await c.newPage();await p.route(/\/worker(?:-[\w-]+)?\.js(?:\?.*)?$/,async route=>{await new Promise(r=>setTimeout(r,300));try{await route.continue();}catch{}});await p.goto(base);await p.locator('.library-row').first().waitFor();await p.locator('#solve').click();await p.locator('#cancel').click();assert.match(await p.locator('#solve-status').innerText(),/cancelled/);assert.ok(await p.locator('#solve').isEnabled());await new Promise(r=>setTimeout(r,400));assert.match(await p.locator('#solve-status').innerText(),/cancelled/);await c.close();
  });
  await check('failed catalog load and failed worker start have clear recovery states',async()=>{
    const c=await browser.newContext(),p=await c.newPage();await p.route(/\/(?:data\/game|assets\/game-[\w-]+)\.json(?:\?.*)?$/,route=>route.fulfill({status:503,body:'unavailable'}));await p.goto(base);await p.locator('#notice').waitFor({state:'visible'});assert.match(await p.locator('#notice').innerText(),/HTTP 503/);assert.ok(await p.locator('#solve').isDisabled());await c.close();
    const c2=await browser.newContext(),p2=await c2.newPage();await p2.route(/\/worker(?:-[\w-]+)?\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'text/javascript',body:'throw new Error("worker unavailable")'}));await p2.goto(base);await p2.locator('.library-row').first().waitFor();await p2.locator('#solve').click();await p2.locator('#notice').waitFor({state:'visible'});assert.match(await p2.locator('#notice').innerText(),/worker could not start/);assert.ok(await p2.locator('#solve').isEnabled());await c2.close();
  });
  assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.failedRequests,[]);assert.deepEqual(report.consoleErrors,[]);
  report.status='passed';report.finishedAt=new Date().toISOString();console.log(`${report.checks.length} browser scenarios passed; no page errors or failed requests.`);
}catch(error){report.status='failed';report.failure=error.stack;console.error(error);process.exitCode=1;}
finally{if(browser)await browser.close();if(ownedServer)await new Promise(r=>ownedServer.close(r));fs.writeFileSync(path.join(evidence,'browser-report.json'),JSON.stringify(report,null,2)+'\n');}
