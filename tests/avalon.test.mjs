import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';

await build({
  stdin: {
    contents: "export * from './lib/game'; export * from './lib/rules'; export * from './lib/avalon'; export * from './server/room'; export {memoryStore} from './server/storage';",
    resolveDir: process.cwd()
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  outfile: 'tests/.avalon-test.mjs'
});

const {initialRoom, mutate, viewRoom, AVALON_QUEST_TABLE} = await import('./.avalon-test.mjs');

const act = (r, key, action, args = {}) => mutate(r, key, {action, epoch: r.epoch, ...args});

test('Avalon 5-player full game loop with card binding, mission voting, and assassination', () => {
  // 1. Create 5-player Avalon room
  const r = initialRoom('avalonroom0123456789', 'host', '法官', 5, '', {gameType: 'avalon'}, 'avalon');
  assert.equal(r.gameType, 'avalon');
  assert.equal(r.size, 5);
  assert.equal(r.avalon.currentRound, 1);

  // 2. Players join and bind physical cards (1-5) & UIDs
  const cards = [
    {no: 1, uid: '04:A1:B2:C1'},
    {no: 2, uid: '04:A1:B2:C2'},
    {no: 3, uid: '04:A1:B2:C3'},
    {no: 4, uid: '04:A1:B2:C4'},
    {no: 5, uid: '04:A1:B2:C5'}
  ];

  for (let i = 0; i < 5; i++) {
    act(r, 'p' + i, 'join', {name: '玩家' + (i + 1), newId: 'id' + i});
    act(r, 'p' + i, 'bindCard', {cardNo: cards[i].no, cardUid: cards[i].uid});
    act(r, 'p' + i, 'ready', {ready: true});
  }

  assert.equal(r.players.length, 5);
  assert.equal(r.players[0].cardNo, 1);
  assert.equal(r.players[0].cardUid, '04:A1:B2:C1');

  // 3. Deal Avalon cards
  act(r, 'host', 'deal');
  assert.equal(r.phase, 'deal');
  assert(r.players.every(p => p.role.length > 0));

  // Check roles: 3 good (merlin, percival, servant) and 2 evil (assassin, morgana)
  const merlin = r.players.find(p => p.role === 'merlin');
  const percival = r.players.find(p => p.role === 'percival');
  const assassin = r.players.find(p => p.role === 'assassin');
  const morgana = r.players.find(p => p.role === 'morgana');
  assert(merlin && percival && assassin && morgana);

  // Check vision
  const merlinView = viewRoom(r, merlin.key);
  assert.equal(merlinView.me.vision.alignment, 'good');
  assert.equal(merlinView.me.vision.knownPlayers.length, 2); // sees assassin and morgana

  const percivalView = viewRoom(r, percival.key);
  assert.equal(percivalView.me.vision.knownPlayers.length, 2); // sees merlin and morgana

  // Ack identities
  for (let i = 0; i < 5; i++) {
    act(r, 'p' + i, 'ack');
  }

  // 4. Advance to Quest 1 nomination
  act(r, 'host', 'advance');
  assert.equal(r.phase, 'avalonNominate');
  assert.equal(r.avalon.currentRound, 1);

  // Leader for 5p round 1 nominates 2 players
  const leaderSeat = r.avalon.leaderSeat;
  const leader = r.players.find(p => p.seat === leaderSeat);
  const squad = [r.players[0].id, r.players[1].id];

  // Nominate
  act(r, leader.key, 'avalonNominate', {squad});
  assert.equal(r.phase, 'avalonVoteTeam');
  assert.deepEqual(r.avalon.nominatedSquad, squad);

  // All 5 players vote Approve
  for (let i = 0; i < 5; i++) {
    act(r, 'p' + i, 'avalonVoteTeam', {approve: true});
  }

  // Team approved -> mission execution
  assert.equal(r.phase, 'avalonVoteMission');

  // Nominated squad members vote mission
  // Even if good player submits success: false (for disguise/anti-profiling), backend auto-converts it to success: true!
  const p0IsGood = ['merlin', 'percival', 'servant'].includes(r.players[0].role);
  if (p0IsGood) {
    act(r, r.players[0].key, 'avalonVoteMission', {success: false}); // Should silently coerce to true
  } else {
    act(r, r.players[0].key, 'avalonVoteMission', {success: true});
  }
  act(r, r.players[1].key, 'avalonVoteMission', {success: true});

  // Mission 1 success!
  assert.equal(r.avalon.missionHistory[0], 'success');
  assert.equal(r.avalon.currentRound, 2);
  assert.equal(r.phase, 'avalonNominate');
});
