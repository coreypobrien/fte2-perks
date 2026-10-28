import fs from 'node:fs';
import {chromium} from 'playwright';
const args=process.argv.slice(2),arg=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const base=arg('--base-url','http://127.0.0.1:4173/'),nodeLimit=Number(arg('--nodes','4000')),repeats=Number(arg('--repeats','3'));
const build=JSON.parse(fs.readFileSync('examples/machinist-validation/machinist-1.afe2.json')),trials=[];
const browser=await chromium.launch({headless:true,executablePath:arg('--browser-path',undefined)});
try{
  for(let pair=0;pair<repeats;pair++)for(const enabled of pair%2?[true,false]:[false,true]){
    const context=await browser.newContext({viewport:{width:1440,height:1100}});
    await context.addInitScript(({enabled,nodeLimit,build})=>{
      localStorage.setItem('afe2.perk-planner.v0',JSON.stringify({schemaVersion:1,gameVersion:build.gameVersion,draft:build.config,builds:[]}));
      const interval=window.setInterval.bind(window);window.setInterval=(callback,delay,...rest)=>delay===250&&!enabled?-1:interval(callback,delay,...rest);
      const NativeWorker=window.Worker;window.Worker=class extends NativeWorker{
        constructor(...args){super(...args);this.addEventListener('message',e=>{window.benchResult=e.data.result;});}
        postMessage(message){super.postMessage({...message,options:{timeLimitMs:60000,maxNodes:nodeLimit}});}
      };
    },{enabled,nodeLimit,build});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>!!window.benchResult,{},{timeout:65000});
    const result=await page.evaluate(()=>window.benchResult);if(errors.length)throw new Error(errors.join('; '));
    const record={pair,timer:enabled,nodes:result.nodes,status:result.status,included:result.included,ms:result.elapsedMs};trials.push(record);console.log(JSON.stringify({...record,included:record.included.length}));await context.close();
  }
}finally{await browser.close();}
if(new Set(trials.map(t=>JSON.stringify([t.nodes,t.status,t.included]))).size!==1)throw new Error('Timer trials did not perform the same fixed-work search.');
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const summary={timerOffMs:median(trials.filter(t=>!t.timer).map(t=>t.ms)),timerOnMs:median(trials.filter(t=>t.timer).map(t=>t.ms))};summary.differencePercent=100*(summary.timerOnMs/summary.timerOffMs-1);
fs.mkdirSync('work/evidence',{recursive:true});fs.writeFileSync(arg('--output','work/evidence/timer-profile.json'),JSON.stringify({base,nodeLimit,trials,summary},null,2)+'\n');console.log(JSON.stringify(summary));
