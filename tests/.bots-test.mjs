// lib/avalon.ts
var AVALON_ROLE_NAMES = {
  merlin: "\u6885\u6797",
  percival: "\u6D3E\u897F\u7EF4\u5C14",
  servant: "\u4E9A\u745F\u5FE0\u81E3",
  assassin: "\u523A\u5BA2",
  morgana: "\u83AB\u7518\u5A1C",
  mordred: "\u83AB\u5FB7\u96F7\u5FB7",
  oberon: "\u5965\u4F2F\u4F26",
  minion: "\u83AB\u5FB7\u96F7\u5FB7\u722A\u7259"
};
var AVALON_ROLE_DESC = {
  merlin: "\u6B63\u4E49\u9886\u8896\u3002\u77E5\u6653\u6240\u6709\u7EA2\u65B9\u574F\u4EBA\uFF08\u83AB\u5FB7\u96F7\u5FB7\u9664\u5916\uFF09\uFF0C\u4F46\u5FC5\u987B\u9690\u853D\u81EA\u8EAB\uFF0C\u9632\u6B62\u88AB\u523A\u5BA2\u523A\u6740\u3002",
  percival: "\u6B63\u4E49\u76FE\u724C\u3002\u80FD\u770B\u5230\u6885\u6797\u4E0E\u83AB\u7518\u5A1C\u4E24\u4EBA\uFF0C\u9700\u5206\u8FA8\u771F\u5047\u6885\u6797\u5E76\u66FF\u6885\u6797\u5438\u5F15\u523A\u5BA2\u6CE8\u610F\u529B\u3002",
  servant: "\u6B63\u4E49\u57FA\u77F3\u3002\u4E9A\u745F\u7684\u5FE0\u81E3\uFF0C\u6CA1\u6709\u8D85\u81EA\u7136\u80FD\u529B\uFF0C\u7528\u903B\u8F91\u4E0E\u63A8\u7406\u5728\u961F\u4F0D\u6295\u7968\u4E2D\u8FA8\u522B\u6B63\u90AA\u3002",
  assassin: "\u90AA\u6076\u5229\u5203\u3002\u5982\u679C\u6B63\u4E49\u9635\u8425\u5B8C\u6210 3 \u4E2A\u4EFB\u52A1\uFF0C\u523A\u5BA2\u6709\u4E00\u51FB\u5FC5\u6740\u6885\u6797\u3001\u9006\u8F6C\u80DC\u5C40\u7684\u673A\u4F1A\u3002",
  morgana: "\u90AA\u6076\u4F2A\u88C5\u8005\u3002\u5728\u6D3E\u897F\u7EF4\u5C14\u773C\u4E2D\u4E0E\u6885\u6797\u5B8C\u5168\u76F8\u540C\uFF0C\u8D1F\u8D23\u6DF7\u6DC6\u89C6\u542C\u3001\u63A9\u62A4\u540C\u4F34\u3002",
  mordred: "\u90AA\u6076\u4E3B\u5BB0\u3002\u62E5\u6709\u5F3A\u5927\u7684\u90AA\u6076\u529B\u91CF\uFF0C\u6885\u6797\u65E0\u6CD5\u611F\u77E5\u5230\u4ED6\u7684\u5B58\u5728\u3002",
  oberon: "\u5B64\u50B2\u90AA\u6076\u3002\u5C5E\u4E8E\u90AA\u6076\u9635\u8425\uFF0C\u4F46\u4E0E\u5176\u4ED6\u574F\u4EBA\u4E0D\u4E92\u901A\u8EAB\u4EFD\uFF0C\u6885\u6797\u80FD\u770B\u5230\u4ED6\u3002",
  minion: "\u90AA\u6076\u968F\u4ECE\u3002\u83AB\u5FB7\u96F7\u5FB7\u7684\u5FE0\u5B9E\u722A\u7259\uFF0C\u4E0E\u523A\u5BA2\u3001\u83AB\u7518\u5A1C\u76F8\u4E92\u77E5\u6653\u8EAB\u4EFD\u3002"
};
var AVALON_QUEST_TABLE = {
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
    { squadSize: 4, failsRequired: 2 },
    // 7人局第4轮需要2张失败
    { squadSize: 4, failsRequired: 1 }
  ],
  8: [
    { squadSize: 3, failsRequired: 1 },
    { squadSize: 4, failsRequired: 1 },
    { squadSize: 4, failsRequired: 1 },
    { squadSize: 5, failsRequired: 2 },
    // 8人局第4轮需要2张失败
    { squadSize: 5, failsRequired: 1 }
  ],
  9: [
    { squadSize: 3, failsRequired: 1 },
    { squadSize: 4, failsRequired: 1 },
    { squadSize: 4, failsRequired: 1 },
    { squadSize: 5, failsRequired: 2 },
    // 9人局第4轮需要2张失败
    { squadSize: 5, failsRequired: 1 }
  ],
  10: [
    { squadSize: 3, failsRequired: 1 },
    { squadSize: 4, failsRequired: 1 },
    { squadSize: 4, failsRequired: 1 },
    { squadSize: 5, failsRequired: 2 },
    // 10人局第4轮需要2张失败
    { squadSize: 5, failsRequired: 1 }
  ]
};
function defaultAvalonDeck(size) {
  switch (size) {
    case 5:
      return ["merlin", "percival", "servant", "assassin", "morgana"];
    case 6:
      return ["merlin", "percival", "servant", "servant", "assassin", "morgana"];
    case 7:
      return ["merlin", "percival", "servant", "servant", "assassin", "morgana", "minion"];
    case 8:
      return ["merlin", "percival", "servant", "servant", "servant", "assassin", "morgana", "minion"];
    case 9:
      return ["merlin", "percival", "servant", "servant", "servant", "servant", "assassin", "morgana", "mordred"];
    case 10:
    default:
      return ["merlin", "percival", "servant", "servant", "servant", "servant", "assassin", "morgana", "mordred", "oberon"];
  }
}
function isEvil(role) {
  return ["assassin", "morgana", "mordred", "oberon", "minion"].includes(role);
}
function isGood(role) {
  return !isEvil(role);
}
function resolveVision(player, allPlayers) {
  const role = player.role;
  const alignment = isEvil(role) ? "evil" : "good";
  const known = [];
  if (role === "merlin") {
    for (const p of allPlayers) {
      if (p.id !== player.id && isEvil(p.role) && p.role !== "mordred") {
        known.push({ seat: p.seat, name: p.name, tag: "\u90AA\u6076\u9635\u8425" });
      }
    }
  } else if (role === "percival") {
    for (const p of allPlayers) {
      if (p.role === "merlin" || p.role === "morgana") {
        known.push({ seat: p.seat, name: p.name, tag: "\u6885\u6797\u6216\u83AB\u7518\u5A1C" });
      }
    }
    known.sort(() => Math.random() - 0.5);
  } else if (isEvil(role) && role !== "oberon") {
    for (const p of allPlayers) {
      if (p.id !== player.id && isEvil(p.role) && p.role !== "oberon") {
        known.push({ seat: p.seat, name: p.name, tag: "\u90AA\u6076\u540C\u4F34 (" + AVALON_ROLE_NAMES[p.role] + ")" });
      }
    }
  }
  return {
    title: AVALON_ROLE_NAMES[role] || "\u672A\u77E5\u89D2\u8272",
    alignment,
    roleName: AVALON_ROLE_NAMES[role],
    description: AVALON_ROLE_DESC[role] || "",
    knownPlayers: known
  };
}
function initialAvalonState(size) {
  const enableLady = size >= 7;
  const initialLadyHolder = enableLady ? size : void 0;
  return {
    currentRound: 1,
    missionHistory: ["pending", "pending", "pending", "pending", "pending"],
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

// lib/rules.ts
var ROLES = { wolf: "\u72FC\u4EBA", seer: "\u9884\u8A00\u5BB6", witch: "\u5973\u5DEB", hunter: "\u730E\u4EBA", idiot: "\u767D\u75F4", guard: "\u5B88\u536B", villager: "\u6751\u6C11" };
var ROLE_IDS = ["wolf", "seer", "witch", "hunter", "idiot", "guard", "villager"];
var PLAYER_SIZES = [6, 7, 8, 9, 10, 11, 12];
var RuleError = class extends Error {
};
function fail(message) {
  throw new RuleError(message);
}
function recommendedConfig(size, preset = "classic") {
  if (!PLAYER_SIZES.includes(size)) fail("\u652F\u6301 6\u201312 \u4EBA\u5C40\uFF0C\u4E0D\u542B\u6CD5\u5B98");
  if (!["classic", "guard"].includes(preset)) fail("\u63A8\u8350\u914D\u7F6E\u65E0\u6548");
  const wolves = size >= 12 ? 4 : size >= 9 ? 3 : 2;
  const roles = { wolf: wolves, seer: 1, witch: 1, hunter: size >= 8 ? 1 : 0, idiot: size >= 11 && preset === "classic" ? 1 : 0, guard: size >= 10 && preset === "guard" ? 1 : 0, villager: 0 };
  roles.villager = size - Object.values(roles).reduce((sum, n) => sum + n, 0);
  return { mode: "recommended", preset, roles, victory: "edge", witchSelfSave: "firstNight", sheriff: false, sheriffExplosion: "single", nightMode: "openEyes" };
}
function legacyConfig(size) {
  const config = recommendedConfig(size);
  return { ...config, victory: size <= 9 ? "parity" : "edge", witchSelfSave: "never", sheriff: false };
}
function resolveConfig(size, input) {
  if (!PLAYER_SIZES.includes(size)) fail("\u652F\u6301 6\u201312 \u4EBA\u5C40\uFF0C\u4E0D\u542B\u6CD5\u5B98");
  if (input === void 0) return recommendedConfig(size);
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("\u73A9\u6CD5\u914D\u7F6E\u65E0\u6548");
  const value = input;
  const sheriff = value.sheriff === void 0 ? false : value.sheriff;
  if (typeof sheriff !== "boolean") fail("\u8B66\u957F\u5F00\u5173\u5FC5\u987B\u662F\u5E03\u5C14\u503C");
  if (sheriff && size < 9) fail("\u8B66\u957F\u6D41\u7A0B\u652F\u6301 9\u201312 \u4EBA\u5C40");
  const sheriffExplosion = value.sheriffExplosion === void 0 ? "single" : value.sheriffExplosion;
  const nightMode = value.nightMode === "closedEyes" ? "closedEyes" : "openEyes";
  if (typeof sheriffExplosion !== "string" || !["single", "double"].includes(sheriffExplosion)) fail("\u8BF7\u9009\u62E9\u8B66\u4E0A\u81EA\u7206\u7684\u8B66\u5FBD\u89C4\u5219");
  const witchSelfSave = value.witchSelfSave === void 0 ? "firstNight" : value.witchSelfSave;
  if (typeof witchSelfSave !== "string" || !["never", "firstNight", "always"].includes(witchSelfSave)) fail("\u8BF7\u9009\u62E9\u6709\u6548\u7684\u5973\u5DEB\u81EA\u6551\u89C4\u5219");
  if (value.mode === "recommended") {
    if (value.preset !== void 0 && !["classic", "guard"].includes(String(value.preset))) fail("\u63A8\u8350\u914D\u7F6E\u65E0\u6548");
    return { ...recommendedConfig(size, value.preset || "classic"), witchSelfSave, sheriff, sheriffExplosion, nightMode };
  }
  if (value.mode !== "custom") fail("\u8BF7\u9009\u62E9\u63A8\u8350\u73A9\u6CD5\u6216\u81EA\u9009\u73A9\u6CD5");
  if (!value.roles || typeof value.roles !== "object" || Array.isArray(value.roles)) fail("\u8BF7\u914D\u7F6E\u8EAB\u4EFD\u6570\u91CF");
  const supplied = value.roles;
  if (Object.keys(supplied).some((role) => !ROLE_IDS.includes(role))) fail("\u542B\u6709\u6682\u4E0D\u652F\u6301\u7684\u89D2\u8272");
  const roles = {};
  for (const role of ROLE_IDS) {
    const n = Object.hasOwn(supplied, role) ? supplied[role] : 0;
    if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > size) fail("\u8EAB\u4EFD\u6570\u91CF\u5FC5\u987B\u662F\u975E\u8D1F\u6574\u6570");
    if (!["wolf", "villager"].includes(role) && n > 1) fail(ROLES[role] + "\u6700\u591A 1 \u4F4D");
    roles[role] = n;
  }
  if (Object.values(roles).reduce((sum, n) => sum + n, 0) !== size) fail("\u8EAB\u4EFD\u603B\u6570\u5FC5\u987B\u7B49\u4E8E " + size + " \u4F4D\u73A9\u5BB6");
  if (roles.wolf < 1 || roles.wolf * 2 >= size) fail("\u81F3\u5C11 1 \u4F4D\u72FC\u4EBA\uFF0C\u4E14\u72FC\u4EBA\u5FC5\u987B\u5C11\u4E8E\u597D\u4EBA");
  if (roles.villager < 1) fail("\u81F3\u5C11\u4FDD\u7559 1 \u4F4D\u6751\u6C11");
  if (roles.seer + roles.witch + roles.hunter + roles.idiot + roles.guard < 1) fail("\u81F3\u5C11\u4FDD\u7559 1 \u4F4D\u795E\u804C");
  if (typeof value.victory !== "string" || !["edge", "parity"].includes(value.victory)) fail("\u8BF7\u9009\u62E9\u6709\u6548\u7684\u80DC\u8D1F\u6761\u4EF6");
  return { mode: "custom", preset: "classic", roles, victory: value.victory, witchSelfSave, sheriff, sheriffExplosion };
}
function configDeck(config) {
  return ROLE_IDS.flatMap((role) => Array(config.roles[role]).fill(role));
}
function selfSaveAllowed(config, day) {
  return config.witchSelfSave === "always" || config.witchSelfSave === "firstNight" && day === 1;
}

// lib/game.ts
function initialRoom(id, hostKey, name, size, voice, input, gameType = "werewolf") {
  const isAvalon = gameType === "avalon" || input && input.gameType === "avalon";
  const gType = isAvalon ? "avalon" : "werewolf";
  const roomSetup = isAvalon ? void 0 : resolveConfig(size, input);
  return {
    id,
    hostKey,
    hostName: name,
    size,
    setup: roomSetup,
    lastGuard: "",
    voice,
    phase: "lobby",
    epoch: 0,
    day: 0,
    players: [],
    night: { wolves: {}, kill: "", seerDone: false, guardDone: false, guardTarget: "", witch: null },
    medicine: { heal: true, poison: true },
    votes: {},
    runoff: [],
    voteRound: 0,
    speaker: 0,
    deadline: 0,
    hunter: "",
    afterHunter: "",
    winner: "",
    message: isAvalon ? "\u963F\u74E6\u9686\u623F\u95F4\u5DF2\u521B\u5EFA\uFF0C\u652F\u6301 5\u201310 \u4EBA\u53CA 20 \u5F20 NFC/\u767D\u5361\u5207\u5361\u3002" : "\u7B49\u670B\u53CB\u4EEC\u5165\u5EA7\uFF0C\u51C6\u5907\u597D\u540E\u7531\u6CD5\u5B98\u53D1\u8EAB\u4EFD\u3002",
    logs: [],
    expires: Date.now() + 864e5,
    gameType: gType,
    avalon: isAvalon ? initialAvalonState(size) : void 0,
    voiceMasterId: hostKey,
    voiceMasterName: name,
    pairingCode: id.slice(-4).toUpperCase(),
    nightDuration: 12,
    offlineVote: false,
    villagerBluffs: {}
  };
}
var RoomError = class extends Error {
};
function insist(ok, msg) {
  if (!ok) throw new RoomError(msg);
}
function log(r, text) {
  r.message = text;
  r.logs.push({ day: r.day, text });
  r.logs = r.logs.slice(-100);
}
function move(r, p) {
  r.phase = p;
  r.epoch++;
  r.deadline = 0;
}
function alive(r) {
  return r.players.filter((p) => p.alive);
}
function setup(r) {
  if (r.setup) return { ...r.setup, sheriff: r.setup.sheriff || false, sheriffExplosion: r.setup.sheriffExplosion || "single" };
  const validSize = Math.max(6, Math.min(12, r.size));
  return r.gameType === "avalon" ? recommendedConfig(validSize) : legacyConfig(r.size);
}
function voters(r) {
  return alive(r).filter((p) => !p.idiotRevealed && !(r.voteRound === 2 && r.runoff.includes(p.id)));
}
function election(r) {
  return r.election ??= { choices: {}, candidates: [], withdrawn: [], runoff: [], votes: {}, round: 1, done: false };
}
function candidates(r) {
  const e = election(r);
  return e.candidates.filter((id) => getPlayer(r, id).alive && !e.withdrawn.includes(id) && (!e.runoff.length || e.runoff.includes(id)));
}
function electionVoters(r) {
  return alive(r).filter((p) => !election(r).choices[p.id] && !p.idiotRevealed);
}
function speakers(r) {
  if (r.phase === "sheriffSpeech") return candidates(r).map((id) => getPlayer(r, id));
  if (r.phase === "runoffSpeech") return r.runoff.map((id) => getPlayer(r, id)).filter((p) => p.alive);
  if (r.speechOrder?.length) return r.speechOrder.map((id) => getPlayer(r, id)).filter((p) => p.alive);
  return alive(r);
}
function getPlayer(r, id) {
  const p = r.players.find((p2) => p2.id === id);
  insist(p, "\u73A9\u5BB6\u4E0D\u5B58\u5728");
  return p;
}
function liveTarget(r, id, allowPass = true) {
  if (allowPass && id === "pass") return null;
  const p = getPlayer(r, id);
  insist(p.alive, "\u53EA\u80FD\u9009\u62E9\u5B58\u6D3B\u73A9\u5BB6");
  return p;
}
function tally(votes, weight = () => 1) {
  const counts = {};
  for (const [voter, id] of Object.entries(votes)) {
    if (id && id !== "pass") counts[id] = (counts[id] || 0) + weight(voter);
  }
  const max = Math.max(0, ...Object.values(counts));
  return { counts, leaders: Object.keys(counts).filter((id) => counts[id] === max) };
}
function winner(r) {
  const a = alive(r), wolves = a.filter((p) => p.role === "wolf").length;
  const wolfWins = setup(r).victory === "edge" ? !a.some((p) => p.role === "villager") || !a.some((p) => p.role !== "wolf" && p.role !== "villager") : wolves >= a.length - wolves;
  const result = wolves === 0 ? "\u597D\u4EBA" : wolfWins ? "\u72FC\u4EBA" : "";
  if (result) {
    r.winner = result;
    move(r, "ended");
    log(r, result + "\u9635\u8425\u83B7\u80DC\uFF0C\u672C\u5C40\u8EAB\u4EFD\u5DF2\u63ED\u6653\u3002");
    return true;
  }
  return false;
}
function night(r) {
  r.day++;
  r.night = { wolves: {}, kill: "", seerDone: false, guardDone: false, guardTarget: "", witch: null };
  r.votes = {};
  r.runoff = [];
  r.voteRound = 0;
  r.hunter = "";
  const firstPhase = setup(r).roles.guard ? "guard" : "wolves";
  move(r, firstPhase);
  r.deadline = Date.now() + (r.nightDuration || 12) * 1e3;
  log(r, "\u7B2C " + r.day + " \u591C\u5F00\u59CB\uFF0C\u7EAF\u9ED1\u591C\u89C6\u6A21\u5F0F\u5DF2\u5F00\u542F\u3002\u6BCF\u9636\u6BB5\u56FA\u5B9A\u5012\u8BA1\u65F6 " + (r.nightDuration || 12) + " \u79D2\uFF0C\u9632\u79D2\u8FC7\u62BF\u8EAB\u4EFD\u3002");
}
function resume(r, after) {
  if (winner(r)) return;
  const sheriff = r.sheriffId ? r.players.find((p) => p.id === r.sheriffId) : null;
  if (sheriff && (!sheriff.alive || sheriff.idiotRevealed)) {
    r.badgeFrom = sheriff.id;
    r.afterBadge = after;
    r.sheriffId = "";
    move(r, "badge");
    log(r, sheriff.seat + " \u53F7\u8BF7\u79FB\u4EA4\u6216\u6495\u6BC1\u8B66\u5FBD\u3002");
    return;
  }
  if (after === "speech" && sheriff?.alive) {
    move(r, "order");
    log(r, "\u8BF7\u8B66\u957F\u51B3\u5B9A\u672C\u8F6E\u53D1\u8A00\u987A\u5E8F\u3002");
    return;
  }
  move(r, after);
  if (after === "speech") {
    r.speechOrder = alive(r).map((p) => p.id);
    beginSpeech(r);
  }
}
function afterDeath(r, ids, poisonId, after) {
  for (const id of ids) getPlayer(r, id).alive = false;
  const h = ids.map((id) => getPlayer(r, id)).find((p) => p.role === "hunter" && p.id !== poisonId);
  if (h) {
    r.hunter = h.id;
    r.afterHunter = after;
    move(r, "hunter");
    log(r, h.seat + " \u53F7\u730E\u4EBA\u53EF\u4EE5\u5F00\u67AA\u3002");
  } else resume(r, after);
}
function beginSpeech(r) {
  r.speaker = 0;
  r.deadline = Date.now() + 9e4;
}
function finishElection(r, id) {
  election(r).done = true;
  r.sheriffId = id;
  move(r, "dawn");
  log(r, id ? getPlayer(r, id).seat + " \u53F7\u5F53\u9009\u8B66\u957F\u3002\u8BF7\u6CD5\u5B98\u516C\u5E03\u6628\u591C\u7ED3\u679C\u3002" : "\u672C\u5C40\u6CA1\u6709\u8B66\u957F\u3002\u8BF7\u6CD5\u5B98\u516C\u5E03\u6628\u591C\u7ED3\u679C\u3002");
}
function settleDawn(r, after = "speech") {
  const poison = r.night.witch?.kind === "poison" ? r.night.witch.target : "";
  const saved = r.night.witch?.kind === "heal", guarded = !!r.night.kill && r.night.guardTarget === r.night.kill, kill = saved === guarded ? r.night.kill : "";
  const deaths = [...new Set([kill, poison].filter((id) => id && getPlayer(r, id).alive))];
  log(r, deaths.length ? "\u6628\u591C\u51FA\u5C40\uFF1A" + deaths.map((id) => getPlayer(r, id).seat + " \u53F7").join("\u3001") + "\u3002" : "\u6628\u591C\u662F\u5E73\u5B89\u591C\u3002");
  afterDeath(r, deaths, poison, after);
}
function cancelSwaps(r, id) {
  r.seatSwaps = (r.seatSwaps || []).filter((s) => s.from !== id && s.to !== id);
}
function mutateCore(r, key, b) {
  const host = key === r.hostKey, me = r.players.find((p) => p.key === key);
  const act = b.action;
  if (act === "join") {
    insist(!host && !me, "\u4F60\u5DF2\u7ECF\u5728\u623F\u95F4\u4E2D");
    insist(r.phase === "lobby", "\u672C\u5C40\u5DF2\u5F00\u59CB\uFF0C\u4E0D\u80FD\u4E2D\u9014\u5165\u5EA7");
    insist(r.players.length < r.size, "\u5EA7\u4F4D\u5DF2\u6EE1");
    const name = String(b.name || "").trim();
    insist(name.length > 0 && name.length <= 16, "\u6635\u79F0\u9700\u4E3A 1\u201316 \u4E2A\u5B57");
    insist(!r.players.some((p) => p.name === name), "\u6635\u79F0\u5DF2\u6709\u4EBA\u4F7F\u7528\uFF0C\u6362\u4E00\u4E2A\u8BD5\u8BD5");
    let seat = 1;
    if (b.seat !== void 0 && b.seat !== 0) {
      insist(Number.isInteger(b.seat) && b.seat >= 1 && b.seat <= r.size, "\u5EA7\u4F4D\u53F7\u7801\u65E0\u6548");
      seat = b.seat;
      insist(!r.players.some((p) => p.seat === seat), "\u5EA7\u4F4D\u5DF2\u88AB\u5176\u4ED6\u73A9\u5BB6\u5360\u7528\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9");
    } else while (r.players.some((p) => p.seat === seat)) seat++;
    r.players.push({ id: b.newId, seat, name, key, ready: false, ack: false, role: "", alive: true, checks: [] });
    r.players.sort((a, b2) => a.seat - b2.seat);
    return;
  }
  insist(host || me, "\u8BF7\u5148\u5165\u5EA7");
  insist(b.epoch === r.epoch, "\u6D41\u7A0B\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u786E\u8BA4\u5F53\u524D\u9636\u6BB5\u540E\u91CD\u8BD5");
  if (act === "bindCard") {
    insist(me, "\u8BF7\u5148\u5165\u5EA7");
    if (b.cardNo !== void 0 && b.cardNo !== null) {
      const cNo = Number(b.cardNo);
      insist(Number.isInteger(cNo) && cNo >= 1 && cNo <= 20, "\u5361\u53F7\u9700\u5728 1\u201320 \u4E4B\u95F4");
      me.cardNo = cNo;
    }
    if (b.cardUid !== void 0 && b.cardUid !== null) {
      me.cardUid = String(b.cardUid).trim();
    }
    log(r, me.name + " (" + me.seat + "\u53F7) \u7ED1\u5B9A\u4E86\u5B9E\u4F53\u5361" + (me.cardNo ? " #" + me.cardNo : "") + (me.cardUid ? " [UID:" + me.cardUid + "]" : ""));
    r.epoch++;
    return;
  }
  if (r.gameType === "avalon") {
    if (act === "toggleOfflineVote") {
      insist(host, "\u53EA\u6709\u6CD5\u5B98\u53EF\u4EE5\u5207\u6362\u7EBF\u4E0B\u4E3E\u724C\u8868\u51B3\u6A21\u5F0F");
      r.offlineVote = !r.offlineVote;
      r.epoch++;
      log(r, r.offlineVote ? "\u5DF2\u5F00\u542F\u3010\u7EBF\u4E0B\u4E3E\u724C\u8868\u51B3\u6A21\u5F0F\u3011\uFF1A\u961F\u957F\u7EBF\u4E0B\u5206\u53D1\u5B9D\u5251\u5361(#14~#18)\uFF0C\u684C\u9762\u4EAE\u7968\u540E\u961F\u957F/\u6CD5\u5B98\u4E00\u952E\u5F55\u5165\uFF01" : "\u5DF2\u5207\u6362\u4E3A\u3010\u7EBF\u4E0A\u624B\u673A\u8868\u51B3\u6A21\u5F0F\u3011\uFF1A\u5168\u5458\u5728\u624B\u673A\u4E0A\u70B9\u51FB\u8D5E\u6210/\u53CD\u5BF9\u3002");
      return;
    }
    if (act === "avalonOfflineResolve") {
      insist((host || me && me.seat === r.avalon?.leaderSeat) && r.phase === "avalonVoteTeam", "\u53EA\u6709\u961F\u957F\u6216\u6CD5\u5B98\u53EF\u4EE5\u5F55\u5165\u7EBF\u4E0B\u8868\u51B3\u7ED3\u679C");
      const passed = Boolean(b.passed);
      if (passed) {
        r.avalon.voteTracker = 0;
        r.avalon.missionVotes = [];
        r.avalon.missionSubmissions = {};
        move(r, "avalonVoteMission");
        log(r, "\u7EBF\u4E0B\u4E3E\u724C\u8868\u51B3\u3010\u901A\u8FC7\u3011\uFF01\u8BF7\u51FA\u52E4\u961F\u5458\u62FF\u51FA\u624B\u673A\u6216\u5237 NFC \u5B9D\u5251\u767D\u5361\uFF0C\u79D8\u5BC6\u6267\u884C\u4EFB\u52A1\uFF01");
      } else {
        r.avalon.voteTracker++;
        if (r.avalon.voteTracker >= 5) {
          r.winner = "evil";
          move(r, "ended");
          r.avalon.winnerReason = "\u7EBF\u4E0B\u7EC4\u961F\u8FDE\u7EED 5 \u6B21\u88AB\u5426\u51B3\uFF01\u90AA\u6076\u9635\u8425\u76F4\u63A5\u83B7\u80DC\uFF01";
          log(r, r.avalon.winnerReason);
        } else {
          r.avalon.leaderSeat = r.avalon.leaderSeat % r.size + 1;
          move(r, "avalonNominate");
          log(r, "\u7EBF\u4E0B\u7EC4\u961F\u88AB\u5426\u51B3\uFF01\u961F\u957F\u79FB\u4EA4\u7ED9 " + r.avalon.leaderSeat + " \u53F7\uFF0C\u91CD\u65B0\u9009\u4EBA\u3002\u5F53\u524D\u5426\u51B3\u8BA1\u6570: " + r.avalon.voteTracker + "/5\u3002");
        }
      }
      r.epoch++;
      return;
    }
    if (act === "avalonNominate") {
      insist(r.phase === "avalonNominate", "\u73B0\u5728\u4E0D\u662F\u6311\u9009\u51FA\u52E4\u961F\u5458\u9636\u6BB5");
      insist(host || me && me.seat === r.avalon?.leaderSeat, "\u53EA\u6709\u5F53\u524D\u961F\u957F\u6216\u6CD5\u5B98\u53EF\u4EE5\u6311\u9009\u961F\u5458");
      const reqSize = AVALON_QUEST_TABLE[r.size]?.[r.avalon.currentRound - 1]?.squadSize || 2;
      const squad = Array.isArray(b.squad) ? b.squad.map(String) : [];
      insist(squad.length === reqSize, "\u672C\u8F6E\u4EFB\u52A1\u5FC5\u987B\u6311\u9009 " + reqSize + " \u540D\u961F\u5458\u51FA\u52E4");
      for (const pid of squad) insist(r.players.some((p) => p.id === pid), "\u51FA\u52E4\u961F\u5458\u4E0D\u5B58\u5728");
      insist(new Set(squad).size === reqSize, "\u961F\u5458\u4E0D\u80FD\u91CD\u590D\u6311\u9009");
      r.avalon.nominatedSquad = squad;
      r.avalon.teamVotes = {};
      r.avalon.teamVotesRevealed = false;
      move(r, "avalonVoteTeam");
      log(r, "\u961F\u957F\u63D0\u8BAE\u51FA\u52E4\u540D\u5355\uFF1A" + squad.map((id) => getPlayer(r, id).seat + "\u53F7").join("\u3001") + "\u3002\u8BF7\u5168\u5458\u5728\u624B\u673A\u6216\u5927\u5C4F\u4E0A\u8868\u51B3\uFF01");
      return;
    }
    if (act === "avalonVoteTeam") {
      insist(me && r.phase === "avalonVoteTeam", "\u73B0\u5728\u4E0D\u662F\u5168\u5458\u7EC4\u961F\u8868\u51B3\u9636\u6BB5");
      insist(typeof b.approve === "boolean", "\u8BF7\u9009\u62E9\u8D5E\u6210\u6216\u53CD\u5BF9");
      r.avalon.teamVotes[me.id] = b.approve;
      if (Object.keys(r.avalon.teamVotes).length >= r.players.length) {
        const approves = Object.values(r.avalon.teamVotes).filter(Boolean).length;
        const rejects = r.players.length - approves;
        r.avalon.teamVotesRevealed = true;
        log(r, "\u7EC4\u961F\u8868\u51B3\u7ED3\u679C\uFF1A" + approves + " \u7968\u8D5E\u6210\uFF0C" + rejects + " \u7968\u53CD\u5BF9\u3002");
        if (approves > r.players.length / 2) {
          r.avalon.voteTracker = 0;
          r.avalon.missionVotes = [];
          r.avalon.missionSubmissions = {};
          move(r, "avalonVoteMission");
          log(r, "\u7EC4\u961F\u901A\u8FC7\uFF01\u8BF7\u51FA\u52E4\u961F\u5458\u62FF\u51FA\u624B\u673A\u6216\u5237 NFC \u767D\u5361\uFF0C\u79D8\u5BC6\u6267\u884C\u4EFB\u52A1\uFF01");
        } else {
          r.avalon.voteTracker++;
          if (r.avalon.voteTracker >= 5) {
            r.winner = "evil";
            move(r, "ended");
            r.avalon.winnerReason = "\u7EC4\u961F\u8FDE\u7EED 5 \u6B21\u88AB\u5426\u51B3\uFF01\u90AA\u6076\u9635\u8425\u76F4\u63A5\u83B7\u80DC\uFF01";
            log(r, r.avalon.winnerReason);
          } else {
            r.avalon.leaderSeat = r.avalon.leaderSeat % r.size + 1;
            move(r, "avalonNominate");
            log(r, "\u7EC4\u961F\u88AB\u5426\u51B3\uFF01\u961F\u957F\u79FB\u4EA4\u7ED9 " + r.avalon.leaderSeat + " \u53F7\uFF0C\u91CD\u65B0\u9009\u4EBA\u3002\u5F53\u524D\u5426\u51B3\u8BA1\u6570: " + r.avalon.voteTracker + "/5\u3002");
          }
        }
      }
      r.epoch++;
      return;
    }
    if (act === "avalonVoteMission") {
      insist(me && r.phase === "avalonVoteMission", "\u73B0\u5728\u4E0D\u662F\u51FA\u52E4\u6267\u884C\u9636\u6BB5");
      insist(r.avalon.nominatedSquad.includes(me.id), "\u53EA\u6709\u88AB\u9009\u4E2D\u7684\u51FA\u52E4\u961F\u5458\u80FD\u6267\u884C\u4EFB\u52A1");
      insist(!r.avalon.missionSubmissions[me.id], "\u4F60\u5DF2\u7ECF\u63D0\u4EA4\u8FC7\u4EFB\u52A1\u5361");
      const goodPlayer = isGood(me.role);
      let success = Boolean(b.success);
      if (goodPlayer) {
        success = true;
      }
      r.avalon.missionSubmissions[me.id] = true;
      r.avalon.missionVotes.push(success ? "success" : "fail");
      if (Object.keys(r.avalon.missionSubmissions).length >= r.avalon.nominatedSquad.length) {
        for (let i = r.avalon.missionVotes.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [r.avalon.missionVotes[i], r.avalon.missionVotes[j]] = [r.avalon.missionVotes[j], r.avalon.missionVotes[i]];
        }
        const fails = r.avalon.missionVotes.filter((v) => v === "fail").length;
        const successes = r.avalon.nominatedSquad.length - fails;
        r.avalon.missionFails[r.avalon.currentRound - 1] = fails;
        const reqFails = AVALON_QUEST_TABLE[r.size]?.[r.avalon.currentRound - 1]?.failsRequired || 1;
        const isFail = fails >= reqFails;
        r.avalon.missionHistory[r.avalon.currentRound - 1] = isFail ? "fail" : "success";
        r.avalon.lastMissionSummary = successes + " \u6210\u529F / " + fails + " \u7834\u574F" + (reqFails > 1 ? " (\u7B2C4\u8F6E\u97002\u7834\u574F)" : "") + " -> " + (isFail ? "\u4EFB\u52A1\u5931\u8D25" : "\u4EFB\u52A1\u6210\u529F");
        log(r, "\u7B2C " + r.avalon.currentRound + " \u8F6E\u4EFB\u52A1\u516C\u5E03\uFF1A" + successes + " \u7968\u6210\u529F\uFF0C" + fails + " \u7968\u7834\u574F\uFF01\u5224\u5B9A\uFF1A\u3010" + (isFail ? "\u4EFB\u52A1\u5931\u8D25" : "\u4EFB\u52A1\u6210\u529F") + "\u3011" + (reqFails > 1 ? "\uFF08\u9700 " + reqFails + " \u5F20\u7834\u574F\u724C\uFF09" : "") + "\uFF01");
        const evilPoints = r.avalon.missionHistory.filter((h) => h === "fail").length;
        const goodPoints = r.avalon.missionHistory.filter((h) => h === "success").length;
        if (evilPoints >= 3) {
          r.winner = "evil";
          move(r, "ended");
          r.avalon.winnerReason = "\u90AA\u6076\u9635\u8425\u6210\u529F\u7834\u574F\u4E86 3 \u4E2A\u4EFB\u52A1\uFF0C\u8D62\u5F97\u80DC\u5229\uFF01";
          log(r, r.avalon.winnerReason);
        } else if (goodPoints >= 3) {
          move(r, "avalonAssassinate");
          log(r, "\u6B63\u4E49\u9635\u8425\u7387\u5148\u5B8C\u6210 3 \u4E2A\u4EFB\u52A1\uFF01\u8BF7\u523A\u5BA2\u7741\u773C\uFF0C\u79D8\u5BC6\u6311\u9009\u523A\u6740\u76EE\u6807\uFF01");
        } else {
          r.avalon.currentRound++;
          r.avalon.leaderSeat = r.avalon.leaderSeat % r.size + 1;
          move(r, "avalonNominate");
          log(r, "\u8FDB\u5165\u7B2C " + r.avalon.currentRound + " \u8F6E\u4EFB\u52A1\uFF01\u8BF7 " + r.avalon.leaderSeat + " \u53F7\u961F\u957F\u6311\u9009\u51FA\u52E4\u961F\u5458\u3002");
        }
      }
      r.epoch++;
      return;
    }
    if (act === "avalonStepReveal") {
      insist(host, "\u53EA\u6709\u6CD5\u5B98\u53EF\u4EE5\u63A8\u8FDB\u9010\u5F20\u63ED\u6653");
      insist(r.phase === "avalonReveal", "\u73B0\u5728\u4E0D\u662F\u5F00\u724C\u63ED\u6653\u9636\u6BB5");
      const total = r.avalon.cardRevealOrder.length;
      if (r.avalon.revealingIndex < total - 1) {
        r.avalon.revealingIndex++;
        const currentCard = r.avalon.cardRevealOrder[r.avalon.revealingIndex];
        log(r, "\u7B2C " + (r.avalon.revealingIndex + 1) + " \u5F20\u724C\u63ED\u6653\uFF1A" + (currentCard === "success" ? "\u{1F535} \u6210\u529F" : "\u{1F534} \u7834\u574F\uFF01"));
      } else {
        const fails = r.avalon.cardRevealOrder.filter((v) => v === "fail").length;
        const successes = total - fails;
        const curRound = r.avalon.currentRound;
        r.avalon.missionFails[curRound - 1] = fails;
        const reqFails = AVALON_QUEST_TABLE[r.size]?.[curRound - 1]?.failsRequired || 1;
        const isFail = fails >= reqFails;
        r.avalon.missionHistory[curRound - 1] = isFail ? "fail" : "success";
        r.avalon.lastMissionSummary = successes + " \u6210\u529F / " + fails + " \u7834\u574F" + (reqFails > 1 ? " (\u7B2C4\u8F6E\u97002\u7834\u574F)" : "") + " -> " + (isFail ? "\u4EFB\u52A1\u5931\u8D25" : "\u4EFB\u52A1\u6210\u529F");
        r.avalon.matrixRecords = r.avalon.matrixRecords || [];
        r.avalon.matrixRecords.push({
          round: curRound,
          squadSeats: r.avalon.nominatedSquad.map((id) => getPlayer(r, id).seat),
          leaderSeat: r.avalon.leaderSeat,
          hammer: r.avalon.voteTracker + 1,
          teamVotes: Object.entries(r.avalon.teamVotes).map(([pid, app]) => ({
            seat: getPlayer(r, pid).seat,
            name: getPlayer(r, pid).name,
            approve: app
          })),
          successCount: successes,
          failCount: fails,
          failsRequired: reqFails,
          result: isFail ? "fail" : "success",
          cardRevealOrder: [...r.avalon.cardRevealOrder]
        });
        log(r, "\u7B2C " + curRound + " \u8F6E\u6700\u7EC8\u5224\u5B9A\uFF1A\u3010" + (isFail ? "\u4EFB\u52A1\u5931\u8D25" : "\u4EFB\u52A1\u6210\u529F") + "\u3011\uFF08" + successes + " \u6210\u529F / " + fails + " \u7834\u574F\uFF09\uFF01");
        const evilPoints = r.avalon.missionHistory.filter((h) => h === "fail").length;
        const goodPoints = r.avalon.missionHistory.filter((h) => h === "success").length;
        if (evilPoints >= 3) {
          r.winner = "evil";
          move(r, "ended");
          r.avalon.winnerReason = "\u90AA\u6076\u9635\u8425\u6210\u529F\u7834\u574F\u4E86 3 \u4E2A\u4EFB\u52A1\uFF0C\u8D62\u5F97\u80DC\u5229\uFF01";
          log(r, r.avalon.winnerReason);
        } else if (goodPoints >= 3) {
          move(r, "avalonAssassinate");
          log(r, "\u6B63\u4E49\u9635\u8425\u7387\u5148\u5B8C\u6210 3 \u4E2A\u4EFB\u52A1\uFF01\u8BF7\u523A\u5BA2\u7741\u773C\uFF0C\u79D8\u5BC6\u6311\u9009\u523A\u6740\u76EE\u6807\uFF01");
        } else {
          const ladyActive = r.size >= 7 && [2, 3, 4].includes(curRound) && r.avalon.ladyHolderSeat;
          if (ladyActive) {
            move(r, "avalonLady");
            r.avalon.ladyTargetSeat = void 0;
            r.avalon.ladyResultAlignment = void 0;
            log(r, "\u7B2C " + curRound + " \u8F6E\u4EFB\u52A1\u7ED3\u675F\uFF0C\u89E6\u53D1\u3010\u{1F9DA} \u6E56\u4E2D\u4ED9\u5973\u67E5\u9A8C\u3011\uFF01\u8BF7 " + r.avalon.ladyHolderSeat + " \u53F7\u6301\u5361\u73A9\u5BB6\u5C06\u5B9E\u4F53\u4ED9\u5973\u5361\u9012\u7ED9\u88AB\u9A8C\u8005\uFF0C\u5E76\u5728\u624B\u673A\u9009\u62E9\u67E5\u9A8C\u76EE\u6807\uFF01");
          } else {
            r.avalon.currentRound++;
            r.avalon.leaderSeat = r.avalon.leaderSeat % r.size + 1;
            move(r, "avalonNominate");
            log(r, "\u8FDB\u5165\u7B2C " + r.avalon.currentRound + " \u8F6E\u4EFB\u52A1\uFF01\u8BF7 " + r.avalon.leaderSeat + " \u53F7\u961F\u957F\u6311\u9009\u51FA\u52E4\u961F\u5458\u3002");
          }
        }
      }
      r.epoch++;
      return;
    }
    if (act === "avalonLadyCheck") {
      insist(r.phase === "avalonLady", "\u73B0\u5728\u4E0D\u662F\u6E56\u4E2D\u4ED9\u5973\u67E5\u9A8C\u9636\u6BB5");
      const holderSeat = r.avalon.ladyHolderSeat;
      insist(host || me && me.seat === holderSeat, "\u53EA\u6709\u5F53\u524D\u6301\u6709\u6E56\u4E2D\u4ED9\u5973\u5361\uFF08#" + holderSeat + "\u53F7\uFF09\u7684\u73A9\u5BB6\u6216\u6CD5\u5B98\u53EF\u4EE5\u9A8C\u4EBA");
      const targetSeat = Number(b.targetSeat);
      insist(Number.isInteger(targetSeat) && targetSeat >= 1 && targetSeat <= r.size, "\u76EE\u6807\u5EA7\u4F4D\u65E0\u6548");
      insist(targetSeat !== holderSeat, "\u6E56\u4E2D\u4ED9\u5973\u4E0D\u80FD\u67E5\u9A8C\u81EA\u5DF1");
      r.avalon.ladyCheckedSeats = r.avalon.ladyCheckedSeats || [];
      insist(!r.avalon.ladyCheckedSeats.includes(targetSeat), "\u8BE5\u73A9\u5BB6\u4E4B\u524D\u5DF2\u88AB\u4ED9\u5973\u67E5\u9A8C\u8FC7\uFF0C\u4E0D\u80FD\u91CD\u590D\u67E5\u9A8C");
      const targetPlayer = r.players.find((p) => p.seat === targetSeat);
      insist(targetPlayer, "\u76EE\u6807\u73A9\u5BB6\u4E0D\u5B58\u5728");
      const targetAlignment = isEvil(targetPlayer.role) ? "evil" : "good";
      r.avalon.ladyTargetSeat = targetSeat;
      r.avalon.ladyResultAlignment = targetAlignment;
      r.avalon.ladyCheckedSeats.push(targetSeat);
      r.avalon.ladyHistory = r.avalon.ladyHistory || [];
      r.avalon.ladyHistory.push({
        round: r.avalon.currentRound,
        fromSeat: holderSeat,
        toSeat: targetSeat,
        targetAlignment
      });
      log(r, holderSeat + " \u53F7\u73A9\u5BB6\u4F7F\u7528\u6E56\u4E2D\u4ED9\u5973\u67E5\u9A8C\u4E86 " + targetSeat + " \u53F7\u73A9\u5BB6\u7684\u771F\u5B9E\u9635\u8425\uFF01\u5B9E\u4F53\u4ED9\u5973\u5361\u79FB\u4EA4\u7ED9 " + targetSeat + " \u53F7\uFF01");
      r.avalon.ladyHolderSeat = targetSeat;
      r.avalon.currentRound++;
      r.avalon.leaderSeat = r.avalon.leaderSeat % r.size + 1;
      move(r, "avalonNominate");
      log(r, "\u8FDB\u5165\u7B2C " + r.avalon.currentRound + " \u8F6E\u4EFB\u52A1\uFF01\u8BF7 " + r.avalon.leaderSeat + " \u53F7\u961F\u957F\u6311\u9009\u51FA\u52E4\u961F\u5458\u3002");
      r.epoch++;
      return;
    }
    if (act === "avalonAssassinate") {
      insist(r.phase === "avalonAssassinate", "\u73B0\u5728\u4E0D\u662F\u523A\u6740\u6885\u6797\u9636\u6BB5");
      insist(host || me && (me.role === "assassin" || me.role === "morgana"), "\u53EA\u6709\u523A\u5BA2\u6216\u6CD5\u5B98\u53EF\u4EE5\u6267\u884C\u523A\u6740");
      const target = getPlayer(r, String(b.target || ""));
      if (target.role === "merlin") {
        r.winner = "evil";
        r.avalon.winnerReason = "\u523A\u5BA2\u6210\u529F\u523A\u6740\u6885\u6797\uFF08" + target.seat + "\u53F7 " + target.name + "\uFF09\uFF01\u90AA\u6076\u9635\u8425\u7EDD\u6740\u83B7\u80DC\uFF01";
        log(r, r.avalon.winnerReason);
      } else {
        r.winner = "good";
        r.avalon.winnerReason = "\u523A\u5BA2\u523A\u6740\u4E86 " + target.seat + "\u53F7\uFF08\u4E0D\u662F\u6885\u6797\uFF09\uFF01\u6885\u6797\u6210\u529F\u63A9\u62A4\u9690\u85CF\uFF0C\u6B63\u4E49\u9635\u8425\u8D62\u5F97\u6700\u7EC8\u80DC\u5229\uFF01";
        log(r, r.avalon.winnerReason);
      }
      r.avalon.assassinTarget = target.id;
      move(r, "ended");
      return;
    }
  }
  if (act === "villagerBluff") {
    insist(me && me.alive, "\u53EA\u6709\u5B58\u6D3B\u73A9\u5BB6\u53EF\u4EE5\u64CD\u4F5C\u591C\u95F4\u4F2A\u88C5");
    r.villagerBluffs = r.villagerBluffs || {};
    r.villagerBluffs[me.id] = String(b.target || "pass");
    r.epoch++;
    return;
  }
  if (act === "ready") {
    insist(me && r.phase === "lobby", "\u73B0\u5728\u4E0D\u80FD\u51C6\u5907");
    me.ready = !!b.ready;
    return;
  }
  if (act === "configure") {
    insist(host && r.phase === "lobby", "\u53EA\u6709\u6CD5\u5B98\u80FD\u5728\u53D1\u724C\u524D\u4FEE\u6539\u73A9\u6CD5");
    r.setup = resolveConfig(r.size, b.setup);
    r.players.forEach((p) => p.ready = false);
    r.epoch++;
    log(r, "\u6CD5\u5B98\u66F4\u65B0\u4E86\u672C\u684C\u73A9\u6CD5\uFF0C\u8BF7\u67E5\u770B\u914D\u7F6E\u5E76\u91CD\u65B0\u51C6\u5907\u3002");
    return;
  }
  if (act === "kick") {
    insist(host && r.phase === "lobby", "\u53EA\u80FD\u5728\u5F00\u59CB\u524D\u79FB\u9664\u73A9\u5BB6");
    cancelSwaps(r, b.target);
    r.players = r.players.filter((p) => p.id !== b.target);
    r.epoch++;
    return;
  }
  if (act === "leave") {
    insist(me && r.phase === "lobby", "\u5F00\u59CB\u540E\u4E0D\u80FD\u79BB\u5F00\u5E2D\u4F4D");
    cancelSwaps(r, me.id);
    r.players = r.players.filter((p) => p.id !== me.id);
    r.epoch++;
    return;
  }
  if (act === "seatMove") {
    insist(me && r.phase === "lobby", "\u53EA\u80FD\u5728\u53D1\u724C\u524D\u6362\u5EA7");
    insist(Number.isInteger(b.seat) && b.seat >= 1 && b.seat <= r.size, "\u5EA7\u4F4D\u53F7\u7801\u65E0\u6548");
    insist(!r.players.some((p) => p.seat === b.seat), "\u8BE5\u5EA7\u4F4D\u5DF2\u6709\u73A9\u5BB6\uFF0C\u53EF\u7533\u8BF7\u4E92\u6362");
    cancelSwaps(r, me.id);
    me.seat = b.seat;
    me.ready = false;
    r.players.sort((a, b2) => a.seat - b2.seat);
    r.epoch++;
    log(r, me.name + " \u79FB\u5230 " + me.seat + " \u53F7\uFF0C\u8BF7\u91CD\u65B0\u51C6\u5907\u3002");
    return;
  }
  if (act === "seatSwapRequest") {
    insist(me && r.phase === "lobby", "\u53EA\u80FD\u5728\u53D1\u724C\u524D\u7533\u8BF7\u6362\u4F4D");
    const target = getPlayer(r, b.target);
    insist(target.id !== me.id, "\u4E0D\u80FD\u548C\u81EA\u5DF1\u6362\u4F4D");
    const pending = r.seatSwaps || [];
    insist(!pending.some((s) => [s.from, s.to].some((id) => id === me.id || id === target.id)), "\u6709\u5F85\u5904\u7406\u7684\u6362\u4F4D\u7533\u8BF7\uFF0C\u8BF7\u5148\u53D6\u6D88\u6216\u5904\u7406");
    r.seatSwaps = [...pending, { from: me.id, to: target.id }];
    me.ready = false;
    target.ready = false;
    r.epoch++;
    return;
  }
  if (act === "seatSwapCancel") {
    insist(me && r.phase === "lobby", "\u53EA\u80FD\u5728\u53D1\u724C\u524D\u53D6\u6D88\u6362\u4F4D");
    const swap = (r.seatSwaps || []).find((s) => s.from === me.id);
    insist(swap, "\u6CA1\u6709\u5F85\u53D6\u6D88\u7684\u7533\u8BF7");
    cancelSwaps(r, me.id);
    r.epoch++;
    return;
  }
  if (act === "seatSwapRespond") {
    insist(me && r.phase === "lobby", "\u53EA\u80FD\u5728\u53D1\u724C\u524D\u5904\u7406\u6362\u4F4D");
    insist(typeof b.accept === "boolean", "\u8BF7\u9009\u62E9\u63A5\u53D7\u6216\u62D2\u7EDD");
    const swap = (r.seatSwaps || []).find((s) => s.to === me.id && s.from === b.from);
    insist(swap, "\u6362\u4F4D\u7533\u8BF7\u5DF2\u5931\u6548");
    const from = getPlayer(r, swap.from);
    if (b.accept) {
      [from.seat, me.seat] = [me.seat, from.seat];
      from.ready = false;
      me.ready = false;
      r.players.sort((a, b2) => a.seat - b2.seat);
      log(r, from.name + " \u4E0E " + me.name + " \u4E92\u6362\u5EA7\u4F4D\uFF0C\u8BF7\u53CC\u65B9\u91CD\u65B0\u51C6\u5907\u3002");
    }
    cancelSwaps(r, me.id);
    r.epoch++;
    return;
  }
  if (act === "deal") {
    insist(host && r.phase === "lobby", "\u73B0\u5728\u4E0D\u80FD\u53D1\u8EAB\u4EFD");
    insist(!(r.seatSwaps || []).length, "\u8BF7\u5148\u5904\u7406\u6240\u6709\u6362\u4F4D\u7533\u8BF7");
    insist(r.players.length === r.size && r.players.every((p) => p.ready), "\u7B49\u5F85\u6240\u6709\u73A9\u5BB6\u5165\u5EA7\u5E76\u51C6\u5907");
    const roles = r.gameType === "avalon" ? defaultAvalonDeck(r.size) : configDeck(setup(r));
    insist(roles.length === r.size, "\u89D2\u8272\u6570\u91CF\u4E0E\u4EBA\u6570\u4E0D\u7B26\uFF0C\u8BF7\u91CD\u65B0\u914D\u7F6E");
    for (let i = roles.length - 1; i > 0; i--) {
      let x;
      const limit = Math.floor(4294967296 / (i + 1)) * (i + 1);
      do {
        x = crypto.getRandomValues(new Uint32Array(1))[0];
      } while (x >= limit);
      const j = x % (i + 1);
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    r.players.forEach((p, i) => {
      p.role = roles[i];
      p.ack = false;
      p.idiotRevealed = false;
      p.exploded = false;
    });
    move(r, "deal");
    log(r, "\u8EAB\u4EFD\u5DF2\u53D1\u653E\uFF0C\u8BF7\u6BCF\u4E2A\u4EBA\u79C1\u4E0B\u67E5\u770B\u5E76\u786E\u8BA4\u3002");
    return;
  }
  if (act === "ack") {
    insist(me && r.phase === "deal", "\u73B0\u5728\u4E0D\u80FD\u786E\u8BA4\u8EAB\u4EFD");
    me.ack = true;
    return;
  }
  if (act === "rematch") {
    insist(host && r.phase === "ended", "\u7ED3\u675F\u540E\u624D\u80FD\u518D\u6765\u4E00\u5C40");
    const config = setup(r), next = initialRoom(r.id, r.hostKey, r.hostName, r.size, r.voice, config);
    next.setup = config;
    next.players = r.players.map((p) => ({ ...p, role: "", ready: false, ack: false, alive: true, idiotRevealed: false, exploded: false, checks: [] }));
    next.epoch = r.epoch + 1;
    Object.assign(r, next, { sheriffId: "", election: void 0, badgeFrom: "", afterBadge: "", speechOrder: [], seatSwaps: [] });
    return;
  }
  if (act === "sheriffSignup") {
    insist(me?.alive && r.phase === "sheriffSignup", "\u73B0\u5728\u4E0D\u80FD\u4E0A\u8B66\u62A5\u540D");
    insist(typeof b.run === "boolean", "\u8BF7\u9009\u62E9\u4E0A\u8B66\u6216\u4E0D\u4E0A\u8B66");
    election(r).choices[me.id] = b.run;
    return;
  }
  if (act === "withdraw") {
    insist(me && r.phase === "sheriffSpeech" && election(r).round === 1 && candidates(r).includes(me.id), "\u53EA\u6709\u7ADE\u9009\u8005\u80FD\u5728\u9996\u8F6E\u53D1\u8A00\u9636\u6BB5\u9000\u6C34\uFF0CPK \u65F6\u4E0D\u80FD\u9000\u6C34");
    const list = speakers(r), current = list[r.speaker];
    election(r).withdrawn.push(me.id);
    const next = speakers(r);
    r.speaker = current ? Math.max(0, next.findIndex((p) => p.id === current.id)) : 0;
    if (current?.id === me.id) r.speaker = Math.min(list.indexOf(current), Math.max(0, next.length - 1));
    r.epoch++;
    r.deadline = Date.now() + 9e4;
    log(r, me.seat + " \u53F7\u9000\u51FA\u8B66\u957F\u7ADE\u9009\uFF0C\u4ECD\u4E0D\u80FD\u6295\u8B66\u957F\u7968\u3002");
    return;
  }
  if (act === "explode") {
    insist(me?.alive && me.role === "wolf", "\u53EA\u6709\u5B58\u6D3B\u72FC\u4EBA\u53EF\u4EE5\u81EA\u7206");
    insist(["sheriffSpeech", "order", "speech", "runoffSpeech"].includes(r.phase), "\u53EA\u80FD\u5728\u767D\u5929\u53D1\u8A00\u9636\u6BB5\u81EA\u7206\uFF0C\u6295\u7968\u3001\u591C\u95F4\u3001\u730E\u4EBA\u5F00\u67AA\u9636\u6BB5\u4E0D\u53EF\u81EA\u7206");
    const onPolice = r.phase === "sheriffSpeech";
    me.alive = false;
    me.exploded = true;
    log(r, me.seat + " \u53F7\u72FC\u4EBA\u81EA\u7206\uFF0C\u7ACB\u5373\u505C\u6B62\u672C\u8F6E\u767D\u5929\u53D1\u8A00\u4E0E\u6295\u7968\u3002");
    if (onPolice) {
      const e = election(r);
      e.explosions = (e.explosions || 0) + 1;
      e.interrupted = setup(r).sheriffExplosion === "double" && e.explosions < 2;
      e.done = !e.interrupted;
      e.votes = {};
      e.runoff = [];
      e.round = 1;
      r.sheriffId = "";
      log(r, e.interrupted ? "\u8B66\u957F\u7ADE\u9009\u6682\u505C\uFF0C\u4E0B\u4E00\u5929\u4FDD\u7559\u539F\u4E0A\u8B66\u540D\u5355\u7EE7\u7EED\u7ADE\u9009\u3002" : "\u8B66\u5FBD\u88AB\u541E\u6389\uFF0C\u672C\u5C40\u4E0D\u518D\u7ADE\u9009\u8B66\u957F\u3002");
      settleDawn(r, "explosion");
    } else resume(r, "explosion");
    return;
  }
  if (act === "sheriffVote") {
    insist(me && r.phase === "sheriffVote" && electionVoters(r).some((p) => p.id === me.id), "\u53EA\u6709\u6700\u521D\u672A\u4E0A\u8B66\u7684\u73A9\u5BB6\u53EF\u4EE5\u6295\u8B66\u957F\u7968");
    const e = election(r);
    insist(!e.votes[me.id], "\u8B66\u957F\u7968\u5DF2\u63D0\u4EA4\uFF0C\u4E0D\u80FD\u4FEE\u6539");
    const target = String(b.target || "pass");
    insist(target === "pass" || candidates(r).includes(target), "\u53EA\u80FD\u6295\u7ED9\u672C\u8F6E\u7ADE\u9009\u8005");
    e.votes[me.id] = target;
    return;
  }
  if (act === "badge") {
    insist(r.phase === "badge" && (host || me?.id === r.badgeFrom), "\u53EA\u6709\u539F\u8B66\u957F\u53EF\u4EE5\u79FB\u4EA4\u8B66\u5FBD");
    const target = String(b.target || "pass"), p = liveTarget(r, target);
    insist(!p || !p.idiotRevealed && p.id !== r.badgeFrom, "\u8BF7\u9009\u62E9\u5C1A\u672A\u7FFB\u724C\u7684\u5B58\u6D3B\u73A9\u5BB6");
    r.sheriffId = p?.id || "";
    r.badgeFrom = "";
    log(r, p ? "\u8B66\u5FBD\u79FB\u4EA4\u7ED9 " + p.seat + " \u53F7\u3002" : "\u8B66\u5FBD\u5DF2\u6495\u6BC1\uFF0C\u672C\u5C40\u4E0D\u518D\u6709\u8B66\u957F\u3002");
    resume(r, r.afterBadge || "speech");
    return;
  }
  if (act === "speechOrder") {
    insist(r.phase === "order" && (host || me?.id === r.sheriffId), "\u53EA\u6709\u8B66\u957F\u53EF\u4EE5\u51B3\u5B9A\u53D1\u8A00\u987A\u5E8F");
    insist(["ascending", "descending"].includes(b.direction), "\u8BF7\u9009\u62E9\u987A\u65F6\u9488\u6216\u9006\u65F6\u9488");
    const chief = getPlayer(r, r.sheriffId || ""), list = alive(r).filter((p) => p.id !== chief.id);
    list.sort((a, c) => {
      const distance = (p) => b.direction === "ascending" ? (p.seat - chief.seat + r.size) % r.size : (chief.seat - p.seat + r.size) % r.size;
      return distance(a) - distance(c);
    });
    r.speechOrder = [...list.map((p) => p.id), chief.id];
    move(r, "speech");
    beginSpeech(r);
    log(r, "\u6309" + (b.direction === "ascending" ? "\u53F7\u7801\u9012\u589E" : "\u53F7\u7801\u9012\u51CF") + "\u65B9\u5411\u53D1\u8A00\uFF0C\u8B66\u957F\u6700\u540E\u5F52\u7968\u3002");
    return;
  }
  if (act === "nightAction") {
    insist(me && me.alive, "\u53EA\u6709\u5B58\u6D3B\u73A9\u5BB6\u53EF\u4EE5\u884C\u52A8");
    const target = String(b.target || "pass");
    if (r.phase === "guard") {
      insist(me.role === "guard" && !r.night.guardDone, "\u73B0\u5728\u65E0\u6CD5\u5B88\u62A4");
      const p = liveTarget(r, target);
      insist(!p || p.id !== r.lastGuard, "\u4E0D\u80FD\u8FDE\u7EED\u4E24\u591C\u5B88\u62A4\u540C\u4E00\u4F4D\u73A9\u5BB6");
      r.night.guardTarget = p?.id || "";
      r.night.guardDone = true;
      return;
    }
    if (r.phase === "wolves") {
      insist(me.role === "wolf", "\u73B0\u5728\u4E0D\u662F\u4F60\u7684\u884C\u52A8\u9636\u6BB5");
      liveTarget(r, target);
      r.night.wolves[me.id] = target;
      return;
    }
    if (r.phase === "seer") {
      insist(me.role === "seer" && !r.night.seerDone, "\u73B0\u5728\u65E0\u6CD5\u67E5\u9A8C");
      const p = liveTarget(r, target);
      insist(!p || p.id !== me.id, "\u8BF7\u9009\u62E9\u5176\u4ED6\u73A9\u5BB6");
      if (p) me.checks.push({ day: r.day, seat: p.seat, result: p.role === "wolf" ? "\u72FC\u4EBA" : "\u597D\u4EBA" });
      r.night.seerDone = true;
      return;
    }
    if (r.phase === "witch") {
      insist(me.role === "witch" && !r.night.witch, "\u73B0\u5728\u65E0\u6CD5\u7528\u836F");
      const kind = b.kind;
      insist(["pass", "heal", "poison"].includes(kind), "\u8BF7\u9009\u62E9\u7528\u836F\u65B9\u5F0F");
      if (kind === "heal") {
        const selfSave = selfSaveAllowed(setup(r), r.day);
        insist(r.medicine.heal && r.night.kill && (r.night.kill !== me.id || selfSave), "\u6CA1\u6709\u53EF\u7528\u7684\u89E3\u836F\u76EE\u6807\uFF08\u8BF7\u68C0\u67E5\u672C\u684C\u81EA\u6551\u89C4\u5219\uFF09");
        r.night.witch = { kind, target: r.night.kill };
        r.medicine.heal = false;
      } else if (kind === "poison") {
        insist(r.medicine.poison, "\u6BD2\u836F\u5DF2\u4F7F\u7528");
        const p = liveTarget(r, target, false);
        insist(p && p.id !== me.id, "\u8BF7\u9009\u62E9\u5176\u4ED6\u73A9\u5BB6");
        r.night.witch = { kind, target };
        r.medicine.poison = false;
      } else r.night.witch = { kind: "pass", target: "" };
      return;
    }
    throw new RoomError("\u73B0\u5728\u4E0D\u662F\u591C\u95F4\u884C\u52A8\u9636\u6BB5");
  }
  if (act === "vote") {
    insist(me && r.phase === "vote" && voters(r).some((p2) => p2.id === me.id), "\u73B0\u5728\u4E0D\u80FD\u6295\u7968\uFF08\u5DF2\u51FA\u5C40\u3001\u767D\u75F4\u5DF2\u7FFB\u724C\u6216\u6B63\u5728 PK \u53F0\u4E0A\uFF09");
    insist(!r.votes[me.id], "\u6295\u7968\u5DF2\u63D0\u4EA4\uFF0C\u4E0D\u80FD\u4FEE\u6539");
    const target = String(b.target || "pass"), p = liveTarget(r, target);
    insist(!p || !p.idiotRevealed, "\u5DF2\u7FFB\u724C\u7684\u767D\u75F4\u4E0D\u80FD\u518D\u6B21\u88AB\u653E\u9010");
    insist(!r.runoff.length || target === "pass" || r.runoff.includes(target), "\u52A0\u6295\u53EA\u80FD\u9009\u62E9\u5E73\u7968\u73A9\u5BB6");
    insist(target !== me.id, "\u4E0D\u80FD\u6295\u81EA\u5DF1");
    r.votes[me.id] = target;
    return;
  }
  if (act === "shoot") {
    insist(r.phase === "hunter" && (host || me?.id === r.hunter), "\u73B0\u5728\u4E0D\u80FD\u5F00\u67AA");
    const target = String(b.target || "pass");
    const p = liveTarget(r, target);
    if (p) {
      p.alive = false;
      log(r, getPlayer(r, r.hunter).seat + " \u53F7\u730E\u4EBA\u5E26\u8D70\u4E86 " + p.seat + " \u53F7\u3002");
    } else log(r, "\u730E\u4EBA\u9009\u62E9\u4E0D\u5F00\u67AA\u3002");
    r.hunter = "";
    resume(r, r.afterHunter);
    return;
  }
  if (act === "nextSpeaker") {
    insist(host && ["speech", "sheriffSpeech", "runoffSpeech"].includes(r.phase), "\u73B0\u5728\u4E0D\u80FD\u5207\u6362\u53D1\u8A00");
    const list = speakers(r);
    insist(r.speaker < list.length - 1, "\u6240\u6709\u73A9\u5BB6\u5DF2\u7ECF\u53D1\u8A00\uFF0C\u53EF\u4EE5\u5F00\u59CB\u6295\u7968");
    r.speaker++;
    r.deadline = Date.now() + 9e4;
    r.epoch++;
    return;
  }
  if (act === "restartTimer") {
    insist(host && ["speech", "sheriffSpeech", "runoffSpeech"].includes(r.phase), "\u73B0\u5728\u4E0D\u80FD\u91CD\u7F6E\u8BA1\u65F6");
    r.deadline = Date.now() + 9e4;
    return;
  }
  if (act === "advance") {
    insist(host, "\u53EA\u6709\u6CD5\u5B98\u53EF\u4EE5\u63A8\u8FDB\u6D41\u7A0B");
    switch (r.phase) {
      case "deal":
        insist(r.players.every((p) => p.ack), "\u8BF7\u7B49\u5F85\u6BCF\u4E2A\u4EBA\u786E\u8BA4\u8EAB\u4EFD");
        if (r.gameType === "avalon") {
          move(r, "avalonNominate");
          log(r, "\u963F\u74E6\u9686\u7B2C 1 \u8F6E\u4EFB\u52A1\u5F00\u59CB\uFF01\u8BF7 " + r.avalon.leaderSeat + " \u53F7\u961F\u957F\u6311\u9009\u51FA\u52E4\u961F\u5458\u3002");
          return;
        }
        night(r);
        return;
      case "guard":
        r.lastGuard = r.night.guardTarget || "";
        move(r, "wolves");
        return;
      case "wolves": {
        r.night.kill = tally(r.night.wolves).leaders.length === 1 ? tally(r.night.wolves).leaders[0] : "";
        move(r, "seer");
        return;
      }
      case "seer":
        move(r, "witch");
        return;
      case "witch":
        if (setup(r).sheriff && !election(r).done && election(r).interrupted) {
          election(r).interrupted = false;
          move(r, "sheriffSpeech");
          beginSpeech(r);
          log(r, "\u6062\u590D\u8B66\u957F\u7ADE\u9009\uFF0C\u4FDD\u7559\u539F\u4E0A\u8B66\u540D\u5355\u4E0E\u9000\u6C34\u8BB0\u5F55\uFF0C\u6682\u4E0D\u516C\u5E03\u6628\u591C\u6B7B\u4EA1\u3002");
        } else if (r.day === 1 && setup(r).sheriff && !election(r).done) {
          move(r, "sheriffSignup");
          log(r, "\u9996\u591C\u884C\u52A8\u7ED3\u675F\uFF0C\u5148\u7ADE\u9009\u8B66\u957F\uFF0C\u518D\u516C\u5E03\u6628\u591C\u7ED3\u679C\u3002\u8BF7\u9009\u62E9\u4E0A\u8B66\u6216\u4E0D\u4E0A\u8B66\u3002");
        } else move(r, "dawn");
        return;
      case "sheriffSignup": {
        const e = election(r);
        e.candidates = alive(r).filter((p) => e.choices[p.id]).map((p) => p.id);
        e.withdrawn = [];
        e.runoff = [];
        e.votes = {};
        e.round = 1;
        if (!e.candidates.length) {
          finishElection(r, "");
          return;
        }
        move(r, "sheriffSpeech");
        beginSpeech(r);
        log(r, "\u4E0A\u8B66\uFF1A" + e.candidates.map((id) => getPlayer(r, id).seat + " \u53F7").join("\u3001") + "\u3002\u6309\u5EA7\u4F4D\u987A\u5E8F\u7ADE\u9009\u53D1\u8A00\uFF0C\u53EF\u9000\u6C34\u3002");
        return;
      }
      case "sheriffSpeech": {
        const list = candidates(r);
        if (list.length <= 1) {
          finishElection(r, list[0] || "");
          return;
        }
        election(r).votes = {};
        move(r, "sheriffVote");
        log(r, "\u8BF7\u6700\u521D\u672A\u4E0A\u8B66\u7684\u73A9\u5BB6\u6295\u8B66\u957F\u7968\uFF1B\u9000\u6C34\u73A9\u5BB6\u4E0D\u80FD\u6295\u7968\u3002");
        return;
      }
      case "sheriffVote": {
        const e = election(r), { counts, leaders } = tally(e.votes);
        log(r, "\u8B66\u957F\u7968\u7ED3\u679C\uFF1A" + (Object.entries(counts).map(([id, n]) => getPlayer(r, id).seat + "\u53F7 " + n + "\u7968").join("\uFF0C") || "\u5168\u90E8\u5F03\u7968") + "\u3002");
        if (leaders.length > 1 && e.round === 1) {
          e.runoff = leaders;
          e.round = 2;
          e.votes = {};
          move(r, "sheriffSpeech");
          beginSpeech(r);
          log(r, "\u8B66\u957F\u7ADE\u9009\u5E73\u7968\uFF0C\u8BF7 PK \u53D1\u8A00\u540E\u52A0\u6295\u4E00\u6B21\u3002\u4ECD\u53EA\u6709\u6700\u521D\u672A\u4E0A\u8B66\u8005\u6295\u7968\u3002");
          return;
        }
        finishElection(r, leaders.length === 1 ? leaders[0] : "");
        return;
      }
      case "dawn":
        settleDawn(r);
        return;
      case "runoffSpeech":
        move(r, "vote");
        log(r, "PK \u53D1\u8A00\u7ED3\u675F\uFF0C\u8BF7\u53F0\u4E0B\u73A9\u5BB6\u52A0\u6295\u3002PK \u53F0\u4E0A\u7684\u73A9\u5BB6\u4E0D\u80FD\u6295\u7968\u3002");
        return;
      case "speech":
        r.votes = {};
        r.runoff = [];
        r.voteRound = 1;
        move(r, "vote");
        log(r, "\u8BF7\u6295\u7968\u653E\u9010\u4E00\u4F4D\u73A9\u5BB6\uFF0C\u6216\u9009\u62E9\u5F03\u7968\u3002");
        return;
      case "vote": {
        const { counts, leaders } = tally(r.votes, (id) => id === r.sheriffId ? 1.5 : 1);
        const summary = Object.entries(counts).map(([id, n]) => getPlayer(r, id).seat + "\u53F7 " + n + "\u7968").join("\uFF0C");
        log(r, "\u6295\u7968\u7ED3\u679C\uFF1A" + (summary || "\u5168\u90E8\u5F03\u7968") + "\u3002");
        if (leaders.length > 1 && r.voteRound === 1) {
          r.runoff = leaders;
          r.voteRound = 2;
          r.votes = {};
          move(r, "runoffSpeech");
          beginSpeech(r);
          log(r, "\u5E73\u7968\uFF1A" + leaders.map((id) => getPlayer(r, id).seat + "\u53F7").join("\u3001") + "\u3002\u8BF7\u5148 PK \u53D1\u8A00\uFF0C\u518D\u7531\u53F0\u4E0B\u73A9\u5BB6\u52A0\u6295\u3002");
          return;
        }
        if (leaders.length === 1) {
          const p = getPlayer(r, leaders[0]);
          if (p.role === "idiot" && !p.idiotRevealed) {
            p.idiotRevealed = true;
            log(r, p.seat + " \u53F7\u767D\u75F4\u7FFB\u724C\uFF0C\u7EE7\u7EED\u5B58\u6D3B\u5E76\u53D1\u8A00\uFF0C\u4F46\u5931\u53BB\u6295\u7968\u6743\uFF0C\u4E0D\u80FD\u518D\u88AB\u653E\u9010\u3002");
            resume(r, "dusk");
            return;
          }
          log(r, p.seat + " \u53F7\u88AB\u653E\u9010\u3002");
          afterDeath(r, leaders, "", "dusk");
          return;
        }
        move(r, "dusk");
        log(r, "\u672C\u8F6E\u65E0\u4EBA\u88AB\u653E\u9010\u3002");
        return;
      }
      case "dusk":
        night(r);
        return;
      case "explosion":
        night(r);
        return;
      default:
        throw new RoomError("\u73B0\u5728\u4E0D\u80FD\u63A8\u8FDB\u6D41\u7A0B");
    }
  }
  throw new RoomError("\u4E0D\u652F\u6301\u6B64\u64CD\u4F5C");
}
function viewRoom(r, key) {
  const host = key === r.hostKey, me = r.players.find((p) => p.key === key), nightPhase = ["guard", "wolves", "seer", "witch", "dawn"].includes(r.phase);
  const roleActive = me?.alive && (r.phase === "guard" && me.role === "guard" || r.phase === "wolves" && me.role === "wolf" || r.phase === "seer" && me.role === "seer" || r.phase === "witch" && me.role === "witch");
  const members = r.players.map((p) => ({ id: p.id, seat: p.seat, name: p.name, ready: p.ready, ack: p.ack, alive: p.alive, idiotRevealed: !!p.idiotRevealed, exploded: !!p.exploded, cardNo: p.cardNo, cardUid: p.cardUid, ...host || r.phase === "ended" || p.idiotRevealed || p.exploded ? { role: p.role } : {} }));
  const e = r.election, eligible = voters(r), speaking = ["speech", "sheriffSpeech", "runoffSpeech"].includes(r.phase), freeSeats = Array.from({ length: r.size }, (_, i) => i + 1).filter((n) => !r.players.some((p) => p.seat === n));
  const base = {
    id: r.id,
    hostName: r.hostName,
    size: r.size,
    setup: setup(r),
    voice: r.voice,
    phase: nightPhase && !host ? "night" : r.phase,
    epoch: r.epoch,
    day: r.day,
    players: members,
    host,
    member: !!me,
    me: me ? {
      id: me.id,
      seat: me.seat,
      name: me.name,
      role: me.role,
      ready: me.ready,
      ack: me.ack,
      alive: me.alive,
      idiotRevealed: !!me.idiotRevealed,
      checks: me.checks,
      cardNo: me.cardNo,
      cardUid: me.cardUid,
      vision: r.gameType === "avalon" && me.role ? resolveVision(me, r.players) : null
    } : null,
    gameType: r.gameType || "werewolf",
    avalon: r.gameType === "avalon" && r.avalon ? {
      currentRound: r.avalon.currentRound,
      missionHistory: r.avalon.missionHistory,
      missionFails: r.avalon.missionFails,
      voteTracker: r.avalon.voteTracker,
      leaderSeat: r.avalon.leaderSeat,
      nominatedSquad: r.avalon.nominatedSquad,
      teamVotes: r.avalon.teamVotesRevealed ? r.avalon.teamVotes : {},
      teamVotesRevealed: r.avalon.teamVotesRevealed,
      teamVoteCount: Object.keys(r.avalon.teamVotes).length,
      missionSubmissionsCount: Object.keys(r.avalon.missionSubmissions).length,
      missionSquadSize: AVALON_QUEST_TABLE[r.size]?.[r.avalon.currentRound - 1]?.squadSize || 2,
      failsRequired: AVALON_QUEST_TABLE[r.size]?.[r.avalon.currentRound - 1]?.failsRequired || 1,
      hammerCount: r.avalon.voteTracker + 1,
      isFinalHammer: r.avalon.voteTracker >= 4,
      lastMissionSummary: r.avalon.lastMissionSummary || "",
      myTeamVote: me ? r.avalon.teamVotes[me.id] : void 0,
      hasSubmittedMission: me ? !!r.avalon.missionSubmissions[me.id] : false,
      isNominated: me ? r.avalon.nominatedSquad.includes(me.id) : false,
      isLeader: me ? me.seat === r.avalon.leaderSeat : false,
      winnerReason: r.avalon.winnerReason
    } : null,
    canJoin: r.phase === "lobby" && r.players.length < r.size,
    message: r.message,
    logs: r.logs,
    winner: r.winner,
    expires: r.expires,
    runoff: r.runoff,
    voteRound: r.voteRound,
    voteTotal: eligible.length,
    canVote: !!me && eligible.some((p) => p.id === me.id),
    voteCount: r.phase === "vote" ? Object.keys(r.votes).length : 0,
    myVote: me ? r.votes[me.id] || "" : "",
    speaker: speaking ? speakers(r)[r.speaker]?.id : "",
    lastSpeaker: r.speaker >= speakers(r).length - 1,
    deadline: r.deadline,
    hunter: r.hunter,
    sheriffId: r.sheriffId || "",
    badgeFrom: r.badgeFrom || "",
    speechOrder: r.phase === "speech" ? speakers(r).map((p) => p.id) : [],
    seatSwaps: (r.seatSwaps || []).filter((s) => host || s.from === me?.id || s.to === me?.id),
    freeSeats,
    canExplode: !!me?.alive && me.role === "wolf" && ["sheriffSpeech", "order", "speech", "runoffSpeech"].includes(r.phase),
    sheriff: setup(r)?.sheriff ? { candidates: r.phase === "sheriffSignup" ? [] : e?.candidates || [], active: r.phase === "sheriffSignup" ? [] : e ? candidates(r) : [], withdrawn: e?.withdrawn || [], round: e?.round || 1, mySignup: me ? e?.choices[me.id] ?? null : null, signupCount: host ? Object.keys(e?.choices || {}).length : 0, myVote: me ? e?.votes[me.id] || "" : "", canVote: r.phase === "sheriffVote" && !!me && electionVoters(r).some((p) => p.id === me.id), voteTotal: r.phase === "sheriffVote" ? electionVoters(r).length : 0, voteCount: r.phase === "sheriffVote" ? Object.keys(e?.votes || {}).length : 0 } : null,
    guardLast: host || me?.role === "guard" ? r.lastGuard || "" : "",
    canSelfSave: setup(r) ? selfSaveAllowed(setup(r), r.day) : false,
    wolfTeam: me?.role === "wolf" ? r.players.filter((p) => p.role === "wolf").map((p) => ({ seat: p.seat, name: p.name, id: p.id })) : [],
    action: roleActive ? r.phase : "",
    submitted: !!(roleActive && me && (r.phase === "guard" ? r.night.guardDone : r.phase === "wolves" ? r.night.wolves[me.id] : r.phase === "seer" ? r.night.seerDone : r.phase === "witch" ? r.night.witch : false)),
    wolfVotes: host || me?.alive && me.role === "wolf" && r.phase === "wolves" ? r.night.wolves : {},
    victim: host || me?.alive && me.role === "witch" && r.phase === "witch" && r.medicine.heal ? r.night.kill : "",
    medicine: host || me?.role === "witch" ? r.medicine : null,
    voiceMasterId: r.voiceMasterId || "",
    voiceMasterName: r.voiceMasterName || "",
    isVoiceMaster: host ? r.voiceMasterId === r.hostKey || !r.voiceMasterId : me ? r.voiceMasterId === me.key : false,
    pairingCode: r.pairingCode || r.id.slice(-4).toUpperCase(),
    nightDuration: r.nightDuration || 12,
    nightRemaining: nightPhase && r.deadline ? Math.max(0, Math.ceil((r.deadline - Date.now()) / 1e3)) : 0,
    hostNight: host ? { ...r.night, checks: r.players.find((p) => p.role === "seer")?.checks || [] } : null
  };
  if (!host && !me) return { id: r.id, hostName: r.hostName, size: r.size, setup: setup(r), phase: "join", canJoin: r.phase === "lobby" && r.players.length < r.size, count: r.players.length, freeSeats: r.phase === "lobby" ? freeSeats : [], expires: r.expires };
  return base;
}
var isBot = (p) => p.key.startsWith("bot:");
function pick(xs) {
  return xs[Math.floor(Math.random() * xs.length)];
}
function botStep(r) {
  const bots = r.players.filter(isBot);
  if (!bots.length) return false;
  const run = (p, b) => {
    try {
      mutateCore(r, p.key, { ...b, epoch: r.epoch });
      return true;
    } catch {
      return false;
    }
  };
  if (r.phase === "deal") {
    for (const p of bots) if (!p.ack && run(p, { action: "ack" })) return true;
    return false;
  }
  if (r.gameType === "avalon" && r.avalon) {
    const av = r.avalon, size = AVALON_QUEST_TABLE[r.size]?.[av.currentRound - 1]?.squadSize || 2;
    if (r.phase === "avalonNominate") {
      const leader = r.players.find((p) => p.seat === av.leaderSeat);
      if (leader && isBot(leader)) {
        const order = [...r.players].sort((a, c) => (a.seat - leader.seat + r.size) % r.size - (c.seat - leader.seat + r.size) % r.size);
        return run(leader, { action: "avalonNominate", squad: order.slice(0, size).map((p) => p.id) });
      }
      return false;
    }
    if (r.phase === "avalonVoteTeam") {
      for (const p of bots) if (av.teamVotes[p.id] === void 0) {
        const evil = isEvil(p.role), hasEvil = av.nominatedSquad.some((id) => isEvil(r.players.find((q) => q.id === id)?.role || ""));
        return run(p, { action: "avalonVoteTeam", approve: evil ? hasEvil : av.voteTracker >= 3 || !hasEvil || Math.random() < 0.6 });
      }
      return false;
    }
    if (r.phase === "avalonVoteMission") {
      for (const p of bots) if (av.nominatedSquad.includes(p.id) && !av.missionSubmissions[p.id]) return run(p, { action: "avalonVoteMission", success: !isEvil(p.role) });
      return false;
    }
    if (r.phase === "avalonReveal") {
      try {
        mutateCore(r, r.hostKey, { action: "avalonStepReveal", epoch: r.epoch });
        return true;
      } catch {
        return false;
      }
    }
    if (r.phase === "avalonLady") {
      const ladyPlayer = r.players.find((p) => p.seat === av.ladyHolderSeat);
      if (ladyPlayer && (isBot(ladyPlayer) || true)) {
        const candidates2 = r.players.filter((p) => p.seat !== av.ladyHolderSeat && !(av.ladyCheckedSeats || []).includes(p.seat));
        if (candidates2.length) {
          try {
            mutateCore(r, ladyPlayer ? ladyPlayer.key : r.hostKey, { action: "avalonLadyCheck", targetSeat: candidates2[0].seat, epoch: r.epoch });
            return true;
          } catch {
            return false;
          }
        }
      }
      return false;
    }
    if (r.phase === "avalonAssassinate") {
      const killers = r.players.filter((p) => p.role === "assassin" || p.role === "morgana");
      if (killers.length && killers.every(isBot)) {
        const t = pick(r.players.filter((p) => isGood(p.role)));
        if (t) return run(killers[0], { action: "avalonAssassinate", target: t.id });
      }
      return false;
    }
    return false;
  }
  const live = bots.filter((p) => p.alive);
  const others = (p) => r.players.filter((q) => q.alive && q.id !== p.id);
  switch (r.phase) {
    case "guard":
      for (const p of live) if (p.role === "guard" && !r.night.guardDone) return run(p, { action: "nightAction", target: "pass" });
      return false;
    case "wolves":
      for (const p of live) if (p.role === "wolf" && !r.night.wolves[p.id]) {
        const humanWolfPick = Object.values(r.night.wolves)[0];
        const t = humanWolfPick || pick(others(p).filter((q) => q.role !== "wolf"))?.id || "pass";
        return run(p, { action: "nightAction", target: t });
      }
      return false;
    case "seer":
      for (const p of live) if (p.role === "seer" && !r.night.seerDone) return run(p, { action: "nightAction", target: pick(others(p))?.id || "pass" });
      return false;
    case "witch":
      for (const p of live) if (p.role === "witch" && !r.night.witch) return run(p, { action: "nightAction", kind: "pass", target: "" });
      return false;
    case "sheriffSignup": {
      const e = r.election;
      for (const p of live) if (e?.choices[p.id] === void 0) return run(p, { action: "sheriffSignup", run: false });
      return false;
    }
    case "sheriffVote": {
      const e = r.election;
      for (const p of live) if (e && !e.votes[p.id] && run(p, { action: "sheriffVote", target: "pass" })) return true;
      return false;
    }
    case "vote":
      for (const p of live) if (!r.votes[p.id] && run(p, { action: "vote", target: "pass" })) return true;
      return false;
    case "hunter": {
      const h = r.players.find((p) => p.id === r.hunter);
      if (h && isBot(h)) return run(h, { action: "shoot", target: "pass" });
      return false;
    }
    case "badge": {
      const h = r.players.find((p) => p.id === r.badgeFrom);
      if (h && isBot(h)) return run(h, { action: "badge", target: "pass" });
      return false;
    }
    case "order": {
      const h = r.players.find((p) => p.id === r.sheriffId);
      if (h && isBot(h)) return run(h, { action: "speechOrder", direction: "ascending" });
      return false;
    }
  }
  return false;
}
function mutate(r, key, b) {
  const host = key === r.hostKey, act = b.action;
  if (act === "switchGame") {
    insist(host, "\u53EA\u6709\u6CD5\u5B98\u53EF\u4EE5\u5207\u6362\u6E38\u620F");
    insist(b.epoch === r.epoch, "\u6D41\u7A0B\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u786E\u8BA4\u5F53\u524D\u9636\u6BB5\u540E\u91CD\u8BD5");
    insist(r.phase === "lobby" || r.phase === "ended", "\u53EA\u80FD\u5728\u5927\u5385\u6216\u4E00\u5C40\u7ED3\u675F\u540E\u5207\u6362\u6E38\u620F");
    const to = b.gameType === "werewolf" ? "werewolf" : b.gameType === "avalon" ? "avalon" : r.gameType === "avalon" ? "werewolf" : "avalon";
    const lo = to === "avalon" ? 5 : 6, hi = to === "avalon" ? 10 : 12;
    let size = Math.max(lo, Math.min(hi, Number(b.size) || r.size));
    const maxSeat = Math.max(0, ...r.players.map((p) => p.seat));
    if (!b.size) size = Math.max(size, Math.min(hi, maxSeat));
    insist(r.players.every((p) => p.seat <= size), (to === "avalon" ? "\u963F\u74E6\u9686" : "\u72FC\u4EBA\u6740") + "\u6700\u591A " + hi + " \u4EBA\uFF0C\u8BF7\u5148\u79FB\u9664\u8D85\u51FA\u5EA7\u4F4D\u7684\u73A9\u5BB6");
    const next = initialRoom(r.id, r.hostKey, r.hostName, size, r.voice, void 0, to);
    next.players = r.players.map((p) => ({ ...p, role: "", ready: isBot(p), ack: false, alive: true, idiotRevealed: false, exploded: false, checks: [] }));
    next.epoch = r.epoch + 1;
    next.logs = r.logs;
    next.pairingCode = r.pairingCode || r.id.slice(-4).toUpperCase();
    next.voiceMasterId = r.voiceMasterId || r.hostKey;
    next.voiceMasterName = r.voiceMasterName || "\u6CD5\u5B98";
    Object.assign(r, next, { sheriffId: "", election: void 0, badgeFrom: "", afterBadge: "", speechOrder: [], seatSwaps: [], winner: "", deadline: 0, votes: {}, runoff: [], hunter: "", afterHunter: "", day: 0, speaker: 0, night: { wolves: {}, kill: "", seerDone: false, guardDone: false, guardTarget: "", witch: null } });
    log(r, "\u6CD5\u5B98\u4E00\u952E\u5207\u6362\u4E3A\u3010" + (to === "avalon" ? "\u963F\u74E6\u9686" : "\u72FC\u4EBA\u6740") + "\u3011" + size + " \u4EBA\u5C40\uFF0C\u8BA1\u65F6\u5668\u4E0E\u516C\u5C4F\u706F\u6548\u5DF2\u5F7B\u5E95\u91CD\u7F6E\u5F52\u96F6\u3002");
    return;
  }
  if (act === "fillBots") {
    insist(host && r.phase === "lobby", "\u53EA\u6709\u6CD5\u5B98\u5728\u5927\u5385\u53EF\u4EE5\u8865\u5145 AI \u73A9\u5BB6");
    insist(b.epoch === r.epoch, "\u6D41\u7A0B\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u786E\u8BA4\u5F53\u524D\u9636\u6BB5\u540E\u91CD\u8BD5");
    let n = 0;
    for (let seat = 1; seat <= r.size; seat++) {
      if (r.players.some((p) => p.seat === seat)) continue;
      const id = "bot" + seat + Math.random().toString(16).slice(2, 8);
      r.players.push({ id, seat, name: "AI-" + seat + "\u53F7", key: "bot:" + id, ready: true, ack: false, role: "", alive: true, checks: [], cardNo: seat });
      n++;
    }
    r.players.sort((a, c) => a.seat - c.seat);
    r.epoch++;
    log(r, "\u5DF2\u8865\u5145 " + n + " \u540D AI \u6D4B\u8BD5\u73A9\u5BB6\uFF1A\u81EA\u52A8\u51C6\u5907\u3001\u786E\u8BA4\u8EAB\u4EFD\u3001\u8868\u51B3\u4E0E\u51FA\u4EFB\u52A1\u3002");
    return;
  }
  if (act === "clearBots") {
    insist(host && r.phase === "lobby", "\u53EA\u6709\u6CD5\u5B98\u5728\u5927\u5385\u53EF\u4EE5\u79FB\u9664 AI \u73A9\u5BB6");
    r.players = r.players.filter((p) => !isBot(p));
    r.epoch++;
    log(r, "\u5DF2\u79FB\u9664\u5168\u90E8 AI \u6D4B\u8BD5\u73A9\u5BB6\u3002");
    return;
  }
  mutateCore(r, key, b);
  for (let i = 0; i < 80 && botStep(r); i++) ;
}
export {
  RoomError,
  initialRoom,
  insist,
  mutate,
  viewRoom
};
