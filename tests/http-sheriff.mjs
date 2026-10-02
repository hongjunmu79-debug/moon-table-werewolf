import assert from 'node:assert/strict';
const endpoint=process.env.TEST_URL||'http://127.0.0.1:8088/api/room';
async function post(actor,body){const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(actor.cookie?{Cookie:actor.cookie}:{})},body:JSON.stringify(body)});const data=await response.json();const cookie=response.headers.get('set-cookie')?.split(';')[0];if(cookie)actor.cookie=cookie;return {status:response.status,data};}
async function get(actor,id){const response=await fetch(endpoint+'?id='+id,{headers:actor.cookie?{Cookie:actor.cookie}:{}});assert.equal(response.status,200);return response.json();}
for(const [size,variant] of [[9,'selfsave'],[10,'unique'],[11,'tie'],[12,'dead-chief'],[12,'guard']]){
 const host={},setup={mode:'recommended',preset:variant==='guard'?'guard':'classic',sheriff:true,witchSelfSave:variant==='selfsave'?'always':'firstNight'};
 const created=await post(host,{action:'create',size,name:'规则校验法官',setup});assert.equal(created.status,200,JSON.stringify(created.data));const id=created.data.id,peers=[];
 async function act(actor,action,args={}){const state=await get(actor,id),response=await post(actor,{id,action,epoch:state.epoch,...args});assert.equal(response.status,200,JSON.stringify(response.data));return response.data;}
 const advance=()=>act(host,'advance');
 for(let i=0;i<size;i++){const p={};const joined=await post(p,{id,action:'join',name:'规则玩家'+(i+1)});assert.equal(joined.status,200);peers.push(p);await act(p,'ready',{ready:true});}
 await act(host,'deal');let state=await get(host,id);assert.equal(state.setup.victory,'edge');assert.equal(state.setup.witchSelfSave,setup.witchSelfSave);const actors=new Map();
 for(const p of peers){p.view=await get(p,id);actors.set(p.view.me.id,p);assert(p.view.players.every(x=>!('role' in x)));await act(p,'ack');}
 const chief=state.players.find(p=>p.role==='villager'),seer=state.players.find(p=>p.role==='seer'),witch=state.players.find(p=>p.role==='witch'),guard=state.players.find(p=>p.role==='guard');
 await advance();if(guard){await act(actors.get(guard.id),'nightAction',{target:'pass'});await advance();}
 for(const wolf of state.players.filter(p=>p.role==='wolf'))await act(actors.get(wolf.id),'nightAction',{target:variant==='selfsave'?witch.id:variant==='dead-chief'?chief.id:'pass'});
 await advance();await act(actors.get(seer.id),'nightAction',{target:'pass'});await advance();
 if(variant==='selfsave'){const view=await get(actors.get(witch.id),id);assert(view.canSelfSave);await act(actors.get(witch.id),'nightAction',{kind:'heal'});}else await act(actors.get(witch.id),'nightAction',{kind:'pass'});
 await advance();state=await get(host,id);assert.equal(state.phase,'sheriffSignup');assert(state.players.every(p=>p.alive));
 const candidates=variant==='tie'?state.players.slice(0,3).map(p=>p.id):[chief.id,seer.id];
 for(const p of peers)await act(p,'sheriffSignup',{run:candidates.includes(p.view.me.id)});
 await advance();await act(actors.get(variant==='tie'?candidates[2]:seer.id),'withdraw');await advance();
 if(variant==='tie'){
  state=await get(host,id);assert.equal(state.phase,'sheriffVote');const voters=peers.filter(p=>!candidates.includes(p.view.me.id));assert.equal(state.sheriff.voteTotal,8);
  for(const actor of peers.filter(p=>candidates.includes(p.view.me.id))){const rejected=await post(actor,{id,action:'sheriffVote',epoch:state.epoch,target:candidates[0]});assert.equal(rejected.status,400);}
  for(const [i,p] of voters.entries())await act(p,'sheriffVote',{target:candidates[i%2]});await advance();state=await get(host,id);assert.equal(state.phase,'sheriffSpeech');assert.equal(state.sheriff.round,2);await advance();
  for(const [i,p] of voters.entries())await act(p,'sheriffVote',{target:candidates[i%2]});await advance();state=await get(host,id);assert.equal(state.sheriffId,'');
 }else{state=await get(host,id);assert.equal(state.sheriffId,chief.id);}
 assert.equal(state.phase,'dawn');assert(state.players.every(p=>p.alive));const privateView=await get(actors.get(chief.id),id);assert.equal(privateView.hostNight,null);assert.equal(privateView.victim,'');await advance();state=await get(host,id);
 if(variant==='dead-chief'){assert.equal(state.phase,'badge');assert(!state.players.find(p=>p.id===chief.id).alive);await act(actors.get(chief.id),'badge',{target:seer.id});state=await get(host,id);assert.equal(state.sheriffId,seer.id);}
 if(state.phase==='order'){await act(actors.get(state.sheriffId),'speechOrder',{direction:'descending'});state=await get(host,id);assert.equal(state.speechOrder.at(-1),state.sheriffId);}
 assert.equal(state.phase,'speech');if(variant==='selfsave')assert(state.players.find(p=>p.id===witch.id).alive);
 await advance();state=await get(host,id);for(const p of peers){const view=await get(p,id);if(view.canVote)await act(p,'vote',{target:'pass'});}await advance();await advance();state=await get(host,id);
 if(guard){await act(actors.get(guard.id),'nightAction',{target:'pass'});await advance();}
 if(variant==='selfsave'){
  for(const wolf of state.players.filter(p=>p.role==='wolf'))await act(actors.get(wolf.id),'nightAction',{target:witch.id});await advance();await advance();const view=await get(actors.get(witch.id),id);assert(view.canSelfSave);assert.equal(view.medicine.heal,false);
 }
 const outsider=await get({},id);assert(!('players' in outsider));console.log(`PASS: ${size} players + judge; sheriff ${variant}; independent sessions, hidden first-night deaths, election, badge and direction`);
}
