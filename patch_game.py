import re

path = r"C:\Users\23715\.gemini\antigravity\scratch\moon-table-werewolf\lib\game.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add imports from ./avalon
import_avalon = "import {defaultAvalonDeck,resolveVision,initialAvalonState,AVALON_QUEST_TABLE,isEvil,isGood,AVALON_ROLE_NAMES,type AvalonRole,type AvalonState} from './avalon';\n"
if "from './avalon'" not in content:
    content = import_avalon + content

# 2. Update Player type to include cardNo and cardUid
content = content.replace(
    "checks:{day:number;seat:number;result:string}[]};",
    "checks:{day:number;seat:number;result:string}[];cardNo?:number;cardUid?:string};"
)

# 3. Update Room type to include gameType and avalon
content = content.replace(
    "expires:number};",
    "expires:number;gameType?:'werewolf'|'avalon';avalon?:AvalonState};"
)

# 4. Update initialRoom signature & definition
old_init = "export function initialRoom(id:string,hostKey:string,name:string,size:number,voice:string,input?:GameConfig):Room{return {id,hostKey,hostName:name,size,setup:resolveConfig(size,input),lastGuard:'',voice,phase:'lobby',epoch:0,day:0,players:[],night:{wolves:{},kill:'',seerDone:false,guardDone:false,guardTarget:'',witch:null},medicine:{heal:true,poison:true},votes:{},runoff:[],voteRound:0,speaker:0,deadline:0,hunter:'',afterHunter:'',winner:'',message:'等朋友们入座，准备好后由法官发身份。',logs:[],expires:Date.now()+86400000};}"

new_init = """export function initialRoom(id:string,hostKey:string,name:string,size:number,voice:string,input?:any,gameType:'werewolf'|'avalon'='werewolf'):Room{
  const isAvalon = gameType === 'avalon' || (input && input.gameType === 'avalon');
  const gType = isAvalon ? 'avalon' : 'werewolf';
  const roomSetup = isAvalon ? undefined : resolveConfig(size, input);
  return {
    id,hostKey,hostName:name,size,setup:roomSetup,lastGuard:'',voice,phase:'lobby',epoch:0,day:0,
    players:[],night:{wolves:{},kill:'',seerDone:false,guardDone:false,guardTarget:'',witch:null},
    medicine:{heal:true,poison:true},votes:{},runoff:[],voteRound:0,speaker:0,deadline:0,
    hunter:'',afterHunter:'',winner:'',message:isAvalon?'阿瓦隆房间已创建，支持 5–10 人及 10 张 NFC/白卡切卡。':'等朋友们入座，准备好后由法官发身份。',
    logs:[],expires:Date.now()+86400000,gameType:gType,avalon:isAvalon?initialAvalonState(size):undefined
  };
}"""
content = content.replace(old_init, new_init)

