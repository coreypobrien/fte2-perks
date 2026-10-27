// Prove the production catalog can be reproduced with no observation directory.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const scratch=path.resolve('work/catalog-input-test');
assert.ok(!fs.existsSync(path.join(scratch,'data/verified')),'Isolation test must not contain user observations');
for(const file of ['data/extracted/perks.json','data/native/mod-chip-defaults.json','data/inventory/installed-game.json']) {
  const destination=path.join(scratch,file);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.copyFileSync(file,destination);
}
const result=spawnSync(process.execPath,[path.resolve('scripts/build-catalog.mjs')],{cwd:scratch,encoding:'utf8',windowsHide:true});
assert.equal(result.status,0,result.stderr);
assert.deepEqual(fs.readFileSync(path.join(scratch,'data/perks/catalog.json')),fs.readFileSync('data/perks/catalog.json'));
console.log('Isolation test passed: identical catalog generated without any user observations.');
