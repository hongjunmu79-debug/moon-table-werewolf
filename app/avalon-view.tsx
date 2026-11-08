"use client";
import { useState, useEffect } from 'react';
import { Shield, Swords, Wifi, Check, X, EyeOff, Crown, AlertTriangle, Sparkles, ScrollText, BookOpen, UserCheck, Flame } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { AVALON_QUEST_TABLE } from '@/lib/avalon';

interface AvalonViewProps {
  room: any;
  onSend: (action: string, args?: Record<string, unknown>) => Promise<any>;
}

export default function AvalonView({ room, onSend }: AvalonViewProps) {
  const [holdingCard, setHoldingCard] = useState<boolean>(false);
  const [scanningNfc, setScanningNfc] = useState<boolean>(false);
  const [selectedSquad, setSelectedSquad] = useState<string[]>([]);
  const [nfcSupported, setNfcSupported] = useState<boolean>(false);

  // Requirement 1: Randomize the order of Success and Fail buttons
  const [missionOrder, setMissionOrder] = useState<('success' | 'fail')[]>(() =>
    Math.random() < 0.5 ? ['success', 'fail'] : ['fail', 'success']
  );

  // Dialog state for identical confirmation on mission cards
  const [pendingMissionCard, setPendingMissionCard] = useState<'success' | 'fail' | null>(null);

  // Dialog state for Assassin target confirmation
  const [pendingAssassinTarget, setPendingAssassinTarget] = useState<any | null>(null);

  // Requirement 4: Drawer state for Matrix History Records
  const [showMatrixDrawer, setShowMatrixDrawer] = useState<boolean>(false);

  // Requirement 2: Dialog state for Lady of Lake target selection
  const [pendingLadyTarget, setPendingLadyTarget] = useState<number | null>(null);

  const me = room?.me;
  const avalon = room?.avalon;
  const isHost = room?.host;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setNfcSupported(true);
    }
  }, []);

  useEffect(() => {
    if (room.phase === 'avalonVoteMission') {
      setMissionOrder(Math.random() < 0.5 ? ['success', 'fail'] : ['fail', 'success']);
    }
  }, [room.phase, avalon?.currentRound]);

  const isGoodPlayer = me && ['merlin', 'percival', 'servant'].includes(me.role);

  // Web NFC Scanning handler
  const handleScanNfc = async () => {
    if (!('NDEFReader' in window)) {
      toast.info('当前浏览器未开放底层 Web-NFC，可直接点击下方 1–20 号卡号完成绑定');
      return;
    }
    try {
      setScanningNfc(true);
      toast.info('请将手机背面靠近 IC 白卡...');
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();
      ndef.addEventListener('reading', async ({ serialNumber }: any) => {
        toast.success(`成功读取卡片 UID: ${serialNumber}`);
        setScanningNfc(false);
        await onSend('bindCard', { cardUid: serialNumber });
      });
    } catch (e: any) {
      setScanningNfc(false);
      toast.error(e?.message || 'NFC 扫描失败，请点击下方数字直接选卡');
    }
  };

  const handleSelectCardNo = async (num: number) => {
    try {
      await onSend('bindCard', { cardNo: num });
      toast.success(`成功绑定 #${num} 号卡片`);
    } catch (e: any) {
      toast.error(e?.message || '选卡失败');
    }
  };

  const toggleSelectPlayer = (playerId: string) => {
    const limit = avalon?.missionSquadSize || 2;
    if (selectedSquad.includes(playerId)) {
      setSelectedSquad(selectedSquad.filter(id => id !== playerId));
    } else {
      if (selectedSquad.length < limit) {
        setSelectedSquad([...selectedSquad, playerId]);
      } else {
        toast.info(`本轮任务只能选择 ${limit} 名出勤队员`);
      }
    }
  };

  const handleNominate = async () => {
    try {
      await onSend('avalonNominate', { squad: selectedSquad });
      setSelectedSquad([]);
    } catch (e: any) {
      toast.error(e?.message || '提交出勤名单失败');
    }
  };

  const handleTeamVote = async (approve: boolean) => {
    try {
      await onSend('avalonVoteTeam', { approve });
    } catch (e: any) {
      toast.error(e?.message || '表决提交失败');
    }
  };

  // Requirement 2: Offline tabletop vote resolve
  const handleOfflineVoteResolve = async (passed: boolean) => {
    try {
      await onSend('avalonOfflineResolve', { passed });
      toast.success(passed ? '已确认线下表决通过，进入任务！' : '已确认线下表决否决，转入下一锤！');
    } catch (e: any) {
      toast.error(e?.message || '录入失败');
    }
  };

  // Requirement 3: Heartbeat reveal step
  const handleStepReveal = async () => {
    try {
      await onSend('avalonStepReveal');
    } catch (e: any) {
      toast.error(e?.message || '开牌推进失败');
    }
  };

  // Requirement 2: Lady of Lake Check
  const handleLadyCheck = async () => {
    if (!pendingLadyTarget) return;
    try {
      await onSend('avalonLadyCheck', { targetSeat: pendingLadyTarget });
      setPendingLadyTarget(null);
      toast.success(`已完成对 ${pendingLadyTarget} 号玩家的阵营查验！`);
    } catch (e: any) {
      toast.error(e?.message || '查验操作失败');
    }
  };

  // Requirement 1: Confirm dialog submit handler for mission execution
  const confirmSubmitMission = async () => {
    if (!pendingMissionCard) return;
    const card = pendingMissionCard;
    setPendingMissionCard(null);

    const actualSuccess = isGoodPlayer ? true : card === 'success';

    try {
      await onSend('avalonVoteMission', { success: actualSuccess });
      if (isGoodPlayer && card === 'fail') {
        toast.info('忠臣效忠机制：已为你自动提交【成功】卡，保护身份伪装。');
      } else {
        toast.success('出勤卡已秘密提交，等待其他人...');
      }
    } catch (e: any) {
      toast.error(e?.message || '提交失败');
    }
  };

  // Requirement 1: Confirm assassination target
  const confirmExecuteAssassination = async () => {
    if (!pendingAssassinTarget) return;
    const target = pendingAssassinTarget;
    setPendingAssassinTarget(null);
    try {
      await onSend('avalonAssassinate', { target: target.id });
    } catch (e: any) {
      toast.error(e?.message || '刺杀操作失败');
    }
  };

  if (!avalon) return null;

  const questTable = AVALON_QUEST_TABLE[room.size] || [];

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* 5-Quest Status HUD & 5-Hammer Tracker & Matrix Drawer Trigger */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-bold flex items-center gap-1.5 text-indigo-300">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>阿瓦隆战况 · 第 {avalon.currentRound} 轮</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMatrixDrawer(true)}
              className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 flex items-center gap-1"
            >
              <ScrollText className="w-3 h-3 text-indigo-400" />
              <span>战况矩阵</span>
            </button>
            <span className="font-mono text-[11px] text-slate-400">
              {room.size} 人局
            </span>
          </div>
        </div>

        {/* 5 Quest Circles */}
        <div className="grid grid-cols-5 gap-2 pt-1">
          {[0, 1, 2, 3, 4].map((idx) => {
            const status = avalon.missionHistory[idx];
            const isCurrent = avalon.currentRound === idx + 1 && room.phase !== 'ended';
            const squadSize = questTable[idx]?.squadSize || 2;
            const failsRequired = questTable[idx]?.failsRequired || 1;

            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                  status === 'success'
                    ? 'bg-blue-950/80 border-blue-500 text-blue-200 shadow-blue-950'
                    : status === 'fail'
                    ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-rose-950'
                    : isCurrent
                    ? 'bg-amber-950/60 border-amber-400 text-amber-200 ring-2 ring-amber-400/40 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
              >
                <div className="text-[10px] font-mono mb-0.5">R{idx + 1}</div>
                <div className="font-bold text-xs">
                  {status === 'success' ? '成功 🛡️' : status === 'fail' ? '失败 ⚔️' : `${squadSize}人`}
                </div>
                {failsRequired > 1 && (
                  <span className="mt-1 text-[9px] bg-rose-900/90 text-rose-200 px-1 py-0.2 rounded font-semibold">
                    需2败
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 5-Hammer Tracker (流局计数器) */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold ${avalon.isFinalHammer ? 'text-rose-400 font-bold animate-pulse flex items-center gap-1' : 'text-slate-300'}`}>
              {avalon.isFinalHammer && <AlertTriangle className="w-3.5 h-3.5" />}
              <span>锤度 (组队否决):</span>
            </span>
            <span className="font-mono text-xs text-amber-400 font-bold">
              {avalon.voteTracker} / 5
            </span>
          </div>

          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((h) => (
              <div
                key={h}
                className={`w-4 h-4 rounded-full border transition ${
                  h <= avalon.voteTracker
                    ? 'bg-rose-500 border-rose-400 shadow-sm'
                    : h === avalon.voteTracker + 1
                    ? 'bg-amber-500/40 border-amber-400 animate-pulse'
                    : 'bg-slate-800 border-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Warning on 5th Hammer */}
        {avalon.isFinalHammer && room.phase !== 'ended' && (
          <div className="p-2 bg-rose-950/70 border border-rose-800 rounded-xl text-center text-rose-200 text-xs font-bold animate-pulse">
            ⚠️ 终局第 5 锤警告：若本次提议再次被否决，邪恶阵营将直接获胜！
          </div>
        )}

        {/* Last Mission Breakdown Summary */}
        {avalon.lastMissionSummary && (
          <div className="p-2 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-slate-300 text-center">
            <span className="text-slate-400">上一轮出勤结果：</span>
            <span className="text-amber-300 font-semibold ml-1">{avalon.lastMissionSummary}</span>
          </div>
        )}
      </div>

      {/* Requirement 2: 实体道具持有指示 (王冠 #13 / 仙女 #19 / 宝剑 #14~#18) */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 text-xs text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-amber-400 font-semibold">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>#13 队长: {avalon.leaderSeat} 号</span>
          </div>
          {avalon.ladyHolderSeat && (
            <div className="flex items-center gap-1 text-purple-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>#19 仙女: {avalon.ladyHolderSeat} 号</span>
            </div>
          )}
        </div>
        {room.host && (
          <button
            onClick={() => onSend('toggleOfflineVote')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition ${
              room.offlineVote
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {room.offlineVote ? '⚔️ 线下宝剑举牌模式' : '📱 手机全员点选模式'}
          </button>
        )}
      </div>

      {/* Physical NFC Card Binding Bar */}
      {me && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wifi className={`w-4 h-4 ${me.cardNo || me.cardUid ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-xs font-semibold text-slate-200">
                {me.cardNo ? `已绑定白卡 #${me.cardNo}` : me.cardUid ? `已绑卡: ${me.cardUid}` : '未绑定实体白卡'}
              </span>
            </div>
            {nfcSupported && (
              <button
                onClick={handleScanNfc}
                disabled={scanningNfc}
                className="text-[11px] px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition"
              >
                {scanningNfc ? '靠近 NFC 中...' : '扫一扫白卡'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-10 gap-1 mt-2">
            {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => handleSelectCardNo(num)}
                className={`h-7 rounded text-[11px] font-mono font-bold transition flex items-center justify-center border ${
                  me.cardNo === num
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Secret Identity Card Drawer */}
      {me?.role && me.vision && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <EyeOff className="w-4 h-4 text-indigo-400" />
              <span>我的私密身份</span>
            </span>
            <button
              onClick={() => setHoldingCard(!holdingCard)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {holdingCard ? '点击隐藏' : '长按/点击查看'}
            </button>
          </div>

          {holdingCard ? (
            <div className={`p-4 rounded-xl border mt-2 ${
              me.vision.alignment === 'good'
                ? 'bg-blue-950/60 border-blue-800/80 text-blue-200'
                : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold">{me.vision.roleName}</span>
                <span className="text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-black/40">
                  {me.vision.alignment === 'good' ? '正义阵营 (蓝)' : '邪恶阵营 (红)'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {me.vision.description}
              </p>

              {me.vision.knownPlayers?.length > 0 && (
                <div className="pt-2 border-t border-slate-700/60">
                  <span className="text-xs font-semibold block mb-1 text-amber-300">
                    👁️ 天黑看到的视野：
                  </span>
                  <div className="space-y-1">
                    {me.vision.knownPlayers.map((k: any, i: number) => (
                      <div key={i} className="text-xs flex items-center justify-between bg-black/30 p-1.5 rounded">
                        <span className="font-medium text-slate-200">{k.seat} 号：{k.name}</span>
                        <span className="text-amber-400 text-[11px] font-semibold">{k.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => setHoldingCard(true)}
              className="h-14 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400 cursor-pointer hover:border-slate-700 select-none"
            >
              🔒 隐私保护：点击展开查看你的阿瓦隆底牌与红蓝视野
            </div>
          )}
        </div>
      )}

      {/* Leader Nomination Phase */}
      {room.phase === 'avalonNominate' && (
        <div className="bg-slate-900/90 border border-amber-900/50 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-300">
              队长挑选出勤队员 (第 {avalon.currentRound} 轮)
            </h3>
          </div>
          <p className="text-xs text-slate-300 mb-3">
            请 <span className="text-amber-400 font-bold">{avalon.leaderSeat} 号队长</span> 挑选 <span className="text-indigo-400 font-bold">{avalon.missionSquadSize}</span> 名队员出勤本轮任务。
          </p>

          {(isHost || avalon.isLeader) && (
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-2">
                {room.players.map((p: any) => {
                  const selected = selectedSquad.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleSelectPlayer(p.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                        selected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <span>{p.seat} 号：{p.name}</span>
                      {selected && <Check className="w-4 h-4 text-slate-950" />}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNominate}
                disabled={selectedSquad.length !== avalon.missionSquadSize}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg mt-2"
              >
                提议出勤名单 ({selectedSquad.length}/{avalon.missionSquadSize})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Team Approval Vote Phase (Requirement 2: 支持线下实体举牌或线上表决) */}
      {room.phase === 'avalonVoteTeam' && (
        <div className="bg-slate-900/90 border border-indigo-900/50 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-indigo-300">组队表决阶段</h3>
            {room.offlineVote && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-semibold">
                ⚔️ 线下宝剑举牌模式
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 mb-3">
            队长提议出勤名单：
            <span className="text-amber-400 font-semibold ml-1">
              {avalon.nominatedSquad.map((id: string) => `${room.players.find((p: any) => p.id === id)?.seat}号`).join('、')}
            </span>
          </p>

          {/* 线下举牌模式：队长或法官一键录入 */}
          {room.offlineVote ? (
            <div className="space-y-3 mt-4 p-3 bg-amber-950/30 border border-amber-900/60 rounded-xl">
              <p className="text-xs text-amber-200">
                桌面举牌已完成？请队长或法官根据桌面亮票情况直接确认：
              </p>
              {(isHost || avalon.isLeader) ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleOfflineVoteResolve(true)}
                    className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>⚡ 线下表决已通过 (进任务)</span>
                  </button>
                  <button
                    onClick={() => handleOfflineVoteResolve(false)}
                    className="py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>⚡ 线下表决已否决 (下一锤)</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-2">
                  等待队长（{avalon.leaderSeat} 号）或法官录入线下表决结果...
                </p>
              )}
            </div>
          ) : (
            // 线上点选表决
            me && avalon.myTeamVote === undefined ? (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => handleTeamVote(true)}
                  className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-1.5"
                >
                  <Check className="w-5 h-5" />
                  <span>赞成出勤</span>
                </button>
                <button
                  onClick={() => handleTeamVote(false)}
                  className="py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-1.5"
                >
                  <X className="w-5 h-5" />
                  <span>反对出勤</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                {me ? `你已提交表决 (${avalon.myTeamVote ? '赞成' : '反对'})，等待其他玩家...` : '等待玩家表决...'}
              </div>
            )
          )}
        </div>
      )}

      {/* Secret Mission Execution Phase */}
      {room.phase === 'avalonVoteMission' && (
        <div className="bg-slate-900/90 border border-blue-900/50 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-blue-300 mb-1">出勤执行中（秘密行动）</h3>
          <p className="text-xs text-slate-300 mb-3">
            出勤队伍已获表决通过，被选中的队员请在下方隐蔽执行任务。
          </p>

          {avalon.isNominated ? (
            !avalon.hasSubmittedMission ? (
              <div className="space-y-3 mt-3">
                <p className="text-xs text-slate-400">
                  你是本轮出勤队员。为防止旁人通过手势/位置猜疑，卡片位置已随机调换，请点击选择并确认：
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {missionOrder.map((type) => (
                    <button
                      key={type}
                      onClick={() => setPendingMissionCard(type)}
                      className="py-3.5 px-4 bg-slate-800/90 hover:bg-slate-750 active:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-medium text-sm transition flex flex-col items-center justify-center gap-1 shadow-md select-none"
                    >
                      <span className="text-base">{type === 'success' ? '🛡️ 任务成功' : '⚔️ 任务破坏'}</span>
                      <span className="text-[10px] text-slate-400">点击进入确认</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-950/60 rounded-xl border border-blue-900/40 text-xs text-blue-300">
                ✅ 你的出勤卡已安全加密提交，等待全员提交后匿名洗牌进入逐张开牌阶段。
              </div>
            )
          ) : (
            <div className="text-center py-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
              你未出勤本轮任务，请等待出勤队员秘密提交卡片。
            </div>
          )}
        </div>
      )}

      {/* Requirement 3: 逐张开牌心跳演出 (avalonReveal) */}
      {room.phase === 'avalonReveal' && (
        <div className="bg-slate-900/90 border border-indigo-700/80 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest">
              HEARTBEAT REVEAL
            </span>
            <h3 className="text-base font-bold text-slate-100 flex items-center justify-center gap-2">
              <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
              <span>逐张揭晓出勤票！</span>
            </h3>
            <p className="text-xs text-slate-400">
              所有出勤队员卡牌已洗乱，正在逐张亮出票面！
            </p>
          </div>

          {/* Cards animation row */}
          <div className="flex items-center justify-center gap-3 py-2">
            {(avalon.cardRevealOrder || []).map((card: string, i: number) => {
              const isRevealed = i <= (avalon.revealingIndex ?? -1);
              return (
                <div
                  key={i}
                  className={`w-14 h-20 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-500 shadow-lg ${
                    isRevealed
                      ? card === 'success'
                        ? 'bg-blue-600 border-blue-300 text-white scale-105'
                        : 'bg-red-600 border-red-300 text-white scale-105 animate-pulse'
                      : 'bg-slate-950 border-slate-700 text-slate-500'
                  }`}
                >
                  <span className="text-[10px] font-mono mb-1">#{i + 1}</span>
                  <span className="text-xl">
                    {isRevealed ? (card === 'success' ? '🛡️' : '⚔️') : '❓'}
                  </span>
                  <span className="text-[10px] font-bold mt-1">
                    {isRevealed ? (card === 'success' ? '成功' : '破坏') : '秘密'}
                  </span>
                </div>
              );
            })}
          </div>

          {isHost && (
            <button
              onClick={handleStepReveal}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow flex items-center justify-center gap-2"
            >
              <span>揭晓下一张 (或结算结果)</span>
            </button>
          )}
        </div>
      )}

      {/* Requirement 2: 湖中仙女查验阶段 (avalonLady) */}
      {room.phase === 'avalonLady' && (
        <div className="bg-purple-950/70 border border-purple-800 rounded-2xl p-5 shadow-2xl space-y-3">
          <div className="flex items-center gap-2 text-purple-300">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold">湖中仙女查验时刻</h3>
          </div>
          <p className="text-xs text-slate-300">
            当前湖中仙女持有者：
            <span className="text-amber-400 font-bold ml-1">
              {avalon.ladyHolderSeat} 号玩家
            </span>。请将实体 #19 仙女卡递给被验者，并在手机点击验人。
          </p>

          {(isHost || (me && me.seat === avalon.ladyHolderSeat)) ? (
            <div className="space-y-3 mt-3">
              <p className="text-xs text-purple-200">选择一位尚未被仙女查验的玩家：</p>
              <div className="grid grid-cols-2 gap-2">
                {room.players.map((p: any) => {
                  const isHolder = p.seat === avalon.ladyHolderSeat;
                  const alreadyChecked = (avalon.ladyCheckedSeats || []).includes(p.seat);
                  const disabled = isHolder || alreadyChecked;
                  return (
                    <button
                      key={p.id}
                      disabled={disabled}
                      onClick={() => setPendingLadyTarget(p.seat)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                        pendingLadyTarget === p.seat
                          ? 'bg-purple-600 text-white border-purple-400 shadow font-bold'
                          : disabled
                          ? 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <span>{p.seat} 号：{p.name}</span>
                      {alreadyChecked && <span className="text-[10px] text-slate-500">已验过</span>}
                      {isHolder && <span className="text-[10px] text-purple-400">持卡人</span>}
                    </button>
                  );
                })}
              </div>

              {pendingLadyTarget && (
                <button
                  onClick={handleLadyCheck}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow mt-2"
                >
                  确认查验 {pendingLadyTarget} 号玩家阵营并交出仙女卡
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
              请等待 {avalon.ladyHolderSeat} 号持卡人在线下递交仙女卡并完成查验。
            </div>
          )}
        </div>
      )}

      {/* Assassination Phase */}
      {room.phase === 'avalonAssassinate' && (
        <div className="bg-red-950/60 border border-red-800/80 rounded-2xl p-5 shadow-2xl animate-pulse">
          <h3 className="text-sm font-bold text-red-400 mb-1 flex items-center gap-2">
            <Swords className="w-5 h-5 text-red-400" />
            <span>刺客绝杀时刻！</span>
          </h3>
          <p className="text-xs text-slate-200 mb-3">
            正义阵营已完成 3 个任务。刺客请选择怀疑为梅林的玩家执行刺杀。刺杀成功则邪恶阵营逆转获胜！
          </p>

          {(isHost || me?.role === 'assassin' || me?.role === 'morgana') && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {room.players.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => setPendingAssassinTarget(p)}
                  className="p-3 bg-red-900/60 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition border border-red-700/80"
                >
                  刺杀 {p.seat} 号 ({p.name})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requirement 4: 历史车队战况矩阵抽屉 (Matrix Drawer) */}
      <Dialog open={showMatrixDrawer} onOpenChange={setShowMatrixDrawer}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-200 p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-indigo-300">
              <ScrollText className="w-4 h-4 text-indigo-400" />
              <span>阿瓦隆历史车队与战况矩阵</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              记录每一轮车队提议、全员表决投票以及最终出勤结果。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {(!avalon.matrixRecords || avalon.matrixRecords.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-6">
                暂无出勤战况记录，完成第 1 轮任务后将在此展示。
              </p>
            ) : (
              avalon.matrixRecords.map((m: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-amber-300">第 {m.round} 轮任务 ({m.squadSeats.join('、')} 号出勤)</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      m.result === 'success' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-red-950 text-red-300 border border-red-800'
                    }`}>
                      {m.result === 'success' ? '🛡️ 成功' : '⚔️ 破坏'} ({m.successCount}成 / {m.failCount}败)
                    </span>
                  </div>

                  {/* Team vote breakdown */}
                  <div className="pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span className="block mb-1 text-slate-500">组队表决投票明细：</span>
                    <div className="grid grid-cols-4 gap-1">
                      {m.teamVotes.map((v: any, vIdx: number) => (
                        <div key={vIdx} className="bg-slate-900 px-1.5 py-0.5 rounded text-[10px] flex items-center justify-between">
                          <span>{v.seat}号</span>
                          <span className={v.approve ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {v.approve ? '赞' : '反'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Requirement 1: Mission Card Confirmation Modal */}
      <Dialog open={!!pendingMissionCard} onOpenChange={(open) => { if (!open) setPendingMissionCard(null); }}>
        <DialogContent className="max-w-xs bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-center">
              确认出勤提交
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 text-center pt-2">
              你正在提交【{pendingMissionCard === 'success' ? '任务成功 🛡️' : '任务破坏 ⚔️'}】卡。<br />
              提交后不可撤回，将被匿名洗牌加入任务判定。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-2 pt-3">
            <button
              onClick={() => setPendingMissionCard(null)}
              className="py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-slate-300 font-medium hover:bg-slate-750"
            >
              再想一下
            </button>
            <button
              onClick={confirmSubmitMission}
              className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow"
            >
              确认提交
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Requirement 1: Assassin Target Confirmation Modal */}
      <Dialog open={!!pendingAssassinTarget} onOpenChange={(open) => { if (!open) setPendingAssassinTarget(null); }}>
        <DialogContent className="max-w-xs bg-slate-900 border-red-900 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-red-400 text-center flex items-center justify-center gap-1.5">
              <Swords className="w-4 h-4 text-red-400" />
              <span>确认刺杀目标</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300 text-center pt-2">
              确定刺杀 <span className="text-amber-400 font-bold text-sm">{pendingAssassinTarget?.seat} 号 {pendingAssassinTarget?.name}</span> 吗？<br />
              <span className="text-red-400 font-semibold block mt-1.5">落子无悔！刺杀结果将直接决出最终胜负！</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-2 pt-3">
            <button
              onClick={() => setPendingAssassinTarget(null)}
              className="py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800 text-xs text-slate-300 font-medium hover:bg-slate-750"
            >
              再想想
            </button>
            <button
              onClick={confirmExecuteAssassination}
              className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow"
            >
              落子无悔 · 刺杀
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
