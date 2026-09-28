import {initialRoom,mutate,viewRoom,insist,RoomError,type Room} from '../lib/game';
import {roomStore,type RoomStore} from './storage';

const cookieName=(id:string)=>'moon_'+id;
function token(bytes=32){return [...crypto.getRandomValues(new Uint8Array(bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');}
async function hash(s:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
function cookie(req:Request,id:string){return (req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName(id)+'='))?.slice(cookieName(id).length+1)||'';}
function response(data:unknown,status=200,c=''){const headers:Record<string,string>={'Cache-Control':'no-store, private','Vary':'Cookie','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff'};if(c)headers['Set-Cookie']=c;return new Response(JSON.stringify(data),{status,headers});}
function setCookie(req:Request,id:string,value:string){return cookieName(id)+'='+value+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400'+(new URL(req.url).protocol==='https:'?'; Secure':'');}
function validId(id:string){insist(/^[a-f0-9]{20}$/.test(id),'邀请链接无效');}
async function read(db:RoomStore,id:string){const row=await db.read(id);insist(row&&row.expires>Date.now(),'房间不存在或已过期，请重新建房');return {r:JSON.parse(row.state) as Room,revision:row.revision};}
function failure(e:unknown){console.error('Room request failed',e);return e instanceof RoomError?response({error:e.message},400):response({error:'房间服务暂时不可用，请稍后重试'},503);}

export async function roomGet(req:Request,db:RoomStore=roomStore()){
  try{const id=new URL(req.url).searchParams.get('id')||'';validId(id);const {r}=await read(db,id);return response(viewRoom(r,await hash(cookie(req,id))));}
  catch(e){return failure(e);}
}

export async function roomPost(req:Request,db:RoomStore=roomStore()){
  try{
    insist(req.headers.get('content-type')?.includes('application/json'),'请求格式无效');
    const origin=req.headers.get('origin');insist(!origin||origin===new URL(req.url).origin,'请从房间页面操作');insist(req.headers.get('sec-fetch-site')!=='cross-site','请从房间页面操作');
    const raw=await req.text();insist(raw.length<8192,'请求过大');
    let b:Record<string,any>;try{b=JSON.parse(raw);}catch{throw new RoomError('请求格式无效');}
    insist(b&&typeof b==='object'&&!Array.isArray(b),'请求格式无效');
    if(b.action==='create'){
      const name=String(b.name||'').trim();insist(name.length>0&&name.length<=16,'请填写 1–16 字的法官昵称');
      const size=Number(b.size);insist([6,7,8,9].includes(size),'支持 6–9 人局');
      let voice=String(b.voice||'').trim();if(voice){insist(voice.length<=1000,'语音房链接太长');let url:URL;try{url=new URL(voice);}catch{throw new RoomError('请填写有效的语音房链接');}insist(url.protocol==='https:'||url.protocol==='http:','请填写有效的语音房链接');voice=url.href;}
      const id=token(10),t=token(),key=await hash(t),r=initialRoom(id,key,name,size,voice);
      await db.create(r);return response(viewRoom(r,key),200,setCookie(req,id,t));
    }
    const id=String(b.id||'');validId(id);
    const existing=cookie(req,id),t=existing||token(),key=await hash(t);b.newId=token(8);
    for(let tries=0;tries<6;tries++){
      const {r,revision}=await read(db,id);mutate(r,key,b);
      if(await db.compareAndSwap(id,revision,r))return response(viewRoom(r,key),200,!existing&&b.action==='join'?setCookie(req,id,t):'');
    }
    return response({error:'同时操作较多，请稍后重试'},409);
  }catch(e){return failure(e);}
}
