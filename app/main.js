import {createConfig,reconcileConfig,canEquip,availability,slotOptions,prepareProblem,dependencyHint,equippedEffects} from './core/model.js';
import {exportBuild,importBuild,buildFilename,MAX_BUILD_SIZE} from './core/transfer.js';
import {loadState,persistState,saveNamed,cloneConfig} from './core/storage.js';
const $=id=>document.getElementById(id);
function element(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
const storage={getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value)};
let game,byId,config,result=null,resultConfig=null,stale=false,worker=null,job=0,activeJob=null,builds=[],selectedSaveId=null,storageBlocked=false,selectedPerk=null;
function notice(text){$('notice').textContent=text;$('notice').hidden=!text;}
function saveStatus(text,error=false){$('save-status').textContent=text;$('save-status').classList.toggle('error-text',error);}
function persist(){if(storageBlocked){saveStatus('Existing saves could not be read. Saving is disabled to preserve them.',true);return false;}const value=persistState(storage,{draft:config,builds},game.version);if(!value.ok)saveStatus(value.error,true);return value.ok;}
function stopWorker(){if(worker){worker.terminate();worker=null;}activeJob=null;$('cancel').hidden=true;$('solve').disabled=false;}
function change(){stopWorker();stale=true;if(!storageBlocked)notice('');$('solve-status').textContent='Inputs changed. Find a new arrangement.';renderPriorities();renderResults();return persist();}
function klass(){return game.classes.find(c=>c.id===config.classId);}
function fixedCurrent(){return prepareProblem(game,{...config,requests:[]}).fixed;}
function selectPerk(id){selectedPerk=id;document.querySelectorAll('[data-perk-id]').forEach(n=>n.classList.toggle('highlighted',n.dataset.perkId===id));const perk=byId.get(id);$('selected-detail').hidden=!perk;if(perk){$('selected-detail').replaceChildren(element('h3',perk.name),element('p',perk.description),element('p',dependencyHint(perk,[...fixedCurrent(),...config.requests.map(r=>byId.get(r.id)).filter(Boolean)]),'secondary'));}}
function renderSetup(){
  $('class-select').replaceChildren(...game.classes.map(c=>new Option(c.name,c.id)));$('class-select').value=config.classId;
  $('rank-select').replaceChildren(...Array.from({length:10},(_,i)=>new Option(String(i+1),String(i+1))));$('rank-select').value=String(config.rank);
  for(const slot of klass().slots){const select=$(slot.key+'-select');select.replaceChildren(...slotOptions(game,klass(),slot).map(p=>new Option(p.name,p.id)));select.value=config.abilities[slot.key];}
}
const expandedPerks=new Set();
function renderLibrary(){
  for(const row of $('library-list').children){const details=row.querySelector('details');if(details){if(details.open)expandedPerks.add(row.dataset.perkId);else expandedPerks.delete(row.dataset.perkId);}}
  const query=$('search').value.trim().toLowerCase(),grant=$('granting-class').value,show=$('show-unavailable').checked;
  let list=game.perks.filter(p=>!p.slot && (!availability(p,klass(),config.rank)||show));
  list=list.filter(p=>$(p.kind==='Core'?'type-core':'type-modifier').checked);
  const sources=p=>p.unlockSources.map(s=>s.class);
  const fromClass=(p,name)=>sources(p).length?sources(p).includes(name):p.originKit?.split('.')[0]===game.classes.find(c=>c.name===name)?.id;
  if(grant!=='all')list=list.filter(p=>fromClass(p,grant));
  if(!$('show-universal').checked)list=list.filter(p=>p.restriction!=='None'||fromClass(p,klass().name));
  if(query)list=list.filter(p=>(p.name+' '+p.description).toLowerCase().includes(query));
  list.sort((a,b)=>a.name.localeCompare(b.name));$('library-count').textContent=String(list.length);$('library-list').replaceChildren();
  if(!list.length)$('library-list').append(element('p','No matching perks. Try another search or include unavailable perks.','empty'));
  for(const p of list){
    const unavailable=availability(p,klass(),config.rank),added=config.requests.some(r=>r.id===p.id),row=element('article',undefined,'library-row');row.dataset.perkId=p.id;
    const heading=element('div',undefined,'row-title');heading.append(element('h3',p.name),element('span',p.shapes.map(s=>s.width+'×'+s.height).join(' / '),'size'));row.append(heading);
    const details=element('details');details.open=expandedPerks.has(p.id);details.ontoggle=()=>{if(details.isConnected){if(details.open)expandedPerks.add(p.id);else expandedPerks.delete(p.id);}};details.append(element('summary',p.kind+' · '+(p.restriction==='None'?'Universal use':'Class restricted')));
    details.append(element('p',p.description),element('p',dependencyHint(p,[...fixedCurrent(),...config.requests.map(r=>byId.get(r.id)).filter(Boolean)])));
    const origin=p.originKit?game.classes.find(c=>p.originKit.split('.')[0]===c.id)?.name:null;
    const unlock=p.unlockSources.map(s=>s.class+(s.requiredRank?' rank '+s.requiredRank:'')).join('; ');
    details.append(element('p','Unlock source: '+(unlock||origin||'Shared reward / weapon progression; all assumed unlocked.')));
    row.append(details);
    const actions=element('div',undefined,'row-actions');actions.append(element('span',unavailable??(p.restriction==='None'?'Universal use':'Selected class'),p.restriction==='None'?'tag universal':'tag'));
    const add=element('button',added?'Added':'Add');add.disabled=added||!!unavailable;add.setAttribute('aria-label','Add '+p.name);add.onclick=()=>{config.requests.push({id:p.id,required:false});change();renderLibrary();};actions.append(add);row.append(actions);$('library-list').append(row);
  }
}
function renderPriorities(){
  const focus=document.activeElement?.dataset,restore=focus?.action&&focus?.perkId?{...focus}:null;
  $('priority-count').textContent=String(config.requests.length);$('priority-list').replaceChildren();
  if(!config.requests.length)$('priority-list').append(element('li','Add perks from the library, then put the most important ones first.','empty'));
  config.requests.forEach((request,index)=>{
    const p=byId.get(request.id),included=result?.included?.includes(request.id),row=element('li',undefined,'priority-row'+(included&&!stale?' included':''));row.dataset.perkId=request.id;
    row.draggable=true;row.title='Drag to reorder; arrow buttons also available';
    row.ondragstart=e=>{e.dataTransfer.setData('text/plain',request.id);e.dataTransfer.effectAllowed='move';row.classList.add('dragging');};
    row.ondragend=()=>{row.classList.remove('dragging');document.querySelectorAll('.drop-target').forEach(n=>n.classList.remove('drop-target'));};
    row.ondragover=e=>{e.preventDefault();e.dataTransfer.dropEffect='move';row.classList.add('drop-target');};
    row.ondragleave=()=>row.classList.remove('drop-target');
    row.ondrop=e=>{e.preventDefault();const from=config.requests.findIndex(r=>r.id===e.dataTransfer.getData('text/plain'));if(from<0||from===index)return;const [moved]=config.requests.splice(from,1);config.requests.splice(index,0,moved);change();};
    const heading=element('div',undefined,'row-title'),name=element('h3',`${index+1}. ${p?.name??'Missing catalog perk'}`);heading.append(name,element('span',p?p.shapes.map(s=>s.width+'×'+s.height).join('/'):'Unknown','size'));row.append(heading);
    const reason=result?.omissions?.find(o=>o.id===request.id)?.reason;
    row.append(element('span',stale?'Previous result · out of date':included?'✓ In grid':reason??(!result?'Not solved yet':result.placements?'Below the line':'No successful arrangement'),'row-state'));
    const actions=element('div',undefined,'priority-actions'),label=element('label',undefined,'check-row'),check=element('input');check.type='checkbox';check.checked=request.required;check.dataset.action='required';check.dataset.perkId=request.id;check.setAttribute('aria-label','Require '+(p?.name??request.id));check.onchange=()=>{request.required=check.checked;change();};label.append(check,document.createTextNode('Required'));actions.append(label);
    for(const [action,text,disabled,callback] of [
      ['up','↑',index===0,()=>{[config.requests[index-1],config.requests[index]]=[config.requests[index],config.requests[index-1]];}],
      ['down','↓',index===config.requests.length-1,()=>{[config.requests[index+1],config.requests[index]]=[config.requests[index],config.requests[index+1]];}],
      ['remove','×',false,()=>config.requests.splice(index,1)]]){
      const b=element('button',text);b.disabled=disabled;b.dataset.action=action;b.dataset.perkId=request.id;b.setAttribute('aria-label',action==='remove'?'Remove '+(p?.name??'perk'):'Move '+(p?.name??'perk')+' '+action);b.onclick=()=>{callback();change();renderLibrary();};actions.append(b);
    }
    name.onclick=()=>selectPerk(request.id);row.append(actions);$('priority-list').append(row);
  });
  if(restore){const target=[...$('priority-list').querySelectorAll('[data-action]')].find(n=>n.dataset.action===restore.action&&n.dataset.perkId===restore.perkId);target?.focus({preventScroll:true});}
}
function renderResults(){
  const displayConfig=resultConfig??config,problem=prepareProblem(game,{...displayConfig,requests:[]}),grid=$('grid');grid.replaceChildren();
  for(let y=0;y<game.board.height;y++)for(let x=0;x<game.board.width;x++){
    const rank=game.board.rankMask[x*game.board.height+y],cell=element('div',rank>displayConfig.rank?'R'+rank:'','cell'+(rank<0?' void':rank>displayConfig.rank?' locked':''));cell.style.gridArea=`${y+1}/${x+1}`;cell.setAttribute('aria-label',rank<0?'Unusable':rank>displayConfig.rank?'Unlocks at rank '+rank:'Available cell');grid.append(cell);
  }
  for(const placement of [...problem.fixed,...(result?.placements??[])]){
    const p=byId.get(placement.id),fixed=problem.fixed.some(f=>f.id===placement.id),tile=element('button',p?.name??'Unknown','tile'+(fixed?' fixed':'')+(placement.width===1?' vertical':''));tile.style.gridArea=`${placement.y+1}/${placement.x+1}/span ${placement.height}/span ${placement.width}`;tile.dataset.perkId=placement.id;tile.setAttribute('aria-label',(p?.name??placement.id)+`, column ${placement.x+1}, row ${placement.y+1}, ${placement.width} by ${placement.height}`);tile.onclick=()=>selectPerk(placement.id);grid.append(tile);
  }
  let label='Ready',kind='';
  if(stale){label='Out of date';kind='warning';}else if(activeJob!==null){label='Solving…';}else if(result?.status==='optimal'){label='Optimal fit';kind='success';}else if(result?.status==='timeout'){label='Search limit';kind='warning';}else if(result&&!result.placements){label='No arrangement';kind='error';}
  $('result-badge').textContent=label;$('result-badge').className='badge '+kind;
  $('grid-summary').textContent=stale?'Previous arrangement. Solve again to update the grid, checks, and descriptions.':result?.placements?`${result.included.length} of ${displayConfig.requests.length} requested perks included · ${result.nodes} search steps · ${Math.round(result.elapsedMs)} ms`:'Fixed ability slots shown. Add perks and find an arrangement.';
  $('effects-list').replaceChildren();
  const effects=equippedEffects(game,displayConfig,result);$('effect-count').textContent=effects.length?String(effects.length):'';
  $('effects-note').textContent=stale?'Descriptions from the previous arrangement · out of date.':'Game descriptions from equipped items. Conditional effects retain their conditions.';
  for(const effect of effects){const li=element('li'),button=element('button',effect.description);button.dataset.perkId=effect.id;button.setAttribute('aria-label',effect.description+' Source: '+effect.source);button.onclick=()=>selectPerk(effect.id);li.append(button);$('effects-list').append(li);}
  if(!effects.length)$('effects-list').append(element('li','Find an arrangement to see the descriptions of everything equipped.','empty'));
  $('below-list').replaceChildren();const omissions=result?.omissions??[];$('below-count').textContent=omissions.length?String(omissions.length):'';
  if(result&&!result.placements)$('below-list').append(element('p',result.error??'No arrangement found. Required perks were not dropped.','error-text'));
  for(const omission of omissions){const p=byId.get(omission.id),row=element('article',undefined,'below-row');row.dataset.perkId=omission.id;row.append(element('h3',p?.name??'Missing catalog perk'),element('p',omission.reason));const request=config.requests.find(r=>r.id===omission.id);if(request){const require=element('button',request.required?'Required':'Make required');require.disabled=request.required;require.onclick=()=>{request.required=true;change();};row.append(require);} $('below-list').append(row);}
  if(!omissions.length)$('below-list').append(element('p',result?.placements?'All requested perks included.':'Omitted requests and their reasons will appear here.','empty'));
  if(selectedPerk)document.querySelectorAll('[data-perk-id]').forEach(n=>n.classList.toggle('highlighted',n.dataset.perkId===selectedPerk));
}
function renderSaves(){const select=$('saved-builds');select.replaceChildren(...(builds.length?builds.map(b=>new Option(b.name,b.id)):[new Option('No saved builds','')]));if(selectedSaveId)select.value=selectedSaveId;$('load-build').disabled=!builds.length;select.disabled=!builds.length;}
function startSolve(){
  stopWorker();const current=cloneConfig(config),problem=prepareProblem(game,current);job++;activeJob=job;const thisJob=job;
  $('solve').disabled=true;$('cancel').hidden=false;$('solve-status').textContent='Searching fixed-orientation placements and compatible groups…';renderResults();
  worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});
  worker.onmessage=event=>{if(activeJob!==thisJob||event.data.jobId!==thisJob)return;const next=event.data.result;stopWorker();result=next;resultConfig=current;stale=false;$('solve-status').textContent=next.error??'Search complete. Higher-priority optional perks were preferred.';renderPriorities();renderResults();};
  worker.onerror=()=>{if(activeJob!==thisJob)return;stopWorker();notice('The solver worker could not start. Serve this folder over HTTP; do not open index.html as a file.');};
  worker.postMessage({jobId:thisJob,problem,options:{timeLimitMs:Number($('search-budget').value),maxNodes:Number($('search-budget').value)>2500?1400000:350000}});
}
function namedSave(copy){try{const next=saveNamed(builds,$('build-name').value,config,game.version,{existingId:copy?null:selectedSaveId});const previous=builds;builds=next;if(persist()){selectedSaveId=next.at(-1).id;renderSaves();saveStatus('Saved in this browser · '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}));}else builds=previous;}catch(error){saveStatus(error.message,true);}}
function transferStatus(message,error=false){$('transfer-status').textContent=message;$('transfer-status').classList.toggle('error-text',error);}
function currentExport(){return exportBuild($('build-name').value,config,game.version);}
function loadPortable(text){
  const build=importBuild(text),reconciled=reconcileConfig(game,build.config);
  config=reconciled.config;selectedSaveId=null;$('build-name').value=build.name;
  change();renderSetup();renderLibrary();renderSaves();
  notice([build.gameVersion!==game.version?'Imported from a different game-data version; inputs are being revalidated.':null,...reconciled.notices].filter(Boolean).join(' '));
  transferStatus('Build loaded with '+config.requests.length+' priorities. Use Save build to keep a named snapshot.');startSolve();
}
function setupTransfer(){
  $('copy-build').onclick=async()=>{try{const text=currentExport();$('build-json').value=text;await navigator.clipboard.writeText(text);transferStatus('Build copied, including priorities and Required flags.');}catch(error){$('manual-transfer').open=true;transferStatus('Clipboard copy unavailable. Copy the build JSON below manually.',true);}};
  $('paste-build').onclick=async()=>{try{const text=await navigator.clipboard.readText();$('build-json').value=text;loadPortable(text);}catch(error){$('manual-transfer').open=true;transferStatus('Could not load from clipboard: '+error.message+' You can paste JSON below.',true);}};
  $('load-json').onclick=()=>{try{loadPortable($('build-json').value);}catch(error){transferStatus(error.message,true);}};
  $('export-file').onclick=()=>{try{const blob=new Blob([currentExport()],{type:'application/json'}),url=URL.createObjectURL(blob),link=element('a');link.href=url;link.download=buildFilename($('build-name').value,klass().name,config.rank);link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);transferStatus('Build file exported, including all priorities.');}catch(error){transferStatus(error.message,true);}};
  $('import-file').onclick=()=>$('build-file').click();
  $('build-file').onchange=async()=>{try{const file=$('build-file').files[0];if(!file)return;if(file.size>MAX_BUILD_SIZE)throw new Error('Build file exceeds 1 MiB.');loadPortable(await file.text());}catch(error){transferStatus(error.message,true);}finally{$('build-file').value='';}};
}
async function init(){
  document.body.classList.add('loading');
  const response=await fetch(new URL('./data/game.json',import.meta.url));if(!response.ok)throw new Error('Game catalog returned HTTP '+response.status);game=await response.json();byId=new Map(game.perks.map(p=>[p.id,p]));
  const saved=loadState(storage);builds=saved.builds;storageBlocked=!!saved.blocked;
  const initial=reconcileConfig(game,saved.draft??createConfig(game));config=initial.config;notice([saved.error,...initial.notices].filter(Boolean).join(' '));
  $('data-version').textContent='BUILD '+game.version;$('data-scope').textContent=game.scope;
  $('granting-class').append(...game.classes.map(c=>new Option(c.name,c.name)));
  renderSetup();renderSaves();renderLibrary();renderPriorities();renderResults();
  $('class-select').onchange=()=>{const requests=config.requests;config={...createConfig(game,$('class-select').value),rank:config.rank,requests};renderSetup();renderLibrary();change();};
  $('rank-select').onchange=()=>{config.rank=Number($('rank-select').value);change();renderLibrary();};
  for(const slot of ['primary','secondary','passive'])$(slot+'-select').onchange=()=>{config.abilities[slot]=$(slot+'-select').value;change();renderLibrary();};
  for(const id of ['search','granting-class','type-core','type-modifier','show-universal','show-unavailable'])$(id).addEventListener(id==='search'?'input':'change',renderLibrary);
  $('solve').onclick=startSolve;$('cancel').onclick=()=>{stopWorker();$('solve-status').textContent='Search cancelled. No optimality claim was made.';renderResults();};
  setupTransfer();
  $('save-build').onclick=()=>namedSave(false);$('save-copy').onclick=()=>namedSave(true);
  $('load-build').onclick=()=>{const saved=builds.find(b=>b.id===$('saved-builds').value);if(!saved)return;const reconciled=reconcileConfig(game,cloneConfig(saved.config));config=reconciled.config;selectedSaveId=saved.id;$('build-name').value=saved.name;notice([saved.gameVersion!==game.version?'Saved with a different game-data version. Inputs were preserved and are being revalidated.':null,...reconciled.notices].filter(Boolean).join(' '));renderSetup();renderLibrary();renderPriorities();persist();startSolve();};
  startSolve();document.body.classList.remove('loading');
}
init().catch(error=>{document.body.classList.remove('loading');notice('The planner could not load: '+error.message);$('solve').disabled=true;});
