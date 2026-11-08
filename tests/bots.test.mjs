import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';

await build({stdin:{contents:"export * from './lib/game';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',packages:'external',outfile:'tests/.bots-test.mjs'});
const {initialRoom,mutate,viewRoom}=await import('./.bots-test.mjs');
const act=(r,key,action,args={})=>mutate(r,key,{action,epoch:r.epoch,...args});

test('one-click switch Avalon <-> Werewolf keeps seats and card bindings', () => {
  const r=initialRoom('abcdefabcdefabcdef12','host','法官',7,'',{gameType:'avalon'},'avalon');
  act(r,'p1','join',{name:'小明',newId:'p1id',seat:1});
  act(r,'p1','bindCard',{cardNo:1});
  act(r,'host','switchGame',{gameType:'werewolf'});
  assert.equal(r.gameType,'werewolf');assert.equal(r.size,7);assert.equal(r.players[0].cardNo,1);
  act(r,'host','switchGame',{gameType:'avalon',size:10});
  assert.equal(r.gameType,'avalon');assert.equal(r.size,10);assert.ok(r.avalon);
});

for(const size of [5,7,10]) test(`Avalon ${size}p solo test with AI bots runs to an ending`, () => {
  const r=initialRoom('abcdefabcdefabcdef12','host','法官',size,'',{gameType:'avalon'},'avalon');
  act(r,'host','fillBots');
  assert.equal(r.players.length,size);
  act(r,'host','deal');
  assert.equal(r.phase,'deal');assert.ok(r.players.every(p=>p.ack));
  act(r,'host','advance');
  for(let i=0;i<40&&r.phase!=='ended';i++){
    if(r.phase==='avalonAssassinate'){const t=r.players.find(p=>p.role!=='merlin'&&p.role!=='assassin');act(r,'host','avalonAssassinate',{target:t.id});}
  }
  assert.equal(r.phase,'ended');assert.ok(['good','evil'].includes(r.winner));
});

test('Werewolf 9p solo test with AI bots advances through night and day', () => {
  const r=initialRoom('abcdefabcdefabcdef12','host','法官',9,'',undefined,'werewolf');
  act(r,'host','fillBots');act(r,'host','deal');act(r,'host','advance');
  let guard=0;
  while(r.phase!=='ended'&&guard++<200){
    if(r.phase==='speech'){while(!viewRoom(r,'host').lastSpeaker)act(r,'host','nextSpeaker');}
    act(r,'host','advance');
  }
  assert.equal(r.phase,'ended');
});
