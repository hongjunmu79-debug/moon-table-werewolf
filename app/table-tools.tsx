import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Volume2, VolumeX, ShieldAlert, Cpu, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';

type Props = { room: any; busy: boolean; act: (action: string, args?: Record<string, unknown>) => void; onConsole: () => void };

const VOICE_KEY = 'moon_voice_judge';

/** Unlock iOS Safari / WeChat browser audio policy during user gesture */
function unlockAudioContext() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(u);
    }
  } catch (e) {
    console.warn('Audio unlock notice:', e);
  }
}

/** Speaks every new public judge message aloud — ONLY when this device holds the room's exclusive voice lock */
function useVoiceJudge(message: string | undefined, enabled: boolean, isMaster: boolean) {
  const last = useRef<string>('');
  useEffect(() => {
    // Only speak when both local switch is on AND this device owns the voice lock
    if (!enabled || !isMaster || !message || message === last.current) return;
    const first = !last.current;
    last.current = message;
    if (first) return; // Don't read backlog on initial load
    if (!('speechSynthesis' in window)) return;
    const cleanText = message.replace(/[【】💣🛡️⚔️]/g, '');
    const u = new SpeechSynthesisUtterance(cleanText);
    u.lang = 'zh-CN';
    u.rate = 0.95;
    u.volume = 1;
    const zh = speechSynthesis.getVoices().find((v) => v.lang.startsWith('zh'));
    if (zh) u.voice = zh;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }, [message, enabled, isMaster]);
}

