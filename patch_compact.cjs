const fs = require('fs');
let code = fs.readFileSync('D:/moon-table-werewolf/server/room.ts', 'utf8');

const targetOld = `      tv:Object.keys(av.teamVotes).length,mv:Object.keys(av.missionSubmissions).length,
      approve:av.teamVotesRevealed?Object.values(av.teamVotes).filter(Boolean).length:-1
    }:null
  };
}`;

const targetNew = `      tv:Object.keys(av.teamVotes).length,mv:Object.keys(av.missionSubmissions).length,
      approve:av.teamVotesRevealed?Object.values(av.teamVotes).filter(Boolean).length:-1,
      revIdx:av.revealingIndex,
      revCard:av.revealingIndex>=0?av.cardRevealOrder[av.revealingIndex]:'',
      lady:av.ladyHolderSeat||0,
      offline:!!r.offlineVote
    }:null
  };
}`;

code = code.replace(targetOld, targetNew);
fs.writeFileSync('D:/moon-table-werewolf/server/room.ts', code, 'utf8');
console.log('server/room.ts compact poll updated ok!');
