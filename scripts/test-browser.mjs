import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {createServer} from './serve.mjs';
import {createConfig,availability} from '../app/core/model.js';
import {exportBuild,importBuild} from '../app/core/transfer.js';
const args=process.argv.slice(2),arg=(name,fallback=null)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
let playwright;
try{playwright=await import('playwright');}catch(error){const module=arg('--playwright-module');if(!module)throw new Error('Install dev dependencies (pnpm install --frozen-lockfile), or pass --playwright-module PATH_TO_PLAYWRIGHT_INDEX_MJS.');playwright=await import(pathToFileURL(path.resolve(module)));}
const evidence=path.resolve(arg('--evidence','work/evidence'));fs.mkdirSync(evidence,{recursive:true});
const report={startedAt:new Date().toISOString(),browser:'Chromium',checks:[],pageErrors:[],consoleErrors:[],failedRequests:[],coverage:[]};
const check=async(name,run)=>{if(arg('--only')&&!name.includes(arg('--only')))return;try{await run();report.checks.push({name,status:'passed'});console.log('PASS '+name);}catch(error){report.checks.push({name,status:'failed'});const pages=browser?.contexts().flatMap(c=>c.pages())??[];const p=pages.at(-1);if(p){report.failurePage=await p.locator('body').innerText().catch(()=> 'Page unavailable');await p.screenshot({path:path.join(evidence,'failure.png'),fullPage:true}).catch(()=>{});}throw error;}};
let ownedServer=null,browser;
try{
  let base=arg('--base-url');if(!base){ownedServer=createServer(arg('--directory')??undefined,arg('--base-path','/'));await new Promise(r=>ownedServer.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+ownedServer.address().port+arg('--base-path','/');}
  report.baseUrl=base;assert.equal((await fetch(base)).status,200);
  const executablePath=arg('--browser-path');browser=await playwright.chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
  const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage();
  page.on('pageerror',e=>report.pageErrors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))report.consoleErrors.push(m.text());});page.on('requestfailed',r=>report.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
  await page.coverage.startJSCoverage({resetOnNavigation:false});
  await check('static page loads catalog and a keyboard-accessible library without server APIs',async()=>{
    await page.goto(base);await page.locator('.library-row').first().waitFor();assert.equal(await page.locator('#class-select').inputValue(),'/Game/Blueprints/Avocado_Classes/Medic/Player_Medic');
    assert.equal(await page.locator('#grid .tile.fixed').count(),3);await page.locator('#search').focus();await page.keyboard.type('Doctor');assert.ok(await page.getByRole('button',{name:"Add Doctor's Orders",exact:true}).isEnabled());
  });
  await check('granting class, independent type and universal filters preserve expanded descriptions',async()=>{
    assert.equal(await page.locator('#build-name').inputValue(),'');
    await page.locator('#search').fill('');
    await page.locator('#granting-class').selectOption('Medic');
    await page.locator('#type-modifier').uncheck();
    assert.ok(await page.locator('.library-row').count()>0);
    assert.ok((await page.locator('.library-row summary').allTextContents()).every(s=>s.startsWith('Core')));
    await page.locator('#type-core').uncheck();assert.equal(await page.locator('.library-row').count(),0);
    await page.locator('#type-core').check();await page.locator('#type-modifier').check();await page.locator('#granting-class').selectOption('all');
    await page.locator('#search').fill('Drive');await page.locator('#show-universal').uncheck();assert.equal(await page.locator('.library-row').count(),0);
    await page.locator('#show-universal').check();assert.ok(await page.getByRole('button',{name:'Add Drive',exact:true}).isEnabled());
    await page.locator('#search').fill('');
    const doctor=page.locator('.library-row').filter({has:page.getByRole('button',{name:"Add Doctor's Orders",exact:true})});
    const formula=page.locator('.library-row').filter({has:page.getByRole('button',{name:'Add Concentrated Formula',exact:true})});
    await doctor.locator('summary').click();await formula.locator('summary').click();
    await doctor.getByRole('button',{name:"Add Doctor's Orders",exact:true}).click();
    assert.ok(await doctor.locator('details').evaluate(n=>n.open));assert.ok(await formula.locator('details').evaluate(n=>n.open));
    await page.getByRole('button',{name:"Remove Doctor's Orders",exact:true}).click();
    await page.locator('#search').fill('Doctor');
  });
  await check('selected-class rank filtering hides future grants and leaves cross-class unlocks available',async()=>{
    await page.locator('#search').fill('Resiliency');await page.locator('#rank-select').selectOption('9');assert.equal(await page.locator('.library-row').count(),0);
    await page.locator('#show-unavailable').check();assert.ok(await page.getByRole('button',{name:'Add Resiliency',exact:true}).isDisabled());assert.match(await page.locator('#library-list').innerText(),/rank 10/);
    await page.locator('#rank-select').selectOption('10');assert.ok(await page.getByRole('button',{name:'Add Resiliency',exact:true}).isEnabled());await page.locator('#show-unavailable').uncheck();
    await page.locator('#rank-select').selectOption('1');await page.locator('#search').fill('Drive');assert.ok(await page.getByRole('button',{name:'Add Drive',exact:true}).isEnabled());
    await page.locator('#search').fill("Doctor's Orders");assert.equal(await page.locator('.library-row').count(),0);await page.locator('#rank-select').selectOption('3');assert.ok(await page.getByRole('button',{name:"Add Doctor's Orders",exact:true}).isEnabled());
    await page.locator('#rank-select').selectOption('10');await page.locator('#search').fill('Doctor');
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
  await check('hover and keyboard focus link perk rows, tiles and descriptions while omissions show missed effects',async()=>{
    const priority=page.locator('.priority-row').filter({hasText:"Doctor's Orders"}),id=await priority.getAttribute('data-perk-id');
    const linked=selector=>page.locator(selector+'[data-perk-id='+JSON.stringify(id)+']'),tile=linked('#grid .tile'),effect=linked('#effects-list .effect-row');
    assert.equal(await page.locator('#effects-list .effect-row').count(),3);
    const fixedIds=await page.locator('#grid .tile.fixed').evaluateAll(ns=>ns.map(n=>n.dataset.perkId)),effectIds=await page.locator('#effects-list .effect-row').evaluateAll(ns=>ns.map(n=>n.dataset.perkId));assert.ok(effectIds.every(id=>!fixedIds.includes(id)));
    for(const origin of [priority,tile,effect]){await origin.hover();for(const counterpart of [priority,tile,effect])assert.ok((await counterpart.getAttribute('class')).includes('highlighted'));}
    await page.locator('h1').hover();for(const counterpart of [priority,tile,effect])assert.ok(!(await counterpart.getAttribute('class')).includes('highlighted'));
    await effect.locator('button').focus();for(const counterpart of [priority,tile,effect])assert.ok((await counterpart.getAttribute('class')).includes('highlighted'));await page.locator('#search').focus();
    const omitted=page.locator('#below-list .below-row').filter({hasText:'Resiliency'}),omittedPriority=page.locator('.priority-row').filter({hasText:'Resiliency'});
    assert.match(await omitted.locator('.omitted-effect').innerText(),/300%/);assert.ok(!(await page.locator('#effects-list').innerText()).includes('300%'));
    for(const origin of [omitted,omittedPriority]){await origin.hover();assert.ok((await omitted.getAttribute('class')).includes('highlighted'));assert.ok((await omittedPriority.getAttribute('class')).includes('highlighted'));assert.ok(!(await tile.getAttribute('class')).includes('highlighted'));}
    await page.locator('h1').hover();
  });
  await check('editing invalidates highlights and rank 10 restores the omitted effect exactly once',async()=>{
    await page.locator('#below-list').getByRole('button',{name:'Make required'}).click();await solve();assert.equal(await page.locator('#result-badge').innerText(),'No arrangement');await page.getByRole('checkbox',{name:'Require Resiliency',exact:true}).uncheck();
    await page.locator('#rank-select').selectOption('10');assert.equal(await page.locator('#result-badge').innerText(),'Out of date');assert.equal(await page.locator('.priority-row.included').count(),0);assert.match(await page.locator('#effects-note').innerText(),/previous/);
    await solve();assert.match(await page.locator('#grid-summary').innerText(),/4 of 4/);assert.equal(await page.locator('#effects-list li').filter({hasText:'300%'}).count(),1);
    assert.match(await page.locator('#grid .tile').filter({hasText:'Resiliency'}).getAttribute('aria-label'),/row 1/);
    await page.locator('#grid .tile').filter({hasText:"Doctor's Orders"}).click();assert.match(await page.locator('#selected-detail').innerText(),/5%/);
  });
  await check('drag reorder persists priorities and invalidates the solved snapshot',async()=>{
    const rows=page.locator('.priority-row'),before=await rows.evaluateAll(ns=>ns.map(n=>n.dataset.perkId));
    await rows.first().dragTo(rows.last());
    const after=await rows.evaluateAll(ns=>ns.map(n=>n.dataset.perkId));assert.deepEqual(after,[...before.slice(1),before[0]]);
    assert.equal(await page.locator('#result-badge').innerText(),'Out of date');
    const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('afe2.perk-planner.v0')).draft.requests.map(r=>r.id));assert.deepEqual(stored,after);
    await rows.last().dragTo(rows.first());assert.deepEqual(await rows.evaluateAll(ns=>ns.map(n=>n.dataset.perkId)),before);
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
  await check('portable file and real clipboard round trips preserve priorities and separate named saves',async()=>{
    const catalog=JSON.parse(fs.readFileSync(new URL('../app/data/game.json',import.meta.url))),config=createConfig(catalog);
    config.requests=[{id:catalog.perks.find(p=>p.name==="Doctor's Orders").id,required:true},{id:catalog.perks.find(p=>p.name==='Resiliency').id,required:false},{id:'/Unknown/FuturePerk',required:false}];
    const text=exportBuild('Portable priorities',config,'older-game'),c=await browser.newContext();await c.grantPermissions(['clipboard-read','clipboard-write'],{origin:new URL(base).origin});
    const p=await c.newPage();p.on('pageerror',e=>report.pageErrors.push(e.message));await p.goto(base);await p.locator('.library-row').first().waitFor();await p.locator('#transfer-panel > summary').click();
    const choose=p.waitForEvent('filechooser');await p.locator('#import-file').click();await (await choose).setFiles({name:'portable.afe2.json',mimeType:'application/json',buffer:Buffer.from(text)});
    await p.locator('.priority-row').nth(2).waitFor();await p.locator('#cancel').waitFor({state:'hidden'});assert.equal(await p.locator('#build-name').inputValue(),'Portable priorities');assert.match(await p.locator('#notice').innerText(),/different game-data version/);
    const inputs=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('afe2.perk-planner.v0')).draft);
    assert.deepEqual(await inputs(),config);assert.ok(await p.getByRole('checkbox',{name:"Require Doctor's Orders",exact:true}).isChecked());
    await p.locator('#save-build').click();const named=await p.evaluate(()=>JSON.parse(localStorage.getItem('afe2.perk-planner.v0')).builds);assert.equal(named.length,1);assert.deepEqual(named[0].config.requests,config.requests);
    const downloadEvent=p.waitForEvent('download');await p.locator('#export-file').click();const download=await downloadEvent;assert.equal(download.suggestedFilename(),'portable-priorities.afe2.json');const target=path.join(evidence,'portable-download.afe2.json');await download.saveAs(target);assert.deepEqual(importBuild(fs.readFileSync(target,'utf8')).config,config);
    await p.bringToFront();await p.locator('#copy-build').click();await p.waitForFunction(()=>document.getElementById('transfer-status').textContent.includes('Build copied'));assert.match(await p.locator('#transfer-status').innerText(),/Build copied/);const clipboard=await p.evaluate(()=>navigator.clipboard.readText());assert.deepEqual(importBuild(clipboard).config,config);
    await p.getByRole('button',{name:'Move Resiliency up',exact:true}).click();await p.getByRole('checkbox',{name:"Require Doctor's Orders",exact:true}).uncheck();await p.locator('#paste-build').click();await p.waitForFunction(()=>document.getElementById('transfer-status').textContent.includes('Build loaded'));await p.locator('#cancel').waitFor({state:'hidden'});assert.deepEqual(await inputs(),config);
    assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('afe2.perk-planner.v0')).builds),named);
    await p.locator('#build-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{broken')});await p.waitForFunction(()=>document.getElementById('transfer-status').textContent.includes('not valid JSON'));assert.match(await p.locator('#transfer-status').innerText(),/not valid JSON/);assert.deepEqual(await inputs(),config);
    await p.locator('#build-file').setInputFiles({name:'large.json',mimeType:'application/json',buffer:Buffer.alloc(1048577,32)});await p.waitForFunction(()=>document.getElementById('transfer-status').textContent.includes('exceeds 1 MiB'));assert.deepEqual(await inputs(),config);
    await p.locator('#manual-transfer > summary').click();await p.locator('#build-json').fill(JSON.stringify({format:'afe2-perk-build',version:99}));await p.locator('#load-json').click();assert.match(await p.locator('#transfer-status').innerText(),/Unsupported/);assert.deepEqual(await inputs(),config);
    await c.close();
  });
  await check('denied clipboard access has manual copy/paste recovery without losing priorities',async()=>{
    const c=await browser.newContext();await c.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('denied');},readText:async()=>{throw new Error('denied');}}}));
    const p=await c.newPage();await p.goto(base);await p.locator('.library-row').first().waitFor();await p.locator('#transfer-panel > summary').click();
    await p.locator('#copy-build').click();await p.waitForFunction(()=>document.getElementById('transfer-status').textContent.includes('Clipboard copy unavailable'));assert.ok(await p.locator('#manual-transfer').evaluate(n=>n.open));const text=await p.locator('#build-json').inputValue();assert.equal(importBuild(text).config.rank,10);
    await p.locator('#paste-build').click();await p.waitForFunction(()=>document.getElementById('transfer-status').textContent.includes('Could not load from clipboard'));assert.match(await p.locator('#transfer-status').innerText(),/paste JSON below/);await p.locator('#load-json').click();assert.match(await p.locator('#transfer-status').innerText(),/Build loaded/);await c.close();
  });
  await check('all five generated Machinist files load their exact 24-item priority lists',async()=>{
    const c=await browser.newContext(),p=await c.newPage();p.on('pageerror',e=>report.pageErrors.push(e.message));await p.goto(base);await p.locator('.library-row').first().waitFor();await p.locator('#transfer-panel > summary').click();
    for(let i=1;i<=5;i++){
      const filename='machinist-'+i+'.afe2.json',buffer=fs.readFileSync(new URL('../examples/machinist-validation/'+filename,import.meta.url)),build=importBuild(buffer.toString('utf8'));
      await p.locator('#build-file').setInputFiles({name:filename,mimeType:'application/json',buffer});await p.waitForFunction(name=>document.getElementById('build-name').value===name,build.name);
      assert.equal(await p.locator('#rank-select').inputValue(),'10');assert.equal(await p.locator('.priority-row').count(),24);
      const draft=await p.evaluate(()=>JSON.parse(localStorage.getItem('afe2.perk-planner.v0')).draft);assert.deepEqual(draft,build.config);
      await p.locator('#cancel').waitFor({state:'hidden',timeout:10000});assert.equal(await p.locator('#result-badge').innerText(),'Optimal fit');assert.ok(await p.locator('.priority-row.included').count()>=14);
    }
    await c.close();
  });
  await check('Agile Practices chooses exactly one host, with optional pins saved and exported',async()=>{
    const catalog=JSON.parse(fs.readFileSync(new URL('../app/data/game.json',import.meta.url))),klass=catalog.classes.find(k=>k.name==='Machinist'),config=createConfig(catalog,klass.id),agile=catalog.perks.find(p=>p.name==='Agile Practices'),rumble=catalog.perks.find(p=>p.name==='Rumble Turret'),bodyguard=catalog.perks.find(p=>p.id===config.abilities.secondary);config.abilities.primary=rumble.id;config.requests=[{id:agile.id,required:true}];
    const c=await browser.newContext();await c.addInitScript(state=>{if(!localStorage.getItem('afe2.perk-planner.v0'))localStorage.setItem('afe2.perk-planner.v0',JSON.stringify(state));},{schemaVersion:1,gameVersion:catalog.version,draft:config,builds:[]});
    const p=await c.newPage();p.on('pageerror',e=>report.pageErrors.push(e.message));await p.goto(base);await p.locator('.priority-row').first().waitFor();await p.locator('#cancel').waitFor({state:'hidden'});
    const choice=p.getByRole('combobox',{name:'Attach Agile Practices to',exact:true}),tile=p.locator('#grid .tile').filter({hasText:'Agile Practices'});assert.equal(await choice.inputValue(),'');assert.match(await choice.locator('option').first().innerText(),/Either/);
    await p.locator('#search').fill('Agile Practices');await p.locator('#library-list summary').click();assert.match(await p.locator('#library-list').innerText(),/ONE of: Rumble Turret or Bodyguard/);
    for(const core of [rumble,bodyguard]){await choice.selectOption(core.id);assert.equal(await p.locator('#result-badge').innerText(),'Out of date');await p.locator('#solve').click();await p.locator('#cancel').waitFor({state:'hidden'});assert.equal(await p.locator('#result-badge').innerText(),'Optimal fit');assert.equal(await tile.getAttribute('title'),'Connected to '+core.name);assert.match(await p.locator('.priority-row .row-state').innerText(),new RegExp(core.name));assert.equal(await p.locator('#effects-list button').getAttribute('title'),'Attached to '+core.name);}
    await p.setViewportSize({width:1440,height:1100});await p.screenshot({path:path.join(evidence,'agile-host.png'),fullPage:true});
    await p.locator('#build-name').fill('Agile Bodyguard');await p.locator('#save-build').click();await p.locator('#transfer-panel > summary').click();const downloadEvent=p.waitForEvent('download');await p.locator('#export-file').click();const download=await downloadEvent,target=path.join(evidence,'agile-host.afe2.json');await download.saveAs(target);assert.equal(importBuild(fs.readFileSync(target,'utf8')).config.requests[0].coreId,bodyguard.id);
    await choice.selectOption('');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('afe2.perk-planner.v0')).draft.requests[0].coreId),undefined);await p.locator('#load-build').click();await p.locator('#cancel').waitFor({state:'hidden'});assert.equal(await choice.inputValue(),bodyguard.id);assert.equal(await tile.getAttribute('title'),'Connected to Bodyguard');
    const replacement=catalog.perks.find(p=>p.name==='Artillery Bodyguard'&&p.id.includes('/Technician/'));await p.locator('#secondary-select').selectOption(replacement.id);assert.equal(await choice.inputValue(),bodyguard.id);await p.locator('#solve').click();await p.locator('#cancel').waitFor({state:'hidden'});assert.equal(await p.locator('#result-badge').innerText(),'No arrangement');assert.match(await p.locator('#below-list').innerText(),/selected core Bodyguard/);
    await choice.selectOption('');await p.locator('#solve').click();await p.locator('#cancel').waitFor({state:'hidden'});assert.equal(await p.locator('#result-badge').innerText(),'Optimal fit');await c.close();
  });
  await check('top and bottom solve controls use sixty seconds, show progress, and clear cancels and persists an empty draft',async()=>{
    const catalog=JSON.parse(fs.readFileSync(new URL('../app/data/game.json',import.meta.url))),config=createConfig(catalog);config.requests=[{id:catalog.perks.find(p=>p.name==="Doctor's Orders").id,required:true}];
    const saved={id:'keep-named',name:'Keep this snapshot',config,gameVersion:catalog.version,savedAt:'today'},c=await browser.newContext();
    await c.addInitScript(state=>{if(!localStorage.getItem('afe2.perk-planner.v0'))localStorage.setItem('afe2.perk-planner.v0',JSON.stringify(state));const NativeWorker=window.Worker;window.Worker=class extends NativeWorker{postMessage(message,...rest){window.lastSolverOptions=message.options;super.postMessage(message,...rest);}};},{schemaVersion:1,gameVersion:catalog.version,draft:config,builds:[saved]});
    const p=await c.newPage();p.on('pageerror',e=>report.pageErrors.push(e.message));await p.route(url=>url.pathname.includes('/worker')&&url.pathname.endsWith('.js'),async route=>{await new Promise(r=>setTimeout(r,900));try{await route.continue();}catch{}});
    await p.goto(base);await p.locator('.priority-row').first().waitFor();assert.equal(await p.locator('#search-budget').count(),0);assert.equal(await p.getByRole('button',{name:/Find arrangement/}).count(),2);
    assert.ok(await p.evaluate(()=>!!(document.getElementById('solve').compareDocumentPosition(document.getElementById('priority-list'))&Node.DOCUMENT_POSITION_FOLLOWING)));
    await p.locator('#cancel').waitFor({state:'hidden',timeout:16000});assert.ok(await p.locator('#solver-progress').isHidden());
    await p.locator('#solve').click();await p.locator('#solver-progress').waitFor({state:'visible'});await p.locator('#rank-select').selectOption('9');assert.ok(await p.locator('#solver-progress').isHidden());assert.equal(await p.locator('#grid').getAttribute('aria-busy'),'false');assert.equal(await p.locator('#result-badge').innerText(),'Out of date');
    await p.locator('#solve-bottom').click();await p.locator('#solver-progress').waitFor({state:'visible'});assert.equal(await p.locator('#grid').getAttribute('aria-busy'),'true');assert.equal(await p.locator('#result-badge').innerText(),'Solving…');assert.ok(await p.locator('#solve').isDisabled());assert.ok(await p.locator('#solve-bottom').isDisabled());
    await p.waitForFunction(()=>parseFloat(document.getElementById('solver-elapsed').textContent)>=0.2);assert.match(await p.locator('#solver-elapsed').innerText(),/\/ 60 s$/);assert.deepEqual(await p.evaluate(()=>window.lastSolverOptions),{timeLimitMs:60000,maxNodes:Number.MAX_SAFE_INTEGER});
    await p.locator('#clear-priorities').click();assert.equal(await p.locator('.priority-row').count(),0);assert.equal(await p.locator('#grid .tile:not(.fixed)').count(),0);assert.equal(await p.locator('#effects-list .effect-row').count(),0);assert.equal(await p.locator('#below-list .below-row').count(),0);assert.ok(await p.locator('#solver-progress').isHidden());assert.ok(await p.locator('#clear-priorities').isDisabled());assert.ok(await p.locator('#solve-bottom').isEnabled());assert.match(await p.locator('#solve-status').innerText(),/cleared/);
    const stored=await p.evaluate(()=>JSON.parse(localStorage.getItem('afe2.perk-planner.v0')));assert.deepEqual(stored.draft.requests,[]);assert.equal(stored.draft.rank,9);assert.deepEqual(stored.builds,[saved]);
    await p.reload();await p.locator('.library-row').first().waitFor();await p.locator('#cancel').waitFor({state:'hidden',timeout:16000});assert.equal(await p.locator('.priority-row').count(),0);assert.equal(await p.locator('#grid .tile.fixed').count(),3);assert.equal(await p.locator('#effects-list .effect-row').count(),0);assert.equal(await p.locator('#grid').getAttribute('aria-busy'),'false');await c.close();
  });
  await check('40-request loadout completes through the real worker and retains all omitted requests',async()=>{
    const catalog=JSON.parse(fs.readFileSync(new URL('../app/data/game.json',import.meta.url))),config=createConfig(catalog),klass=catalog.classes.find(k=>k.id===config.classId);
    config.requests=catalog.perks.filter(p=>!availability(p,klass)).slice(0,40).map(p=>({id:p.id,required:false}));
    const c=await browser.newContext(),p=await c.newPage();p.on('pageerror',e=>report.pageErrors.push(e.message));
    await c.addInitScript(state=>localStorage.setItem('afe2.perk-planner.v0',JSON.stringify(state)),{schemaVersion:1,gameVersion:catalog.version,draft:config,builds:[]});
    await p.goto(base);await p.locator('.priority-row').first().waitFor();await p.locator('#cancel').waitFor({state:'hidden',timeout:16000});
    assert.equal(await p.locator('#result-badge').innerText(),'Optimal fit');assert.equal(await p.locator('.priority-row').count(),40);assert.equal(await p.locator('.priority-row.included').count(),14);assert.equal(await p.locator('#below-list .below-row').count(),26);
    await c.close();
  });
  await check('blocked local storage reports failure without inventing a successful save',async()=>{
    const denied=await browser.newContext();await denied.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota full','QuotaExceededError');};});const p=await denied.newPage();p.on('pageerror',e=>report.pageErrors.push(e.message));await p.goto(base);await p.locator('.library-row').first().waitFor();await p.locator('#build-name').fill('Cannot save');await p.locator('#save-build').click();assert.match(await p.locator('#save-status').innerText(),/unavailable|full/);assert.equal(await p.locator('#saved-builds').inputValue(),'');await denied.close();
  });
  await check('malformed existing storage is preserved instead of being overwritten',async()=>{
    const isolated=await browser.newContext(),p=await isolated.newPage();await p.goto(base,{waitUntil:'networkidle'});await p.locator('.library-row').first().waitFor();await p.evaluate(()=>localStorage.setItem('afe2.perk-planner.v0','{broken-original'));await p.reload({waitUntil:'networkidle'});await p.locator('.library-row').first().waitFor();assert.match(await p.locator('#notice').innerText(),/could not be read/);await p.locator('#save-build').click();assert.equal(await p.evaluate(()=>localStorage.getItem('afe2.perk-planner.v0')),'{broken-original');await isolated.close();
  });
  await check('cancelling a worker leaves inputs intact and does not publish a late result',async()=>{
    const c=await browser.newContext(),p=await c.newPage();await p.route(/\/worker(?:-[\w-]+)?\.js(?:\?.*)?$/,async route=>{await new Promise(r=>setTimeout(r,300));try{await route.continue();}catch{}});await p.goto(base);await p.locator('.library-row').first().waitFor();await p.locator('#solve').click();await p.locator('#cancel').click();assert.match(await p.locator('#solve-status').innerText(),/cancelled/);assert.ok(await p.locator('#solve').isEnabled());assert.ok(await p.locator('#solver-progress').isHidden());await new Promise(r=>setTimeout(r,400));assert.match(await p.locator('#solve-status').innerText(),/cancelled/);await c.close();
  });
  await check('failed catalog load and failed worker start have clear recovery states',async()=>{
    const c=await browser.newContext(),p=await c.newPage();await p.route(/\/(?:data\/game|assets\/game-[\w-]+)\.json(?:\?.*)?$/,route=>route.fulfill({status:503,body:'unavailable'}));await p.goto(base);await p.locator('#notice').waitFor({state:'visible'});assert.match(await p.locator('#notice').innerText(),/HTTP 503/);assert.ok(await p.locator('#solve').isDisabled());await c.close();
    const c2=await browser.newContext(),p2=await c2.newPage();await p2.route(/\/worker(?:-[\w-]+)?\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'text/javascript',body:'throw new Error("worker unavailable")'}));await p2.goto(base);await p2.locator('.library-row').first().waitFor();await p2.locator('#solve').click();await p2.locator('#notice').waitFor({state:'visible'});assert.match(await p2.locator('#notice').innerText(),/worker could not start/);assert.ok(await p2.locator('#solve').isEnabled());assert.ok(await p2.locator('#solver-progress').isHidden());assert.notEqual(await p2.locator('#result-badge').innerText(),'Solving…');await c2.close();
  });
  assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.failedRequests,[]);assert.deepEqual(report.consoleErrors,[]);
  report.status='passed';report.finishedAt=new Date().toISOString();console.log(`${report.checks.length} browser scenarios passed; no page errors or failed requests.`);
}catch(error){report.status='failed';report.failure=error.stack;console.error(error);process.exitCode=1;}
finally{if(browser)await browser.close();if(ownedServer)await new Promise(r=>ownedServer.close(r));fs.writeFileSync(path.join(evidence,'browser-report.json'),JSON.stringify(report,null,2)+'\n');}
