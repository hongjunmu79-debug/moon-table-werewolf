const fs = require('fs');
let code = fs.readFileSync('D:/moon-table-werewolf/lib/game.ts', 'utf8');

const targetOld = `    if(Object.keys(r.avalon!.missionSubmissions).length>=r.avalon!.nominatedSquad.length){
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
    }`;

const targetNew = `    if(Object.keys(r.avalon!.missionSubmissions).length>=r.avalon!.nominatedSquad.length){
     for(let i=r.avalon!.missionVotes.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [r.avalon!.missionVotes[i],r.avalon!.missionVotes[j]]=[r.avalon!.missionVotes[j],r.avalon!.missionVotes[i]];
     }
     r.avalon!.cardRevealOrder = [...r.avalon!.missionVotes];
     r.avalon!.revealingIndex = 0;
     move(r,'avalonReveal');
     log(r,'所有出勤队员已完成出牌！进入【逐张开牌阶段】，公屏与法官将逐张揭晓心跳结果！');
    }`;

code = code.replace(targetOld, targetNew);

const revealAndLadyCode = `
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
`;

code = code.replace("if(act==='avalonAssassinate'){", revealAndLadyCode + "  if(act==='avalonAssassinate'){");

fs.writeFileSync('D:/moon-table-werewolf/lib/game.ts', code, 'utf8');
console.log('game.ts part 3 ok');
