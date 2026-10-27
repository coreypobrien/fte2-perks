import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const [input, output, tool] = process.argv.slice(2);
if (!input || !output || !tool) throw new Error('Usage: node export-assets.mjs INPUT OUTPUT UASSETGUI');
const walk = p => fs.readdirSync(p, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(p,e.name)) : [path.join(p,e.name)]);
const files = walk(input).filter(p => /\.uasset$/i.test(p) && /^(Perk_|PerkBoard_|BasePerkBoard|Player_)/.test(path.basename(p)));
let cursor=0, completed=0;
const failures=[];
async function worker() {
  while (cursor<files.length) {
    const source=files[cursor++], destination=path.join(output,path.relative(input,source).replace(/\.uasset$/i,'.json'));
    fs.mkdirSync(path.dirname(destination),{recursive:true});
    await new Promise(resolve=>{
        const proc=spawn(tool,['tojson',source,destination,'VER_UE4_27'],{windowsHide:true,stdio:'ignore'});
        const timer=setTimeout(()=>proc.kill(),120000);
        proc.on('error',e=>{failures.push({source,error:e.message});});
        proc.on('close',code=>{clearTimeout(timer);if(code!==0 || !fs.existsSync(destination)) failures.push({source,exitCode:code});else {try{JSON.parse(fs.readFileSync(destination,'utf8').replace(/^\uFEFF/,''));}catch(e){failures.push({source,error:e.message});}}resolve();});
      });
    if (++completed%50===0) console.log(`${completed}/${files.length}`);
  }
}
await Promise.all(Array.from({length:4},worker));
fs.writeFileSync(path.join(output,'export-report.json'),JSON.stringify({selected:files.length,completed,failures},null,2)+'\n');
console.log(JSON.stringify({selected:files.length,completed,failures}));
if(failures.length) process.exitCode=1;
