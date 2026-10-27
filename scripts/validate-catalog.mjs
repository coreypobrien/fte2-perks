import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=name=>JSON.parse(fs.readFileSync(`data/extracted/${name}.json`,'utf8'));
const perks=read('perks'), classes=read('classes'), boards=read('boards'), report=read('extraction-report');
assert.deepEqual(classes.map(c=>c.name).sort(),['Duelist','Hunter','Machinist','Marauder','Medic','Specialist']);
assert.equal(new Set(perks.map(p=>p.assetPath)).size,perks.length,'Duplicate perk identifiers');
assert.equal(report.referencedButNotExtracted.length,0,'Missing catalog references');
assert.equal(report.parseWarnings.length,0,'Raw unparsed exports remain');
assert.equal(report.malformedShapes.length,0,'Malformed shape masks');
for(const p of perks) {
  assert.equal(typeof p.name,'string',p.assetPath);
  assert.equal(typeof p.description,'string',p.assetPath);
  assert.equal(p.source.buildId,report.buildId);
  for(const s of p.shapes) {
    assert.equal(s.collisionMask.length,s.width*s.height,p.name);
    assert.ok(s.collisionMask.every(v=>Number.isInteger(v)&&v>=0),`Invalid perk mask values: ${p.name}`);
    assert.equal(s.occupiedCellsColumnMajor.length,s.collisionMask.filter(Boolean).length,p.name);
  }
}
const base=boards.find(b=>b.properties.BaseShape).properties.BaseShape;
assert.equal(base.CollisionMask.length,base.Width*base.Height);
for(const b of boards) for(const placement of b.properties.BoardLockedPlacements??[]) {
  assert.ok(placement.Column>=0&&placement.Column<base.Width);
  assert.ok(placement.Row>=0&&placement.Row<base.Height);
  if(placement.LockedSpecificChip) assert.ok(perks.some(p=>p.assetPath===placement.LockedSpecificChip.split('.')[0]),'Unknown fixed chip');
}
assert.equal(report.perkAssets,perks.length);
console.log(`Validated ${perks.length} chip assets, ${classes.length} classes, and ${boards.length} boards for build ${report.buildId}.`);
console.log(`${perks.filter(p=>!p.shapes.length).length} chips omit serialized shapes; native defaults resolve them in the effective catalog.`);

// User observations are cross-checks only. The catalog build never reads them.
const catalog = JSON.parse(fs.readFileSync('data/perks/catalog.json','utf8'));
assert.equal(catalog.perks.length, perks.length);
assert.equal(catalog.counts.assetShapes + catalog.counts.nativeDefaultShapes, perks.length);
const verified = JSON.parse(fs.readFileSync('data/verified/perks.json','utf8').replace(/^\uFEFF/,''));
const verifiedIds = new Set();
for (const observation of verified.perks) {
  assert.ok(!verifiedIds.has(observation.assetPath), 'Duplicate verified perk');
  verifiedIds.add(observation.assetPath);
  const perk = perks.find(p => p.assetPath === observation.assetPath);
  assert.ok(perk, 'Verified perk must resolve to an extracted asset');
  assert.equal(perk.name, observation.name);
  assert.equal(perk.source.buildId, observation.evidence.buildIdContext, 'Recheck user observations for a changed build');
  const shape = observation.footprint;
  assert.ok(Number.isInteger(shape.width) && shape.width > 0);
  assert.ok(Number.isInteger(shape.height) && shape.height > 0);
  assert.ok(catalog.perks.find(p => p.assetPath === observation.assetPath).shapes.some(s => s.width === shape.width && s.height === shape.height), 'Verified footprint conflicts with extracted shape');
  if (observation.connection) assert.ok(['none_required','required'].includes(observation.connection.mode));
  if (observation.connection?.mode === 'required') assert.equal(typeof observation.connection.targetName, 'string');
}
const recovered = verified.perks.filter(o => !perks.find(p => p.assetPath === o.assetPath).shapes.length).length;
console.log(`User checks agree with code-derived footprints for ${verified.perks.length} perks, including ${recovered} omitted asset shapes.`);

// All catalog inputs below come from game files, never observation fixtures.
const native = JSON.parse(fs.readFileSync('data/native/mod-chip-defaults.json','utf8'));
assert.equal(catalog.buildId, native.buildId);
for (const effective of catalog.perks) {
  const raw = perks.find(p => p.assetPath === effective.assetPath);
  const hasExplicit = Object.hasOwn(raw.properties, 'PossibleShapes');
  assert.equal(effective.shapes[0].source.kind, hasExplicit ? 'asset_property' : 'native_constructor_default');
  const expected = hasExplicit ? raw.properties.PossibleShapes : native.properties.PossibleShapes;
  assert.deepEqual(effective.shapes.map(s => ({Width:s.width,Height:s.height,CollisionMask:s.collisionMask})), expected);
}
console.log(`All ${catalog.perks.length} effective footprints have game-file provenance; no manual overrides.`);
