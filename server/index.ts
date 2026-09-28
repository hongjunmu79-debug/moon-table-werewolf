import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {roomGet,roomPost} from './room';

const root=resolve(import.meta.dirname,'../dist');
const types:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
const port=Number(process.env.PORT||8080);

const server=createServer(async(req,res)=>{
  try{
    const hostname=req.headers.host||'localhost';
    const protocol=process.env.NODE_ENV==='production'?'https':'http';
    const url=new URL(req.url||'/',`${protocol}://${hostname}`);
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','same-origin');
    if(url.pathname==='/healthz'){
      res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end('ok');return;
    }
    if(url.pathname==='/api/room'){
      if(req.method!=='GET'&&req.method!=='POST'){res.writeHead(405,{'Allow':'GET, POST'});res.end();return;}
      let body:Buffer|undefined;
      if(req.method==='POST'){
        const chunks:Buffer[]=[];let size=0;
        for await(const chunk of req){const part=Buffer.from(chunk);size+=part.length;if(size>8192){res.writeHead(413);res.end();return;}chunks.push(part);}
        body=Buffer.concat(chunks);
      }
      const request=new Request(url,{method:req.method,headers:req.headers as HeadersInit,body:body?new Uint8Array(body).buffer:undefined});
      const answer=await (req.method==='POST'?roomPost(request):roomGet(request));
      res.writeHead(answer.status,Object.fromEntries(answer.headers.entries()));
      res.end(Buffer.from(await answer.arrayBuffer()));return;
    }
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
    const pathname=decodeURIComponent(url.pathname);
    if(pathname.includes('..')||pathname.includes('\\')||pathname.includes('\0')){res.writeHead(400);res.end();return;}
    let file=join(root,pathname);
    let info;try{info=await stat(file);}catch{info=null;}
    if(!info?.isFile())file=join(root,'index.html');
    const content=await readFile(file);
    const ext=extname(file);
    res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','Cache-Control':ext==='.html'?'no-cache':'public, max-age=31536000, immutable'});
    if(req.method==='GET')res.end(content);else res.end();
  }catch(e){console.error('HTTP request failed',e);res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});res.end('服务暂时不可用');}
});

server.listen(port,'0.0.0.0',()=>{console.log(`Moon table listening on ${String((server.address() as {port:number}).port)}`);});
