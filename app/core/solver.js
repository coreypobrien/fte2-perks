/** Fixed-orientation, lexicographic perk packing. Pure and usable in Node or a worker. */
export function tagMatches(tag, query) { return tag === query || tag.startsWith(query + '.'); }
export function compatible(core, modifier) {
  return core.kind === 'Core' && modifier.kind === 'Modifier' &&
    (core.accepts ?? []).some(q => (modifier.tags ?? []).some(t => tagMatches(t, q)));
}
export function cellsOf(placement) {
  return placement.cells.map(([x, y]) => [x + placement.x, y + placement.y]);
}
export function adjacent(a, b) {
  const other = new Set(cellsOf(b).map(([x,y]) => `${x},${y}`));
  return cellsOf(a).some(([x,y]) => [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([cx,cy]) => other.has(`${cx},${cy}`)));
}
/** Each modifier belongs to an orthogonally connected group rooted at a compatible Core.
 * Native rule: no group may contain two GrantedAbilityOverride chips. */
export function assignGroups(placements, tick = () => {}, preparedLinks = null) {
  const cores = placements.filter(p => p.kind === 'Core');
  const mods = placements.filter(p => p.kind === 'Modifier');
  if (!mods.length) return {};
  if (!cores.length) return null;
  const occupiedCells=preparedLinks?[]:placements.map(p=>new Set(cellsOf(p).map(([x,y])=>x+','+y)));
  const perimeter=preparedLinks?[]:placements.map(p=>cellsOf(p).flatMap(([x,y])=>[[x-1,y],[x+1,y],[x,y-1],[x,y+1]]).map(([x,y])=>x+','+y));
  const links=preparedLinks??placements.map((a,i)=>placements.map((b,j)=>i!==j&&perimeter[i].some(cell=>occupiedCells[j].has(cell))));
  const indices = new Map(placements.map((p,i) => [p.id,i]));
  const can = cores.map(c => mods.map(m => compatible(c,m)&&(!m.groupCoreId||m.groupCoreId===c.id)));
  // Reachability is a necessary pruning check, not a proof: a shared bridge
  // cannot simultaneously belong to two different core groups.
  const reachable=cores.map((core,g)=>{
    const queue=[indices.get(core.id)],seen=new Set(queue);
    while(queue.length){tick();const i=queue.shift();mods.forEach((m,k)=>{const j=indices.get(m.id);if(can[g][k]&&!seen.has(j)&&links[i][j]){seen.add(j);queue.push(j);}});}
    return mods.map(m=>seen.has(indices.get(m.id)));
  });
  if(mods.some((m,k)=>!reachable.some(group=>group[k])))return null;
  if(cores.length===1)return Number(!!cores[0].override)+mods.filter(m=>m.override).length<=1?Object.fromEntries(mods.map(m=>[m.id,cores[0].id])):null;
  // A modifier can be reachable from multiple groups. Search assignments rather than
  // rejecting a shared component or prematurely assigning a bridge to the wrong core.
  const assignment = mods.map(() => -1), seen = new Set();
  function grow(left) {
    tick(); if (!left) return true;
    const key=assignment.join(','); if(seen.has(key)) return false; seen.add(key);
    for(let m=0;m<mods.length;m++) if(assignment[m]===-1) for(let g=0;g<cores.length;g++) {
      if(!can[g][m]) continue;
      if(mods[m].override && (cores[g].override || mods.some((p,k)=>assignment[k]===g && p.override))) continue;
      const index=indices.get(mods[m].id);
      const touches=links[index][indices.get(cores[g].id)] || mods.some((p,k)=>assignment[k]===g && links[index][indices.get(p.id)]);
      if(!touches) continue;
      assignment[m]=g; if(grow(left-1)) return true; assignment[m]=-1;
    }
    return false;
  }
  return grow(mods.length)?Object.fromEntries(mods.map((m,k)=>[m.id,cores[assignment[k]].id])):null;
}
export function connectedGroups(placements,tick=()=>{},preparedLinks=null){return assignGroups(placements,tick,preparedLinks)!==null;}

