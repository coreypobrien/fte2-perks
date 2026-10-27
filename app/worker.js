import {solve} from './core/solver.js';
self.onmessage=event=>{
  const {jobId,problem,options}=event.data;
  try{self.postMessage({jobId,result:solve(problem,options)});}
  catch(error){self.postMessage({jobId,result:{status:'error',placements:null,included:[],omissions:[],error:'The solver could not process this configuration: '+error.message}});}
};
