"use client";
import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Shield, Swords, Disc, Crown, Sparkles, CheckCircle2, XCircle, AlertCircle, RefreshCw, Cpu } from 'lucide-react';
import { AVALON_ROLE_NAMES, AVALON_QUEST_TABLE, type AvalonRole } from '@/lib/avalon';

interface ConsoleProps {
  room: any;
  onAdvance?: () => void;
  onAction?: (action: string, args: Record<string, unknown>) => void;
}

export default function MosaicoConsole({ room, onAdvance, onAction }: ConsoleProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [bezelMode, setBezelMode] = useState<'round' | 'square' | 'fullscreen'>('round');
  const [lastAnnouncedPhase, setLastAnnouncedPhase] = useState<string>('');
  const [revealingMission, setRevealingMission] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play sound effect using Web Audio API synthesized tones
  const playTone = (type: 'success' | 'fail' | 'ding' | 'drumroll' | 'fanfare') => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) audioContextRef.current = new AudioCtx();
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'ding') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'success') {
        // Major chord arpeggio
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'triangle';
          o.frequency.value = freq;
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0.2, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.4);
        });
      } else if (type === 'fail') {
        // Dramatic low drone
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.8);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
        osc.start(now);
        osc.stop(now + 0.9);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Chinese speech synthesis for Judge announcements
  const speakJudge = (text: string) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-CN';
      utter.rate = 0.95;
      utter.pitch = 1.0;
      window.speechSynthesis.speak(utter);
    } catch {
      // Speech fallback
    }
  };

  // Automatically trigger voice prompts when phase updates
  useEffect(() => {
    if (!room || room.phase === lastAnnouncedPhase) return;
    setLastAnnouncedPhase(room.phase);

    if (room.gameType === 'avalon' && room.avalon) {
      const round = room.avalon.currentRound;
      const squadSize = room.avalon.missionSquadSize;
      const leader = room.players.find((p: any) => p.seat === room.avalon.leaderSeat)?.name || `${room.avalon.leaderSeat}号`;

      switch (room.phase) {
        case 'lobby':
          speakJudge('欢迎来到阿瓦隆桌游控制台。请各位玩家刷卡或输入号码入座。');
          break;
        case 'deal':
          playTone('ding');
          speakJudge('天黑请闭眼，请大家保持安静。拿起白卡或在手机上查看自己的私密身份。');
          break;
        case 'avalonNominate':
          playTone('ding');
          speakJudge(`第 ${round} 轮任务开始，请队长 ${leader} 挑选 ${squadSize} 名队员出勤。`);
          break;
        case 'avalonVoteTeam':
          playTone('ding');
          speakJudge('队伍提议已生成。请全体玩家在手机或大屏上表决：赞成或反对。');
          break;
        case 'avalonVoteMission':
          playTone('ding');
          speakJudge('组队表决通过！请被选中的出勤队员拿出手机或白卡，秘密决定任务执行结果。');
          break;
        case 'avalonAssassinate':
          playTone('fanfare');
          speakJudge('正义阵营已完成3个任务！请刺客睁眼，秘密挑选刺杀梅林的目标！');
          break;
        case 'ended':
          if (room.winner === 'evil') {
            playTone('fail');
            speakJudge('游戏结束！邪恶阵营获胜！');
          } else {
            playTone('success');
            speakJudge('游戏结束！正义阵营获胜！');
          }
          break;
      }
    }
  }, [room?.phase, room?.avalon?.currentRound, audioEnabled]);

  const avalon = room?.avalon;
  const isAvalon = room?.gameType === 'avalon' && avalon;

  return (
    <div className="flex flex-col items-center justify-center p-2 text-white">
      {/* Console Device Controls */}
      <div className="flex items-center gap-3 mb-3 text-xs bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700/60 shadow-lg">
        <div className="flex items-center gap-1.5 font-medium text-emerald-400">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>乐鑫 ESP32 MOSAicO 480×480 AMOLED 主机公屏</span>
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${audioEnabled ? 'bg-indigo-600/60 text-indigo-200' : 'bg-slate-800 text-slate-400'}`}
        >
          {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{audioEnabled ? '电子法官语音开' : '静音'}</span>
        </button>
        <div className="h-3 w-px bg-slate-700" />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setBezelMode('round')}
            className={`px-2 py-0.5 rounded ${bezelMode === 'round' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
          >
            圆形表盘
          </button>
          <button
            onClick={() => setBezelMode('square')}
            className={`px-2 py-0.5 rounded ${bezelMode === 'square' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
          >
            方形AMOLED
          </button>
        </div>
      </div>

      {/* The 480x480 AMOLED Simulator Screen */}
      <div
        style={{ width: '480px', height: '480px' }}
        className={`relative overflow-hidden flex flex-col justify-between p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-4 border-slate-700 shadow-2xl transition-all duration-300 select-none ${
          bezelMode === 'round' ? 'rounded-full ring-8 ring-slate-800' : 'rounded-3xl'
        }`}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-indigo-500/20 blur-2xl pointer-events-none" />

        {/* Header / Title & Round Indicator */}
        <div className="relative z-10 text-center pt-2">
          <div className="flex items-center justify-center gap-2">
            <Disc className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
            <h2 className="text-sm font-semibold tracking-wider text-indigo-200 uppercase">
              {isAvalon ? '阿瓦隆 · 智能中央主机' : '月下桌游 · 主持公屏'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            房间: <span className="font-mono text-indigo-300">{room?.id?.slice(0, 8)}</span> · {room?.players?.length}/{room?.size} 人
          </p>
        </div>

        {/* Center Stage: Missions and Current Phase */}
        {isAvalon ? (
          <div className="relative z-10 flex flex-col items-center justify-center gap-3 my-auto">
            {/* 5 Quest Mission Circles */}
            <div className="flex items-center gap-3">
              {[0, 1, 2, 3, 4].map((idx) => {
                const status = avalon.missionHistory[idx];
                const isCurrent = avalon.currentRound === idx + 1 && room.phase !== 'ended';
                const questConfig = AVALON_QUEST_TABLE[room.size]?.[idx];
                const squadCount = questConfig?.squadSize || 2;
                const failsReq = questConfig?.failsRequired || 1;

                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div
                      className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all transform shadow-md ${
                        status === 'success'
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-700 text-white ring-2 ring-blue-300'
                          : status === 'fail'
                          ? 'bg-gradient-to-br from-red-600 to-rose-900 text-white ring-2 ring-red-400'
                          : isCurrent
                          ? 'bg-slate-800 text-amber-300 ring-2 ring-amber-400 animate-pulse'
                          : 'bg-slate-800/80 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {status === 'success' ? (
                        <Shield className="w-6 h-6 text-blue-200" />
                      ) : status === 'fail' ? (
                        <Swords className="w-6 h-6 text-red-200" />
                      ) : (
                        <>
                          <span className="text-xs font-bold font-mono">{squadCount}人</span>
                          <span className="text-[10px] text-slate-400">R{idx + 1}</span>
                        </>
                      )}
                    </div>
                    {failsReq > 1 && status !== 'success' && status !== 'fail' && (
                      <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-800 px-1 rounded mt-0.5 font-semibold">需2败</span>
                    )}
                    {status === 'fail' && (
                      <span className="text-[10px] text-red-400 mt-0.5 font-mono">{avalon.missionFails[idx]}败</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Vote Rejection Tracker (1~5 锤度条) */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 bg-slate-950/70 px-3 py-1 rounded-full border border-slate-800">
                <span className={`text-[11px] font-semibold mr-1 ${avalon.voteTracker >= 4 ? 'text-red-400 font-bold animate-pulse' : 'text-slate-400'}`}>
                  锤度 ({avalon.voteTracker}/5):
                </span>
                {[1, 2, 3, 4, 5].map((v) => (
                  <div
                    key={v}
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      avalon.voteTracker >= v
                        ? v === 5
                          ? 'bg-red-600 text-white animate-bounce'
                          : 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {v === 5 ? '💀' : v}
                  </div>
                ))}
              </div>
              {avalon.voteTracker >= 4 && room.phase !== 'ended' && (
                <span className="text-[10px] font-bold text-red-400 animate-pulse">
                  ⚠️ 第 5 锤终局警告！再被否决坏人直接胜利！
                </span>
              )}
            </div>

            {/* Last Mission Breakdown */}
            {avalon.lastMissionSummary && (
              <div className="text-[11px] text-amber-300 bg-slate-950/80 px-2.5 py-0.5 rounded border border-slate-800">
                票型：{avalon.lastMissionSummary}
              </div>
            )}

            {/* Current Phase Action Display */}
            <div className="text-center px-4 max-w-[360px]">
              {room.phase === 'lobby' && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-300">等待玩家入座与准备</p>
                  <p className="text-xs text-slate-400">请大家拿各自的 IC 白卡或手机扫描入座</p>
                </div>
              )}

              {room.phase === 'deal' && (
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-300">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>身份已分发 · 密看阶段</span>
                  </div>
                  <p className="text-xs text-slate-400">请玩家在各自手机上按住屏幕或贴白卡查看</p>
                </div>
              )}

              {room.phase === 'avalonNominate' && (
                <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-amber-400">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>当前队长：{avalon.leaderSeat} 号玩家</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    需挑选 <span className="text-amber-400 font-bold">{avalon.missionSquadSize}</span> 名队员出勤任务
                  </p>
                </div>
              )}

              {room.phase === 'avalonVoteTeam' && (
                <div className="space-y-1.5 bg-slate-900/80 p-3 rounded-xl border border-indigo-900/50">
                  <p className="text-xs text-indigo-300 font-medium">出勤提议已就绪，全员表决中</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-slate-400">已表决:</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {avalon.teamVoteCount} / {room.players.length}
                    </span>
                  </div>
                  {avalon.teamVotesRevealed && (
                    <p className="text-xs text-amber-300 font-semibold animate-pulse">正在公布全员表决票数...</p>
                  )}
                </div>
              )}

              {room.phase === 'avalonVoteMission' && (
                <div className="space-y-2 bg-slate-900/90 p-3 rounded-xl border border-blue-900/60">
                  <p className="text-sm font-bold text-blue-300 flex items-center justify-center gap-1">
                    <Shield className="w-4 h-4" />
                    <span>出勤执行中 (秘密行动)</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    出勤队员已提交: <span className="font-bold text-blue-400">{avalon.missionSubmissionsCount}</span> / {avalon.nominatedSquad.length}
                  </p>
                  <p className="text-[11px] text-slate-400">所有出勤卡将完全打乱洗牌后公布</p>
                </div>
              )}

              {room.phase === 'avalonReveal' && (
                <div className="space-y-2 bg-indigo-950/80 p-3 rounded-xl border border-indigo-700 animate-pulse">
                  <p className="text-sm font-bold text-amber-300 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>逐张揭晓心跳亮牌中！</span>
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {(avalon.cardRevealOrder || []).map((card: string, idx: number) => {
                      const revealed = idx <= (avalon.revealingIndex ?? -1);
                      return (
                        <div
                          key={idx}
                          className={`w-10 h-14 rounded-lg border flex flex-col items-center justify-center text-xs font-bold transition ${
                            revealed
                              ? card === 'success'
                                ? 'bg-blue-600 border-blue-400 text-white'
                                : 'bg-red-600 border-red-400 text-white animate-bounce'
                              : 'bg-slate-900 border-slate-700 text-slate-500'
                          }`}
                        >
                          <span>{revealed ? (card === 'success' ? '🛡️' : '⚔️') : '❓'}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-300">
                    已揭晓 {Math.max(0, (avalon.revealingIndex ?? -1) + 1)} / {(avalon.cardRevealOrder || []).length} 张
                  </p>
                </div>
              )}

              {room.phase === 'avalonLady' && (
                <div className="space-y-1.5 bg-purple-950/80 p-3 rounded-xl border border-purple-800 animate-pulse">
                  <p className="text-sm font-bold text-purple-300 flex items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>🧚 湖中仙女查验时刻</span>
                  </p>
                  <p className="text-xs text-slate-200">
                    请持卡人 <span className="text-amber-400 font-bold">{avalon.ladyHolderSeat} 号</span> 线下递交实体卡并在手机选择查验！
                  </p>
                </div>
              )}

              {room.phase === 'avalonAssassinate' && (
                <div className="space-y-1.5 bg-red-950/60 p-3 rounded-xl border border-red-800/80 animate-pulse">
                  <p className="text-sm font-bold text-red-400 flex items-center justify-center gap-1">
                    <Swords className="w-4 h-4" />
                    <span>刺客绝杀时刻！</span>
                  </p>
                  <p className="text-xs text-slate-200">刺客请睁眼，在手机上选出梅林执行刺杀！</p>
                </div>
              )}

              {room.phase === 'ended' && (
                <div className="space-y-1 bg-slate-900/90 p-3 rounded-xl border border-slate-700">
                  <h3 className={`text-base font-bold ${room.winner === 'good' ? 'text-blue-400' : 'text-red-400'}`}>
                    {room.winner === 'good' ? '🛡️ 正义阵营获得最终胜利！' : '⚔️ 邪恶阵营获得最终胜利！'}
                  </h3>
                  {avalon.winnerReason && (
                    <p className="text-xs text-slate-300">{avalon.winnerReason}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Werewolf Display Fallback */
          <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center px-4">
            <p className="text-sm font-medium text-amber-300">{room?.message || '等待开局'}</p>
            <p className="text-xs text-slate-400 mt-2">阶段: {room?.phase}</p>
          </div>
        )}

        {/* Bottom Status & Players Physical Cards Binding Summary */}
        <div className="relative z-10 text-center pb-2">
          {/* Card Bindings indicator */}
          <div className="flex items-center justify-center gap-1 flex-wrap max-w-[380px] mx-auto">
            {room?.players?.map((p: any) => (
              <span
                key={p.id}
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  p.cardNo || p.cardUid
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                    : 'bg-slate-800/60 text-slate-400'
                }`}
                title={`玩家: ${p.name} | 卡号: ${p.cardNo || '未绑'}`}
              >
                {p.seat}号{p.cardNo ? `[#${p.cardNo}]` : ''}
              </span>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 mt-1">
            ESP-Claw / ESP-Mosaico 硬件同步服务 · 腾讯云 CloudBase 已连接
          </p>
        </div>
      </div>
    </div>
  );
}
