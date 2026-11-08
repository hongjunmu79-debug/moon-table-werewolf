const fs = require('fs');
let code = fs.readFileSync('D:/moon-table-werewolf/lib/game.ts', 'utf8');

const offlineCode = `
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
`;

code = code.replace("if(act==='avalonNominate'){", offlineCode + "  if(act==='avalonNominate'){");

const bluffCode = `
  if(act==='villagerBluff'){
    insist(me&&me.alive,'只有存活玩家可以操作夜间伪装');
    r.villagerBluffs = r.villagerBluffs || {};
    r.villagerBluffs[me.id] = String(b.target||'pass');
    r.epoch++;return;
  }
`;
code = code.replace("if(act==='ready'){", bluffCode + "  if(act==='ready'){");

fs.writeFileSync('D:/moon-table-werewolf/lib/game.ts', code, 'utf8');
console.log('game.ts part 2 ok');
