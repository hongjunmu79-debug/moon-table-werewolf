import re

content = open("lib/game.ts", "r", encoding="utf-8").read()

# 1. Update Room type definition
old_room_type = "export type Room={id:string;hostName:string;hostKey:string;size:number;setup?:GameConfig;lastGuard?:string;sheriffId?:string;election?:Election;badgeFrom?:string;afterBadge?:string;speechOrder?:string[];seatSwaps?:{from:string;to:string}[];voice:string;phase:string;epoch:number;day:number;players:Player[];night:{wolves:Record<string,string>;kill:string;seerDone:boolean;guardDone?:boolean;guardTarget?:string;witch:null|{kind:string;target:string}};medicine:{heal:boolean;poison:boolean};votes:Record<string,string>;runoff:string[];voteRound:number;speaker:number;deadline:number;hunter:string;afterHunter:string;winner:string;message:string;logs:{day:number;text:string}[];expires:number;gameType?:'werewolf'|'avalon';avalon?:AvalonState};"
new_room_type = "export type Room={id:string;hostName:string;hostKey:string;size:number;setup?:GameConfig;lastGuard?:string;sheriffId?:string;election?:Election;badgeFrom?:string;afterBadge?:string;speechOrder?:string[];seatSwaps?:{from:string;to:string}[];voice:string;phase:string;epoch:number;day:number;players:Player[];night:{wolves:Record<string,string>;kill:string;seerDone:boolean;guardDone?:boolean;guardTarget?:string;witch:null|{kind:string;target:string}};medicine:{heal:boolean;poison:boolean};votes:Record<string,string>;runoff:string[];voteRound:number;speaker:number;deadline:number;hunter:string;afterHunter:string;winner:string;message:string;logs:{day:number;text:string}[];expires:number;gameType?:'werewolf'|'avalon';avalon?:AvalonState;voiceMasterId?:string;voiceMasterName?:string;pairingCode?:string;nightDuration?:number};"
content = content.replace(old_room_type, new_room_type)

# 2. Update initialRoom
old_init_room = """    hunter:'',afterHunter:'',winner:'',message:isAvalon?'阿瓦隆房间已创建，支持 5–10 人及 10 张 NFC/白卡切卡。':'等朋友们入座，准备好后由法官发身份。',
    logs:[],expires:Date.now()+86400000,gameType:gType,avalon:isAvalon?initialAvalonState(size):undefined
  };"""
new_init_room = """    hunter:'',afterHunter:'',winner:'',message:isAvalon?'阿瓦隆房间已创建，支持 5–10 人及 20 张 NFC/白卡切卡。':'等朋友们入座，准备好后由法官发身份。',
    logs:[],expires:Date.now()+86400000,gameType:gType,avalon:isAvalon?initialAvalonState(size):undefined,
    voiceMasterId:hostKey,voiceMasterName:name,pairingCode:id.slice(-4).toUpperCase(),nightDuration:12
  };"""
content = content.replace(old_init_room, new_init_room)

# 3. Update night function
old_night = "function night(r:Room){r.day++;r.night={wolves:{},kill:'',seerDone:false,guardDone:false,guardTarget:'',witch:null};r.votes={};r.runoff=[];r.voteRound=0;r.hunter='';move(r,setup(r).roles.guard?'guard':'wolves');log(r,'第 '+r.day+' 夜开始，请在语音房保持安静。');}"
new_night = "function night(r:Room){r.day++;r.night={wolves:{},kill:'',seerDone:false,guardDone:false,guardTarget:'',witch:null};r.votes={};r.runoff=[];r.voteRound=0;r.hunter='';const firstPhase=setup(r).roles.guard?'guard':'wolves';move(r,firstPhase);r.deadline=Date.now()+(r.nightDuration||12)*1000;log(r,'第 '+r.day+' 夜开始，纯黑夜视模式已开启。每阶段固定倒计时 '+(r.nightDuration||12)+' 秒，防秒过抿身份。');}"
content = content.replace(old_night, new_night)

