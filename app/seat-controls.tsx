import {useEffect,useState} from 'react';
type Props={room:any;busy:boolean;act:(action:string,args?:Record<string,unknown>)=>void;ask:(action:string,title:string,body:string,args?:Record<string,unknown>)=>void};
export default function SeatControls({room:r,busy,act,ask}:Props){
 const [emptySeat,setEmptySeat]=useState(''),[other,setOther]=useState('');
 useEffect(()=>{setEmptySeat('');setOther('');},[r.epoch]);
 const pending=r.seatSwaps||[],incoming=pending.find((s:any)=>s.to===r.me.id),outgoing=pending.find((s:any)=>s.from===r.me.id),person=(id:string)=>r.players.find((p:any)=>p.id===id),label=(id:string)=>person(id)?person(id).seat+' 号 '+person(id).name:'玩家';
 return <section className="seat-controls"><h3>开局前换位</h3><p className="muted small">可移到空座位，或申请与其他玩家互换。换位后需要重新准备。</p>
  {incoming?<div className="swap-notice"><p>{label(incoming.from)} 想与你换位。</p><div className="button-row"><button type="button" className="primary" disabled={busy} onClick={()=>ask('seatSwapRespond','接受换位？','与 '+label(incoming.from)+' 互换，双方重新准备。',{from:incoming.from,accept:true})}>接受换位</button><button type="button" className="secondary" disabled={busy} onClick={()=>act('seatSwapRespond',{from:incoming.from,accept:false})}>拒绝</button></div></div>:outgoing?<div className="swap-notice"><p>正在等待 {label(outgoing.to)} 确认换位。</p><button type="button" className="secondary full" disabled={busy} onClick={()=>act('seatSwapCancel')}>取消换位申请</button></div>:<>
   {r.freeSeats.length>0&&<><label>移到空座位<select className="field" value={emptySeat} onChange={e=>setEmptySeat(e.target.value)}><option value="">选择空座位</option>{r.freeSeats.map((seat:number)=><option key={seat} value={seat}>{seat} 号 · 空座位</option>)}</select></label><button type="button" className="secondary full" disabled={busy||!emptySeat} onClick={()=>act('seatMove',{seat:Number(emptySeat)})}>移到选定空位</button></>}
   {r.players.length>1&&<><label>与玩家互换<select className="field" value={other} onChange={e=>setOther(e.target.value)}><option value="">选择要互换的玩家</option>{r.players.filter((p:any)=>p.id!==r.me.id).map((p:any)=><option key={p.id} value={p.id}>{p.seat} 号 · {p.name}</option>)}</select></label><button type="button" className="secondary full" disabled={busy||!other} onClick={()=>act('seatSwapRequest',{target:other})}>发送换位申请</button></>}
  </>}
 </section>;
}
