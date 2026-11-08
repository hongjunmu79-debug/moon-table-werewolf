const fs = require('fs');
let code = fs.readFileSync('D:/moon-table-werewolf/app/table-app.tsx', 'utf8');

// 1. Add secret note state & modal state
const stateInsert = `
  const [playerNotes, setPlayerNotes] = useState<Record<number, string>>(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem('moon_player_notes') || '{}'); } catch { return {}; }
    }
    return {};
  });
  const [noteSeat, setNoteSeat] = useState<number | null>(null);

  const saveNote = (seat: number, tag: string) => {
    const next = { ...playerNotes, [seat]: tag };
    setPlayerNotes(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('moon_player_notes', JSON.stringify(next));
    }
    setNoteSeat(null);
  };
`;
code = code.replace("const [confirm,setConfirm]=useState<Confirm|null>(null);", "const [confirm,setConfirm]=useState<Confirm|null>(null);" + stateInsert);

// 2. Villager bluff panel in night phase when not active role
const villagerBluffInsert = `
  {r.phase==='night'&&!r.action&&<div className="wait-state">
    <Moon size={38}/>
    <h3>{me?.alive?(r.nightMode==='openEyes'?'🌙 全员低头暗操进行中':'天黑，请闭眼'):'你已出局，安静观战'}</h3>
    {me?.alive && r.nightMode==='openEyes' ? (
      <div className="bluff-box p-3 bg-slate-900/90 border border-slate-800 rounded-xl my-2 text-left space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-300">🌙 夜间伪装占卜：盲猜本局狼人</span>
          <span className="text-[10px] text-slate-500">全桌同步低头点击</span>
        </div>
        <p className="text-[11px] text-slate-400">
          全员统一低头点击屏幕，平民不空白等待，杜绝闭眼场外。你的占卜纯属私密：
        </p>
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {r.players.filter((p:any)=>p.alive && p.id!==me.id).map((p:any)=>(
            <button
              key={p.id}
              onClick={()=>act('villagerBluff', { target: p.id })}
              className={\`p-1.5 rounded-lg border text-[11px] font-medium transition \${
                r.myBluff === p.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
              }\`}
            >
              {p.seat}号 {p.name.slice(0, 3)}
            </button>
          ))}
        </div>
        {r.myBluff && (
          <p className="text-[10px] text-emerald-400 text-center pt-1">
            已标记盲猜 {r.players.find((p:any)=>p.id===r.myBluff)?.seat} 号为狼人
          </p>
        )}
      </div>
    ) : (
      <p className="muted">轮到你时，操作会出现在这里。其他时间请不要透露信息。</p>
    )}
  </div>}
`;

code = code.replace(
  "{r.phase==='night'&&!r.action&&<div className=\"wait-state\"><Moon size={38}/><h3>{me?.alive?'天黑，请保持安静':'你已出局，安静观战'}</h3><p className=\"muted\">轮到你时，操作会出现在这里。其他时间请不要在语音房透露信息。</p></div>}",
  villagerBluffInsert
);

// 3. Make seat avatar/tag clickable to open Private Player Notes
const seatNoteInsert = `
  <div onClick={()=>setNoteSeat(i+1)} className="cursor-pointer" title="点击添加私密身份笔记">
    <span className="seat-num">{String(i+1).padStart(2,'0')}</span>
    {playerNotes[i+1] && (
      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/80 text-indigo-200 border border-indigo-700">
        {playerNotes[i+1]}
      </span>
    )}
  </div>
`;

code = code.replace(
  '<span className="seat-num">{String(i+1).padStart(2,\'0\')}</span>',
  seatNoteInsert
);

// 4. Modal for Private Player Note
const modalInsert = `
  {/* Private Note Modal */}
  <Dialog open={noteSeat !== null} onOpenChange={(open) => { if (!open) setNoteSeat(null); }}>
    <DialogContent className="max-w-xs bg-slate-900 border-slate-800 text-slate-200">
      <DialogHeader>
        <DialogTitle className="text-sm font-bold text-center">
          私密身份笔记 · {noteSeat} 号玩家
        </DialogTitle>
        <DialogDescription className="text-xs text-slate-400 text-center">
          仅自己可见，帮助你在手机上盘逻辑与标记阵营。
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-2 pt-2">
        {['好人?', '坏人!', '梅林?', '刺客/狼?', '神职?', '平民', '查杀!', '金水'].map((tag) => (
          <button
            key={tag}
            onClick={() => noteSeat && saveNote(noteSeat, tag)}
            className="py-2 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-slate-200 font-medium hover:bg-slate-700"
          >
            {tag}
          </button>
        ))}
      </div>
      <DialogFooter className="pt-2">
        <button
          onClick={() => noteSeat && saveNote(noteSeat, '')}
          className="w-full py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-400 hover:text-slate-200"
        >
          清除此玩家标记
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
`;

code = code.replace("</div>;</main>:null}", modalInsert + "</div>;</main>:null}");

fs.writeFileSync('D:/moon-table-werewolf/app/table-app.tsx', code, 'utf8');
console.log('table-app.tsx patched ok!');
