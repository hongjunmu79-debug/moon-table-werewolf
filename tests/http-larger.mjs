import assert from 'node:assert/strict';
const endpoint=process.env.TEST_URL||'http://127.0.0.1:8088/api/room';
async function post(actor,body){
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(actor.cookie?{Cookie:actor.cookie}:{})},body:JSON.stringify(body)});
 const data=await response.json();const cookie=response.headers.get('set-cookie')?.split(';')[0];if(cookie)actor.cookie=cookie;
 return {status:response.status,data};
}
async function get(actor,id){const response=await fetch(endpoint+'?id='+id,{headers:actor.cookie?{Cookie:actor.cookie}:{}});assert.equal(response.status,200);return response.json();}
const custom={mode:'custom',roles:{wolf:3,villager:4,seer:1,witch:1,hunter:1,guard:1,idiot:1},victory:'edge',witchSelfSave:'firstNight'};
for(const [size,setup] of [[10,{mode:'recommended',preset:'classic'}],[11,{mode:'recommended',preset:'classic'}],[12,{mode:'recommended',preset:'classic'}],[12,{mode:'recommended',preset:'guard'}],[12,custom]]){
 const host={cookie:''},created=await post(host,{action:'create',name:'扩展验收法官',size,setup});assert.equal(created.status,200,JSON.stringify(created.data));
 const id=created.data.id,peers=[];
 for(let i=0;i<size;i++){const actor={cookie:''},joined=await post(actor,{action:'join',id,name:'验收玩家'+(i+1)});assert.equal(joined.status,200);peers.push(actor);}
 async function act(actor,action,args={}){const state=await get(actor,id),response=await post(actor,{id,action,epoch:state.epoch,...args});assert.equal(response.status,200,JSON.stringify(response.data));return response.data;}
 async function advance(){return act(host,'advance');}
 for(const actor of peers)await act(actor,'ready',{ready:true});await act(host,'deal');
 let state=await get(host,id);for(const [role,n] of Object.entries(state.setup.roles))assert.equal(state.players.filter(p=>p.role===role).length,n);
 assert.equal(state.players.length,size);const byId=new Map();
 for(const actor of peers){actor.view=await get(actor,id);byId.set(actor.view.me.id,actor);assert(actor.view.players.every(p=>!('role' in p)));assert(actor.view.me.role);await act(actor,'ack');}
 const outsider=await get({},id);assert.equal(outsider.phase,'join');assert(!('players' in outsider));assert(!JSON.stringify(outsider).includes('hostKey'));
 await advance();state=await get(host,id);const victim=state.players.find(p=>p.role==='villager');
 const guard=state.players.find(p=>p.role==='guard'),idiot=state.players.find(p=>p.role==='idiot');
 if(guard){assert.equal(state.phase,'guard');for(const actor of peers)assert.equal((await get(actor,id)).phase,'night');await act(byId.get(guard.id),'nightAction',{target:victim.id});await advance();}
 for(const p of state.players.filter(p=>p.role==='wolf'))await act(byId.get(p.id),'nightAction',{target:guard?victim.id:'pass'});await advance();
 const seer=state.players.find(p=>p.role==='seer');if(seer)await act(byId.get(seer.id),'nightAction',{target:'pass'});await advance();
 const witch=state.players.find(p=>p.role==='witch');if(witch)await act(byId.get(witch.id),'nightAction',{kind:'pass'});await advance();
 state=await get(host,id);assert(state.players.every(p=>p.alive));await advance();state=await get(host,id);assert(state.players.every(p=>p.alive));
 await advance();for(const actor of peers)await act(actor,'vote',{target:idiot&&actor.view.me.id!==idiot.id?idiot.id:'pass'});await advance();
 if(idiot){const revealed=await get(byId.get(idiot.id),id);assert(revealed.me.alive&&revealed.me.idiotRevealed);assert.equal(revealed.voteTotal,size-1);assert.deepEqual(revealed.players.filter(p=>'role' in p).map(p=>p.role),['idiot']);}
 await advance();state=await get(host,id);
 if(guard){const actor=byId.get(guard.id),rejected=await post(actor,{id,action:'nightAction',epoch:state.epoch,target:victim.id});assert.equal(rejected.status,400);await act(actor,'nightAction',{target:'pass'});await advance();}
 const stranger=peers.find(p=>p.view.me.role==='villager'),publicState=await get(stranger,id);
 assert.equal(publicState.hostNight,null);assert.deepEqual(publicState.wolfVotes,{});assert.equal(publicState.guardLast,'');assert.equal(publicState.victim,'');
 console.log('PASS: '+size+' players + judge; '+setup.mode+' '+(setup.preset||'custom')+'; independent sessions, roles, night settlement, voting, and privacy');
}
