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
console.log(`${perks.filter(p=>!p.shapes.length).length} chips lack serialized shapes; these remain unknown.`);

// User verification supplements raw exports without filling unknown native properties.
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
  if (perk.shapes.length) assert.ok(perk.shapes.some(s => s.width === shape.width && s.height === shape.height), 'Verified footprint conflicts with extracted shape');
  if (observation.connection) assert.ok(['none_required','required'].includes(observation.connection.mode));
  if (observation.connection?.mode === 'required') assert.equal(typeof observation.connection.targetName, 'string');
}
const recovered = verified.perks.filter(o => !perks.find(p => p.assetPath === o.assetPath).shapes.length).length;
console.log(`User verification: ${verified.perks.length} perks checked, ${recovered} missing footprints recovered, ${perks.filter(p => !p.shapes.length).length - recovered} footprints unresolved.`);
