import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
await build({stdin:{contents:"export * from './lib/game'; export * from './lib/rules'; export * from './server/room'; export {memoryStore} from './server/storage';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',packages:'external',outfile:'tests/.setup-test.mjs'});
const {initialRoom,mutate,viewRoom,recommendedConfig,resolveConfig,configDeck,PLAYER_SIZES,roomPost,roomGet,memoryStore}=await import('./.setup-test.mjs');
const act=(r,key,action,args={})=>mutate(r,key,{action,epoch:r.epoch,...args});
function fixture(size=12,config=recommendedConfig(size,'guard')){
 const r=initialRoom('0123456789abcdef0123','host','测试法官',size,'',config);
 configDeck(config).forEach((role,i)=>{act(r,'p'+i,'join',{name:'玩家'+i,newId:'id'+i});Object.assign(r.players[i],{role,ready:true,ack:true});});
 r.phase='deal';return r;
}
const person=(r,role)=>r.players.find(p=>p.role===role);
const advance=r=>act(r,'host','advance');
function finishNight(r,{guard='pass',kill='pass',kind='pass',poison='pass'}={}){
 if(r.phase==='deal')advance(r);
 if(r.phase==='guard'){const g=person(r,'guard');if(g?.alive)act(r,g.key,'nightAction',{target:guard});advance(r);}
 r.players.filter(p=>p.alive&&p.role==='wolf').forEach(p=>act(r,p.key,'nightAction',{target:kill}));advance(r);
 const seer=person(r,'seer');if(seer?.alive)act(r,seer.key,'nightAction',{target:'pass'});advance(r);
 const witch=person(r,'witch');if(witch?.alive)act(r,witch.key,'nightAction',{kind,target:poison});advance(r);
 assert(r.players.filter(p=>!p.alive).every(p=>p.id!==kill),'night death must be deferred until dawn');
 advance(r);
}
function nextNight(r){assert.equal(r.phase,'speech');advance(r);advance(r);advance(r);}

test('every 6–12 player preset deals exactly the advertised roles with private identities',()=>{
 for(const size of PLAYER_SIZES)for(const preset of ['classic','guard']){
  const config=recommendedConfig(size,preset),r=fixture(size,config);
  assert.equal(configDeck(config).length,size);r.phase='lobby';act(r,'host','deal');
  for(const [role,n] of Object.entries(config.roles))assert.equal(r.players.filter(p=>p.role===role).length,n);
  assert.equal(r.players.at(-1).seat,size);const player=viewRoom(r,'p0');
  assert(player.players.every(p=>!('role' in p)));assert.equal(player.me.role,r.players[0].role);
  assert(!JSON.stringify(player).includes('"key"'));assert.equal(viewRoom(r,'host').players.length,size);
  const outsider=viewRoom(r,'outsider');assert.deepEqual(outsider.setup,config);assert(!('players' in outsider));
 }
 assert.deepEqual(recommendedConfig(12).roles,{wolf:4,seer:1,witch:1,hunter:1,idiot:1,guard:0,villager:4});
});

test('custom setup rejects invalid counts, unknown roles, and invalid rule values',()=>{
 const valid={...recommendedConfig(12,'guard'),mode:'custom'};
 assert.deepEqual(resolveConfig(12,valid).roles,valid.roles);
 for(const invalid of [null,[],{mode:'unknown'},{...valid,roles:{...valid.roles,villager:3}},{...valid,roles:{...valid.roles,witch:2,villager:3}},{...valid,roles:{...valid.roles,wolf:4.5}},{...valid,roles:{...valid.roles,wolf:'4'}},{...valid,roles:{...valid.roles,wolf:8,villager:0}},{...valid,roles:{...valid.roles,constructor:1}},{...valid,victory:'unknown'},{...valid,witchSelfSave:'always'}])assert.throws(()=>resolveConfig(12,invalid));
 for(const n of [0,5,13,12.5,NaN])assert.throws(()=>resolveConfig(n));
 for(const invalid of [{...valid,roles:{...valid.roles,idiot:null}},{...valid,victory:['edge']},{...valid,witchSelfSave:['never']}])assert.throws(()=>resolveConfig(12,invalid));
 assert.throws(()=>resolveConfig(12,{...valid,roles:JSON.parse('{"wolf":4,"villager":4,"seer":1,"witch":1,"hunter":1,"guard":1,"__proto__":0}')}));
});

test('only the judge can edit before dealing; edit resets readiness and rematch preserves setup',()=>{
 const r=fixture();r.phase='lobby';const config={...recommendedConfig(12),mode:'custom',witchSelfSave:'firstNight'};
 assert.throws(()=>act(r,'p0','configure',{setup:config}));const old=r.epoch;act(r,'host','configure',{setup:config});
 assert(r.players.every(p=>!p.ready));assert.throws(()=>mutate(r,'p0',{action:'ready',ready:true,epoch:old}));
 assert.equal(r.setup.witchSelfSave,'firstNight');r.phase='deal';assert.throws(()=>act(r,'host','configure',{setup:config}));
 r.phase='ended';r.players[0].idiotRevealed=true;r.lastGuard='id4';act(r,'host','rematch');
 assert.deepEqual(r.setup,resolveConfig(12,config));assert.equal(r.lastGuard,'');assert(r.players.every(p=>!p.idiotRevealed&&!p.ready&&p.role===''));
 const oldRoom=fixture(9,recommendedConfig(9));delete oldRoom.setup;
 assert.equal(viewRoom(oldRoom,'host').setup.victory,'parity');
});

test('guard permits self guard, forbids consecutive targets, and keeps targets private',()=>{
 const r=fixture();advance(r);const g=person(r,'guard'),v=person(r,'villager');
 assert.throws(()=>act(r,v.key,'nightAction',{target:v.id}));act(r,g.key,'nightAction',{target:g.id});
 assert.throws(()=>act(r,g.key,'nightAction',{target:v.id}));
 const outsider=viewRoom(r,v.key);assert.equal(outsider.phase,'night');assert.equal(outsider.action,'');assert.equal(outsider.hostNight,null);assert.equal(outsider.guardLast,'');
 advance(r);assert.equal(viewRoom(r,g.key).guardLast,g.id);assert.equal(viewRoom(r,v.key).guardLast,'');
 r.phase='speech';nextNight(r);assert.throws(()=>act(r,g.key,'nightAction',{target:g.id}));
 act(r,g.key,'nightAction',{target:'pass'});advance(r);r.phase='speech';nextNight(r);act(r,g.key,'nightAction',{target:g.id});
});

test('guard and witch resolve guard only, heal only, double protection, and poison correctly',()=>{
 for(const [guarded,saved,expectedAlive] of [[false,false,false],[true,false,true],[false,true,true],[true,true,false]]){
  const r=fixture(),v=person(r,'villager');finishNight(r,{guard:guarded?v.id:'pass',kill:v.id,kind:saved?'heal':'pass'});assert.equal(v.alive,expectedAlive);
 }
 const r=fixture(),v=person(r,'villager');finishNight(r,{guard:v.id,kind:'poison',poison:v.id});assert.equal(v.alive,false);
 const dead=fixture(),g=person(dead,'guard');finishNight(dead,{kind:'poison',poison:g.id});assert.equal(g.alive,false);nextNight(dead);assert.equal(dead.phase,'guard');assert.equal(viewRoom(dead,g.key).action,'');advance(dead);assert.equal(dead.phase,'wolves');
});

test('witch can self save only under a first-night custom rule',()=>{
 for(const [rule,day,allowed] of [['never',1,false],['firstNight',1,true],['firstNight',2,false]]){
  const config={...recommendedConfig(12),mode:'custom',witchSelfSave:rule},r=fixture(12,config),w=person(r,'witch');
  r.phase='witch';r.day=day;r.night.kill=w.id;
  if(allowed){act(r,w.key,'nightAction',{kind:'heal'});assert.equal(r.medicine.heal,false);}
  else{assert.throws(()=>act(r,w.key,'nightAction',{kind:'heal'}));assert.equal(r.medicine.heal,true);}
 }
});

test('idiot is publicly revealed on exile, cannot vote or be exiled again, and still dies at night',()=>{
 const r=fixture(12,recommendedConfig(12)),i=person(r,'idiot');r.phase='vote';r.voteRound=1;
 r.players.forEach(p=>act(r,p.key,'vote',{target:p.id===i.id?'pass':i.id}));advance(r);
 assert(i.alive&&i.idiotRevealed);assert.equal(r.phase,'dusk');const publicView=viewRoom(r,person(r,'villager').key);
 assert.deepEqual(publicView.players.filter(p=>'role' in p).map(p=>p.role),['idiot']);assert.equal(publicView.voteTotal,11);
 r.phase='vote';r.votes={};assert.throws(()=>act(r,i.key,'vote',{target:'pass'}));assert.throws(()=>act(r,'p0','vote',{target:i.id}));
 r.phase='dusk';advance(r);finishNight(r,{kill:i.id});assert.equal(i.alive,false);
});

test('edge victory differs from parity and correctly handles either good-side group',()=>{
 for(const victory of ['edge','parity']){
  const config={...recommendedConfig(6),mode:'custom',victory},r=fixture(6,config);person(r,'seer').alive=false;person(r,'villager').alive=false;r.phase='dawn';advance(r);
  assert.equal(r.winner,victory==='edge'?'':'狼人');
 }
 for(const eliminated of ['gods','villagers','wolves']){
  const r=fixture(12,recommendedConfig(12));r.players.filter(p=>eliminated==='gods'?p.role!=='wolf'&&p.role!=='villager':p.role===(eliminated==='wolves'?'wolf':'villager')).forEach(p=>p.alive=false);r.phase='dawn';advance(r);assert.equal(r.winner,eliminated==='wolves'?'好人':'狼人');
 }
});

test('API accepts larger and custom rooms and returns 400 for invalid configurations',async()=>{
 for(const size of [10,11,12]){
  const response=await roomPost(new Request('https://table.example/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create',name:'测试法官',size,setup:{mode:'recommended',preset:'guard'}})}),memoryStore);
  assert.equal(response.status,200);const data=await response.json();assert.equal(data.size,size);assert.equal(configDeck(data.setup).length,size);
  const outsider=await roomGet(new Request('https://table.example/api/room?id='+data.id),memoryStore);assert.equal((await outsider.json()).phase,'join');
 }
 const original=console.error;console.error=()=>{};
 try{for(const payload of [{size:13},{size:12,setup:{...recommendedConfig(12),mode:'custom',roles:{wolf:4,villager:1}}}]){
  const response=await roomPost(new Request('https://table.example/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create',name:'测试法官',...payload})}),memoryStore);assert.equal(response.status,400);
 }}finally{console.error=original;}
});