# 4. Update avalonVoteMission
old_vote_mission = """   const goodPlayer=isGood(me.role as AvalonRole);
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
    log(r,'第 '+r.avalon!.currentRound+' 轮任务公布：'+(r.avalon!.nominatedSquad.length-fails)+' 票成功，'+fails+' 票失败！任务判定：'+(isFail?'【任务失败】':'【任务成功】')+'！');"""

new_vote_mission = """   const goodPlayer=isGood(me.role as AvalonRole);
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
    log(r,'第 '+r.avalon!.currentRound+' 轮任务公布：'+successes+' 票成功，'+fails+' 票破坏！判定：【'+(isFail?'任务失败':'任务成功')+'】'+(reqFails>1?'（需 '+reqFails+' 张破坏牌）':'')+'！');"""
content = content.replace(old_vote_mission, new_vote_mission)

# 5. Add voice master & pairing actions in mutateCore
actions_insertion = """  if(act==='claimVoiceMaster'){
   r.voiceMasterId=key;r.voiceMasterName=host?'法官':(me?me.name:'未知');
   log(r,r.voiceMasterName+' 获得了全房唯一语音法官主持权。');
   r.epoch++;return;
  }
  if(act==='releaseVoiceMaster'){
   if(r.voiceMasterId===key){r.voiceMasterId='';r.voiceMasterName='';log(r,'语音法官主持权已释放。');r.epoch++;}
   return;
  }
  if(act==='pairMosaico'){
   insist(host,'只有法官可以关联 Mosaico 屏幕');
   const code=String(b.deviceCode||'').trim().toUpperCase();
   insist(code.length>=2,'配对码无效');
   r.pairingCode=code;log(r,'已关联 ESP-Mosaico 桌面公屏（设备码: '+code+'）。');
   r.epoch++;return;
  }
"""
content = content.replace("  if(act==='ready'){", actions_insertion + "  if(act==='ready'){")

# 6. Night phase countdown guard in advance
old_advance = """  if(act==='advance'){insist(host,'只有法官可以推进流程');
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
    case 'witch':"""

new_advance = """  if(act==='advance'){insist(host,'只有法官可以推进流程');
   const isNightAction=['guard','wolves','seer','witch'].includes(r.phase);
   if(isNightAction&&Date.now()<r.deadline&&!b.force){
     const leftSec=Math.max(1,Math.ceil((r.deadline-Date.now())/1000));
     insist(false,'夜间防抿身份读秒保护中（还剩 '+leftSec+' 秒），请等待倒计时结束');
   }
   switch(r.phase){
    case 'deal':insist(r.players.every(p=>p.ack),'请等待每个人确认身份');
     if(r.gameType==='avalon'){
       move(r,'avalonNominate');
       log(r,'阿瓦隆第 1 轮任务开始！请 '+r.avalon!.leaderSeat+' 号队长挑选出勤队员。');
       return;
     }
     night(r);return;
    case 'guard':r.lastGuard=r.night.guardTarget||'';move(r,'wolves');r.deadline=Date.now()+(r.nightDuration||12)*1000;return;
    case 'wolves':{r.night.kill=tally(r.night.wolves).leaders.length===1?tally(r.night.wolves).leaders[0]:'';move(r,'seer');r.deadline=Date.now()+(r.nightDuration||12)*1000;return;}
    case 'seer':move(r,'witch');r.deadline=Date.now()+(r.nightDuration||12)*1000;return;
    case 'witch':"""
content = content.replace(old_advance, new_advance)

