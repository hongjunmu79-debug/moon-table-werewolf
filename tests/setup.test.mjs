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
 for(const invalid of [null,[],{mode:'unknown'},{...valid,roles:{...valid.roles,villager:3}},{...valid,roles:{...valid.roles,witch:2,villager:3}},{...valid,roles:{...valid.roles,wolf:4.5}},{...valid,roles:{...valid.roles,wolf:'4'}},{...valid,roles:{...valid.roles,wolf:8,villager:0}},{...valid,roles:{...valid.roles,constructor:1}},{...valid,victory:'unknown'},{...valid,witchSelfSave:'unknown'}])assert.throws(()=>resolveConfig(12,invalid));
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
 for(const [rule,day,allowed] of [['never',1,false],['firstNight',1,true],['firstNight',2,false],['always',1,true],['always',2,true],['always',5,true]]){
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

function sheriffFixture(size=9){return fixture(size,{...recommendedConfig(size),sheriff:true});}
function openElection(r,kill='pass'){
 advance(r);
 if(r.phase==='guard')advance(r);
 r.players.filter(p=>p.role==='wolf').forEach(p=>act(r,p.key,'nightAction',{target:kill}));advance(r);
 act(r,person(r,'seer').key,'nightAction',{target:'pass'});advance(r);
 act(r,person(r,'witch').key,'nightAction',{kind:'pass'});advance(r);
 assert.equal(r.phase,'sheriffSignup');
}
function nominate(r,ids){r.players.forEach(p=>act(r,p.key,'sheriffSignup',{run:ids.includes(p.id)}));advance(r);}
function elect(r,id){openElection(r);nominate(r,[id]);advance(r);assert.equal(r.sheriffId,id);advance(r);}

test('new recommended boards use edge victory and first-night self save; sheriff is optional only at 9+',()=>{
 for(const size of PLAYER_SIZES){const c=recommendedConfig(size);assert.equal(c.victory,'edge');assert.equal(c.witchSelfSave,'firstNight');assert.equal(c.sheriff,false);}
 for(const mode of ['recommended','custom']){
  const c={...recommendedConfig(9),mode,sheriff:true,witchSelfSave:'always'};assert.equal(resolveConfig(9,c).sheriff,true);assert.equal(resolveConfig(9,c).witchSelfSave,'always');
  for(const sheriff of [1,'true',null,[]])assert.throws(()=>resolveConfig(9,{...c,sheriff}));
  assert.throws(()=>resolveConfig(8,{...recommendedConfig(8),mode,sheriff:true}));
 }
 const old=fixture(9);old.setup.witchSelfSave='never';old.setup.victory='parity';delete old.setup.sheriff;
 assert.equal(viewRoom(old,'host').setup.sheriff,false);old.phase='ended';act(old,'host','rematch');assert.equal(old.setup.victory,'parity');assert.equal(old.setup.witchSelfSave,'never');
});

test('first-night deaths remain hidden through signup, speech and sheriff voting; only off-police players vote',()=>{
 const r=sheriffFixture(),v=person(r,'villager'),w=person(r,'witch'),s=person(r,'seer');openElection(r,v.id);
 assert(r.players.every(p=>p.alive));const stranger=viewRoom(r,v.key);assert.equal(stranger.hostNight,null);assert.equal(stranger.victim,'');assert(stranger.players.every(p=>p.alive));
 act(r,s.key,'sheriffSignup',{run:true});act(r,s.key,'sheriffSignup',{run:false});act(r,s.key,'sheriffSignup',{run:true});
 assert.deepEqual(viewRoom(r,v.key).sheriff.candidates,[]);assert.throws(()=>act(r,'host','sheriffSignup',{run:true}));assert.throws(()=>act(r,v.key,'sheriffSignup',{run:'true'}));
 nominate(r,[s.id,w.id]);assert.equal(r.phase,'sheriffSpeech');assert.throws(()=>act(r,v.key,'withdraw'));const before=r.epoch;
 act(r,s.key,'withdraw');assert.throws(()=>mutate(r,'host',{action:'advance',epoch:before}));assert.throws(()=>act(r,s.key,'sheriffSignup',{run:true}));
 advance(r);assert.equal(r.sheriffId,w.id);assert.equal(r.phase,'dawn');assert(v.alive);advance(r);assert(!v.alive);assert.equal(r.phase,'order');
});

test('sheriff runoff retains the original electorate, withdrawn and losing candidates cannot vote, second tie removes badge',()=>{
 const r=sheriffFixture(),[a,b,c]=r.players;openElection(r);nominate(r,[a.id,b.id,c.id]);act(r,c.key,'withdraw');advance(r);
 assert.equal(r.phase,'sheriffVote');assert.equal(viewRoom(r,'host').sheriff.voteTotal,6);
 for(const p of [a,b,c])assert.throws(()=>act(r,p.key,'sheriffVote',{target:a.id}));
 assert.throws(()=>act(r,r.players[3].key,'sheriffVote',{target:c.id}));
 for(const [i,p] of r.players.slice(3).entries())act(r,p.key,'sheriffVote',{target:i%2?a.id:b.id});
 assert.throws(()=>act(r,r.players[3].key,'sheriffVote',{target:a.id}));assert.equal(viewRoom(r,r.players[4].key).sheriff.myVote,a.id);
 advance(r);assert.equal(r.phase,'sheriffSpeech');assert.equal(r.election.round,2);assert.deepEqual(new Set(r.election.runoff),new Set([a.id,b.id]));advance(r);
 for(const p of [a,b,c])assert.throws(()=>act(r,p.key,'sheriffVote',{target:a.id}));
 for(const [i,p] of r.players.slice(3).entries())act(r,p.key,'sheriffVote',{target:i%2?a.id:b.id});advance(r);assert.equal(r.sheriffId,'');assert.equal(r.phase,'dawn');
});

test('sheriff election handles nobody, one candidate, all candidates and all abstentions',()=>{
 for(const count of [0,1,9,2]){
  const r=sheriffFixture();openElection(r);nominate(r,r.players.slice(0,count).map(p=>p.id));
  if(count===0){assert.equal(r.phase,'dawn');assert.equal(r.sheriffId,'');continue;}
  advance(r);if(count===1){assert.equal(r.sheriffId,r.players[0].id);continue;}
  assert.equal(r.phase,'sheriffVote');for(const p of r.players.slice(count))act(r,p.key,'sheriffVote',{target:'pass'});advance(r);assert.equal(r.phase,'dawn');assert.equal(r.sheriffId,'');
 }
});

test('sheriff has 1.5 votes on exile, PK candidates cannot vote, sheriff controls direction and speaks last',()=>{
 const r=sheriffFixture(),chief=r.players[1];elect(r,chief.id);assert.equal(r.phase,'order');
 assert.throws(()=>act(r,r.players[0].key,'speechOrder',{direction:'ascending'}));act(r,chief.key,'speechOrder',{direction:'descending'});
 assert.deepEqual(r.speechOrder,['id0','id8','id7','id6','id5','id4','id3','id2','id1']);assert.equal(viewRoom(r,chief.key).speaker,'id0');
 advance(r);const a=r.players[6],b=r.players[7];for(const p of r.players)act(r,p.key,'vote',{target:p.id===chief.id||p.id==='id0'?a.id:p.id==='id2'||p.id==='id3'?b.id:'pass'});advance(r);
 assert(!a.alive&&b.alive);assert(r.logs.some(l=>l.text.includes(a.seat+'号 2.5票')));
 r.phase='vote';r.voteRound=2;r.runoff=[chief.id,b.id];r.votes={};assert.equal(viewRoom(r,chief.key).canVote,false);assert.throws(()=>act(r,chief.key,'vote',{target:b.id}));assert.throws(()=>act(r,b.key,'vote',{target:chief.id}));assert.equal(viewRoom(r,'host').voteTotal,6);
});

test('a first-night killed elected sheriff transfers badge only after dawn, hunter shoots before badge handling',()=>{
 const r=sheriffFixture(),chief=person(r,'villager'),next=person(r,'seer');openElection(r,chief.id);nominate(r,[chief.id]);advance(r);assert(chief.alive&&r.sheriffId===chief.id);advance(r);
 assert.equal(r.phase,'badge');assert.equal(r.sheriffId,'');assert.equal(r.badgeFrom,chief.id);assert.throws(()=>act(r,next.key,'badge',{target:next.id}));assert.throws(()=>act(r,chief.key,'badge',{target:chief.id}));act(r,chief.key,'badge',{target:next.id});assert.equal(r.phase,'order');assert.equal(r.sheriffId,next.id);act(r,next.key,'speechOrder',{direction:'ascending'});assert.equal(r.phase,'speech');
 const h=sheriffFixture(),hunter=person(h,'hunter');openElection(h,hunter.id);nominate(h,[hunter.id]);advance(h);advance(h);assert.equal(h.phase,'hunter');act(h,hunter.key,'shoot',{target:'pass'});assert.equal(h.phase,'badge');act(h,hunter.key,'badge',{target:'pass'});assert.equal(h.phase,'speech');assert.equal(h.sheriffId,'');
});

test('exile, poison, hunter bullet and idiot revelation all handle the sheriff badge and rematch resets election',()=>{
 for(const cause of ['exile','poison','shot','idiot']){
  const r=sheriffFixture(12),chief=person(r,cause==='idiot'?'idiot':'villager');r.sheriffId=chief.id;r.day=2;
  if(cause==='exile'||cause==='idiot'){r.phase='vote';r.voteRound=1;r.players.filter(p=>p!==chief).forEach(p=>act(r,p.key,'vote',{target:chief.id}));advance(r);}
  if(cause==='poison'){r.phase='dawn';r.night.witch={kind:'poison',target:chief.id};advance(r);}
  if(cause==='shot'){const hunter=person(r,'hunter');hunter.alive=false;r.phase='hunter';r.hunter=hunter.id;r.afterHunter='speech';act(r,hunter.key,'shoot',{target:chief.id});}
  assert.equal(r.phase,'badge');assert.equal(r.badgeFrom,chief.id);assert.equal(chief.alive,cause==='idiot');
  if(cause==='idiot')assert.throws(()=>act(r,chief.key,'badge',{target:chief.id}));
  act(r,'host','badge',{target:'pass'});assert.equal(r.sheriffId,'');assert.equal(r.phase,cause==='exile'||cause==='idiot'?'dusk':'speech');
  r.phase='ended';r.election={choices:{id0:true},candidates:['id0'],withdrawn:[],runoff:[],votes:{},round:1,done:true};act(r,'host','rematch');assert.equal(r.setup.sheriff,true);assert.equal(r.sheriffId,'');assert.equal(r.election,undefined);
 }
});

test('wolf self knife can be healed, seer check remains private and dead sheriff cannot vote',()=>{
 const r=fixture(9),wolf=person(r,'wolf');finishNight(r,{kill:wolf.id,kind:'heal'});assert(wolf.alive);assert.equal(r.medicine.heal,false);
 r.phase='vote';r.voteRound=1;r.sheriffId=wolf.id;wolf.alive=false;assert.throws(()=>act(r,wolf.key,'vote',{target:'pass'}));
});

test('seat changes require consent, reset readiness, preserve sessions and reject stale or started actions',()=>{
 const r=initialRoom('seats','host','法官',6,''),keys=['a','b','c'];
 keys.forEach((key,i)=>act(r,key,'join',{name:key,newId:key,seat:i+2}));
 assert.equal(viewRoom(r,'a').me.seat,2);assert.deepEqual(viewRoom(r,'outsider').freeSeats,[1,5,6]);
 assert.throws(()=>act(r,'d','join',{name:'d',newId:'d',seat:2}));
 for(const seat of [2,3,0,7,1.5,'1'])assert.throws(()=>act(r,'a','seatMove',{seat}));
 act(r,'a','ready',{ready:true});act(r,'a','seatMove',{seat:1});assert.equal(viewRoom(r,'a').me.seat,1);assert.equal(viewRoom(r,'a').me.ready,false);
 act(r,'a','ready',{ready:true});act(r,'b','ready',{ready:true});const stale=r.epoch;
 act(r,'a','seatSwapRequest',{target:'b'});assert.equal(viewRoom(r,'c').seatSwaps.length,0);assert.equal(viewRoom(r,'host').seatSwaps.length,1);
 assert(r.players.filter(p=>['a','b'].includes(p.id)).every(p=>!p.ready));assert.equal(viewRoom(r,'a').me.seat,1);
 assert.throws(()=>act(r,'c','seatSwapRespond',{from:'a',accept:true}));assert.throws(()=>act(r,'host','seatSwapRespond',{from:'a',accept:true}));
 assert.throws(()=>act(r,'c','seatSwapRequest',{target:'b'}));assert.throws(()=>mutate(r,'b',{action:'seatSwapRespond',from:'a',accept:true,epoch:stale}));
 assert.throws(()=>act(r,'host','deal'));act(r,'b','seatSwapRespond',{from:'a',accept:true});
 assert.equal(viewRoom(r,'a').me.seat,3);assert.equal(viewRoom(r,'b').me.seat,1);assert(r.players.every(p=>p.role===''));assert.equal(r.seatSwaps.length,0);
 act(r,'a','seatSwapRequest',{target:'b'});act(r,'b','seatSwapRespond',{from:'a',accept:false});assert.equal(viewRoom(r,'a').me.seat,3);
 act(r,'a','seatSwapRequest',{target:'b'});act(r,'a','seatSwapCancel');assert.equal(r.seatSwaps.length,0);
 act(r,'a','seatSwapRequest',{target:'b'});act(r,'b','leave');assert.equal(r.seatSwaps.length,0);assert.equal(viewRoom(r,'b').phase,'join');
 act(r,'b','join',{name:'b',newId:'b2',seat:1});assert.equal(viewRoom(r,'b').me.id,'b2');
 r.phase='deal';for(const action of ['leave','seatMove','seatSwapRequest','seatSwapRespond','seatSwapCancel'])assert.throws(()=>act(r,'a',action,{seat:5,target:'b2',from:'b2',accept:true}));
});

test('wolf explosion exposes only the exploding wolf, skips exile, rejects unsafe timing and handles a sheriff badge',()=>{
 for(const phase of ['speech','order','runoffSpeech']){
  const r=fixture(9),wolf=person(r,'wolf'),civil=person(r,'villager');r.phase=phase;r.day=1;
  assert.equal(viewRoom(r,wolf.key).canExplode,true);assert.equal(viewRoom(r,civil.key).canExplode,false);
  assert.throws(()=>act(r,civil.key,'explode'));assert.throws(()=>act(r,'host','explode'));act(r,wolf.key,'explode');
  assert(!wolf.alive&&wolf.exploded);assert.equal(r.phase,'explosion');assert.deepEqual(viewRoom(r,civil.key).players.filter(p=>'role' in p).map(p=>p.id),[wolf.id]);
  assert.throws(()=>act(r,wolf.key,'explode'));advance(r);assert.equal(r.day,2);assert.equal(r.phase,'wolves');
 }
 for(const phase of ['lobby','deal','wolves','seer','witch','dawn','sheriffSignup','vote','sheriffVote','hunter','badge','dusk','ended']){
  const r=sheriffFixture();r.phase=phase;assert.throws(()=>act(r,person(r,'wolf').key,'explode'));assert.equal(viewRoom(r,person(r,'wolf').key).canExplode,false);
 }
 const r=sheriffFixture(),wolf=person(r,'wolf'),civil=person(r,'villager');r.phase='speech';r.sheriffId=wolf.id;act(r,wolf.key,'explode');assert.equal(r.phase,'badge');act(r,wolf.key,'badge',{target:civil.id});assert.equal(r.phase,'explosion');assert.equal(r.sheriffId,civil.id);
 const last=fixture(9);last.players.filter(p=>p.role==='wolf').slice(1).forEach(p=>p.alive=false);last.phase='speech';act(last,person(last,'wolf').key,'explode');assert.equal(last.winner,'好人');assert.equal(last.phase,'ended');
});

test('single police explosion settles pending deaths and hunter skill before next night and permanently removes election',()=>{
 const r=sheriffFixture(),wolf=person(r,'wolf'),hunter=person(r,'hunter'),seer=person(r,'seer');
 openElection(r,hunter.id);nominate(r,[wolf.id,seer.id]);act(r,wolf.key,'explode');
 assert(!hunter.alive);assert.equal(r.phase,'hunter');assert(r.election.done);assert.equal(r.sheriffId,'');
 act(r,hunter.key,'shoot',{target:'pass'});assert.equal(r.phase,'explosion');advance(r);assert.equal(r.day,2);
 advance(r);advance(r);advance(r);assert.equal(r.phase,'dawn');advance(r);assert.equal(r.phase,'speech');
});

test('double police explosion retains original signup and withdrawals; second explosion removes election',()=>{
 const r=sheriffFixture(12);r.setup.sheriffExplosion='double';const wolves=r.players.filter(p=>p.role==='wolf'),seer=person(r,'seer'),witch=person(r,'witch');
 openElection(r);nominate(r,[wolves[0].id,seer.id,witch.id]);act(r,witch.key,'withdraw');const choices={...r.election.choices};
 act(r,wolves[0].key,'explode');assert.equal(r.phase,'explosion');assert(!r.election.done&&r.election.interrupted);advance(r);advance(r);advance(r);advance(r);
 assert.equal(r.phase,'sheriffSpeech');assert.deepEqual(r.election.choices,choices);assert.deepEqual(r.election.withdrawn,[witch.id]);assert.deepEqual(viewRoom(r,'host').sheriff.active,[seer.id]);
 act(r,wolves[1].key,'explode');assert.equal(r.phase,'explosion');assert(r.election.done);assert.equal(r.election.explosions,2);advance(r);advance(r);advance(r);advance(r);assert.equal(r.phase,'dawn');
 const elected=sheriffFixture();elected.setup.sheriffExplosion='double';const w=person(elected,'wolf'),s=person(elected,'seer');openElection(elected);nominate(elected,[w.id,s.id]);act(elected,w.key,'explode');advance(elected);advance(elected);advance(elected);advance(elected);advance(elected);assert.equal(elected.sheriffId,s.id);assert.equal(elected.phase,'dawn');
 for(const invalid of ['unknown',true,[],null])assert.throws(()=>resolveConfig(9,{...recommendedConfig(9),sheriffExplosion:invalid}));
});
