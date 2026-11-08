const fs = require('fs');
let code = fs.readFileSync('D:/moon-table-werewolf/lib/game.ts', 'utf8');

const targetOld = `    winnerReason:r.avalon.winnerReason
  }:null,canJoin:r.phase==='lobby'&&r.players.length<r.size,message:r.message,logs:r.logs,winner:r.winner,expires:r.expires,runoff:r.runoff,voteRound:r.voteRound,voteTotal:eligible.length,canVote:!!me&&eligible.some(p=>p.id===me.id),voteCount:r.phase==='vote'?Object.keys(r.votes).length:0,myVote:me?r.votes[me.id]||'':'',speaker:speaking?speakers(r)[r.speaker]?.id:'',lastSpeaker:r.speaker>=speakers(r).length-1,deadline:r.deadline,hunter:r.hunter,`;

const targetNew = `    winnerReason:r.avalon.winnerReason,
    ladyHolderSeat:r.avalon.ladyHolderSeat,
    ladyTargetSeat:r.avalon.ladyTargetSeat,
    ladyResult:(host||(me&&me.seat===r.avalon.ladyHolderSeat))?r.avalon.ladyResultAlignment:undefined,
    ladyHistory:r.avalon.ladyHistory||[],
    ladyCheckedSeats:r.avalon.ladyCheckedSeats||[],
    cardRevealOrder:r.phase==='avalonReveal'||r.phase==='ended'?r.avalon.cardRevealOrder:[],
    revealingIndex:r.avalon.revealingIndex,
    revealedCards:r.avalon.revealingIndex>=0?(r.avalon.cardRevealOrder||[]).slice(0, r.avalon.revealingIndex+1):[],
    matrixRecords:r.avalon.matrixRecords||[]
  }:null,offlineVote:!!r.offlineVote,villagerBluffs:host?r.villagerBluffs:{},myBluff:me?(r.villagerBluffs?.[me.id]||''):'',nightMode:setup(r).nightMode||'openEyes',canJoin:r.phase==='lobby'&&r.players.length<r.size,message:r.message,logs:r.logs,winner:r.winner,expires:r.expires,runoff:r.runoff,voteRound:r.voteRound,voteTotal:eligible.length,canVote:!!me&&eligible.some(p=>p.id===me.id),voteCount:r.phase==='vote'?Object.keys(r.votes).length:0,myVote:me?r.votes[me.id]||'':'',speaker:speaking?speakers(r)[r.speaker]?.id:'',lastSpeaker:r.speaker>=speakers(r).length-1,deadline:r.deadline,hunter:r.hunter,`;

code = code.replace(targetOld, targetNew);

// Also update botStep for avalonReveal and avalonLady
const botOld = `    if(r.phase==='avalonAssassinate'){`;
const botNew = `    if(r.phase==='avalonReveal'){
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
    if(r.phase==='avalonAssassinate'){`;

code = code.replace(botOld, botNew);

fs.writeFileSync('D:/moon-table-werewolf/lib/game.ts', code, 'utf8');
console.log('game.ts part 4 ok');
