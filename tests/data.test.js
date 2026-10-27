import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
test('browser data is deterministic, game-derived, and complete for the audited build',()=>{
  const before=fs.readFileSync('app/data/game.json'),r=spawnSync(process.execPath,['scripts/build-web-data.mjs','--output','work/data-test/game.json'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
  assert.deepEqual(fs.readFileSync('work/data-test/game.json'),before);
  const game=read('app/data/game.json'),source=read('data/extracted/perks.json'),native=read('data/native/mod-chip-rules.json'),catalog=read('data/perks/catalog.json');
  assert.equal(game.perks.length,509);assert.equal(game.classes.length,6);assert.equal(game.version,native.buildId);assert.equal(game.version,catalog.buildId);assert.equal(game.rulesSource.executableSha256,native.source.executableSha256);
  assert.equal(new Set(game.perks.map(p=>p.id)).size,game.perks.length);
  for(const p of game.perks){const raw=source.find(s=>s.assetPath===p.id).properties;assert.equal(p.kind,raw.Type?.split('::').at(-1)??native.defaults.Type);assert.equal(p.restriction,raw.RestrictionType?.split('::').at(-1)??native.defaults.RestrictionType);assert.deepEqual(p.alternativeKits,raw.AlternativeKitsAllowed??[]);assert.ok(!/<[^>]*>/.test(p.description));
    for(const shape of p.shapes)assert.equal(shape.cells.length,shape.width*shape.height,'Current tile renderer expects filled rectangles; audit new footprint shapes before a patch update.');
  }
  assert.equal(crypto.createHash('sha256').update(before).digest('hex').length,64);
});
test('build-static produces ordinary deployable files with no observation or tool dependencies',()=>{
  const r=spawnSync(process.execPath,['scripts/build-static.mjs'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
  assert.ok(fs.existsSync('dist/index.html'));assert.ok(fs.existsSync('dist/.vite/manifest.json'));
  const assets=fs.readdirSync('dist/assets');
  for(const pattern of [/^index-.*\.js$/,/^index-.*\.css$/,/^worker-.*\.js$/,/^game-.*\.json$/])assert.ok(assets.some(p=>pattern.test(p)),pattern);
  const data=assets.find(p=>/^game-.*\.json$/.test(p));assert.deepEqual(fs.readFileSync('dist/assets/'+data),fs.readFileSync('app/data/game.json'));
  assert.ok(!fs.existsSync('dist/data/verified'));assert.ok(!fs.existsSync('dist/work'));assert.ok(!fs.existsSync('dist/scripts'));
});