export function CardBinder({ room, busy, act }: { room: any; busy: boolean; act: Props['act'] }) {
  const me = room.me;
  if (!me) return null;
  return (
    <div className="card-binder">
      <p className="muted small">
        实体白卡：{me.cardNo ? <b>已绑定 #{me.cardNo}</b> : '未绑定'} · 点你手里那张卡的编号（建议卡号 = 座位号）
      </p>
      <div className="card-grid">
        {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" disabled={busy} className={me.cardNo === n ? 'on' : ''} onClick={() => act('bindCard', { cardNo: n })}>
            #{n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TableTools({ room: r, busy, act, onConsole }: Props) {
  const [voice, setVoice] = useState(() => typeof localStorage !== 'undefined' && localStorage.getItem(VOICE_KEY) === '1');
  const [guide, setGuide] = useState(false);
  const [pairModal, setPairModal] = useState(false);
  const [deviceInput, setDeviceInput] = useState('');

  const isMaster = !!r.isVoiceMaster;
  useVoiceJudge(r?.message, voice, isMaster);

  function toggleVoice() {
    unlockAudioContext();
    const next = !voice;
    setVoice(next);
    localStorage.setItem(VOICE_KEY, next ? '1' : '0');

    if (next) {
      act('claimVoiceMaster');
      toast.success('已抢占全房唯一语音法官主持权（其他设备将自动静音防回音）');
    } else {
      act('releaseVoiceMaster');
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      toast.info('已关闭语音法官');
    }
  }

  function handlePairSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = deviceInput.trim().toUpperCase();
    if (!code) {
      toast.error('请输入 Mosaico 屏幕上显示的 4 位配对码');
      return;
    }
    act('pairMosaico', { deviceCode: code });
    toast.success(`已发起关联 Mosaico 屏幕 [${code}]`);
    setPairModal(false);
    setDeviceInput('');
  }

  const canSwitch = r.host && (r.phase === 'lobby' || r.phase === 'ended');
  const isAvalon = r.gameType === 'avalon';
  const empty = r.size - (r.players?.length || 0);
  const bots = (r.players || []).filter((p: any) => String(p.name).startsWith('AI-')).length;

  return (
    <section className="table-tools">
      {/* One-Click Hot Switcher */}
      <div className="game-switch" role="group" aria-label="一键切换游戏">
        <button
          type="button"
          className={isAvalon ? 'on' : ''}
          disabled={!canSwitch || busy || isAvalon}
          onClick={() => {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            act('switchGame', { gameType: 'avalon' });
          }}
        >
          🏰 阿瓦隆
        </button>
        <button
          type="button"
          className={!isAvalon ? 'on' : ''}
          disabled={!canSwitch || busy || !isAvalon}
          onClick={() => {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            act('switchGame', { gameType: 'werewolf' });
          }}
        >
          🐺 狼人杀
        </button>
      </div>

      {r.host && canSwitch && (
        <label className="size-pick">
          人数
          <select value={r.size} disabled={busy} onChange={(e) => act('switchGame', { gameType: r.gameType, size: Number(e.target.value) })}>
            {(isAvalon ? [5, 6, 7, 8, 9, 10] : [6, 7, 8, 9, 10, 11, 12]).map((n) => (
              <option key={n} value={n}>
                {n} 人
              </option>
            ))}
          </select>
        </label>
      )}

      {r.host && r.phase === 'lobby' && empty > 0 && (
        <button type="button" className="tool" disabled={busy} onClick={() => act('fillBots')}>
          🤖 补满 {empty} 个 AI 测试
        </button>
      )}
      {r.host && r.phase === 'lobby' && bots > 0 && (
        <button type="button" className="tool" disabled={busy} onClick={() => act('clearBots')}>
          移除 AI
        </button>
      )}

      {/* Requirement 4: Single Voice Judge Lock */}
      <button
        type="button"
        className={`tool flex items-center gap-1.5 ${voice && isMaster ? 'on' : voice && !isMaster ? 'border-amber-500 text-amber-300' : ''}`}
        onClick={toggleVoice}
        title={voice && !isMaster ? `当前主持权在 ${r.voiceMasterName || '其他设备'}，点击抢回主持` : ''}
      >
        {voice && isMaster ? (
          <>
            <Volume2 className="w-3.5 h-3.5" />
            <span>🔊 语音法官 (主持中)</span>
          </>
        ) : voice && !isMaster ? (
          <>
            <VolumeX className="w-3.5 h-3.5 text-amber-400" />
            <span>🔈 语音法官 (已让渡)</span>
          </>
        ) : (
          <>
            <VolumeX className="w-3.5 h-3.5" />
            <span>🔈 语音法官 关</span>
          </>
        )}
      </button>

      {/* Requirement 6: Mosaico Device Pairing */}
      {r.host && (
        <button type="button" className="tool flex items-center gap-1" onClick={() => setPairModal(true)}>
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>📟 关联 Mosaico 屏幕</span>
        </button>
      )}

      {r.host && (
        <button type="button" className="tool" onClick={onConsole}>
          🖥️ 网页公屏
        </button>
      )}

      <button type="button" className="tool" onClick={() => setGuide(true)}>
        📖 玩法指南
      </button>

      {!r.host && r.gameType !== 'avalon' && r.me && <CardBinder room={r} busy={busy} act={act} />}

      {/* Mosaico Cloud/LAN Pairing Modal */}
      <Dialog open={pairModal} onOpenChange={setPairModal}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-indigo-300">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>关联桌面 ESP-Mosaico 公屏</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 pt-1">
              乐鑫 ESP-Mosaico 无论是连本地局域网还是上腾讯云，均可无缝动态配对。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <div className="text-slate-400">本牌桌配对识别码：</div>
              <div className="font-mono text-xl font-bold text-amber-400 tracking-wider">
                {r.pairingCode || r.id?.slice(-4).toUpperCase()}
              </div>
              <p className="text-[11px] text-slate-500">
                如果 Mosaico 屏幕提示未绑定，或你有多张桌子，可在下方输入 Mosaico 屏幕上显示的 4 位设备码完成定向关联。
              </p>
            </div>

            <form onSubmit={handlePairSubmit} className="space-y-2">
              <label className="block text-slate-300 text-xs font-medium">
                输入 Mosaico 屏幕上显示的设备码 (4位):
                <input
                  type="text"
                  maxLength={8}
                  placeholder="如: D093"
                  value={deviceInput}
                  onChange={(e) => setDeviceInput(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white uppercase focus:outline-none focus:border-indigo-500"
                />
              </label>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow"
              >
                一键绑定设备到当前房间
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Guide Modal */}
      <Dialog open={guide} onOpenChange={setGuide}>
        <DialogContent className="rules-dialog">
          <DialogHeader>
            <DialogTitle>线下玩法与 20 张白卡</DialogTitle>
            <DialogDescription>一部手机一个人，Mosaico 放桌子中间当公屏，一台手机/音箱负责念台词。</DialogDescription>
          </DialogHeader>
          <div className="rules-content">
            <h3>白卡编号</h3>
            <p>
              用记号笔在 20 张白卡上写 <b>1–20</b>，卡号就是座位号。按顺时针把 1 号、2 号……摆在每个座位前，入座后点一下自己那张卡的编号完成绑定（Android Chrome 也可以直接贴卡感应）。
            </p>
            <p>
              狼人杀最多 12 人用 #1–#12，阿瓦隆最多 10 人用 #1–#10；白卡只当座位/身份牌，<b>身份永远只显示在自己的手机上（长按查看）</b>，牌面不写死身份，可以反复使用。
            </p>
            <h3>摆台与静音防反光</h3>
            <p>
              ① ESP-Mosaico 放桌正中，显示阶段、5 轮任务与锤度计数，右侧 6 颗灯实时对应战况。<br />
              ② 狼人杀天黑强制进入纯黑夜视模式，屏幕无白光不映脸；每阶段强制固定倒计时 12 秒，杜绝抢跳秒过。<br />
              ③ 阿瓦隆出勤双按钮外观同构且随机调换位置，好人点破坏自动伪装提交，杜绝任何场外偷看。
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
