import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const appRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../app');
export function createServer(root=appRoot){
  const absolute=path.resolve(root),types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
  return http.createServer((req,res)=>{
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
    let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end('Invalid path');return;}
    if(pathname.includes('\0')||pathname.includes('\\')){res.writeHead(400);res.end('Invalid path');return;}
    const file=path.resolve(absolute,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(absolute+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
    fs.stat(file,(error,stat)=>{
      if(error||!stat.isFile()){res.writeHead(404);res.end('Not found');return;}
      res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
      if(req.method==='HEAD')res.end();else fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
    });
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),port=Number(args[args.indexOf('--port')+1]??4173);
  const selectedPort=args.includes('--port')?port:4173;
  const directory=args.includes('--directory')?args[args.indexOf('--directory')+1]:appRoot;
  const server=createServer(directory);server.on('error',error=>{console.error(error.message);process.exitCode=1;});
  server.listen(selectedPort,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${server.address().port}/`));
}
