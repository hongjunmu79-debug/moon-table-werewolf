import assert from 'node:assert/strict';
import {build} from 'esbuild';
await build({entryPoints:['lib/game.ts'],bundle:true,platform:'node',format:'esm',outfile:'tests/.game-test.mjs'});
const {initialRoom,mutate,viewRoom}=await import('./.game-test.mjs');
let checks=0;const check=(f)=>{f();checks++;};
function fixture(roles=['wolf','wolf','seer','witch','hunter','villager','villager','villager']){
 const r=initialRoom('0123456789abcdef0123','host','法官',roles.length,'');
 roles.forEach((role,i)=>{mutate(r,'p'+i,{action:'join',name:'玩家'+i,newId:'id'+i});r.players[i].role=role;r.players[i].ready=true;r.players[i].ack=true;});
 r.phase='deal';return r;
}
const act=(r,key,action,args={})=>mutate(r,key,{action,epoch:r.epoch,...args});
{
 const r=fixture();act(r,'host','advance');
 const v=viewRoom(r,'p5');check(()=>assert(!JSON.stringify(v).includes('"key"')));check(()=>assert(v.players.every(p=>!('role' in p))));check(()=>assert.equal(v.me.role,'villager'));check(()=>assert.equal(v.action,''));check(()=>assert.equal(viewRoom(r,'outsider').phase,'join'));
 check(()=>assert.throws(()=>act(r,'p5','nightAction',{target:'id0'})));
 check(()=>assert.throws(()=>act(r,'p0','nightAction',{target:'id1'})));
 act(r,'p0','nightAction',{target:'id3'});act(r,'p1','nightAction',{target:'id3'});const old=r.epoch;act(r,'host','advance');
 check(()=>assert.throws(()=>mutate(r,'host',{action:'advance',epoch:old})));
 act(r,'p2','nightAction',{target:'id0'});check(()=>assert.equal(viewRoom(r,'p2').me.checks[0].result,'狼人'));
 check(()=>assert.equal(viewRoom(r,'p5').submitted,false));check(()=>assert.deepEqual(viewRoom(r,'p5').wolfVotes,{}));check(()=>assert.equal(viewRoom(r,'p5').victim,''));
 check(()=>assert.throws(()=>act(r,'p2','nightAction',{target:'id1'})));
 act(r,'host','advance');
 check(()=>assert.throws(()=>act(r,'p3','nightAction',{kind:'heal'})));
 act(r,'p3','nightAction',{kind:'poison',target:'id4'});
 check(()=>assert.equal(viewRoom(r,'p5').submitted,false));check(()=>assert(r.players.every(p=>p.alive)));
 act(r,'host','advance');check(()=>assert(r.players.every(p=>p.alive)));
 act(r,'host','advance');check(()=>assert.equal(r.players[3].alive,false));check(()=>assert.equal(r.players[4].alive,false));check(()=>assert.equal(r.phase,'speech'));check(()=>assert.equal(r.hunter,''));
 check(()=>assert.throws(()=>act(r,'p3','nightAction',{kind:'pass'})));
}
{
 const r=fixture();r.phase='vote';r.day=1;r.voteRound=1;
 r.players.forEach((p,i)=>act(r,p.key,'vote',{target:i%2?'id0':'id1'}));check(()=>assert.throws(()=>act(r,'p0','vote',{target:'pass'})));
 act(r,'host','advance');check(()=>assert.deepEqual(r.runoff,['id1','id0']));
 check(()=>assert.throws(()=>act(r,'p2','vote',{target:'id3'})));
 r.players.forEach((p,i)=>act(r,p.key,'vote',{target:i%2?'id0':'id1'}));
 act(r,'host','advance');check(()=>assert.equal(r.phase,'dusk'));check(()=>assert(r.players.every(p=>p.alive)));
}
{
 const r=fixture(['wolf','hunter','villager','villager','villager','villager']);r.players.slice(2).forEach(p=>p.alive=false);r.phase='vote';r.day=2;r.voteRound=1;r.votes={id0:'id1',id1:'pass'};
 act(r,'host','advance');check(()=>assert.equal(r.phase,'hunter'));check(()=>assert.equal(r.winner,''));
 act(r,'p1','shoot',{target:'id0'});check(()=>assert.equal(r.winner,'好人'));check(()=>assert.equal(r.phase,'ended'));check(()=>assert(viewRoom(r,'p2').players.every(p=>'role' in p)));
 act(r,'host','rematch');check(()=>assert.equal(r.phase,'lobby'));check(()=>assert(r.players.every(p=>p.role===''&&!p.ready&&p.alive)));
}
{
 const r=fixture();r.phase='wolves';act(r,'p0','nightAction',{target:'id5'});act(r,'p1','nightAction',{target:'id6'});act(r,'host','advance');check(()=>assert.equal(r.night.kill,''));
}
console.log('PASS: '+checks+' game assertions (privacy, authorization, stale actions, night settlement, tied votes, hunter, rematch).');
