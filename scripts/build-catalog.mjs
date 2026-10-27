import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const extracted=read('data/extracted/perks.json');
const native=read('data/native/mod-chip-defaults.json');
const inventory=read('data/inventory/installed-game.json');
if(native.buildId!==inventory.buildId) throw new Error('Native default recipe must be audited for the installed build');
const perks=extracted.map(perk=>{
  if(perk.source.buildId!==native.buildId || perk.parentClass!==native.classPath) throw new Error(`Unsupported native parent/build: ${perk.assetPath}`);
  const explicit=Object.hasOwn(perk.properties,'PossibleShapes');
  const shapes=explicit?perk.properties.PossibleShapes:native.properties.PossibleShapes;
  if(!shapes?.length) throw new Error(`No effective shape for ${perk.assetPath}`);
  return {
    assetPath:perk.assetPath,name:perk.name,description:perk.description,
    shapes:shapes.map(s=>{
      if(!Number.isInteger(s.Width)||!Number.isInteger(s.Height)||s.CollisionMask.length!==s.Width*s.Height) throw new Error('Malformed effective shape');
      return {width:s.Width,height:s.Height,collisionMask:s.CollisionMask,
        occupiedCells:s.CollisionMask.flatMap((v,i)=>v!==0?[[Math.floor(i/s.Height),i%s.Height]]:[]),
        coordinateOrder:'column_major',source:explicit?{...perk.source,kind:'asset_property'}:{...native.source,kind:'native_constructor_default'}};
    }),
    tags:perk.tags,modifierCompatibility:perk.modifierCompatibility,modifiers:perk.modifiers,
    restrictionType:perk.restrictionType,kitRestriction:perk.kitRestriction,catalogEvidence:perk.catalogEvidence,
    connectionRuleStatus:'native_logic_not_yet_traced'
  };
});
const result={schemaVersion:1,buildId:native.buildId,
  scope:'Effective footprints from explicit asset properties and native constructor defaults. Connection, rotation, and eligibility logic are not yet fully traced.',
  counts:{chips:perks.length,assetShapes:perks.filter(p=>p.shapes[0].source.kind==='asset_property').length,nativeDefaultShapes:perks.filter(p=>p.shapes[0].source.kind==='native_constructor_default').length},perks};
fs.mkdirSync('data/perks',{recursive:true});
fs.writeFileSync('data/perks/catalog.json',JSON.stringify(result,null,2)+'\n');
console.log(`Built ${perks.length} code-derived footprints: ${result.counts.assetShapes} explicit + ${result.counts.nativeDefaultShapes} native defaults. No user observations used.`);
