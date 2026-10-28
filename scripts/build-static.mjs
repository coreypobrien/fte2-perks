import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=path.join(projectRoot,'dist');
// Delete only this explicitly verified generated directory; reject junctions/symlinks.
if(path.relative(projectRoot,destination)!=='dist')throw new Error('Unsafe output path');
if(fs.existsSync(destination)){
  if(fs.lstatSync(destination).isSymbolicLink()||fs.realpathSync(destination)!==destination)throw new Error('Generated output must not be a link or redirected path');
}
await build({configFile:path.join(projectRoot,'vite.config.js'),build:{outDir:destination,emptyOutDir:true}});
fs.copyFileSync(path.join(projectRoot,'LICENSE'),path.join(destination,'LICENSE.txt'));
fs.copyFileSync(path.join(projectRoot,'NOTICE.md'),path.join(destination,'NOTICE.txt'));
fs.mkdirSync(path.join(destination,'licenses'),{recursive:true});
fs.copyFileSync(path.join(projectRoot,'licenses/Vite.txt'),path.join(destination,'licenses/Vite.txt'));
console.log(`Vite static output: ${destination}. No server runtime or external CDN is required.`);