# 7. Update switchGame to thoroughly clean state
old_switch_game = """    const next=initialRoom(r.id,r.hostKey,r.hostName,size,r.voice,undefined,to);
    next.players=r.players.map(p=>({...p,role:'',ready:isBot(p),ack:false,alive:true,idiotRevealed:false,exploded:false,checks:[]}));
    next.epoch=r.epoch+1;next.logs=r.logs;
    Object.assign(r,next,{sheriffId:'',election:undefined,badgeFrom:'',afterBadge:'',speechOrder:[],seatSwaps:[],winner:''});
    log(r,'法官一键切换为【'+(to==='avalon'?'阿瓦隆':'狼人杀')+'】'+size+' 人局，座位与已绑定白卡保留，请重新准备。');
    return;"""

new_switch_game = """    const next=initialRoom(r.id,r.hostKey,r.hostName,size,r.voice,undefined,to);
    next.players=r.players.map(p=>({...p,role:'',ready:isBot(p),ack:false,alive:true,idiotRevealed:false,exploded:false,checks:[]}));
    next.epoch=r.epoch+1;next.logs=r.logs;
    next.pairingCode=r.pairingCode||r.id.slice(-4).toUpperCase();
    next.voiceMasterId=r.voiceMasterId||r.hostKey;
    next.voiceMasterName=r.voiceMasterName||'法官';
    Object.assign(r,next,{sheriffId:'',election:undefined,badgeFrom:'',afterBadge:'',speechOrder:[],seatSwaps:[],winner:'',deadline:0,votes:{},runoff:[],hunter:'',afterHunter:'',day:0,speaker:0,night:{wolves:{},kill:'',seerDone:false,guardDone:false,guardTarget:'',witch:null}});
    log(r,'法官一键切换为【'+(to==='avalon'?'阿瓦隆':'狼人杀')+'】'+size+' 人局，计时器与公屏灯效已彻底重置归零。');
    return;"""
content = content.replace(old_switch_game, new_switch_game)

# 8. Update viewRoom return values
old_view_avalon = """    missionSquadSize:AVALON_QUEST_TABLE[r.size]?.[r.avalon.currentRound-1]?.squadSize||2,
    failsRequired:AVALON_QUEST_TABLE[r.size]?.[r.avalon.currentRound-1]?.failsRequired||1,
    myTeamVote:me?r.avalon.teamVotes[me.id]:undefined,"""

new_view_avalon = """    missionSquadSize:AVALON_QUEST_TABLE[r.size]?.[r.avalon.currentRound-1]?.squadSize||2,
    failsRequired:AVALON_QUEST_TABLE[r.size]?.[r.avalon.currentRound-1]?.failsRequired||1,
    hammerCount:r.avalon.voteTracker+1,
    isFinalHammer:r.avalon.voteTracker>=4,
    lastMissionSummary:r.avalon.lastMissionSummary||'',
    myTeamVote:me?r.avalon.teamVotes[me.id]:undefined,"""
content = content.replace(old_view_avalon, new_view_avalon)

old_view_bottom = """  medicine:(host||me?.role==='witch')?r.medicine:null,
  hostNight:host?{...r.night,checks:r.players.find(p=>p.role==='seer')?.checks||[]}:null};"""

new_view_bottom = """  medicine:(host||me?.role==='witch')?r.medicine:null,
  voiceMasterId:r.voiceMasterId||'',
  voiceMasterName:r.voiceMasterName||'',
  isVoiceMaster:host?(r.voiceMasterId===r.hostKey||!r.voiceMasterId):(me?r.voiceMasterId===me.key:false),
  pairingCode:r.pairingCode||r.id.slice(-4).toUpperCase(),
  nightDuration:r.nightDuration||12,
  nightRemaining:(nightPhase&&r.deadline)?Math.max(0,Math.ceil((r.deadline-Date.now())/1000)):0,
  hostNight:host?{...r.night,checks:r.players.find(p=>p.role==='seer')?.checks||[]}:null};"""
content = content.replace(old_view_bottom, new_view_bottom)

open("lib/game.ts", "w", encoding="utf-8").write(content)
print("Updated lib/game.ts successfully!")
