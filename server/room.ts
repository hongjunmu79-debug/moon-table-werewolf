import {initialRoom,mutate,viewRoom,insist,RoomError,type Room} from '../lib/game';
import {roomStore,type RoomStore} from './storage';
import {RuleError} from '../lib/rules';

const cookieName=(id:string)=>'moon_'+id;
function token(bytes=32){return [...crypto.getRandomValues(new Uint8Array(bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');}
async function hash(s:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
function cookie(req:Request,id:string){return (req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName(id)+'='))?.slice(cookieName(id).length+1)||'';}
function response(data:unknown,status=200,c=''){const headers:Record<string,string>={'Cache-Control':'no-store, private','Vary':'Cookie','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff'};if(c)headers['Set-Cookie']=c;return new Response(JSON.stringify(data),{status,headers});}
function setCookie(req:Request,id:string,value:string){return cookieName(id)+'='+value+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400'+(new URL(req.url).protocol==='https:'?'; Secure':'');}
function validId(id:string){insist(id==='latest'||/^[a-f0-9]{20}$/.test(id),'邀请链接无效');}
async function read(db:RoomStore,id:string){const row=await db.read(id);insist(row&&row.expires>Date.now(),'房间不存在或已过期，请重新建房');return {r:JSON.parse(row.state) as Room,revision:row.revision};}
function failure(e:unknown){console.error('Room request failed',e);return e instanceof RoomError||e instanceof RuleError?response({error:e.message},400):response({error:'房间服务暂时不可用，请稍后重试'},503);}

export const devicePairings = new Map<string, string>();
export function registerDevicePairing(deviceCode: string, roomId: string) {
  if (deviceCode) devicePairings.set(deviceCode.toUpperCase(), roomId);
}

function compact(r:Room|null, deviceCode?: string){
  if(!r)return {ok:true,paired:false,id:'',code:deviceCode||'',game:'avalon',phase:'idle',msg:'等待手机创建房间…',size:0,count:0};
  const av=r.avalon,seat=(id:string)=>r.players.find(p=>p.id===id)?.seat||0;
  const v=viewRoom(r,r.hostKey) as any;
  return {
    ok:true,paired:true,id:r.id.slice(-6).toUpperCase(),code:r.pairingCode||r.id.slice(-4).toUpperCase(),
    game:r.gameType||'werewolf',phase:r.phase,day:r.day,size:r.size,
    count:r.players.length,alive:r.players.filter(p=>p.alive).length,ready:r.players.filter(p=>p.ready).length,
    msg:String(r.message||'').slice(0,90),winner:r.winner||'',
    speaker:v.speaker?seat(v.speaker):0,remain:r.deadline?Math.max(0,Math.round((r.deadline-Date.now())/1000)):0,
    votes:r.phase==='vote'?Object.keys(r.votes).length:0,voteTotal:v.voteTotal||0,
    av:r.gameType==='avalon'&&av?{
      round:av.currentRound,hist:av.missionHistory.map(h=>h==='success'?1:h==='fail'?2:0),
      track:av.voteTracker,hammer:av.voteTracker+1,isFinal:av.voteTracker>=4,
      leader:av.leaderSeat,need:v.avalon?.missionSquadSize||0,fails:v.avalon?.failsRequired||1,
      last:av.lastMissionSummary||'',squad:av.nominatedSquad.map(seat),
      tv:Object.keys(av.teamVotes).length,mv:Object.keys(av.missionSubmissions).length,
      approve:av.teamVotesRevealed?Object.values(av.teamVotes).filter(Boolean).length:-1,
      revIdx:av.revealingIndex,
      revCard:av.revealingIndex>=0?av.cardRevealOrder[av.revealingIndex]:'',
      lady:av.ladyHolderSeat||0,
      offline:!!r.offlineVote
    }:null
  };
}

export async function mosaicoPoll(req:Request,db:RoomStore=roomStore()){
  try{
    const u=new URL(req.url);
    const code=(u.searchParams.get('deviceCode')||u.searchParams.get('code')||u.searchParams.get('id')||'').trim().toUpperCase();
    let roomId=code?devicePairings.get(code):undefined;
    if(!roomId&&code&&code!=='LATEST'){
      const latestRow=await db.read('latest');
      if(latestRow&&latestRow.expires>Date.now()){
        const lr=JSON.parse(latestRow.state) as Room;
        if((lr.pairingCode&&lr.pairingCode.toUpperCase()===code)||lr.id.slice(-4).toUpperCase()===code){
          roomId=lr.id;registerDevicePairing(code,lr.id);
        }
      }
    }
    if(!roomId)roomId='latest';
    const row=await db.read(roomId);
    if(!row||row.expires<=Date.now()){
      return response({ok:true,paired:false,code:code||'----',msg:'未关联房间，请在法官台输入此配对码'});
    }
    const r=JSON.parse(row.state) as Room;
    return response(compact(r,code));
  }catch(e){
    return response({ok:false,paired:false,err:'poll failed'},500);
  }
}

export async function roomGet(req:Request,db:RoomStore=roomStore()){
  try{
    const u=new URL(req.url);
    const id=u.searchParams.get('id')||'';
    const isMosaico=u.searchParams.get('mosaico')==='1'||id==='latest';
    validId(id);
    if(u.searchParams.get('compact')==='1'){
      const row=await db.read(id);
      return response(compact(row&&row.expires>Date.now()?JSON.parse(row.state) as Room:null));
    }
    if(id==='latest'){
      const row=await db.read('latest');
      if(!row||row.expires<=Date.now()){
        return response({id:'',gameType:'avalon',phase:'idle',day:0,size:6,count:0,message:'等待手机/电脑创建桌游房间...',avalon:{currentRound:1,missionHistory:[null,null,null,null,null],voteTracker:0,leaderSeat:1}});
      }
      const r=JSON.parse(row.state) as Room;
      const v=viewRoom(r,r.hostKey) as any;
      if(r.phase!=='ended'&&Array.isArray(v.players)){
        v.players=v.players.map((p:any)=>({...p,role:undefined}));
      }
      v.hostNight=null;
      return response(v);
    }
    const {r}=await read(db,id);
    if(isMosaico){
      const v=viewRoom(r,r.hostKey) as any;
      if(r.phase!=='ended'&&Array.isArray(v.players)){
        v.players=v.players.map((p:any)=>({...p,role:undefined}));
      }
      v.hostNight=null;
      return response(v);
    }
    return response(viewRoom(r,await hash(cookie(req,id))));
  }
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
      const size=Number(b.size);
      let voice=String(b.voice||'').trim();if(voice){insist(voice.length<=1000,'语音房链接太长');let url:URL;try{url=new URL(voice);}catch{throw new RoomError('请填写有效的语音房链接');}insist(url.protocol==='https:'||url.protocol==='http:','请填写有效的语音房链接');voice=url.href;}
      const id=token(10),t=token(),key=await hash(t),r=initialRoom(id,key,name,size,voice,b.setup,b.gameType||b.setup?.gameType);
      await db.create(r);return response(viewRoom(r,key),200,setCookie(req,id,t));
    }
    const id=String(b.id||'');validId(id);
    const existing=cookie(req,id),t=existing||token(),key=await hash(t);b.newId=token(8);
    for(let tries=0;tries<6;tries++){
      const {r,revision}=await read(db,id);
      if(b.action==='pairMosaico'&&b.deviceCode){
        registerDevicePairing(String(b.deviceCode),r.id);
      }
      mutate(r,b.mosaico?r.hostKey:key,b);
      if(await db.compareAndSwap(r.id,revision,r))return response(viewRoom(r,b.mosaico?r.hostKey:key),200,!existing&&b.action==='join'?setCookie(req,r.id,t):'');
    }
    return response({error:'同时操作较多，请稍后重试'},409);
  }catch(e){return failure(e);}
}
