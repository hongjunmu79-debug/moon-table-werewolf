// Avalon Game Engine and Rule Definitions for Universal Board Game System

export type AvalonRole = 
  | 'merlin'    // 梅林 (好人)：知晓除莫德雷德外的所有坏人
  | 'percival'  // 派西维尔 (好人)：知晓梅林与莫甘娜，但不知具体谁是谁
  | 'servant'   // 亚瑟的忠臣 (好人)：无特殊技能
  | 'assassin'  // 刺客 (坏人)：若好人完成3个任务，刺客可刺杀梅林逆转
  | 'morgana'   // 莫甘娜 (坏人)：在派西维尔眼中冒充梅林
  | 'mordred'   // 莫德雷德 (坏人)：在梅林眼中隐身 (梅林看不到)
  | 'oberon'    // 奥伯伦 (坏人)：孤立坏人，与其他坏人不相认
  | 'minion';   // 莫德雷德的爪牙 (坏人)：普通坏人

export const AVALON_ROLE_NAMES: Record<AvalonRole, string> = {
  merlin: '梅林',
  percival: '派西维尔',
  servant: '亚瑟忠臣',
  assassin: '刺客',
  morgana: '莫甘娜',
  mordred: '莫德雷德',
  oberon: '奥伯伦',
  minion: '莫德雷德爪牙'
};

export const AVALON_ROLE_DESC: Record<AvalonRole, string> = {
  merlin: '正义领袖。知晓所有红方坏人（莫德雷德除外），但必须隐蔽自身，防止被刺客刺杀。',
  percival: '正义盾牌。能看到梅林与莫甘娜两人，需分辨真假梅林并替梅林吸引刺客注意力。',
  servant: '正义基石。亚瑟的忠臣，没有超自然能力，用逻辑与推理在队伍投票中辨别正邪。',
  assassin: '邪恶利刃。如果正义阵营完成 3 个任务，刺客有一击必杀梅林、逆转胜局的机会。',
  morgana: '邪恶伪装者。在派西维尔眼中与梅林完全相同，负责混淆视听、掩护同伴。',
  mordred: '邪恶主宰。拥有强大的邪恶力量，梅林无法感知到他的存在。',
  oberon: '孤傲邪恶。属于邪恶阵营，但与其他坏人不互通身份，梅林能看到他。',
  minion: '邪恶随从。莫德雷德的忠实爪牙，与刺客、莫甘娜相互知晓身份。'
};

export interface AvalonMissionConfig {
  squadSize: number;
  failsRequired: number; // 几张失败牌才判定任务失败（通常为1，7人以上第4局为2）
}

// 5~10 人阿瓦隆标准任务出勤人数与第4局双失败配置
export const AVALON_QUEST_TABLE: Record<number, AvalonMissionConfig[]> = {
  5: [
    { squadSize: 2, failsRequired: 1 },
    { squadSize: 3, failsRequired: 1 },
    { squadSize: 2, failsRequired: 1 },
    { squadSize: 3, failsRequired: 1 },
    { squadSize: 3, failsRequired: 1 }
  ],
  6: [
    { squadSize: 2, failsRequired: 1 },
    { squadSize: 3, failsRequired: 1 },
    { squadSize: 4, failsRequired: 1 },
    { squadSize: 3, failsRequired: 1 },
    { squadSize: 4, failsRequired: 1 }
  ],
  7: [
    { squadSize: 2, failsRequired: 1 },
    { squadSize: 3, failsRequired: 1 },
    { squadSize: 3, failsRequired: 1 },
    { squadSize: 4, failsRequired: 2 }, // 7人局第4轮需要2张失败
    { squadSize: 4, failsRequired: 1 }
  ],
  8: [
    { squadSize: 3, failsRequired: 1 },
    { squadSize: 4, failsRequired: 1 },
    { squadSize: 4, failsRequired: 1 },
    { squadSize: 5, failsRequired: 2 }, // 8人局第4轮需要2张失败
    { squadSize: 5, failsRequired: 1 }
  ],
  9: [
    { squadSize: 3, failsRequired: 1 },
    { squadSize: 4, failsRequired: 1 },
    { squadSize: 4, failsRequired: 1 },
    { squadSize: 5, failsRequired: 2 }, // 9人局第4轮需要2张失败
    { squadSize: 5, failsRequired: 1 }
  ],
  10: [
    { squadSize: 3, failsRequired: 1 },
    { squadSize: 4, failsRequired: 1 },
    { squadSize: 4, failsRequired: 1 },
    { squadSize: 5, failsRequired: 2 }, // 10人局第4轮需要2张失败
    { squadSize: 5, failsRequired: 1 }
  ]
};

// 5~10 人标准板型默认角色分配
export function defaultAvalonDeck(size: number): AvalonRole[] {
  switch (size) {
    case 5:
      return ['merlin', 'percival', 'servant', 'assassin', 'morgana'];
    case 6:
      return ['merlin', 'percival', 'servant', 'servant', 'assassin', 'morgana'];
    case 7:
      return ['merlin', 'percival', 'servant', 'servant', 'assassin', 'morgana', 'minion'];
    case 8:
      return ['merlin', 'percival', 'servant', 'servant', 'servant', 'assassin', 'morgana', 'minion'];
    case 9:
      return ['merlin', 'percival', 'servant', 'servant', 'servant', 'servant', 'assassin', 'morgana', 'mordred'];
    case 10:
    default:
      return ['merlin', 'percival', 'servant', 'servant', 'servant', 'servant', 'assassin', 'morgana', 'mordred', 'oberon'];
  }
}