export function solve(problem, options = {}) {
  const now=options.now ?? (() => performance.now());
  const start=now(), budget=options.timeLimitMs ?? 2500, maxNodes=options.maxNodes ?? 350000;
  let nodes=0, best=null;const work={candidateChecks:0,reachabilityChecks:0,floodIterations:0}; const STOP=Symbol('budget');
  const tick=()=>{nodes++; if(nodes>maxNodes || (nodes===1 || nodes%64===0) && now()-start>=budget) throw STOP;};
  const result=(status, placements, omissions=[], error=null)=>({status,complete:status==='optimal'||status==='infeasible',placements,
    included:placements?.map(p=>p.id)??[],omissions,error,nodes,work:{...work},elapsedMs:Math.max(0,now()-start)});
  const {width,height,rank=10,rankMask,fixed=[],requests=[],perks=[]}=problem;
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>256||rankMask?.length!==width*height || !Number.isInteger(rank)||rank<1||rank>10)
    return result('invalid',null,[],'Invalid board or rank.');
  if(new Set(requests.map(r=>r.id)).size!==requests.length) return result('invalid',null,[],'Duplicate requests.');
  const byId=new Map(perks.map(p=>[p.id,p]));
  const bit=(x,y)=>1n<<BigInt(y*width+x);
  const allowed=(x,y)=>x>=0&&y>=0&&x<width&&y<height&&rankMask[x*height+y]>=0&&rankMask[x*height+y]<=rank;
  function placementMask(p) { let mask=0n; for(const [x,y] of cellsOf(p)){if(!allowed(x,y))return null;const b=bit(x,y);if(mask&b)return null;mask|=b;}return mask; }
  let occupied=0n;
  for(const p of fixed){const mask=placementMask(p);if(mask===null||mask&occupied)return result('invalid',null,[],'Fixed slots overlap or exceed the board.');occupied|=mask;}
  const leftEdge=Array.from({length:height},(_,y)=>bit(0,y)).reduce((a,b)=>a|b,0n);
  const rightEdge=leftEdge<<BigInt(width-1),boardBits=(1n<<BigInt(width*height))-1n;
  const neighbors=m=>((m&~rightEdge)<<1n)|((m&~leftEdge)>>1n)|(m<<BigInt(width))|(m>>BigInt(width));
  const fixedMasks=new WeakMap(fixed.map(p=>[p,placementMask(p)])),maskOf=p=>p.mask??fixedMasks.get(p);
  const fixedForSearch=fixed.map(p=>({...p,mask:fixedMasks.get(p)}));
  const edges=new WeakMap();
  const edge=p=>{if(!edges.has(p))edges.set(p,neighbors(maskOf(p)));return edges.get(p);};
  const fixedIds=new Set(fixed.map(p=>p.id));
  const invalid=requests.filter(r=>!byId.has(r.id)||fixedIds.has(r.id)||byId.get(r.id).unavailable);
  const invalidIds=new Set(invalid.map(r=>r.id));
  const omissions=invalid.map(r=>({id:r.id,reason:byId.get(r.id)?.unavailable??(fixedIds.has(r.id)?'Already equipped in an ability slot.':'Missing from current game catalog.')}));
  if(invalid.some(r=>r.required))return result('infeasible',null,omissions,'A required perk is unavailable.');
  const valid=requests.filter(r=>!invalidIds.has(r.id));
  const candidates=new Map(); let free=0;
  for(let x=0;x<width;x++)for(let y=0;y<height;y++)if(allowed(x,y)&&!(occupied&bit(x,y)))free++;
  for(const request of valid){
    const p=byId.get(request.id), possible=[];
    for(const shape of p.shapes??[]){
      if(!shape.cells?.length || !Number.isInteger(shape.width)||!Number.isInteger(shape.height) || shape.width<1||shape.height<1 || shape.cells.some(([x,y])=>!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=shape.width||y>=shape.height))
        return result('invalid',null,[],'Malformed perk footprint.');
      for(let y=0;y<=height-shape.height;y++)for(let x=0;x<=width-shape.width;x++){
        const v={id:p.id,kind:p.kind,tags:p.tags,accepts:p.accepts,override:p.override,x,y,width:shape.width,height:shape.height,cells:shape.cells,...(p.kind==='Modifier'&&request.coreId?{groupCoreId:request.coreId}:{})};
        const mask=placementMask(v);if(mask!==null&&!(mask&occupied))possible.push({...v,mask});
      }
    }
    candidates.set(p.id,possible);
  }
  const required=valid.filter(r=>r.required), optional=valid.filter(r=>!r.required), failed=new Set();
  const area=id=>Math.min(...(byId.get(id).shapes??[]).map(s=>s.cells.length));
  const bare=p=>{const {mask,...clean}=p;return clean;};
  const definitions=[...fixed,...valid.map(r=>byId.get(r.id))];
  // Candidate copies share their source ID and immutable compatibility metadata.
  const compatibility=new Map(definitions.filter(p=>p.kind==='Core').map(core=>[core.id,new Set(definitions.filter(mod=>compatible(core,mod)).map(p=>p.id))]));
  const targets=new Map(valid.filter(r=>r.coreId).map(r=>[r.id,r.coreId]));
  const matches=(core,mod)=>(!targets.has(mod.id)||targets.get(mod.id)===core.id)&&(compatibility.get(core.id)?.has(mod.id)??false);
  const geometricallyImpossible=new Set();
  function pack(selected){
    tick(); const key=selected.map(r=>r.id).sort().join('|');if(failed.has(key))return null;
    if(selected.reduce((n,r)=>n+area(r.id),0)>free || selected.some(r=>!candidates.get(r.id).length)){failed.add(key);geometricallyImpossible.add(key);return null;}
    const all=[...fixed,...selected.map(r=>byId.get(r.id))];
    if(all.some(p=>p.kind==='Modifier'&&!all.some(c=>matches(c,p)))){failed.add(key);return null;}
    const hosts=selected.filter(r=>byId.get(r.id).kind==='Core'&&all.some(m=>matches(byId.get(r.id),m)));
    // Movable roots have coupled geometry; retain the position-first exact search
    // for that case. Fixed-root builds use direct connected-group growth below.
    if(hosts.length){
    const connectionRank=id=>{const p=byId.get(id);return p.kind==='Modifier'||all.some(m=>matches(p,m))?0:1;};
    const order=[...selected].sort((a,b)=>connectionRank(a.id)-connectionRank(b.id)||candidates.get(a.id).length-candidates.get(b.id).length || Number(byId.get(a.id).kind!=='Core')-Number(byId.get(b.id).kind!=='Core') || a.id.localeCompare(b.id));
    const sparseFootprints=[...fixed,...selected.flatMap(r=>byId.get(r.id).shapes)].some(p=>{const cells=new Set(p.cells.map(([x,y])=>x+','+y)),seen=new Set(),queue=[p.cells[0]];while(queue.length){const [x,y]=queue.pop(),key=x+','+y;if(seen.has(key)||!cells.has(key))continue;seen.add(key);queue.push([x-1,y],[x+1,y],[x,y-1],[x,y+1]);}return seen.size!==cells.size;});
    function potentiallyConnected(n,mask,placed){
      work.reachabilityChecks++;
      const mods=[...fixedForSearch.filter(p=>p.kind==='Modifier'),...placed.filter(p=>p.kind==='Modifier')];if(!mods.length)return true;
      if(sparseFootprints)return true;
      const domains=order.slice(n).map(r=>{let union=0n;for(const p of candidates.get(r.id)){work.candidateChecks++;if(!(mask&p.mask))union|=p.mask;}return {perk:byId.get(r.id),mask:union};});
      const roots=[...fixedForSearch,...placed].filter(p=>p.kind==='Core').map(p=>({perk:p,mask:p.mask}));
      for(const d of domains)if(d.perk.kind==='Core')roots.push({perk:d.perk,mask:d.mask});
      const reached=new Set();
      for(const root of roots){
        if(!mods.some(p=>matches(root.perk,p)))continue;
        let space=root.mask;
        for(const p of mods)if(matches(root.perk,p))space|=p.mask;
        for(const d of domains)if(matches(root.perk,d.perk))space|=d.mask;
        let flood=root.mask,previous;
        do{work.floodIterations++;previous=flood;flood|=neighbors(flood)&space&boardBits;}while(previous!==flood);
        for(const p of mods)if(matches(root.perk,p)&&(flood&p.mask))reached.add(p.id);
      }
      return mods.every(p=>reached.has(p.id));
    }
    let geometryFound=false;
    const dead=new Set();
    function place(n,mask,placed){
      tick();if(n===order.length){geometryFound=true;const all=[...fixed,...placed];
        const links=all.map(a=>all.map(b=>a!==b&&!!(edge(a)&maskOf(b))));
        const assignments=assignGroups(all,tick,links);return assignments===null?null:placed.map(p=>p.kind==='Modifier'?{...bare(p),groupCoreId:assignments[p.id]}:bare(p));}
      // Standalone cores are interchangeable obstacles. Connection-bearing pieces retain
      // their identities and positions so occupancy memoization cannot merge group states.
      const state=n+':'+mask+':'+placed.filter(p=>p.kind==='Modifier'||p.accepts?.length).map(p=>p.id+'@'+p.mask).join(';');
      if(dead.has(state))return null;
      for(const p of candidates.get(order[n].id)){work.candidateChecks++;if(!(mask&p.mask)){
        const next=[...placed,p];
        if(n+1<order.length&&!potentiallyConnected(n+1,mask|p.mask,next)){geometryFound=true;continue;}
        const found=place(n+1,mask|p.mask,next);if(found)return found;
      }
      }
      // Memoization is optional; cap it so a longer time budget cannot retain an
      // unbounded number of large semantic-state strings in one packing attempt.
      if(dead.size<50000)dead.add(state);return null;
    }
    const found=place(0,occupied,[]);if(!found){failed.add(key);if(!geometryFound)geometricallyImpossible.add(key);}return found;
    }
    const loose=selected.filter(r=>byId.get(r.id).kind==='Core'&&!hosts.includes(r));
    loose.sort((a,b)=>candidates.get(a.id).length-candidates.get(b.id).length||a.id.localeCompare(b.id));
    const roots=fixedForSearch.filter(p=>p.kind==='Core');
    const pieces=[...fixedForSearch.filter(p=>p.kind==='Modifier').map(p=>({id:p.id,perk:p,positions:[p],fixed:true})),...selected.filter(r=>byId.get(r.id).kind==='Modifier').map(r=>({id:r.id,perk:byId.get(r.id),positions:candidates.get(r.id),fixed:false}))];
    const rectangular=[...fixed,...selected.flatMap(r=>byId.get(r.id).shapes)].every(p=>p.cells.length===p.width*p.height);
    const looseDead=new Set(),groupDead=new Set();
    const countBits=value=>{let count=0;while(value){value&=value-1n;count++;}return count;};
    function placeLoose(n,mask,placed){
      tick();if(n===loose.length)return placed.map(bare);
      const state=n+':'+mask;if(looseDead.has(state))return null;
      for(const p of candidates.get(loose[n].id)){work.candidateChecks++;if(mask&p.mask)continue;
        const found=placeLoose(n+1,mask|p.mask,[...placed,p]);if(found)return found;
      }
      if(looseDead.size<50000)looseDead.add(state);return null;
    }
    function domainsFor(remaining,mask,groups){
      const domains=remaining.map(index=>({index,piece:pieces[index],positions:pieces[index].positions.filter(p=>{work.candidateChecks++;return pieces[index].fixed||!(p.mask&mask);})}));
      if(domains.some(d=>!d.positions.length))return null;
      for(const d of domains)d.allowed=groups.map((g,i)=>matches(g.core,d.piece.perk)&&!(d.piece.perk.override&&g.override)?i:-1).filter(i=>i>=0);
      if(!rectangular)return domains;
      const reachable=groups.map((group,g)=>{
        let space=group.mask;
        for(const d of domains)if(d.allowed.includes(g))for(const p of d.positions)space|=p.mask;
        let reached=group.mask,previous;do{work.floodIterations++;previous=reached;reached|=neighbors(reached)&space&boardBits;}while(reached!==previous);
        return reached;
      });
      for(const d of domains){d.allowed=d.allowed.filter(g=>d.positions.some(p=>!!(p.mask&reachable[g])));if(!d.allowed.length)return null;}
      // Necessary group-capacity bound, using unions of mutually incompatible
      // future placements as an overestimate. It cannot reject a real completion.
      const subsets=groups.length<=8?Array.from({length:(1<<groups.length)-1},(_,i)=>BigInt(i+1)):[...groups.map((g,i)=>1n<<BigInt(i)),(1n<<BigInt(groups.length))-1n];
      for(const bits of subsets){
        let space=0n,demand=0;groups.forEach((g,i)=>{if(bits&(1n<<BigInt(i)))space|=reachable[i];});
        for(const d of domains)if(!d.piece.fixed&&d.allowed.every(i=>!!(bits&(1n<<BigInt(i)))))demand+=area(d.piece.id);
        if(demand>countBits(space&~mask))return null;
      }
      return domains;
    }
    const SWITCH=Symbol('ordering');let constrained=false,trialStart=nodes;
    function grow(remaining,mask,groups,placed){
      tick();if(!constrained&&nodes-trialStart>10000)throw SWITCH;
      if(!remaining.length)return placeLoose(0,mask,placed);
      const state=remaining.join(',')+':'+mask+':'+groups.map(g=>g.mask+','+Number(g.override)).join(';');
      if(groupDead.has(state))return null;
      const domains=domainsFor(remaining,mask,groups);if(!domains){if(groupDead.size<50000)groupDead.add(state);return null;}
      if(constrained)domains.sort((a,b)=>a.allowed.length-b.allowed.length||a.positions.length-b.positions.length||area(b.piece.id)-area(a.piece.id));
      const seenTypes=new Set();
      // Grow one rooted group at a time. A modifier chooses exactly one host.
      for(const {index,piece,allowed,positions} of domains){
        const type=JSON.stringify([piece.fixed?positions[0].mask.toString():piece.perk.shapes,allowed,!!piece.perk.override]);
        if(seenTypes.has(type))continue;seenTypes.add(type);
        const nextRemaining=remaining.filter(i=>i!==index);
        for(const p of positions){work.candidateChecks++;
          for(const g of allowed){work.reachabilityChecks++;if(!(edge(p)&groups[g].mask))continue;
            const nextGroups=groups.map((group,i)=>i===g?{...group,mask:group.mask|p.mask,override:group.override||!!p.override}:group);
            const nextPlaced=piece.fixed?placed:[...placed,{...p,groupCoreId:groups[g].core.id}];
            const found=grow(nextRemaining,mask|p.mask,nextGroups,nextPlaced);if(found)return found;
          }
        }
      }
      if(groupDead.size<50000)groupDead.add(state);return null;
    }
    const initial=roots.map(core=>({core,mask:core.mask,override:!!core.override}));
    let found;
    try{found=grow(pieces.map((p,i)=>i),occupied,initial,[]);}catch(error){if(error!==SWITCH)throw error;constrained=true;found=grow(pieces.map((p,i)=>i),occupied,initial,[]);}
    if(!found){failed.add(key);if(!pieces.length)geometricallyImpossible.add(key);}return found;
  }
  try {
    function improve(found){
      if(!found)return;
      const ids=new Set(found.map(p=>p.id)),previous=new Set(best?.map(p=>p.id));
      const first=optional.find(r=>ids.has(r.id)!==previous.has(r.id));
      if(best===null || first&&ids.has(first.id))best=found;
    }
    function choose(index, selected, usedArea){
      tick();if(usedArea>free)return null;
      const possible=[...fixed,...selected.map(r=>byId.get(r.id)),...optional.slice(index).map(r=>byId.get(r.id))];
      if(selected.some(r=>byId.get(r.id).kind==='Modifier'&&!possible.some(c=>matches(c,byId.get(r.id)))))return null;
      const current=pack(selected);improve(current);
      // Adding chips cannot rescue geometric impossibility. Connectivity failure alone
      // is not monotone: a later requested core or bridge may repair it.
      if(geometricallyImpossible.has(selected.map(r=>r.id).sort().join('|')))return null;
      if(index===optional.length)return current;
      return choose(index+1,[...selected,optional[index]],usedArea+area(optional[index].id)) ?? choose(index+1,selected,usedArea);
    }
    const found=choose(0,required,required.reduce((n,r)=>n+area(r.id),0));
    const possibleCores=[...fixed,...valid.map(r=>byId.get(r.id))].filter(p=>p.kind==='Core');
    const parentReason=id=>targets.has(id)?'Requires the selected core '+(byId.get(id)?.targetCoreName??byId.get(targets.get(id))?.name??targets.get(id))+'. Equip it or change Attach to.':'Requires a compatible equipped ability or a core in your priority list.';
    const missingParent=id=>byId.get(id).kind==='Modifier'&&!possibleCores.some(c=>matches(c,byId.get(id)));
    if(found===null)return result('infeasible',null,[...omissions,...required.map(r=>({id:r.id,reason:missingParent(r.id)?parentReason(r.id):!candidates.get(r.id).length?'No fixed-orientation placement fits the unlocked grid.':'Cannot be jointly placed with the other required perks under the connection rules.'}))],'Required perks cannot form an arrangement.');
    const ids=new Set(found.map(p=>p.id));
    const omitted=optional.filter(r=>!ids.has(r.id)).map(r=>({id:r.id,reason:missingParent(r.id)?parentReason(r.id):!candidates.get(r.id).length?'No fixed-orientation placement fits the unlocked grid.':'Omitted to preserve higher-priority perks and their connections.'}));
    return result('optimal',found,[...omissions,...omitted]);
  } catch(error){
    if(error!==STOP)throw error;
    const ids=new Set(best?.map(p=>p.id)??[]);
    return result('timeout',best,[...omissions,...valid.filter(r=>!ids.has(r.id)).map(r=>({id:r.id,reason:'Not in the best result before the search limit; fit is not disproven.'}))],best?'Search limit reached; this result is not proven optimal.':'Search limit reached before finding an arrangement.');
  }
}