# 5. Add mutate actions for bindCard and Avalon
avalon_actions = """
 if(act==='bindCard'){
  insist(me,'请先入座');
  if(b.cardNo!==undefined&&b.cardNo!==null){
   const cNo=Number(b.cardNo);insist(Number.isInteger(cNo)&&cNo>=1&&cNo<=20,'卡号需在 1–20 之间');
   me.cardNo=cNo;
  }
  if(b.cardUid!==undefined&&b.cardUid!==null){
   me.cardUid=String(b.cardUid).trim();
  }
  log(r,me.name+' ('+me.seat+'号) 绑定了实体卡'+(me.cardNo?' #'+me.cardNo:'')+(me.cardUid?' [UID:'+me.cardUid+']':''));
  r.epoch++;return;
 }
 if(r.gameType==='avalon'){
  if(act==='avalonNominate'){
   insist(r.phase==='avalonNominate','现在不是挑选出勤队员阶段');
   insist(host||(me&&me.seat===r.avalon?.leaderSeat),'只有当前队长或法官可以挑选队员');
   const reqSize=AVALON_QUEST_TABLE[r.size]?.[r.avalon!.currentRound-1]?.squadSize||2;
   const squad=Array.isArray(b.squad)?b.squad.map(String):[];
   insist(squad.length===reqSize,'本轮任务必须挑选 '+reqSize+' 名队员出勤');
   for(const pid of squad)insist(r.players.some(p=>p.id===pid),'出勤队员不存在');
   insist(new Set(squad).size===reqSize,'队员不能重复挑选');
   r.avalon!.nominatedSquad=squad;r.avalon!.teamVotes={};r.avalon!.teamVotesRevealed=false;
   move(r,'avalonVoteTeam');
   log(r,'队长提议出勤名单：'+squad.map((id:string)=>getPlayer(r,id).seat+'号').join('、')+'。请全员在手机或大屏上表决！');
   return;
  }
  if(act==='avalonVoteTeam'){
   insist(me&&r.phase==='avalonVoteTeam','现在不是全员组队表决阶段');
   insist(typeof b.approve==='boolean','请选择赞成或反对');
   r.avalon!.teamVotes[me.id]=b.approve;
   if(Object.keys(r.avalon!.teamVotes).length>=r.players.length){
    const approves=Object.values(r.avalon!.teamVotes).filter(Boolean).length;
    const rejects=r.players.length-approves;
    r.avalon!.teamVotesRevealed=true;
    log(r,'组队表决结果：'+approves+' 票赞成，'+rejects+' 票反对。');
    if(approves>r.players.length/2){
     r.avalon!.voteTracker=0;r.avalon!.missionVotes=[];r.avalon!.missionSubmissions={};
     move(r,'avalonVoteMission');
     log(r,'组队通过！请出勤队员拿出手机或刷 NFC 白卡，秘密执行任务！');
    }else{
     r.avalon!.voteTracker++;
     if(r.avalon!.voteTracker>=5){
      r.winner='evil';move(r,'ended');
      r.avalon!.winnerReason='组队连续 5 次被否决！邪恶阵营直接获胜！';
      log(r,r.avalon!.winnerReason);
     }else{
      r.avalon!.leaderSeat=(r.avalon!.leaderSeat%r.size)+1;
      move(r,'avalonNominate');
      log(r,'组队被否决！队长移交给 '+r.avalon!.leaderSeat+' 号，重新选人。当前否决计数: '+r.avalon!.voteTracker+'/5。');
     }
    }
   }
   r.epoch++;return;
  }
  if(act==='avalonVoteMission'){
   insist(me&&r.phase==='avalonVoteMission','现在不是出勤执行阶段');
   insist(r.avalon!.nominatedSquad.includes(me.id),'只有被选中的出勤队员能执行任务');
   insist(!r.avalon!.missionSubmissions[me.id],'你已经提交过任务卡');
   const goodPlayer=isGood(me.role as AvalonRole);
   const success=Boolean(b.success);
   if(goodPlayer)insist(success===true,'好人忠臣必须出【成功】牌');
   r.avalon!.missionSubmissions[me.id]=true;
   r.avalon!.missionVotes.push(success?'success':'fail');
   if(Object.keys(r.avalon!.missionSubmissions).length>=r.avalon!.nominatedSquad.length){
    for(let i=r.avalon!.missionVotes.length-1;i>0;i--){
     const j=Math.floor(Math.random()*(i+1));
     [r.avalon!.missionVotes[i],r.avalon!.missionVotes[j]]=[r.avalon!.missionVotes[j],r.avalon!.missionVotes[i]];
    }
    const fails=r.avalon!.missionVotes.filter(v=>v==='fail').length;
    r.avalon!.missionFails[r.avalon!.currentRound-1]=fails;
    const reqFails=AVALON_QUEST_TABLE[r.size]?.[r.avalon!.currentRound-1]?.failsRequired||1;
    const isFail=fails>=reqFails;
    r.avalon!.missionHistory[r.avalon!.currentRound-1]=isFail?'fail':'success';
    log(r,'第 '+r.avalon!.currentRound+' 轮任务公布：'+(r.avalon!.nominatedSquad.length-fails)+' 票成功，'+fails+' 票失败！任务判定：'+(isFail?'【任务失败】':'【任务成功】')+'！');
    const evilPoints=r.avalon!.missionHistory.filter(h=>h==='fail').length;
    const goodPoints=r.avalon!.missionHistory.filter(h=>h==='success').length;
    if(evilPoints>=3){
     r.winner='evil';move(r,'ended');
     r.avalon!.winnerReason='邪恶阵营成功破坏了 3 个任务，赢得胜利！';
     log(r,r.avalon!.winnerReason);
    }else if(goodPoints>=3){
     move(r,'avalonAssassinate');
     log(r,'正义阵营率先完成 3 个任务！请刺客睁眼，秘密挑选刺杀目标！');
    }else{
     r.avalon!.currentRound++;
     r.avalon!.leaderSeat=(r.avalon!.leaderSeat%r.size)+1;
     move(r,'avalonNominate');
     log(r,'进入第 '+r.avalon!.currentRound+' 轮任务！请 '+r.avalon!.leaderSeat+' 号队长挑选出勤队员。');
    }
   }
   r.epoch++;return;
  }
  if(act==='avalonAssassinate'){
   insist(r.phase==='avalonAssassinate','现在不是刺杀梅林阶段');
   insist(host||(me&&(me.role==='assassin'||me.role==='morgana')),'只有刺客或法官可以执行刺杀');
   const target=getPlayer(r,String(b.target||''));
   if(target.role==='merlin'){
    r.winner='evil';
    r.avalon!.winnerReason='刺客成功刺杀梅林（'+target.seat+'号 '+target.name+'）！邪恶阵营绝杀获胜！';
    log(r,r.avalon!.winnerReason);
   }else{
    r.winner='good';
    r.avalon!.winnerReason='刺客刺杀了 '+target.seat+'号（不是梅林）！梅林成功掩护隐藏，正义阵营赢得最终胜利！';
    log(r,r.avalon!.winnerReason);
   }
   r.avalon!.assassinTarget=target.id;
   move(r,'ended');return;
  }
 }
"""

