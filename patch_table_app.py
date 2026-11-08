import re

path = r"C:\Users\23715\.gemini\antigravity\scratch\moon-table-werewolf\app\table-app.tsx"
with open(path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add imports for MosaicoConsole and AvalonView
import_stmt = """import MosaicoConsole from './mosaico-console';
import AvalonView from './avalon-view';
import { Cpu, Gamepad2, Wifi } from 'lucide-react';
"""
code = code.replace("import SeatControls from './seat-controls';", "import SeatControls from './seat-controls';\n" + import_stmt)

# 2. Add state for gameType and showConsole
old_state = "const [preferredSeat,setPreferredSeat]=useState('0');"
new_state = "const [preferredSeat,setPreferredSeat]=useState('0'),[gameType,setGameType]=useState<'avalon'|'werewolf'>('avalon'),[showConsole,setShowConsole]=useState(false);"
code = code.replace(old_state, new_state)

# 3. Add console toggle in header
old_header_actions = '<div className="header-actions">'
new_header_actions = """<div className="header-actions">
{isRoom && (
  <button 
    onClick={() => setShowConsole(!showConsole)} 
    className="flex items-center gap-1.5 text-xs bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full transition shadow"
    title="切换 ESP32 MOSAicO 480x480 AMOLED 桌面电子法官公屏"
  >
    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
    <span>ESP32 主机公屏</span>
  </button>
)}"""
code = code.replace(old_header_actions, new_header_actions)

# 4. In create room form, add gameType selection and appropriate sizes (5~10 for Avalon, 6~12 for Werewolf)
old_create_panel = '<div className="panel-top"><span className="eyebrow">NEW TABLE</span><span className="pill">法官建房</span></div><h2>开一桌</h2><p className="muted">建好房间，把邀请链接发到语音房。</p>'
new_create_panel = """<div className="panel-top"><span className="eyebrow">NEW TABLE</span><span className="pill">法官建房</span></div>
<h2>开一桌</h2>
<p className="muted">建好房间，把邀请链接发到语音房或放在桌中央。</p>
<div className="game-type-selector mb-4">
  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">选择桌游类型</label>
  <div className="grid grid-cols-2 gap-2">
    <button
      type="button"
      onClick={() => { setGameType('avalon'); setSize('7'); }}
      className={`p-3 rounded-xl border text-left transition ${
        gameType === 'avalon'
          ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold shadow'
          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
      }`}
    >
      <div className="flex items-center gap-1.5 text-indigo-300 mb-1">
        <Wifi className="w-4 h-4 text-emerald-400" />
        <span className="text-sm">阿瓦隆 (Avalon)</span>
      </div>
      <p className="text-[11px] font-normal text-slate-300">5–10 人 · 推荐搭配 10 张白卡/NC卡</p>
    </button>
    <button
      type="button"
      onClick={() => { setGameType('werewolf'); setSize('9'); }}
      className={`p-3 rounded-xl border text-left transition ${
        gameType === 'werewolf'
          ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold shadow'
          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
      }`}
    >
      <div className="flex items-center gap-1.5 text-amber-300 mb-1">
        <Gamepad2 className="w-4 h-4 text-amber-400" />
        <span className="text-sm">狼人杀 (Werewolf)</span>
      </div>
      <p className="text-[11px] font-normal text-slate-300">6–12 人 · 经典屠边/预女猎守</p>
    </button>
  </div>
</div>"""
code = code.replace(old_create_panel, new_create_panel)

# Update form submit to pass gameType
old_submit = "act('create',{name,size:Number(size),voice,setup});"
new_submit = "act('create',{name,size:Number(size),voice,setup:gameType==='avalon'?{gameType:'avalon'}:setup,gameType});"
code = code.replace(old_submit, new_submit)

# Update player size options depending on gameType
old_size_select = "<SelectContent>{PLAYER_SIZES.map(n=><SelectItem key={n} value={String(n)}>{n} 人局 · 不含法官</SelectItem>)}</SelectContent>"
new_size_select = """<SelectContent>
{(gameType==='avalon'?[5,6,7,8,9,10]:PLAYER_SIZES).map(n=><SelectItem key={n} value={String(n)}>{n} 人局 · 不含法官</SelectItem>)}
</SelectContent>"""
code = code.replace(old_size_select, new_size_select)

# Hide SetupEditor when gameType === 'avalon'
old_setup_editor = "<SetupEditor size={Number(size)} setup={setup} onChange={setSetup}/>"
new_setup_editor = "{gameType==='werewolf'&&<SetupEditor size={Number(size)} setup={setup} onChange={setSetup}/>}"
code = code.replace(old_setup_editor, new_setup_editor)

# 5. In Room view, render MosaicoConsole when showConsole is true OR inside the view
# And render AvalonView if r.gameType === 'avalon'
old_action_panel = '<aside className="action-panel">'
new_action_panel = """<aside className="action-panel">
{r.gameType === 'avalon' && <AvalonView room={r} onSend={send} />}
"""
code = code.replace(old_action_panel, new_action_panel)

# Add MosaicoConsole modal dialog at the end
console_dialog = """
<Dialog open={showConsole} onOpenChange={setShowConsole}>
  <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 p-4">
    <DialogHeader>
      <DialogTitle className="text-center text-sm font-bold text-slate-200">
        乐鑫 ESP32 MOSAicO 480×480 桌面中央公屏 / 电子法官
      </DialogTitle>
    </DialogHeader>
    <MosaicoConsole room={r} onAdvance={advance} onAction={act} />
  </DialogContent>
</Dialog>
"""
code = code.replace("</AlertDialog>", "</AlertDialog>" + console_dialog)

with open(path, "w", encoding="utf-8") as f:
    f.write(code)

print("Updated app/table-app.tsx successfully")
