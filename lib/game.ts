import {defaultAvalonDeck,resolveVision,initialAvalonState,AVALON_QUEST_TABLE,isEvil,isGood,AVALON_ROLE_NAMES,type AvalonRole,type AvalonState} from './avalon';
import {configDeck,legacyConfig,resolveConfig,recommendedConfig,selfSaveAllowed,type GameConfig} from './rules';
export type Election={choices:Record<string,boolean>;candidates:string[];withdrawn:string[];runoff:string[];votes:Record<string,string>;round:number;done:boolean;interrupted?:boolean;explosions?:number};
export type Player={id:string;seat:number;name:string;key:string;ready:boolean;ack:boolean;role:string;alive:boolean;idiotRevealed?:boolean;exploded?:boolean;checks:{day:number;seat:number;result:string}[];cardNo?:number;cardUid?:string};
export type Room={id:string;offlineVote?:boolean;villagerBluffs?:Record<string,string>;hostName:string;hostKey:string;size:number;setup?:GameConfig;lastGuard?:string;sheriffId?:string;election?:Election;badgeFrom?:string;afterBadge?:string;speechOrder?:string[];seatSwaps?:{from:string;to:string}[];voice:string;phase:string;epoch:number;day:number;players:Player[];night:{wolves:Record<string,string>;kill:string;seerDone:boolean;guardDone?:boolean;guardTarget?:string;witch:null|{kind:string;target:string}};medicine:{heal:boolean;poison:boolean};votes:Record<string,string>;runoff:string[];voteRound:number;speaker:number;deadline:number;hunter:string;afterHunter:string;winner:string;message:string;logs:{day:number;text:string}[];expires:number;gameType?:'werewolf'|'avalon';avalon?:AvalonState;voiceMasterId?:string;voiceMasterName?:string;pairingCode?:string;nightDuration?:number};
export function initialRoom(id:string,hostKey:string,name:string,size:number,voice:string,input?:any,gameType:'werewolf'|'avalon'='werewolf'):Room{
  const isAvalon = gameType === 'avalon' || (input && input.gameType === 'avalon');
  const gType = isAvalon ? 'avalon' : 'werewolf';
  const roomSetup = isAvalon ? undefined : resolveConfig(size, input);
  return {
    id,hostKey,hostName:name,size,setup:roomSetup,lastGuard:'',voice,phase:'lobby',epoch:0,day:0,
    players:[],night:{wolves:{},kill:'',seerDone:false,guardDone:false,guardTarget:'',witch:null},
    medicine:{heal:true,poison:true},votes:{},runoff:[],voteRound:0,speaker:0,deadline:0,
    hunter:'',afterHunter:'',winner:'',message:isAvalon?'阿瓦隆房间已创建，支持 5–10 人及 20 张 NFC/白卡切卡。':'等朋友们入座，准备好后由法官发身份。',
    logs:[],expires:Date.now()+86400000,gameType:gType,avalon:isAvalon?initialAvalonState(size):undefined,
    voiceMasterId:hostKey,voiceMasterName:name,pairingCode:id.slice(-4).toUpperCase(),nightDuration:12,offlineVote:false,villagerBluffs:{}
  };
}
export class RoomError extends Error {}
export function insist(ok:unknown,msg:string):asserts ok{if(!ok)throw new RoomError(msg);}
function log(r:Room,text:string){r.message=text;r.logs.push({day:r.day,text});r.logs=r.logs.slice(-100);}
function move(r:Room,p:string){r.phase=p;r.epoch++;r.deadline=0;}
function alive(r:Room){return r.players.filter(p=>p.alive);}
function setup(r:Room):GameConfig{
 if(r.setup)return {...r.setup,sheriff:r.setup.sheriff||false,sheriffExplosion:r.setup.sheriffExplosion||'single'};
 const validSize=Math.max(6,Math.min(12,r.size));
 return r.gameType==='avalon'?recommendedConfig(validSize):legacyConfig(r.size);
}
function voters(r:Room){return alive(r).filter(p=>!p.idiotRevealed&&!(r.voteRound===2&&r.runoff.includes(p.id)));}
function election(r:Room){return r.election??= {choices:{},candidates:[],withdrawn:[],runoff:[],votes:{},round:1,done:false};}
function candidates(r:Room){const e=election(r);return e.candidates.filter(id=>getPlayer(r,id).alive&&!e.withdrawn.includes(id)&&(!e.runoff.length||e.runoff.includes(id)));}
function electionVoters(r:Room){return alive(r).filter(p=>!election(r).choices[p.id]&&!p.idiotRevealed);}
function speakers(r:Room){
 if(r.phase==='sheriffSpeech')return candidates(r).map(id=>getPlayer(r,id));
 if(r.phase==='runoffSpeech')return r.runoff.map(id=>getPlayer(r,id)).filter(p=>p.alive);
 if(r.speechOrder?.length)return r.speechOrder.map(id=>getPlayer(r,id)).filter(p=>p.alive);
 return alive(r);
}
function getPlayer(r:Room,id:string){const p=r.players.find(p=>p.id===id);insist(p,'玩家不存在');return p;}
function liveTarget(r:Room,id:string,allowPass=true){if(allowPass&&id==='pass')return null;const p=getPlayer(r,id);insist(p.alive,'只能选择存活玩家');return p;}
function tally(votes:Record<string,string>,weight:(voter:string)=>number=()=>1){const counts:Record<string,number>={};for(const [voter,id] of Object.entries(votes)){if(id&&id!=='pass')counts[id]=(counts[id]||0)+weight(voter);}const max=Math.max(0,...Object.values(counts));return {counts,leaders:Object.keys(counts).filter(id=>counts[id]===max)};}
function winner(r:Room){const a=alive(r),wolves=a.filter(p=>p.role==='wolf').length;const wolfWins=setup(r).victory==='edge'?(!a.some(p=>p.role==='villager')||!a.some(p=>p.role!=='wolf'&&p.role!=='villager')):wolves>=a.length-wolves;const result=wolves===0?'好人':wolfWins?'狼人':'';if(result){r.winner=result;move(r,'ended');log(r,result+'阵营获胜，本局身份已揭晓。');return true;}return false;}
function night(r:Room){r.day++;r.night={wolves:{},kill:'',seerDone:false,guardDone:false,guardTarget:'',witch:null};r.votes={};r.runoff=[];r.voteRound=0;r.hunter='';const firstPhase=setup(r).roles.guard?'guard':'wolves';move(r,firstPhase);r.deadline=Date.now()+(r.nightDuration||12)*1000;log(r,'第 '+r.day+' 夜开始，纯黑夜视模式已开启。每阶段固定倒计时 '+(r.nightDuration||12)+' 秒，防秒过抿身份。');}
function resume(r:Room,after:string){
 if(winner(r))return;
 const sheriff=r.sheriffId?r.players.find(p=>p.id===r.sheriffId):null;
 if(sheriff&&(!sheriff.alive||sheriff.idiotRevealed)){
  r.badgeFrom=sheriff.id;r.afterBadge=after;r.sheriffId='';move(r,'badge');log(r,sheriff.seat+' 号请移交或撕毁警徽。');return;
 }
 if(after==='speech'&&sheriff?.alive){move(r,'order');log(r,'请警长决定本轮发言顺序。');return;}
 move(r,after);if(after==='speech'){r.speechOrder=alive(r).map(p=>p.id);beginSpeech(r);}
}
function afterDeath(r:Room,ids:string[],poisonId:string,after:string){for(const id of ids)getPlayer(r,id).alive=false;const h=ids.map(id=>getPlayer(r,id)).find(p=>p.role==='hunter'&&p.id!==poisonId);if(h){r.hunter=h.id;r.afterHunter=after;move(r,'hunter');log(r,h.seat+' 号猎人可以开枪。');}else resume(r,after);}
function beginSpeech(r:Room){r.speaker=0;r.deadline=Date.now()+90000;}
function finishElection(r:Room,id:string){election(r).done=true;r.sheriffId=id;move(r,'dawn');log(r,id?getPlayer(r,id).seat+' 号当选警长。请法官公布昨夜结果。':'本局没有警长。请法官公布昨夜结果。');}
function settleDawn(r:Room,after='speech'){
 const poison=r.night.witch?.kind==='poison'?r.night.witch.target:'';
 const saved=r.night.witch?.kind==='heal',guarded=!!r.night.kill&&r.night.guardTarget===r.night.kill,kill=saved===guarded?r.night.kill:'';
 const deaths=[...new Set([kill,poison].filter(id=>id&&getPlayer(r,id).alive))];
 log(r,deaths.length?'昨夜出局：'+deaths.map(id=>getPlayer(r,id).seat+' 号').join('、')+'。':'昨夜是平安夜。');afterDeath(r,deaths,poison,after);
}
function cancelSwaps(r:Room,id:string){r.seatSwaps=(r.seatSwaps||[]).filter(s=>s.from!==id&&s.to!==id);}
function mutateCore(r:Room,key:string,b:Record<string,any>){
 const host=key===r.hostKey,me=r.players.find(p=>p.key===key);const act=b.action;
 if(act==='join'){insist(!host&&!me,'你已经在房间中');insist(r.phase==='lobby','本局已开始，不能中途入座');insist(r.players.length<r.size,'座位已满');const name=String(b.name||'').trim();insist(name.length>0&&name.length<=16,'昵称需为 1–16 个字');insist(!r.players.some(p=>p.name===name),'昵称已有人使用，换一个试试');let seat=1;if(b.seat!==undefined&&b.seat!==0){insist(Number.isInteger(b.seat)&&b.seat>=1&&b.seat<=r.size,'座位号码无效');seat=b.seat;insist(!r.players.some(p=>p.seat===seat),'座位已被其他玩家占用，请重新选择');}else while(r.players.some(p=>p.seat===seat))seat++;r.players.push({id:b.newId,seat,name,key,ready:false,ack:false,role:'',alive:true,checks:[]});r.players.sort((a,b)=>a.seat-b.seat);return;}
 insist(host||me,'请先入座');
 insist(b.epoch===r.epoch,'流程已更新，请确认当前阶段后重试');

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
  
  if(act==='toggleOfflineVote'){
    insist(host,'只有法官可以切换线下举牌表决模式');
    r.offlineVote = !r.offlineVote;
    r.epoch++;
    log(r, r.offlineVote ? '已开启【线下举牌表决模式】：队长线下分发宝剑卡(#14~#18)，桌面亮票后队长/法官一键录入！' : '已切换为【线上手机表决模式】：全员在手机上点击赞成/反对。');
    return;
  }
  if(act==='avalonOfflineResolve'){
    insist((host || (me && me.seat === r.avalon?.leaderSeat)) && r.phase==='avalonVoteTeam','只有队长或法官可以录入线下表决结果');
    const passed = Boolean(b.passed);
    if(passed){
      r.avalon!.voteTracker=0;r.avalon!.missionVotes=[];r.avalon!.missionSubmissions={};
      move(r,'avalonVoteMission');
      log(r,'线下举牌表决【通过】！请出勤队员拿出手机或刷 NFC 宝剑白卡，秘密执行任务！');
    }else{
      r.avalon!.voteTracker++;
      if(r.avalon!.voteTracker>=5){
        r.winner='evil';move(r,'ended');
        r.avalon!.winnerReason='线下组队连续 5 次被否决！邪恶阵营直接获胜！';
        log(r,r.avalon!.winnerReason);
      }else{
        r.avalon!.leaderSeat=(r.avalon!.leaderSeat%r.size)+1;
        move(r,'avalonNominate');
        log(r,'线下组队被否决！队长移交给 '+r.avalon!.leaderSeat+' 号，重新选人。当前否决计数: '+r.avalon!.voteTracker+'/5。');
      }
    }
    r.epoch++;return;
  }
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
   let success=Boolean(b.success);
   if(goodPlayer){ success=true; }
   r.avalon!.missionSubmissions[me.id]=true;
   r.avalon!.missionVotes.push(success?'success':'fail');
   if(Object.keys(r.avalon!.missionSubmissions).length>=r.avalon!.nominatedSquad.length){
    for(let i=r.avalon!.missionVotes.length-1;i>0;i--){
     const j=Math.floor(Math.random()*(i+1));
     [r.avalon!.missionVotes[i],r.avalon!.missionVotes[j]]=[r.avalon!.missionVotes[j],r.avalon!.missionVotes[i]];
    }
    const fails=r.avalon!.missionVotes.filter(v=>v==='fail').length;
    const successes=r.avalon!.nominatedSquad.length-fails;
    r.avalon!.missionFails[r.avalon!.currentRound-1]=fails;
    const reqFails=AVALON_QUEST_TABLE[r.size]?.[r.avalon!.currentRound-1]?.failsRequired||1;
    const isFail=fails>=reqFails;
    r.avalon!.missionHistory[r.avalon!.currentRound-1]=isFail?'fail':'success';
    r.avalon!.lastMissionSummary=successes+' 成功 / '+fails+' 破坏'+(reqFails>1?' (第4轮需2破坏)':'')+' -> '+(isFail?'任务失败':'任务成功');
    log(r,'第 '+r.avalon!.currentRound+' 轮任务公布：'+successes+' 票成功，'+fails+' 票破坏！判定：【'+(isFail?'任务失败':'任务成功')+'】'+(reqFails>1?'（需 '+reqFails+' 张破坏牌）':'')+'！');
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
  
  if(act==='avalonStepReveal'){
    insist(host,'只有法官可以推进逐张揭晓');
    insist(r.phase==='avalonReveal','现在不是开牌揭晓阶段');
    const total = r.avalon!.cardRevealOrder.length;
    if(r.avalon!.revealingIndex < total - 1){
      r.avalon!.revealingIndex++;
      const currentCard = r.avalon!.cardRevealOrder[r.avalon!.revealingIndex];
      log(r, '第 ' + (r.avalon!.revealingIndex + 1) + ' 张牌揭晓：' + (currentCard === 'success' ? '🔵 成功' : '🔴 破坏！'));
    } else {
      // 揭晓完毕，结算本轮胜负
      const fails = r.avalon!.cardRevealOrder.filter(v => v === 'fail').length;
      const successes = total - fails;
      const curRound = r.avalon!.currentRound;
      r.avalon!.missionFails[curRound - 1] = fails;
      const reqFails = AVALON_QUEST_TABLE[r.size]?.[curRound - 1]?.failsRequired || 1;
      const isFail = fails >= reqFails;
      r.avalon!.missionHistory[curRound - 1] = isFail ? 'fail' : 'success';
      r.avalon!.lastMissionSummary = successes + ' 成功 / ' + fails + ' 破坏' + (reqFails > 1 ? ' (第4轮需2破坏)' : '') + ' -> ' + (isFail ? '任务失败' : '任务成功');
      
      // 记录到矩阵历史
      r.avalon!.matrixRecords = r.avalon!.matrixRecords || [];
      r.avalon!.matrixRecords.push({
        round: curRound,
        squadSeats: r.avalon!.nominatedSquad.map(id => getPlayer(r, id).seat),
        leaderSeat: r.avalon!.leaderSeat,
        hammer: r.avalon!.voteTracker + 1,
        teamVotes: Object.entries(r.avalon!.teamVotes).map(([pid, app]) => ({
          seat: getPlayer(r, pid).seat,
          name: getPlayer(r, pid).name,
          approve: app
        })),
        successCount: successes,
        failCount: fails,
        failsRequired: reqFails,
        result: isFail ? 'fail' : 'success',
        cardRevealOrder: [...r.avalon!.cardRevealOrder]
      });

      log(r, '第 ' + curRound + ' 轮最终判定：【' + (isFail ? '任务失败' : '任务成功') + '】（' + successes + ' 成功 / ' + fails + ' 破坏）！');

      const evilPoints = r.avalon!.missionHistory.filter(h => h === 'fail').length;
      const goodPoints = r.avalon!.missionHistory.filter(h => h === 'success').length;

      if(evilPoints >= 3){
        r.winner = 'evil'; move(r, 'ended');
        r.avalon!.winnerReason = '邪恶阵营成功破坏了 3 个任务，赢得胜利！';
        log(r, r.avalon!.winnerReason);
      } else if(goodPoints >= 3){
        move(r, 'avalonAssassinate');
        log(r, '正义阵营率先完成 3 个任务！请刺客睁眼，秘密挑选刺杀目标！');
      } else {
        // 检查是否触发湖中仙女 (第 2、3、4 轮结算后，且人数 >= 7，且有湖中仙女持卡人)
        const ladyActive = r.size >= 7 && [2, 3, 4].includes(curRound) && r.avalon!.ladyHolderSeat;
        if(ladyActive){
          move(r, 'avalonLady');
          r.avalon!.ladyTargetSeat = undefined;
          r.avalon!.ladyResultAlignment = undefined;
          log(r, '第 ' + curRound + ' 轮任务结束，触发【🧚 湖中仙女查验】！请 ' + r.avalon!.ladyHolderSeat + ' 号持卡玩家将实体仙女卡递给被验者，并在手机选择查验目标！');
        } else {
          r.avalon!.currentRound++;
          r.avalon!.leaderSeat = (r.avalon!.leaderSeat % r.size) + 1;
          move(r, 'avalonNominate');
          log(r, '进入第 ' + r.avalon!.currentRound + ' 轮任务！请 ' + r.avalon!.leaderSeat + ' 号队长挑选出勤队员。');
        }
      }
    }
    r.epoch++; return;
  }
  if(act==='avalonLadyCheck'){
    insist(r.phase==='avalonLady','现在不是湖中仙女查验阶段');
    const holderSeat = r.avalon!.ladyHolderSeat;
    insist(host || (me && me.seat === holderSeat), '只有当前持有湖中仙女卡（#' + holderSeat + '号）的玩家或法官可以验人');
    const targetSeat = Number(b.targetSeat);
    insist(Number.isInteger(targetSeat) && targetSeat >= 1 && targetSeat <= r.size, '目标座位无效');
    insist(targetSeat !== holderSeat, '湖中仙女不能查验自己');
    r.avalon!.ladyCheckedSeats = r.avalon!.ladyCheckedSeats || [];
    insist(!r.avalon!.ladyCheckedSeats.includes(targetSeat), '该玩家之前已被仙女查验过，不能重复查验');
    
    const targetPlayer = r.players.find(p => p.seat === targetSeat);
    insist(targetPlayer, '目标玩家不存在');
    const targetAlignment = isEvil(targetPlayer.role as AvalonRole) ? 'evil' : 'good';
    
    r.avalon!.ladyTargetSeat = targetSeat;
    r.avalon!.ladyResultAlignment = targetAlignment;
    r.avalon!.ladyCheckedSeats.push(targetSeat);
    r.avalon!.ladyHistory = r.avalon!.ladyHistory || [];
    r.avalon!.ladyHistory.push({
      round: r.avalon!.currentRound,
      fromSeat: holderSeat!,
      toSeat: targetSeat,
      targetAlignment
    });

    log(r, holderSeat + ' 号玩家使用湖中仙女查验了 ' + targetSeat + ' 号玩家的真实阵营！实体仙女卡移交给 ' + targetSeat + ' 号！');
    // 仙女所有权转移给被查验者
    r.avalon!.ladyHolderSeat = targetSeat;

    // 查验完毕，推进到下一轮选人
    r.avalon!.currentRound++;
    r.avalon!.leaderSeat = (r.avalon!.leaderSeat % r.size) + 1;
    move(r, 'avalonNominate');
    log(r, '进入第 ' + r.avalon!.currentRound + ' 轮任务！请 ' + r.avalon!.leaderSeat + ' 号队长挑选出勤队员。');
    r.epoch++; return;
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
 
  if(act==='villagerBluff'){
    insist(me&&me.alive,'只有存活玩家可以操作夜间伪装');
    r.villagerBluffs = r.villagerBluffs || {};
    r.villagerBluffs[me.id] = String(b.target||'pass');
    r.epoch++;return;
  }
  if(act==='ready'){insist(me&&r.phase==='lobby','现在不能准备');me.ready=!!b.ready;return;}
 if(act==='configure'){insist(host&&r.phase==='lobby','只有法官能在发牌前修改玩法');r.setup=resolveConfig(r.size,b.setup);r.players.forEach(p=>p.ready=false);r.epoch++;log(r,'法官更新了本桌玩法，请查看配置并重新准备。');return;}
 if(act==='kick'){insist(host&&r.phase==='lobby','只能在开始前移除玩家');cancelSwaps(r,b.target);r.players=r.players.filter(p=>p.id!==b.target);r.epoch++;return;}
 if(act==='leave'){insist(me&&r.phase==='lobby','开始后不能离开席位');cancelSwaps(r,me.id);r.players=r.players.filter(p=>p.id!==me.id);r.epoch++;return;}
 if(act==='seatMove'){insist(me&&r.phase==='lobby','只能在发牌前换座');insist(Number.isInteger(b.seat)&&b.seat>=1&&b.seat<=r.size,'座位号码无效');insist(!r.players.some(p=>p.seat===b.seat),'该座位已有玩家，可申请互换');cancelSwaps(r,me.id);me.seat=b.seat;me.ready=false;r.players.sort((a,b)=>a.seat-b.seat);r.epoch++;log(r,me.name+' 移到 '+me.seat+' 号，请重新准备。');return;}
 if(act==='seatSwapRequest'){insist(me&&r.phase==='lobby','只能在发牌前申请换位');const target=getPlayer(r,b.target);insist(target.id!==me.id,'不能和自己换位');const pending=r.seatSwaps||[];insist(!pending.some(s=>[s.from,s.to].some(id=>id===me.id||id===target.id)),'有待处理的换位申请，请先取消或处理');r.seatSwaps=[...pending,{from:me.id,to:target.id}];me.ready=false;target.ready=false;r.epoch++;return;}
 if(act==='seatSwapCancel'){insist(me&&r.phase==='lobby','只能在发牌前取消换位');const swap=(r.seatSwaps||[]).find(s=>s.from===me.id);insist(swap,'没有待取消的申请');cancelSwaps(r,me.id);r.epoch++;return;}
 if(act==='seatSwapRespond'){insist(me&&r.phase==='lobby','只能在发牌前处理换位');insist(typeof b.accept==='boolean','请选择接受或拒绝');const swap=(r.seatSwaps||[]).find(s=>s.to===me.id&&s.from===b.from);insist(swap,'换位申请已失效');const from=getPlayer(r,swap.from);if(b.accept){[from.seat,me.seat]=[me.seat,from.seat];from.ready=false;me.ready=false;r.players.sort((a,b)=>a.seat-b.seat);log(r,from.name+' 与 '+me.name+' 互换座位，请双方重新准备。');}cancelSwaps(r,me.id);r.epoch++;return;}
 if(act==='deal'){insist(host&&r.phase==='lobby','现在不能发身份');insist(!(r.seatSwaps||[]).length,'请先处理所有换位申请');insist(r.players.length===r.size&&r.players.every(p=>p.ready),'等待所有玩家入座并准备');const roles = r.gameType === 'avalon' ? defaultAvalonDeck(r.size) : configDeck(setup(r));
  insist(roles.length===r.size,'角色数量与人数不符，请重新配置');for(let i=roles.length-1;i>0;i--){let x:number;const limit=Math.floor(4294967296/(i+1))*(i+1);do{x=crypto.getRandomValues(new Uint32Array(1))[0];}while(x>=limit);const j=x%(i+1);[roles[i],roles[j]]=[roles[j],roles[i]];}r.players.forEach((p,i)=>{p.role=roles[i];p.ack=false;p.idiotRevealed=false;p.exploded=false;});move(r,'deal');log(r,'身份已发放，请每个人私下查看并确认。');return;}
 if(act==='ack'){insist(me&&r.phase==='deal','现在不能确认身份');me.ack=true;return;}
 if(act==='rematch'){insist(host&&r.phase==='ended','结束后才能再来一局');const config=setup(r),next=initialRoom(r.id,r.hostKey,r.hostName,r.size,r.voice,config);next.setup=config;next.players=r.players.map(p=>({...p,role:'',ready:false,ack:false,alive:true,idiotRevealed:false,exploded:false,checks:[]}));next.epoch=r.epoch+1;Object.assign(r,next,{sheriffId:'',election:undefined,badgeFrom:'',afterBadge:'',speechOrder:[],seatSwaps:[]});return;}
 if(act==='sheriffSignup'){insist(me?.alive&&r.phase==='sheriffSignup','现在不能上警报名');insist(typeof b.run==='boolean','请选择上警或不上警');election(r).choices[me.id]=b.run;return;}
 if(act==='withdraw'){insist(me&&r.phase==='sheriffSpeech'&&election(r).round===1&&candidates(r).includes(me.id),'只有竞选者能在首轮发言阶段退水，PK 时不能退水');const list=speakers(r),current=list[r.speaker];election(r).withdrawn.push(me.id);const next=speakers(r);r.speaker=current?Math.max(0,next.findIndex(p=>p.id===current.id)):0;if(current?.id===me.id)r.speaker=Math.min(list.indexOf(current),Math.max(0,next.length-1));r.epoch++;r.deadline=Date.now()+90000;log(r,me.seat+' 号退出警长竞选，仍不能投警长票。');return;}
 if(act==='explode'){
  insist(me?.alive&&me.role==='wolf','只有存活狼人可以自爆');insist(['sheriffSpeech','order','speech','runoffSpeech'].includes(r.phase),'只能在白天发言阶段自爆，投票、夜间、猎人开枪阶段不可自爆');
  const onPolice=r.phase==='sheriffSpeech';me.alive=false;me.exploded=true;log(r,me.seat+' 号狼人自爆，立即停止本轮白天发言与投票。');
  if(onPolice){const e=election(r);e.explosions=(e.explosions||0)+1;e.interrupted=setup(r).sheriffExplosion==='double'&&e.explosions<2;e.done=!e.interrupted;e.votes={};e.runoff=[];e.round=1;r.sheriffId='';log(r,e.interrupted?'警长竞选暂停，下一天保留原上警名单继续竞选。':'警徽被吞掉，本局不再竞选警长。');settleDawn(r,'explosion');}
  else resume(r,'explosion');return;
 }
 if(act==='sheriffVote'){insist(me&&r.phase==='sheriffVote'&&electionVoters(r).some(p=>p.id===me.id),'只有最初未上警的玩家可以投警长票');const e=election(r);insist(!e.votes[me.id],'警长票已提交，不能修改');const target=String(b.target||'pass');insist(target==='pass'||candidates(r).includes(target),'只能投给本轮竞选者');e.votes[me.id]=target;return;}
 if(act==='badge'){insist(r.phase==='badge'&&(host||me?.id===r.badgeFrom),'只有原警长可以移交警徽');const target=String(b.target||'pass'),p=liveTarget(r,target);insist(!p||(!p.idiotRevealed&&p.id!==r.badgeFrom),'请选择尚未翻牌的存活玩家');r.sheriffId=p?.id||'';r.badgeFrom='';log(r,p?'警徽移交给 '+p.seat+' 号。':'警徽已撕毁，本局不再有警长。');resume(r,r.afterBadge||'speech');return;}
 if(act==='speechOrder'){insist(r.phase==='order'&&(host||me?.id===r.sheriffId),'只有警长可以决定发言顺序');insist(['ascending','descending'].includes(b.direction),'请选择顺时针或逆时针');const chief=getPlayer(r,r.sheriffId||''),list=alive(r).filter(p=>p.id!==chief.id);list.sort((a,c)=>{const distance=(p:Player)=>b.direction==='ascending'?(p.seat-chief.seat+r.size)%r.size:(chief.seat-p.seat+r.size)%r.size;return distance(a)-distance(c);});r.speechOrder=[...list.map(p=>p.id),chief.id];move(r,'speech');beginSpeech(r);log(r,'按'+(b.direction==='ascending'?'号码递增':'号码递减')+'方向发言，警长最后归票。');return;}
 if(act==='nightAction'){insist(me&&me.alive,'只有存活玩家可以行动');const target=String(b.target||'pass');
  if(r.phase==='guard'){insist(me.role==='guard'&&!r.night.guardDone,'现在无法守护');const p=liveTarget(r,target);insist(!p||p.id!==r.lastGuard,'不能连续两夜守护同一位玩家');r.night.guardTarget=p?.id||'';r.night.guardDone=true;return;}
  if(r.phase==='wolves'){insist(me.role==='wolf','现在不是你的行动阶段');liveTarget(r,target);r.night.wolves[me.id]=target;return;}
  if(r.phase==='seer'){insist(me.role==='seer'&&!r.night.seerDone,'现在无法查验');const p=liveTarget(r,target);insist(!p||p.id!==me.id,'请选择其他玩家');if(p)me.checks.push({day:r.day,seat:p.seat,result:p.role==='wolf'?'狼人':'好人'});r.night.seerDone=true;return;}
  if(r.phase==='witch'){insist(me.role==='witch'&&!r.night.witch,'现在无法用药');const kind=b.kind;insist(['pass','heal','poison'].includes(kind),'请选择用药方式');if(kind==='heal'){const selfSave=selfSaveAllowed(setup(r),r.day);insist(r.medicine.heal&&r.night.kill&&(r.night.kill!==me.id||selfSave),'没有可用的解药目标（请检查本桌自救规则）');r.night.witch={kind,target:r.night.kill};r.medicine.heal=false;}else if(kind==='poison'){insist(r.medicine.poison,'毒药已使用');const p=liveTarget(r,target,false);insist(p&&p.id!==me.id,'请选择其他玩家');r.night.witch={kind,target};r.medicine.poison=false;}else r.night.witch={kind:'pass',target:''};return;}
  throw new RoomError('现在不是夜间行动阶段');
 }
 if(act==='vote'){insist(me&&r.phase==='vote'&&voters(r).some(p=>p.id===me.id),'现在不能投票（已出局、白痴已翻牌或正在 PK 台上）');insist(!r.votes[me.id],'投票已提交，不能修改');const target=String(b.target||'pass'),p=liveTarget(r,target);insist(!p||!p.idiotRevealed,'已翻牌的白痴不能再次被放逐');insist(!r.runoff.length||target==='pass'||r.runoff.includes(target),'加投只能选择平票玩家');insist(target!==me.id,'不能投自己');r.votes[me.id]=target;return;}
 if(act==='shoot'){insist(r.phase==='hunter'&&(host||me?.id===r.hunter),'现在不能开枪');const target=String(b.target||'pass');const p=liveTarget(r,target);if(p){p.alive=false;log(r,getPlayer(r,r.hunter).seat+' 号猎人带走了 '+p.seat+' 号。');}else log(r,'猎人选择不开枪。');r.hunter='';resume(r,r.afterHunter);return;}
 if(act==='nextSpeaker'){insist(host&&['speech','sheriffSpeech','runoffSpeech'].includes(r.phase),'现在不能切换发言');const list=speakers(r);insist(r.speaker<list.length-1,'所有玩家已经发言，可以开始投票');r.speaker++;r.deadline=Date.now()+90000;r.epoch++;return;}
 if(act==='restartTimer'){insist(host&&['speech','sheriffSpeech','runoffSpeech'].includes(r.phase),'现在不能重置计时');r.deadline=Date.now()+90000;return;}
 if(act==='advance'){insist(host,'只有法官可以推进流程');
  switch(r.phase){
   case 'deal':insist(r.players.every(p=>p.ack),'请等待每个人确认身份');
    if(r.gameType==='avalon'){
      move(r,'avalonNominate');
      log(r,'阿瓦隆第 1 轮任务开始！请 '+r.avalon!.leaderSeat+' 号队长挑选出勤队员。');
      return;
    }
    night(r);return;
   case 'guard':r.lastGuard=r.night.guardTarget||'';move(r,'wolves');return;
   case 'wolves':{r.night.kill=tally(r.night.wolves).leaders.length===1?tally(r.night.wolves).leaders[0]:'';move(r,'seer');return;}
   case 'seer':move(r,'witch');return;
   case 'witch':if(setup(r).sheriff&&!election(r).done&&election(r).interrupted){election(r).interrupted=false;move(r,'sheriffSpeech');beginSpeech(r);log(r,'恢复警长竞选，保留原上警名单与退水记录，暂不公布昨夜死亡。');}else if(r.day===1&&setup(r).sheriff&&!election(r).done){move(r,'sheriffSignup');log(r,'首夜行动结束，先竞选警长，再公布昨夜结果。请选择上警或不上警。');}else move(r,'dawn');return;
   case 'sheriffSignup':{const e=election(r);e.candidates=alive(r).filter(p=>e.choices[p.id]).map(p=>p.id);e.withdrawn=[];e.runoff=[];e.votes={};e.round=1;if(!e.candidates.length){finishElection(r,'');return;}move(r,'sheriffSpeech');beginSpeech(r);log(r,'上警：'+e.candidates.map(id=>getPlayer(r,id).seat+' 号').join('、')+'。按座位顺序竞选发言，可退水。');return;}
   case 'sheriffSpeech':{const list=candidates(r);if(list.length<=1){finishElection(r,list[0]||'');return;}election(r).votes={};move(r,'sheriffVote');log(r,'请最初未上警的玩家投警长票；退水玩家不能投票。');return;}
   case 'sheriffVote':{const e=election(r),{counts,leaders}=tally(e.votes);log(r,'警长票结果：'+(Object.entries(counts).map(([id,n])=>getPlayer(r,id).seat+'号 '+n+'票').join('，')||'全部弃票')+'。');if(leaders.length>1&&e.round===1){e.runoff=leaders;e.round=2;e.votes={};move(r,'sheriffSpeech');beginSpeech(r);log(r,'警长竞选平票，请 PK 发言后加投一次。仍只有最初未上警者投票。');return;}finishElection(r,leaders.length===1?leaders[0]:'');return;}
   case 'dawn':settleDawn(r);return;
   case 'runoffSpeech':move(r,'vote');log(r,'PK 发言结束，请台下玩家加投。PK 台上的玩家不能投票。');return;
   case 'speech':r.votes={};r.runoff=[];r.voteRound=1;move(r,'vote');log(r,'请投票放逐一位玩家，或选择弃票。');return;
   case 'vote':{const {counts,leaders}=tally(r.votes,id=>id===r.sheriffId?1.5:1);const summary=Object.entries(counts).map(([id,n])=>getPlayer(r,id).seat+'号 '+n+'票').join('，');log(r,'投票结果：'+(summary||'全部弃票')+'。');
    if(leaders.length>1&&r.voteRound===1){r.runoff=leaders;r.voteRound=2;r.votes={};move(r,'runoffSpeech');beginSpeech(r);log(r,'平票：'+leaders.map(id=>getPlayer(r,id).seat+'号').join('、')+'。请先 PK 发言，再由台下玩家加投。');return;}
    if(leaders.length===1){const p=getPlayer(r,leaders[0]);if(p.role==='idiot'&&!p.idiotRevealed){p.idiotRevealed=true;log(r,p.seat+' 号白痴翻牌，继续存活并发言，但失去投票权，不能再被放逐。');resume(r,'dusk');return;}log(r,p.seat+' 号被放逐。');afterDeath(r,leaders,'','dusk');return;}
    move(r,'dusk');log(r,'本轮无人被放逐。');return;}
   case 'dusk':night(r);return;
   case 'explosion':night(r);return;
   default:throw new RoomError('现在不能推进流程');
  }
 }
 throw new RoomError('不支持此操作');
}
export function viewRoom(r:Room,key:string){
 const host=key===r.hostKey,me=r.players.find(p=>p.key===key),nightPhase=['guard','wolves','seer','witch','dawn'].includes(r.phase);
 const roleActive=me?.alive&&((r.phase==='guard'&&me.role==='guard')||(r.phase==='wolves'&&me.role==='wolf')||(r.phase==='seer'&&me.role==='seer')||(r.phase==='witch'&&me.role==='witch'));
 const members=r.players.map(p=>({id:p.id,seat:p.seat,name:p.name,ready:p.ready,ack:p.ack,alive:p.alive,idiotRevealed:!!p.idiotRevealed,exploded:!!p.exploded,cardNo:p.cardNo,cardUid:p.cardUid,...((host||r.phase==='ended'||p.idiotRevealed||p.exploded)?{role:p.role}:{})}));
 const e=r.election,eligible=voters(r),speaking=['speech','sheriffSpeech','runoffSpeech'].includes(r.phase),freeSeats=Array.from({length:r.size},(_,i)=>i+1).filter(n=>!r.players.some(p=>p.seat===n));
 const base={id:r.id,hostName:r.hostName,size:r.size,setup:setup(r),voice:r.voice,phase:nightPhase&&!host?'night':r.phase,epoch:r.epoch,day:r.day,players:members,host,member:!!me,me:me?{
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
    hammerCount:r.avalon.voteTracker+1,
    isFinalHammer:r.avalon.voteTracker>=4,
    lastMissionSummary:r.avalon.lastMissionSummary||'',
    myTeamVote:me?r.avalon.teamVotes[me.id]:undefined,
    hasSubmittedMission:me?!!r.avalon.missionSubmissions[me.id]:false,
    isNominated:me?r.avalon.nominatedSquad.includes(me.id):false,
    isLeader:me?me.seat===r.avalon.leaderSeat:false,
    winnerReason:r.avalon.winnerReason
  }:null,canJoin:r.phase==='lobby'&&r.players.length<r.size,message:r.message,logs:r.logs,winner:r.winner,expires:r.expires,runoff:r.runoff,voteRound:r.voteRound,voteTotal:eligible.length,canVote:!!me&&eligible.some(p=>p.id===me.id),voteCount:r.phase==='vote'?Object.keys(r.votes).length:0,myVote:me?r.votes[me.id]||'':'',speaker:speaking?speakers(r)[r.speaker]?.id:'',lastSpeaker:r.speaker>=speakers(r).length-1,deadline:r.deadline,hunter:r.hunter,
 sheriffId:r.sheriffId||'',badgeFrom:r.badgeFrom||'',speechOrder:r.phase==='speech'?speakers(r).map(p=>p.id):[],
 seatSwaps:(r.seatSwaps||[]).filter(s=>host||s.from===me?.id||s.to===me?.id),freeSeats,
 canExplode:!!me?.alive&&me.role==='wolf'&&['sheriffSpeech','order','speech','runoffSpeech'].includes(r.phase),
 sheriff:setup(r)?.sheriff?{candidates:r.phase==='sheriffSignup'?[]:e?.candidates||[],active:r.phase==='sheriffSignup'?[]:(e?candidates(r):[]),withdrawn:e?.withdrawn||[],round:e?.round||1,mySignup:me?e?.choices[me.id]??null:null,signupCount:host?Object.keys(e?.choices||{}).length:0,myVote:me?e?.votes[me.id]||'':'',canVote:r.phase==='sheriffVote'&&!!me&&electionVoters(r).some(p=>p.id===me.id),voteTotal:r.phase==='sheriffVote'?electionVoters(r).length:0,voteCount:r.phase==='sheriffVote'?Object.keys(e?.votes||{}).length:0}:null,
 guardLast:(host||me?.role==='guard')?r.lastGuard||'':'',canSelfSave:setup(r)?selfSaveAllowed(setup(r)!,r.day):false,
 wolfTeam:me?.role==='wolf'?r.players.filter(p=>p.role==='wolf').map(p=>({seat:p.seat,name:p.name,id:p.id})):[],
 action:roleActive?r.phase:'',submitted:!!(roleActive&&me&&(r.phase==='guard'?r.night.guardDone:r.phase==='wolves'?r.night.wolves[me.id]:r.phase==='seer'?r.night.seerDone:r.phase==='witch'?r.night.witch:false)),
 wolfVotes:(host||(me?.alive&&me.role==='wolf'&&r.phase==='wolves'))?r.night.wolves:{},
 victim:(host||(me?.alive&&me.role==='witch'&&r.phase==='witch'&&r.medicine.heal))?r.night.kill:'',
 medicine:(host||me?.role==='witch')?r.medicine:null,
 voiceMasterId:r.voiceMasterId||'',
 voiceMasterName:r.voiceMasterName||'',
 isVoiceMaster:host?(r.voiceMasterId===r.hostKey||!r.voiceMasterId):(me?r.voiceMasterId===me.key:false),
 pairingCode:r.pairingCode||r.id.slice(-4).toUpperCase(),
 nightDuration:r.nightDuration||12,
 nightRemaining:(nightPhase&&r.deadline)?Math.max(0,Math.ceil((r.deadline-Date.now())/1000)):0,
 hostNight:host?{...r.night,checks:r.players.find(p=>p.role==='seer')?.checks||[]}:null};
 if(!host&&!me)return {id:r.id,hostName:r.hostName,size:r.size,setup:setup(r),phase:'join',canJoin:r.phase==='lobby'&&r.players.length<r.size,count:r.players.length,freeSeats:r.phase==='lobby'?freeSeats:[],expires:r.expires};
 return base;
}

const isBot=(p:Player)=>p.key.startsWith('bot:');
function pick<T>(xs:T[]):T|undefined{return xs[Math.floor(Math.random()*xs.length)];}
/** One automatic action by an AI test player; returns true when something happened. */
function botStep(r:Room):boolean{
  const bots=r.players.filter(isBot);if(!bots.length)return false;
  const run=(p:Player,b:Record<string,any>)=>{try{mutateCore(r,p.key,{...b,epoch:r.epoch});return true;}catch{return false;}};
  if(r.phase==='deal'){for(const p of bots)if(!p.ack&&run(p,{action:'ack'}))return true;return false;}
  if(r.gameType==='avalon'&&r.avalon){
    const av=r.avalon,size=AVALON_QUEST_TABLE[r.size]?.[av.currentRound-1]?.squadSize||2;
    if(r.phase==='avalonNominate'){
      const leader=r.players.find(p=>p.seat===av.leaderSeat);
      if(leader&&isBot(leader)){const order=[...r.players].sort((a,c)=>((a.seat-leader.seat+r.size)%r.size)-((c.seat-leader.seat+r.size)%r.size));return run(leader,{action:'avalonNominate',squad:order.slice(0,size).map(p=>p.id)});}
      return false;
    }
    if(r.phase==='avalonVoteTeam'){for(const p of bots)if(av.teamVotes[p.id]===undefined){const evil=isEvil(p.role as AvalonRole),hasEvil=av.nominatedSquad.some(id=>isEvil((r.players.find(q=>q.id===id)?.role||'') as AvalonRole));return run(p,{action:'avalonVoteTeam',approve:evil?hasEvil:(av.voteTracker>=3||!hasEvil||Math.random()<0.6)});}return false;}
    if(r.phase==='avalonVoteMission'){for(const p of bots)if(av.nominatedSquad.includes(p.id)&&!av.missionSubmissions[p.id])return run(p,{action:'avalonVoteMission',success:!isEvil(p.role as AvalonRole)});return false;}
    if(r.phase==='avalonReveal'){
      // Auto step reveal in bots mode
      try{ mutateCore(r, r.hostKey, { action: 'avalonStepReveal', epoch: r.epoch }); return true; } catch{ return false; }
    }
    if(r.phase==='avalonLady'){
      const ladyPlayer = r.players.find(p => p.seat === av.ladyHolderSeat);
      if(ladyPlayer && (isBot(ladyPlayer) || true)){
        const candidates = r.players.filter(p => p.seat !== av.ladyHolderSeat && !(av.ladyCheckedSeats||[]).includes(p.seat));
        if(candidates.length){
          try{ mutateCore(r, ladyPlayer ? ladyPlayer.key : r.hostKey, { action: 'avalonLadyCheck', targetSeat: candidates[0].seat, epoch: r.epoch }); return true; } catch{ return false; }
        }
      }
      return false;
    }
    if(r.phase==='avalonAssassinate'){
      const killers=r.players.filter(p=>p.role==='assassin'||p.role==='morgana');
      if(killers.length&&killers.every(isBot)){const t=pick(r.players.filter(p=>isGood(p.role as AvalonRole)));if(t)return run(killers[0],{action:'avalonAssassinate',target:t.id});}
      return false;
    }
    return false;
  }
  const live=bots.filter(p=>p.alive);
  const others=(p:Player)=>r.players.filter(q=>q.alive&&q.id!==p.id);
  switch(r.phase){
    case 'guard':for(const p of live)if(p.role==='guard'&&!r.night.guardDone)return run(p,{action:'nightAction',target:'pass'});return false;
    case 'wolves':for(const p of live)if(p.role==='wolf'&&!r.night.wolves[p.id]){const humanWolfPick=Object.values(r.night.wolves)[0];const t=humanWolfPick||pick(others(p).filter(q=>q.role!=='wolf'))?.id||'pass';return run(p,{action:'nightAction',target:t});}return false;
    case 'seer':for(const p of live)if(p.role==='seer'&&!r.night.seerDone)return run(p,{action:'nightAction',target:pick(others(p))?.id||'pass'});return false;
    case 'witch':for(const p of live)if(p.role==='witch'&&!r.night.witch)return run(p,{action:'nightAction',kind:'pass',target:''});return false;
    case 'sheriffSignup':{const e=r.election;for(const p of live)if(e?.choices[p.id]===undefined)return run(p,{action:'sheriffSignup',run:false});return false;}
    case 'sheriffVote':{const e=r.election;for(const p of live)if(e&&!e.votes[p.id]&&run(p,{action:'sheriffVote',target:'pass'}))return true;return false;}
    case 'vote':for(const p of live)if(!r.votes[p.id]&&run(p,{action:'vote',target:'pass'}))return true;return false;
    case 'hunter':{const h=r.players.find(p=>p.id===r.hunter);if(h&&isBot(h))return run(h,{action:'shoot',target:'pass'});return false;}
    case 'badge':{const h=r.players.find(p=>p.id===r.badgeFrom);if(h&&isBot(h))return run(h,{action:'badge',target:'pass'});return false;}
    case 'order':{const h=r.players.find(p=>p.id===r.sheriffId);if(h&&isBot(h))return run(h,{action:'speechOrder',direction:'ascending'});return false;}
  }
  return false;
}
export function mutate(r:Room,key:string,b:Record<string,any>){
  const host=key===r.hostKey,act=b.action;
  if(act==='switchGame'){
    insist(host,'只有法官可以切换游戏');
    insist(b.epoch===r.epoch,'流程已更新，请确认当前阶段后重试');
    insist(r.phase==='lobby'||r.phase==='ended','只能在大厅或一局结束后切换游戏');
    const to:'werewolf'|'avalon'=b.gameType==='werewolf'?'werewolf':b.gameType==='avalon'?'avalon':(r.gameType==='avalon'?'werewolf':'avalon');
    const lo=to==='avalon'?5:6,hi=to==='avalon'?10:12;
    let size=Math.max(lo,Math.min(hi,Number(b.size)||r.size));
    const maxSeat=Math.max(0,...r.players.map(p=>p.seat));
    if(!b.size)size=Math.max(size,Math.min(hi,maxSeat));
    insist(r.players.every(p=>p.seat<=size),(to==='avalon'?'阿瓦隆':'狼人杀')+'最多 '+hi+' 人，请先移除超出座位的玩家');
    const next=initialRoom(r.id,r.hostKey,r.hostName,size,r.voice,undefined,to);
    next.players=r.players.map(p=>({...p,role:'',ready:isBot(p),ack:false,alive:true,idiotRevealed:false,exploded:false,checks:[]}));
    next.epoch=r.epoch+1;next.logs=r.logs;
    next.pairingCode=r.pairingCode||r.id.slice(-4).toUpperCase();
    next.voiceMasterId=r.voiceMasterId||r.hostKey;
    next.voiceMasterName=r.voiceMasterName||'法官';
    Object.assign(r,next,{sheriffId:'',election:undefined,badgeFrom:'',afterBadge:'',speechOrder:[],seatSwaps:[],winner:'',deadline:0,votes:{},runoff:[],hunter:'',afterHunter:'',day:0,speaker:0,night:{wolves:{},kill:'',seerDone:false,guardDone:false,guardTarget:'',witch:null}});
    log(r,'法官一键切换为【'+(to==='avalon'?'阿瓦隆':'狼人杀')+'】'+size+' 人局，计时器与公屏灯效已彻底重置归零。');
    return;
  }
  if(act==='fillBots'){
    insist(host&&r.phase==='lobby','只有法官在大厅可以补充 AI 玩家');
    insist(b.epoch===r.epoch,'流程已更新，请确认当前阶段后重试');
    let n=0;
    for(let seat=1;seat<=r.size;seat++){
      if(r.players.some(p=>p.seat===seat))continue;
      const id='bot'+seat+Math.random().toString(16).slice(2,8);
      r.players.push({id,seat,name:'AI-'+seat+'号',key:'bot:'+id,ready:true,ack:false,role:'',alive:true,checks:[],cardNo:seat});n++;
    }
    r.players.sort((a,c)=>a.seat-c.seat);r.epoch++;
    log(r,'已补充 '+n+' 名 AI 测试玩家：自动准备、确认身份、表决与出任务。');
    return;
  }
  if(act==='clearBots'){
    insist(host&&r.phase==='lobby','只有法官在大厅可以移除 AI 玩家');
    r.players=r.players.filter(p=>!isBot(p));r.epoch++;log(r,'已移除全部 AI 测试玩家。');return;
  }
  mutateCore(r,key,b);
  for(let i=0;i<80&&botStep(r);i++);
}