# Insert avalon_actions before 'if(act==='ready')'
content = content.replace(" if(act==='ready'){", avalon_actions + " if(act==='ready'){")

# 6. Update 'deal' to handle Avalon
old_deal = "const roles=configDeck(setup(r));insist(roles.length===r.size,'角色数量与人数不符，请重新配置');"
new_deal = """const roles = r.gameType === 'avalon' ? defaultAvalonDeck(r.size) : configDeck(setup(r));
  insist(roles.length===r.size,'角色数量与人数不符，请重新配置');"""
content = content.replace(old_deal, new_deal)

# 7. Update 'advance' case 'deal' to branch for Avalon
old_advance_deal = "case 'deal':insist(r.players.every(p=>p.ack),'请等待每个人确认身份');night(r);return;"
new_advance_deal = """case 'deal':insist(r.players.every(p=>p.ack),'请等待每个人确认身份');
    if(r.gameType==='avalon'){
      move(r,'avalonNominate');
      log(r,'阿瓦隆第 1 轮任务开始！请 '+r.avalon!.leaderSeat+' 号队长挑选出勤队员。');
      return;
    }
    night(r);return;"""
content = content.replace(old_advance_deal, new_advance_deal)

# 8. Update viewRoom for member cardNo, cardUid, avalon state & vision
old_member_map = "const members=r.players.map(p=>({id:p.id,seat:p.seat,name:p.name,ready:p.ready,ack:p.ack,alive:p.alive,idiotRevealed:!!p.idiotRevealed,exploded:!!p.exploded,...((host||r.phase==='ended'||p.idiotRevealed||p.exploded)?{role:p.role}:{})}));"
new_member_map = "const members=r.players.map(p=>({id:p.id,seat:p.seat,name:p.name,ready:p.ready,ack:p.ack,alive:p.alive,idiotRevealed:!!p.idiotRevealed,exploded:!!p.exploded,cardNo:p.cardNo,cardUid:p.cardUid,...((host||r.phase==='ended'||p.idiotRevealed||p.exploded)?{role:p.role}:{})}));"
content = content.replace(old_member_map, new_member_map)

# Update base in viewRoom
old_base_me = "me:me?{id:me.id,seat:me.seat,name:me.name,role:me.role,ready:me.ready,ack:me.ack,alive:me.alive,idiotRevealed:!!me.idiotRevealed,checks:me.checks}:null,"
new_base_me = """me:me?{
    id:me.id,seat:me.seat,name:me.name,role:me.role,ready:me.ready,ack:me.ack,alive:me.alive,
    idiotRevealed:!!me.idiotRevealed,checks:me.checks,cardNo:me.cardNo,cardUid:me.cardUid,
    vision:(r.gameType==='avalon'&&me.role)?resolveVision(me as any,r.players as any):null
  }:null,gameType:r.gameType||'werewolf',
  avalon:r.gameType==='avalon'&&r.avalon?{
    currentRound:r.avalon.currentRound,
    missionHistory:r.avalon.missionHistory,
    missionFails:r.avalon.missionFails,
    voteTracker:r.avalon.voteTracker,
    leaderSeat:r.avalon.leaderSeat,
    nominatedSquad:r.avalon.nominatedSquad,
    teamVotes:r.avalon.teamVotesRevealed?r.avalon.teamVotes:{},
    teamVotesRevealed:r.avalon.teamVotesRevealed,
    teamVoteCount:Object.keys(r.avalon.teamVotes).length,
    missionSubmissionsCount:Object.keys(r.avalon.missionSubmissions).length,
    missionSquadSize:AVALON_QUEST_TABLE[r.size]?.[r.avalon.currentRound-1]?.squadSize||2,
    failsRequired:AVALON_QUEST_TABLE[r.size]?.[r.avalon.currentRound-1]?.failsRequired||1,
    myTeamVote:me?r.avalon.teamVotes[me.id]:undefined,
    hasSubmittedMission:me?!!r.avalon.missionSubmissions[me.id]:false,
    isNominated:me?r.avalon.nominatedSquad.includes(me.id):false,
    isLeader:me?me.seat===r.avalon.leaderSeat:false,
    winnerReason:r.avalon.winnerReason
  }:null,"""
content = content.replace(old_base_me, new_base_me)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated lib/game.ts successfully")
