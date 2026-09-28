import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:8080/api/room';
async function post(body,cookie=''){const res=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});const data=await res.json();return {status:res.status,data,cookie:res.headers.get('set-cookie')?.split(';')[0]||cookie,cache:res.headers.get('cache-control')};}
let host=await post({action:'create',name:'自动验收法官',size:9,voice:''});assert.equal(host.status,200,JSON.stringify(host.data));const id=host.data.id;
let peers=await Promise.all(Array.from({length:9},(_,i)=>post({action:'join',id,name:'验收'+(i+1)})));
for(let i=0;i<peers.length;i++){if(peers[i].status!==200)peers[i]=await post({action:'join',id,name:'验收'+(i+1)});assert.equal(peers[i].status,200);}
assert.equal(new Set(peers.map(x=>x.data.me.seat)).size,9);
const get=async cookie=>{const q=await fetch(base+'?id='+id,{headers:{Cookie:cookie}});return q.json();};
let state=await get(host.cookie);
const anonymous=await get('');assert.equal(anonymous.phase,'join');assert(!anonymous.players);
let prepared=await Promise.all(peers.map(p=>post({id,action:'ready',epoch:state.epoch,ready:true},p.cookie)));
for(let i=0;i<prepared.length;i++){if(prepared[i].status!==200)prepared[i]=await post({id,action:'ready',epoch:state.epoch,ready:true},peers[i].cookie);assert.equal(prepared[i].status,200);}
async function hostAct(action,args={}){state=await get(host.cookie);const q=await post({id,action,epoch:state.epoch,...args},host.cookie);assert.equal(q.status,200,JSON.stringify(q.data));state=q.data;return q;}
await hostAct('deal');
for(const p of peers){p.data=await get(p.cookie);assert.equal(p.data.players.filter(x=>x.role).length,0);assert(p.data.me.role);assert.equal((await post({id,action:'ack',epoch:state.epoch},p.cookie)).status,200);}
state=await get(host.cookie);
const old=state.epoch;
assert.equal((await post({id,action:'advance',epoch:old},peers[0].cookie)).status,400);
const race=await Promise.all([post({id,action:'advance',epoch:old},host.cookie),post({id,action:'advance',epoch:old},host.cookie)]);
assert.deepEqual(race.map(q=>q.status).sort(),[200,400]);
state=await get(host.cookie);assert.equal(state.phase,'wolves');
const failedOrigin=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://attacker.example',Cookie:host.cookie},body:JSON.stringify({id,action:'advance',epoch:state.epoch})});assert([400,403].includes(failedOrigin.status));
for(let round=0;round<3;round++){
 if(round)await hostAct('advance');
 for(const p of peers){const v=await get(p.cookie);if(v.action==='wolves')assert.equal((await post({id,action:'nightAction',epoch:v.epoch,target:'pass'},p.cookie)).status,200);}
 await hostAct('advance');
 for(const p of peers){const v=await get(p.cookie);if(v.action==='seer'){const other=v.players.find(x=>x.alive&&x.id!==v.me.id);assert.equal((await post({id,action:'nightAction',epoch:v.epoch,target:other.id},p.cookie)).status,200);}}
 const villager=peers.find(p=>p.data.me.role==='villager');assert.equal((await get(villager.cookie)).submitted,false);
 await hostAct('advance');
 for(const p of peers){const v=await get(p.cookie);if(v.action==='witch')assert.equal((await post({id,action:'nightAction',epoch:v.epoch,kind:'pass'},p.cookie)).status,200);}
 assert.equal((await get(villager.cookie)).submitted,false);
 await hostAct('advance');await hostAct('advance');assert.equal(state.phase,'speech');await hostAct('advance');
 const wolf=state.players.find(p=>p.alive&&p.role==='wolf');
 for(const p of peers){const v=await get(p.cookie);if(v.me.alive){assert.equal((await post({id,action:'vote',epoch:v.epoch,target:v.me.id===wolf.id?'pass':wolf.id},p.cookie)).status,200);}}
 await hostAct('advance');
}
assert.equal(state.phase,'ended');assert.equal(state.winner,'好人');
await hostAct('rematch');assert.equal(state.phase,'lobby');
console.log('PASS: 10 independent cookie sessions; simultaneous joins/readiness; private roles; CSRF and host authorization; duplicate-advance race; 3 complete nights/votes; good victory; rematch.');
console.log('Local test room: '+id);
