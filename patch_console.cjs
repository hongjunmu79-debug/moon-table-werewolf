const fs = require('fs');
let code = fs.readFileSync('D:/moon-table-werewolf/app/mosaico-console.tsx', 'utf8');

const targetOld = `              {room.phase === 'avalonAssassinate' && (`;
const targetNew = `              {room.phase === 'avalonReveal' && (
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
                          className={\`w-10 h-14 rounded-lg border flex flex-col items-center justify-center text-xs font-bold transition \${
                            revealed
                              ? card === 'success'
                                ? 'bg-blue-600 border-blue-400 text-white'
                                : 'bg-red-600 border-red-400 text-white animate-bounce'
                              : 'bg-slate-900 border-slate-700 text-slate-500'
                          }\`}
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

              {room.phase === 'avalonAssassinate' && (`;

code = code.replace(targetOld, targetNew);
fs.writeFileSync('D:/moon-table-werewolf/app/mosaico-console.tsx', code, 'utf8');
console.log('mosaico-console.tsx updated ok!');