export function isEvil(role: AvalonRole): boolean {
  return ['assassin', 'morgana', 'mordred', 'oberon', 'minion'].includes(role);
}

export function isGood(role: AvalonRole): boolean {
  return !isEvil(role);
}

export interface AvalonVision {
  title: string;
  alignment: 'good' | 'evil';
  roleName: string;
  description: string;
  knownPlayers: { seat: number; name: string; tag: string }[];
}

export interface AvalonPlayerInfo {
  id: string;
  seat: number;
  name: string;
  role: AvalonRole;
}

// 计算某位玩家在天黑/看牌时能看到的信息（严格防偷看与权限隔离）
export function resolveVision(player: AvalonPlayerInfo, allPlayers: AvalonPlayerInfo[]): AvalonVision {
  const role = player.role;
  const alignment: 'good' | 'evil' = isEvil(role) ? 'evil' : 'good';
  const known: { seat: number; name: string; tag: string }[] = [];

  if (role === 'merlin') {
    for (const p of allPlayers) {
      if (p.id !== player.id && isEvil(p.role) && p.role !== 'mordred') {
        known.push({ seat: p.seat, name: p.name, tag: '邪恶阵营' });
      }
    }
  } else if (role === 'percival') {
    for (const p of allPlayers) {
      if (p.role === 'merlin' || p.role === 'morgana') {
        known.push({ seat: p.seat, name: p.name, tag: '梅林或莫甘娜' });
      }
    }
    known.sort(() => Math.random() - 0.5);
  } else if (isEvil(role) && role !== 'oberon') {
    for (const p of allPlayers) {
      if (p.id !== player.id && isEvil(p.role) && p.role !== 'oberon') {
        known.push({ seat: p.seat, name: p.name, tag: '邪恶同伴 (' + AVALON_ROLE_NAMES[p.role] + ')' });
      }
    }
  }

  return {
    title: AVALON_ROLE_NAMES[role] || '未知角色',
    alignment,
    roleName: AVALON_ROLE_NAMES[role],
    description: AVALON_ROLE_DESC[role] || '',
    knownPlayers: known
  };
}

export interface MissionHistoryRecord {
  round: number;
  squadSeats: number[];
  leaderSeat: number;
  hammer: number;
  teamVotes: { seat: number; name: string; approve: boolean }[];
  successCount: number;
  failCount: number;
  failsRequired: number;
  result: 'success' | 'fail';
  cardRevealOrder?: ('success' | 'fail')[];
}

export interface LadyHistoryRecord {
  round: number;
  fromSeat: number;
  toSeat: number;
  targetAlignment: 'good' | 'evil';
}

export interface AvalonState {
  currentRound: number; // 1 ~ 5
  missionHistory: ('success' | 'fail' | 'pending')[]; // 5 rounds record
  missionFails: number[]; // actual fail card counts per round
  voteTracker: number; // 0 ~ 5 (连续 5 次组队被否决坏人直接胜利)
  leaderSeat: number; // 当前队长座位号 (1 ~ size)
  nominatedSquad: string[]; // 当前队长提议的队员 player ID 列表
  teamVotes: Record<string, boolean>; // player ID -> 赞成(true) / 反对(false)
  teamVotesRevealed: boolean;
  missionVotes: ('success' | 'fail')[]; // 出勤队员的秘密投票（已匿名洗牌）
  missionSubmissions: Record<string, boolean>; // player ID -> 是否已提交
  assassinTarget?: string; // 刺客刺杀的目标 player ID
  lastMissionSummary?: string; // 最近一轮任务的票型明细（如 "3 成功 / 1 破坏"）
  
  // Requirement 2: 实体白卡技能化（湖中仙女 #19 / 队长王冠 #13 / 宝剑卡 #14~#18）
  ladyHolderSeat?: number; // 当前持有 #19 湖中仙女卡的玩家座位号 (7人以上可选)
  ladyTargetSeat?: number; // 当前正在被仙女查验的目标座位号
  ladyResultAlignment?: 'good' | 'evil'; // 当前查验结果（仅持有者可见）
  ladyHistory: LadyHistoryRecord[]; // 湖中仙女历史查验记录
  ladyCheckedSeats: number[]; // 已经被仙女查验过的座位号列表（不可重复查验，不可查持卡人自己）
  
  // Requirement 3 & 4: 逐张开牌演出与历史战绩矩阵
  cardRevealOrder: ('success' | 'fail')[]; // 洗乱后的逐张亮牌序列
  revealingIndex: number; // 当前逐张揭晓的索引 0..N-1 (-1 表示未揭晓或揭晓完毕)
  matrixRecords: MissionHistoryRecord[]; // 历史车队与战况矩阵
  
  winner?: 'good' | 'evil';
  winnerReason?: string;
}

export function initialAvalonState(size: number): AvalonState {
  const enableLady = size >= 7;
  // 湖中仙女开局在首发队长(1号)右手边玩家手中: 即 size 号座位
  const initialLadyHolder = enableLady ? size : undefined;
  return {
    currentRound: 1,
    missionHistory: ['pending', 'pending', 'pending', 'pending', 'pending'],
    missionFails: [0, 0, 0, 0, 0],
    voteTracker: 0,
    leaderSeat: 1,
    nominatedSquad: [],
    teamVotes: {},
    teamVotesRevealed: false,
    missionVotes: [],
    missionSubmissions: {},
    ladyHolderSeat: initialLadyHolder,
    ladyHistory: [],
    ladyCheckedSeats: [],
    cardRevealOrder: [],
    revealingIndex: -1,
    matrixRecords: []
  };
}
