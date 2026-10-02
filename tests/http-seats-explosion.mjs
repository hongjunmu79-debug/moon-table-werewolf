import assert from 'node:assert/strict';
const endpoint=process.env.TEST_URL||'http://127.0.0.1:8088/api/room';
async function post(actor,body){const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(actor.cookie?{Cookie:actor.cookie}:{})},body:JSON.stringify(body)});const data=await res.json(),cookie=res.headers.get('set-cookie')?.split(';')[0];if(cookie)actor.cookie=cookie;return {status:res.status,data};}
async function get(actor,id){const res=await fetch(endpoint+'?id='+id,{headers:actor.cookie?{Cookie:actor.cookie}:{}});assert.equal(res.status,200);return res.json();}
for(const mode of ['single','double','day']){
 const host={},created=await post(host,{action:'create',size:12,name:'自爆换位校验法官',setup:{mode:'recommended',sheriff:mode!=='day',sheriffExplosion:mode==='double'?'double':'single'}});assert.equal(created.status,200);const id=created.data.id,peers=[];
 async function act(actor,action,args={}){const state=await get(actor,id),response=await post(actor,{id,action,epoch:state.epoch,...args});assert.equal(response.status,200,JSON.stringify(response.data));return response.data;}
 const advance=()=>act(host,'advance');
 for(let i=0;i<12;i++){const p={};const joined=await post(p,{id,action:'join',name:'校验'+(i+1),seat:12-i});assert.equal(joined.status,200);p.id=joined.data.me.id;peers.push(p);await act(p,'ready',{ready:true});}
 let a=await get(peers[0],id),b=await get(peers[1],id);const stale=a.epoch;
 await act(peers[0],'seatSwapRequest',{target:b.me.id});a=await get(peers[0],id);b=await get(peers[1],id);assert(!a.me.ready&&!b.me.ready);assert.equal((await get(peers[2],id)).seatSwaps.length,0);
 assert.equal((await post(peers[2],{id,action:'seatSwapRespond',epoch:a.epoch,from:a.me.id,accept:true})).status,400);
 assert.equal((await post(peers[1],{id,action:'seatSwapRespond',epoch:stale,from:a.me.id,accept:true})).status,400);
 assert.equal((await post(host,{id,action:'deal',epoch:a.epoch})).status,400);
 await act(peers[1],'seatSwapRespond',{from:a.me.id,accept:true});assert.equal((await get(peers[0],id)).me.seat,11);assert.equal((await get(peers[1],id)).me.seat,12);
 await act(peers[0],'seatSwapRequest',{target:b.me.id});await act(peers[0],'seatSwapCancel');
 await act(peers[0],'leave');a=await get(peers[0],id);assert.equal(a.phase,'join');assert(a.freeSeats.includes(11));assert(!('players' in a));
 const moved=await act(peers[1],'seatMove',{seat:11});assert.equal(moved.me.seat,11);
 const rejoined=await post(peers[0],{id,action:'join',name:'校验1',seat:12});assert.equal(rejoined.status,200);peers[0].id=rejoined.data.me.id;
 await act(peers[0],'ready',{ready:true});await act(peers[1],'ready',{ready:true});await act(host,'deal');let state=await get(host,id);const actors=new Map(peers.map(p=>[p.id,p]));
 for(const p of peers){const view=await get(p,id);assert(view.players.every(x=>!('role' in x)));await act(p,'ack');}
 assert.equal((await post(peers[0],{id,action:'leave',epoch:state.epoch})).status,400);
 const wolves=state.players.filter(p=>p.role==='wolf'),seer=state.players.find(p=>p.role==='seer'),hunter=state.players.find(p=>p.role==='hunter');
 await advance();await advance();await advance();await advance();state=await get(host,id);
 if(mode!=='day'){
  assert.equal(state.phase,'sheriffSignup');for(const p of peers)await act(p,'sheriffSignup',{run:p.id===seer.id||p.id===wolves[0].id});await advance();
 }else{assert.equal(state.phase,'dawn');await advance();}
 state=await get(host,id);assert.equal((await get(actors.get(wolves[0].id),id)).canExplode,true);
 const civilian=state.players.find(p=>p.role==='villager');assert.equal((await post(actors.get(civilian.id),{id,action:'explode',epoch:state.epoch})).status,400);
 await act(actors.get(wolves[0].id),'explode');state=await get(host,id);assert.equal(state.phase,'explosion');assert(!state.players.find(p=>p.id===wolves[0].id).alive);
 const privateView=await get(actors.get(civilian.id),id);assert.deepEqual(privateView.players.filter(p=>'role' in p).map(p=>p.id),[wolves[0].id]);assert.equal(privateView.hostNight,null);assert.equal(privateView.victim,'');
 assert.equal((await post(actors.get(wolves[0].id),{id,action:'explode',epoch:state.epoch})).status,400);
 await advance();await advance();await advance();await advance();state=await get(host,id);
 if(mode==='double'){
  assert.equal(state.phase,'sheriffSpeech');assert.deepEqual(state.sheriff.active,[seer.id]);await act(actors.get(wolves[1].id),'explode');await advance();await advance();await advance();await advance();state=await get(host,id);
 }
 assert.equal(state.phase,'dawn');assert.equal(state.sheriffId,'');await advance();assert.equal((await get(host,id)).phase,'speech');
 console.log(`PASS: HTTP 12-player ${mode}: consented seats, cancellation/rejoin, blocked stale actions, private identities and explosion transition`);
}
