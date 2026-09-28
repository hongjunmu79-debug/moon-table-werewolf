import {deck,ROLES} from './rules';
export type Player={id:string;seat:number;name:string;key:string;ready:boolean;ack:boolean;role:string;alive:boolean;checks:{day:number;seat:number;result:string}[]};
export type Room={id:string;hostName:string;hostKey:string;size:number;voice:string;phase:string;epoch:number;day:number;players:Player[];night:{wolves:Record<string,string>;kill:string;seerDone:boolean;witch:null|{kind:string;target:string}};medicine:{heal:boolean;poison:boolean};votes:Record<string,string>;runoff:string[];voteRound:number;speaker:number;deadline:number;hunter:string;afterHunter:string;winner:string;message:string;logs:{day:number;text:string}[];expires:number};
export function initialRoom(id:string,hostKey:string,name:string,size:number,voice:string):Room{return {id,hostKey,hostName:name,size,voice,phase:'lobby',epoch:0,day:0,players:[],night:{wolves:{},kill:'',seerDone:false,witch:null},medicine:{heal:true,poison:true},votes:{},runoff:[],voteRound:0,speaker:0,deadline:0,hunter:'',afterHunter:'',winner:'',message:'等朋友们入座，准备好后由法官发身份。',logs:[],expires:Date.now()+86400000};}
export class RoomError extends Error {}
export function insist(ok:unknown,msg:string):asserts ok{if(!ok)throw new RoomError(msg);}
function log(r:Room,text:string){r.message=text;r.logs.push({day:r.day,text});r.logs=r.logs.slice(-100);}
function move(r:Room,p:string){r.phase=p;r.epoch++;r.deadline=0;}
function alive(r:Room){return r.players.filter(p=>p.alive);}
function getPlayer(r:Room,id:string){const p=r.players.find(p=>p.id===id);insist(p,'玩家不存在');return p;}
function liveTarget(r:Room,id:string,allowPass=true){if(allowPass&&id==='pass')return null;const p=getPlayer(r,id);insist(p.alive,'只能选择存活玩家');return p;}
function tally(votes:Record<string,string>){const counts:Record<string,number>={};for(const id of Object.values(votes)){if(id&&id!=='pass')counts[id]=(counts[id]||0)+1;}const max=Math.max(0,...Object.values(counts));return {counts,leaders:Object.keys(counts).filter(id=>counts[id]===max)};}
function winner(r:Room){const a=alive(r),wolves=a.filter(p=>p.role==='wolf').length;const result=wolves===0?'好人':wolves>=a.length-wolves?'狼人':'';if(result){r.winner=result;move(r,'ended');log(r,result+'阵营获胜，本局身份已揭晓。');return true;}return false;}
function night(r:Room){r.day++;r.night={wolves:{},kill:'',seerDone:false,witch:null};r.votes={};r.runoff=[];r.voteRound=0;r.hunter='';move(r,'wolves');log(r,'第 '+r.day+' 夜开始，请在语音房保持安静。');}
function afterDeath(r:Room,ids:string[],poisonId:string,after:string){for(const id of ids)getPlayer(r,id).alive=false;const h=ids.map(id=>getPlayer(r,id)).find(p=>p.role==='hunter'&&p.id!==poisonId);if(h){r.hunter=h.id;r.afterHunter=after;move(r,'hunter');log(r,h.seat+' 号猎人可以开枪。');}else if(!winner(r)){move(r,after);if(after==='speech')beginSpeech(r);}}
function beginSpeech(r:Room){r.speaker=0;r.deadline=Date.now()+90000;}
export function mutate(r:Room,key:string,b:Record<string,any>){
 const host=key===r.hostKey,me=r.players.find(p=>p.key===key);const act=b.action;
 if(act==='join'){insist(!host&&!me,'你已经在房间中');insist(r.phase==='lobby','本局已开始，不能中途入座');insist(r.players.length<r.size,'座位已满');const name=String(b.name||'').trim();insist(name.length>0&&name.length<=16,'昵称需为 1–16 个字');insist(!r.players.some(p=>p.name===name),'昵称已有人使用，换一个试试');let seat=1;while(r.players.some(p=>p.seat===seat))seat++;r.players.push({id:b.newId,seat,name,key,ready:false,ack:false,role:'',alive:true,checks:[]});r.players.sort((a,b)=>a.seat-b.seat);return;}
 insist(host||me,'请先入座');
 insist(b.epoch===r.epoch,'流程已更新，请确认当前阶段后重试');
 if(act==='ready'){insist(me&&r.phase==='lobby','现在不能准备');me.ready=!!b.ready;return;}
 if(act==='kick'){insist(host&&r.phase==='lobby','只能在开始前移除玩家');r.players=r.players.filter(p=>p.id!==b.target);return;}
 if(act==='leave'){insist(me&&r.phase==='lobby','开始后不能离开席位');r.players=r.players.filter(p=>p.id!==me.id);return;}
 if(act==='deal'){insist(host&&r.phase==='lobby','现在不能发身份');insist(r.players.length===r.size&&r.players.every(p=>p.ready),'等待所有玩家入座并准备');const roles=deck(r.size);for(let i=roles.length-1;i>0;i--){let x:number;const limit=Math.floor(4294967296/(i+1))*(i+1);do{x=crypto.getRandomValues(new Uint32Array(1))[0];}while(x>=limit);const j=x%(i+1);[roles[i],roles[j]]=[roles[j],roles[i]];}r.players.forEach((p,i)=>{p.role=roles[i];p.ack=false;});move(r,'deal');log(r,'身份已发放，请每个人私下查看并确认。');return;}
 if(act==='ack'){insist(me&&r.phase==='deal','现在不能确认身份');me.ack=true;return;}
 if(act==='rematch'){insist(host&&r.phase==='ended','结束后才能再来一局');const next=initialRoom(r.id,r.hostKey,r.hostName,r.size,r.voice);next.players=r.players.map(p=>({...p,role:'',ready:false,ack:false,alive:true,checks:[]}));next.epoch=r.epoch+1;Object.assign(r,next);return;}
 if(act==='nightAction'){insist(me&&me.alive,'只有存活玩家可以行动');const target=String(b.target||'pass');
  if(r.phase==='wolves'){insist(me.role==='wolf','现在不是你的行动阶段');const p=liveTarget(r,target);insist(!p||p.role!=='wolf','不能袭击狼队成员');r.night.wolves[me.id]=target;return;}
  if(r.phase==='seer'){insist(me.role==='seer'&&!r.night.seerDone,'现在无法查验');const p=liveTarget(r,target);insist(!p||p.id!==me.id,'请选择其他玩家');if(p)me.checks.push({day:r.day,seat:p.seat,result:p.role==='wolf'?'狼人':'好人'});r.night.seerDone=true;return;}
  if(r.phase==='witch'){insist(me.role==='witch'&&!r.night.witch,'现在无法用药');const kind=b.kind;insist(['pass','heal','poison'].includes(kind),'请选择用药方式');if(kind==='heal'){insist(r.medicine.heal&&r.night.kill&&r.night.kill!==me.id,'没有可用的解药目标（本局不能自救）');r.night.witch={kind,target:r.night.kill};r.medicine.heal=false;}else if(kind==='poison'){insist(r.medicine.poison,'毒药已使用');const p=liveTarget(r,target,false);insist(p&&p.id!==me.id,'请选择其他玩家');r.night.witch={kind,target};r.medicine.poison=false;}else r.night.witch={kind:'pass',target:''};return;}
  throw new RoomError('现在不是夜间行动阶段');
 }
 if(act==='vote'){insist(me&&me.alive&&r.phase==='vote','现在不能投票');insist(!r.votes[me.id],'投票已提交，不能修改');const target=String(b.target||'pass');liveTarget(r,target);insist(!r.runoff.length||target==='pass'||r.runoff.includes(target),'加投只能选择平票玩家');insist(target!==me.id,'不能投自己');r.votes[me.id]=target;return;}
 if(act==='shoot'){insist(r.phase==='hunter'&&(host||me?.id===r.hunter),'现在不能开枪');const target=String(b.target||'pass');const p=liveTarget(r,target);if(p){p.alive=false;log(r,getPlayer(r,r.hunter).seat+' 号猎人带走了 '+p.seat+' 号。');}else log(r,'猎人选择不开枪。');r.hunter='';if(!winner(r)){move(r,r.afterHunter);if(r.afterHunter==='speech')beginSpeech(r);}return;}
 if(act==='nextSpeaker'){insist(host&&r.phase==='speech','现在不能切换发言');const list=alive(r);insist(r.speaker<list.length-1,'所有玩家已经发言，可以开始投票');r.speaker++;r.deadline=Date.now()+90000;r.epoch++;return;}
 if(act==='restartTimer'){insist(host&&r.phase==='speech','现在不能重置计时');r.deadline=Date.now()+90000;return;}
 if(act==='advance'){insist(host,'只有法官可以推进流程');
  switch(r.phase){
   case 'deal':insist(r.players.every(p=>p.ack),'请等待每个人确认身份');night(r);return;
   case 'wolves':{r.night.kill=tally(r.night.wolves).leaders.length===1?tally(r.night.wolves).leaders[0]:'';move(r,'seer');return;}
   case 'seer':move(r,'witch');return;
   case 'witch':move(r,'dawn');return;
   case 'dawn':{const poison=r.night.witch?.kind==='poison'?r.night.witch.target:'';const kill=r.night.witch?.kind==='heal'?'':r.night.kill;const deaths=[...new Set([kill,poison].filter(Boolean))];log(r,deaths.length?'昨夜出局：'+deaths.map(id=>getPlayer(r,id).seat+' 号').join('、')+'。':'昨夜是平安夜。');afterDeath(r,deaths,poison,'speech');return;}
   case 'speech':r.votes={};r.runoff=[];r.voteRound=1;move(r,'vote');log(r,'请投票放逐一位玩家，或选择弃票。');return;
   case 'vote':{const {counts,leaders}=tally(r.votes);const summary=Object.entries(counts).map(([id,n])=>getPlayer(r,id).seat+'号 '+n+'票').join('，');log(r,'投票结果：'+(summary||'全部弃票')+'。');
    if(leaders.length>1&&r.voteRound===1){r.runoff=leaders;r.voteRound=2;r.votes={};r.epoch++;log(r,'平票：'+leaders.map(id=>getPlayer(r,id).seat+'号').join('、')+'。请先补充发言，再加投一次。');return;}
    if(leaders.length===1){log(r,getPlayer(r,leaders[0]).seat+' 号被放逐。');afterDeath(r,leaders,'','dusk');return;}
    move(r,'dusk');log(r,'本轮无人被放逐。');return;}
   case 'dusk':night(r);return;
   default:throw new RoomError('现在不能推进流程');
  }
 }
 throw new RoomError('不支持此操作');
}
export function viewRoom(r:Room,key:string){
 const host=key===r.hostKey,me=r.players.find(p=>p.key===key),nightPhase=['wolves','seer','witch','dawn'].includes(r.phase);
 const roleActive=me?.alive&&((r.phase==='wolves'&&me.role==='wolf')||(r.phase==='seer'&&me.role==='seer')||(r.phase==='witch'&&me.role==='witch'));
 const members=r.players.map(p=>({id:p.id,seat:p.seat,name:p.name,ready:p.ready,ack:p.ack,alive:p.alive,...((host||r.phase==='ended')?{role:p.role}:{})}));
 const base={id:r.id,hostName:r.hostName,size:r.size,voice:r.voice,phase:nightPhase&&!host?'night':r.phase,epoch:r.epoch,day:r.day,players:members,host,member:!!me,me:me?{id:me.id,seat:me.seat,name:me.name,role:me.role,ready:me.ready,ack:me.ack,alive:me.alive,checks:me.checks}:null,canJoin:r.phase==='lobby'&&r.players.length<r.size,message:r.message,logs:r.logs,winner:r.winner,expires:r.expires,runoff:r.runoff,voteRound:r.voteRound,voteCount:r.phase==='vote'?Object.keys(r.votes).length:0,myVote:me?r.votes[me.id]||'':'',speaker:r.phase==='speech'?alive(r)[r.speaker]?.id:'',lastSpeaker:r.speaker>=alive(r).length-1,deadline:r.deadline,hunter:r.hunter,
 wolfTeam:me?.role==='wolf'?r.players.filter(p=>p.role==='wolf').map(p=>({seat:p.seat,name:p.name,id:p.id})):[],
 action:roleActive?r.phase:'',submitted:!!(roleActive&&me&&(r.phase==='wolves'?r.night.wolves[me.id]:r.phase==='seer'?r.night.seerDone:r.phase==='witch'?r.night.witch:false)),
 wolfVotes:(host||(me?.alive&&me.role==='wolf'&&r.phase==='wolves'))?r.night.wolves:{},
 victim:(host||(me?.alive&&me.role==='witch'&&r.phase==='witch'&&r.medicine.heal))?r.night.kill:'',
 medicine:(host||me?.role==='witch')?r.medicine:null,
 hostNight:host?{...r.night,checks:r.players.find(p=>p.role==='seer')?.checks||[]}:null};
 if(!host&&!me)return {id:r.id,hostName:r.hostName,size:r.size,phase:'join',canJoin:r.phase==='lobby'&&r.players.length<r.size,count:r.players.length,expires:r.expires};
 return base;
}
