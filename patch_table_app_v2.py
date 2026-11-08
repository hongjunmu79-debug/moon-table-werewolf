import re

content = open("app/table-app.tsx", "r", encoding="utf-8").read()

# Add HoldToExplodeButton definition right before TableApp
hold_button_code = """function HoldToExplodeButton({ onExplode, disabled }: { onExplode: () => void; disabled: boolean }) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<any>(null);
  const startRef = useRef(0);

  const start = () => {
    if (disabled) return;
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(100, (elapsed / 2000) * 100);
      setProgress(pct);
      if (elapsed >= 2000) {
        clearInterval(timerRef.current);
        setProgress(0);
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        onExplode();
      }
    }, 40);
  };

  const cancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(0);
  };

  return (
    <div className="explode-control">
      <p className="muted small">
        💣 存活狼人可随时自爆：长按 2 秒触发，立即中断白天发言与语音，直接进入天黑。
      </p>
      <button
        type="button"
        disabled={disabled}
        onMouseDown={start}
        onMouseUp={cancel}
        onMouseLeave={cancel}
        onTouchStart={start}
        onTouchEnd={cancel}
        className="danger full relative overflow-hidden select-none py-3"
      >
        <div
          className="absolute left-0 top-0 bottom-0 bg-red-700/60 transition-all pointer-events-none"
          style={{ width: `${progress}%` }}
        />
        <span className="relative z-10 font-bold flex items-center justify-center gap-2">
          <span>💣 长按 2 秒自爆</span>
          {progress > 0 && <span className="text-xs font-mono">({Math.round(progress)}%)</span>}
        </span>
      </button>
    </div>
  );
}

export default function TableApp(){"""

content = content.replace("export default function TableApp(){", hold_button_code)

# Add WakeLock hook state inside TableApp
old_state = "const [preferredSeat,setPreferredSeat]=useState('0'),[gameType,setGameType]=useState<'avalon'|'werewolf'>('avalon'),[showConsole,setShowConsole]=useState(false);"
new_state = "const [preferredSeat,setPreferredSeat]=useState('0'),[gameType,setGameType]=useState<'avalon'|'werewolf'>('avalon'),[showConsole,setShowConsole]=useState(false),[wakeLocked,setWakeLocked]=useState(false);"
content = content.replace(old_state, new_state)

# Add WakeLock effect
wakelock_effect = """  useEffect(()=>{
    let sentinel:any=null;
    const requestLock=async()=>{
      if(typeof navigator!=='undefined'&&'wakeLock' in navigator&&document.visibilityState==='visible'){
        try{sentinel=await (navigator as any).wakeLock.request('screen');setWakeLocked(true);sentinel.addEventListener('release',()=>setWakeLocked(false));}catch{setWakeLocked(false);}
      }
    };
    void requestLock();
    const onVis=()=>{
      if(document.visibilityState==='visible'){void requestLock();if(id)void refresh(id);}
    };
    document.addEventListener('visibilitychange',onVis);
    return ()=>{document.removeEventListener('visibilitychange',onVis);if(sentinel)sentinel.release();};
  },[id]);"""

content = content.replace("useEffect(()=>{const room=new URLSearchParams(location.search).get('room')||'';setId(room);setLoaded(true);},[]);",
                       "useEffect(()=>{const room=new URLSearchParams(location.search).get('room')||'';setId(room);setLoaded(true);},[]);\n" + wakelock_effect)

# Update night check & nightLeft countdown
old_night_vars = "const isRoom=r&&r.phase!=='join',me=r?.me,players:any[]=r?.players||[],night=['night','guard','wolves','seer','witch','dawn'].includes(r?.phase);"
new_night_vars = """const isRoom=r&&r.phase!=='join',me=r?.me,players:any[]=r?.players||[],night=['night','guard','wolves','seer','witch','dawn'].includes(r?.phase);
 const isNightOled=r?.gameType==='werewolf'&&['night','guard','wolves','seer','witch'].includes(r?.phase);
 const nightLeft=(isNightOled&&r?.deadline)?Math.max(0,Math.ceil((r.deadline-now)/1000)):0;"""
content = content.replace(old_night_vars, new_night_vars)

# Update host advance button with countdown
old_advance_btn = """  {advanceLabel[r?.phase]&&<button className="primary full" disabled={busy||(r.phase==='deal'&&players.some(p=>!p.ack))} onClick={advance}>{advanceLabel[r.phase]} <ArrowRight size={18}/></button>}"""
new_advance_btn = """  {isNightOled&&nightLeft>0&&<div className="night-timer-bar"><span>🌙 夜间读秒保护中：</span><b className="text-amber-400 font-mono">{nightLeft}s</b><span className="text-[11px] text-slate-400">（防秒过抿身份）</span><button type="button" className="text-[11px] text-slate-500 hover:text-slate-300 ml-auto underline" onClick={()=>act('advance',{force:true})}>(紧急跳过)</button></div>}
  {advanceLabel[r?.phase]&&<button className="primary full" disabled={busy||(r.phase==='deal'&&players.some(p=>!p.ack))||(isNightOled&&nightLeft>0)} onClick={advance}>{isNightOled&&nightLeft>0?`夜间读秒保护 (${nightLeft}s)`:advanceLabel[r.phase]} <ArrowRight size={18}/></button>}"""
content = content.replace(old_advance_btn, new_advance_btn)

# Update main room container class with oled-night
content = content.replace('isRoom?<main className="room">', "isRoom?<main className={'room '+(isNightOled?'oled-night':'')}>")

# Update header with wakeLock indicator
old_header_sync = "{isRoom&&<span className={'sync '+(now-synced>10000?'offline':'')}>{now-synced>10000?'正在重新连接':'房间已同步'}</span>}"
new_header_sync = "{wakeLocked&&<span className=\"pill text-[10px] text-emerald-400 border-emerald-500/40\">🔆 屏幕常亮</span>}{isRoom&&<span className={'sync '+(now-synced>10000?'offline':'')}>{now-synced>10000?'正在重新连接':'房间已同步'}</span>}"
content = content.replace(old_header_sync, new_header_sync)

# Update canExplode button to HoldToExplodeButton
old_explode = """  {r.canExplode&&<div className="explode-control"><p className="muted small">自爆将公开你的狼人身份并结束本轮白天。投票开始后不可自爆。</p><button className="danger full" disabled={busy} onClick={()=>ask('explode','确认狼人自爆？','你会立即公开狼人身份并出局，跳过本轮放逐。'+(r.phase==='sheriffSpeech'?(r.setup.sheriffExplosion==='double'?'本桌采用双爆吞警徽。':'本桌采用单爆吞警徽。'):''))}>狼人自爆</button></div>}"""
new_explode = """  {r.canExplode&&<HoldToExplodeButton disabled={busy} onExplode={()=>ask('explode','确认狼人自爆？','你会立即公开狼人身份并出局，跳过本轮放逐。'+(r.phase==='sheriffSpeech'?(r.setup.sheriffExplosion==='double'?'本桌采用双爆吞警徽。':'本桌采用单爆吞警徽。'):''))}/>}"""
content = content.replace(old_explode, new_explode)

open("app/table-app.tsx", "w", encoding="utf-8").write(content)
print("Updated app/table-app.tsx successfully!")
