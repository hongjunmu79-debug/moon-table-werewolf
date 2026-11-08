-- ============================================================
-- board_game / main.lua  —  桌游公屏 (ESP-Mosaico 480x480)
-- 适配阿瓦隆 5 轮战况 + 锤度条(5锤告警) + 需2败提示 + 狼人杀夜视/发言
-- 支持动态 4 位配对码，云端与局域网通用。
-- ============================================================
local lvgl = require("lvgl")
local storage = require("storage")
local json = require("json")
local system = require("system")
local led_strip = require("led_strip")
local thread = require("thread")
local capability = require("capability")
local delay = require("delay")

local LED_GPIO, LED_COUNT = 38, 6

local function log(...)
  local t = {}
  for i = 1, select("#", ...) do t[#t + 1] = tostring(select(i, ...)) end
  print("[board_game] " .. table.concat(t, " "))
end
local function now_ms()
  local ok, v = pcall(system.millis)
  return (ok and type(v) == "number") and v or 0
end
local function retry(fn, tries, wait)
  for _ = 1, tries do
    local ok, v = pcall(fn)
    if ok and v ~= nil then return v end
    pcall(delay.delay_ms, wait)
  end
  return nil
end

-- ---------------- data / poller ----------------
local root = storage.get_root_dir()
local data_dir = storage.join_path(root, "board_game")
pcall(storage.mkdir, data_dir)
local state_path = storage.join_path(data_dir, "state.json")
pcall(storage.write_file, state_path, json.encode({ ok = false, paired = false, err = "connecting" }))

local poller_path = nil
for _, p in ipairs({
  storage.join_path(root, "apps", "board_game", "scripts", "poller.lua"),
  storage.join_path(root, "skills", "board_game", "scripts", "poller.lua"),
}) do
  if storage.exists(p) then poller_path = p; break end
end
if poller_path then
  local ok, out = pcall(thread.start, poller_path, type(args) == "table" and args or {}, { name = "board_game_poll", replace = true })
  log("poller", ok and "started" or "failed", tostring(out))
else
  log("poller.lua not found")
end

-- ---------------- hardware ----------------
pcall(delay.delay_ms, 600)
local strip = retry(function() return led_strip.new(LED_GPIO, LED_COUNT) end, 20, 250)
pcall(capability.call, "system_control", { operation = "set_display", brightness = 100 })

local lvgl_ok, lvgl_err = false, nil
for _ = 1, 20 do
  lvgl_ok, lvgl_err = pcall(lvgl.init, { buffer_lines = 40, tick_ms = 5, task_period_ms = 10 })
  if lvgl_ok then break end
  pcall(delay.delay_ms, 250)
end
if not lvgl_ok then error(lvgl_err) end

-- 中文字体手动加载
local function font(size, cache)
  local ok, f = pcall(lvgl.font_load, { size = size, cache_size = cache or 256 })
  return ok and f or nil
end
local F18, F24, F32, F40, F72 = font(18), font(24), font(32), font(40, 128), font(72, 32)
if F24 and lvgl.set_default_font then pcall(lvgl.set_default_font, F24) end

-- ---------------- palette ----------------
local C = {
  bg = "#05070D", panel = "#111827", text = "#F8FAFC", muted = "#94A3B8",
  gold = "#F59E0B", blue = "#2563EB", red = "#DC2626", green = "#10B981",
  violet = "#8B5CF6", idle = "#1F2937",
}

local scr = lvgl.create_screen()
scr:set_style({ bg_color = C.bg })

local function label(opts, f)
  local l = lvgl.label(scr, opts)
  if f then l:set_style({ font = f }) end
  return l
end

local header = label({ text = "桌游公屏", x = 16, y = 10, text_color = C.muted }, F18)
local phase_lbl = label({ text = "连接中…", align = "top_mid", y = 40, text_color = C.text }, F40)

-- 5 任务圆 (阿瓦隆)
local circles, circle_lbls, circle_subs = {}, {}, {}
for i = 1, 5 do
  local c = lvgl.container(scr, { x = 28 + (i - 1) * 88, y = 105, w = 72, h = 72, bg_color = C.idle, radius = 36 })
  local l = lvgl.label(c, { text = tostring(i), align = "center", text_color = C.text })
  if F24 then l:set_style({ font = F24 }) end
  local sub = lvgl.label(scr, { text = "", x = 28 + (i - 1) * 88, y = 180, text_color = C.red })
  if F18 then sub:set_style({ font = F18 }) end
  circles[i], circle_lbls[i], circle_subs[i] = c, l, sub
end

-- 锤度 (组队否决计数 5 颗指示点)
local track_lbl = label({ text = "", x = 28, y = 205, text_color = C.muted }, F18)
local dots = {}
for i = 1, 5 do
  dots[i] = lvgl.container(scr, { x = 160 + (i - 1) * 34, y = 205, w = 22, h = 22, bg_color = C.idle, radius = 11 })
end

-- 狼人杀巨号 / 未配对大码
local big_lbl = label({ text = "", align = "top_mid", y = 105, text_color = C.gold }, F72)
local big_sub = label({ text = "", align = "top_mid", y = 195, text_color = C.muted }, F24)

local msg_lbl = label({ text = "", x = 20, y = 250, text_color = C.text }, F24)
local footer = label({ text = "", x = 16, y = 440, text_color = C.muted }, F18)

local running = true
local exit_btn = lvgl.button(scr, { text = "", x = 400, y = 6, w = 70, h = 34, bg_color = C.panel, radius = 10 })
local exit_l = lvgl.label(exit_btn, { text = "退出", align = "center", text_color = C.muted })
if F18 then exit_l:set_style({ font = F18 }) end
exit_btn:on("clicked", function() running = false end)

-- ---------------- helpers ----------------
local PHASE = {
  idle = "等待开局", lobby = "等待入座", deal = "查看身份",
  avalonNominate = "队长挑选出勤", avalonVoteTeam = "全员组队表决", avalonVoteMission = "秘密出任务", avalonReveal = "逐张揭晓开牌", avalonLady = "湖中仙女验人",
  avalonAssassinate = "刺客绝杀刺杀", ended = "本局结束",
  guard = "天黑 · 守卫守护", wolves = "天黑 · 狼队行动", seer = "天黑 · 预言家查验", witch = "天黑 · 女巫用药",
  dawn = "天亮结果公布", sheriffSignup = "警长竞选报名", sheriffSpeech = "警长竞选发言", sheriffVote = "警长投票",
  badge = "移交警徽", order = "警长决定发言顺序", speech = "白天轮流发言", runoffSpeech = "平票 PK 发言",
  vote = "全员放逐投票", hunter = "猎人开枪决断", dusk = "黄昏入夜", explosion = "💣 狼人自爆中",
}
local NIGHT = { guard = true, wolves = true, seer = true, witch = true }

local function wrap(s, cols, max_lines)
  local lines, cur, w = {}, {}, 0
  for ch in tostring(s or ""):gmatch("[%z\1-\127\194-\244][\128-\191]*") do
    if ch == "\n" then
      lines[#lines + 1] = table.concat(cur); cur, w = {}, 0
    else
      local cw = (#ch == 1) and 0.5 or 1
      if w + cw > cols then lines[#lines + 1] = table.concat(cur); cur, w = {}, 0 end
      cur[#cur + 1] = ch; w = w + cw
    end
    if #lines >= max_lines then break end
  end
  if #lines < max_lines and #cur > 0 then lines[#lines + 1] = table.concat(cur) end
  return table.concat(lines, "\n")
end

local function px(i, r, g, b) if strip then pcall(strip.set_pixel, strip, i, r, g, b) end end
local function led_for(slot) if slot <= 4 then return 4 - slot end return slot - 1 end

local function set_leds(s)
  if not strip then return end
  if s.paired == false then
    for i = 0, LED_COUNT - 1 do px(i, 0, 30, 60) end
    pcall(strip.refresh, strip); return
  end
  local av = s.av
  for i = 1, 5 do
    local r, g, b = 0, 0, 0
    if av and type(av.hist) == "table" then
      local h = av.hist[i]
      if h == 1 then r, g, b = 0, 30, 140
      elseif h == 2 then r, g, b = 150, 0, 0
      elseif i == av.round then r, g, b = 120, 70, 0 end
    elseif s.game == "werewolf" and (s.alive or 0) > 0 then
      if i <= ((s.day or 0) - 1) % 5 + 1 and (s.day or 0) > 0 then r, g, b = 60, 40, 0 end
    end
    px(led_for(i), r, g, b)
  end
  local p = s.phase or ""
  if p == "avalonReveal" then
    -- 逐张揭晓开牌演出：根据最近揭晓牌闪蓝或闪红
    local revCard = (av and av.revCard) or ""
    if revCard == "success" then
      px(led_for(6), 0, 80, 255)
    elseif revCard == "fail" then
      for i = 0, LED_COUNT - 1 do px(i, 220, 0, 0) end
    else
      px(led_for(6), 180, 0, 220)
    end
  elseif p == "avalonLady" then
    px(led_for(6), 160, 0, 200)
  elseif NIGHT[p] then px(led_for(6), 50, 0, 100)
  elseif p == "vote" or p == "avalonVoteTeam" or p == "sheriffVote" then px(led_for(6), 0, 120, 30)
  elseif p == "avalonVoteMission" then px(led_for(6), 0, 40, 160)
  elseif p == "ended" then
    local good = (s.winner == "good" or s.winner == "好人")
    px(led_for(6), good and 0 or 160, 0, good and 160 or 0)
  elseif s.ok == false then px(led_for(6), 40, 0, 0)
  else px(led_for(6), 40, 40, 40) end
  pcall(strip.refresh, strip)
end

local remain_base, remain_at = 0, 0
local function render(s)
  -- 1. 未配对或离线状态
  if s.ok == false or s.paired == false then
    header:set_text("Mosaico 桌游公屏 · 待配对")
    phase_lbl:set_text(s.ok == false and "正在连接服务器…" or "等待关联牌桌")
    phase_lbl:set_style({ text_color = C.gold })
    for i = 1, 5 do
      circles[i]:set_style({ bg_opa = 0 }); circle_lbls[i]:set_text("")
      circle_subs[i]:set_text("")
      dots[i]:set_style({ bg_opa = 0 })
    end
    track_lbl:set_text("")
    big_lbl:set_text(tostring(s.code or "D093"))
    big_sub:set_text("设备识别码")
    msg_lbl:set_text(wrap("请在手机或电脑法官台点击【📟 关联 Mosaico 屏幕】并输入此码，屏幕将立即自动同步！", 18, 4))
    footer:set_text(tostring(s.server or ""):sub(1, 40))
    set_leds(s); return
  end

  -- 2. 正常游戏中
  local avalon = s.game == "avalon"
  header:set_text((avalon and "阿瓦隆" or "狼人杀") .. " · " .. tostring(s.size or 0) .. "人 · 桌 " .. tostring(s.id or "-"))
  local title = PHASE[s.phase] or tostring(s.phase or "")
  if s.phase == "ended" then
    local w = s.winner
    title = (w == "good" and "正义阵营获胜！") or (w == "evil" and "邪恶阵营获胜！") or ((w ~= "" and w or "") .. "获胜")
  end
  phase_lbl:set_text(title)
  phase_lbl:set_style({ text_color = NIGHT[s.phase] and C.violet or (s.phase == "ended" and C.gold or C.text) })

  local av = s.av
  for i = 1, 5 do
    if avalon and av then
      local h = av.hist and av.hist[i] or 0
      local color, txt = C.idle, tostring(i)
      if h == 1 then color, txt = C.blue, "成"
      elseif h == 2 then color, txt = C.red, "败"
      elseif i == av.round then color, txt = C.gold, tostring(av.need or i) .. "人" end
      circles[i]:set_style({ bg_color = color, bg_opa = 255 })
      circle_lbls[i]:set_text(txt)
      circle_subs[i]:set_text((i == 4 and (av.fails or 1) > 1) and "需2败" or "")
      dots[i]:set_style({ bg_color = (i <= (av.track or 0)) and C.red or C.idle, bg_opa = 255 })
    else
      circles[i]:set_style({ bg_opa = 0 }); circle_lbls[i]:set_text("")
      circle_subs[i]:set_text("")
      dots[i]:set_style({ bg_opa = 0 })
    end
  end

  if avalon and av then
    local hammer = (av.track or 0) + 1
    if hammer >= 5 then
      track_lbl:set_text("⚠️第5锤")
      track_lbl:set_style({ text_color = C.red })
    else
      track_lbl:set_text("锤度 " .. tostring(av.track or 0) .. "/5")
      track_lbl:set_style({ text_color = C.muted })
    end
    big_lbl:set_text(""); big_sub:set_text("")
  else
    track_lbl:set_text("")
    if (s.speaker or 0) > 0 then
      big_lbl:set_text(tostring(s.speaker) .. "号"); big_sub:set_text("正在发言")
    elseif s.phase == "lobby" or s.phase == "idle" then
      big_lbl:set_text(tostring(s.count or 0) .. "/" .. tostring(s.size or 0)); big_sub:set_text("已入座")
    elseif (s.day or 0) > 0 then
      big_lbl:set_text("第" .. tostring(s.day) .. "天"); big_sub:set_text("存活 " .. tostring(s.alive or 0) .. " 人")
    else
      big_lbl:set_text(""); big_sub:set_text("")
    end
  end

  local msgText = s.msg or ""
  if avalon and av and av.last and av.last ~= "" and s.phase ~= "ended" then
    msgText = "票型: " .. av.last .. "\n" .. msgText
  end
  msg_lbl:set_text(wrap(msgText, 18, 5))

  local foot = ""
  if s.phase == "lobby" then foot = "已准备 " .. tostring(s.ready or 0) .. " / " .. tostring(s.size or 0)
  elseif avalon and av and s.phase == "avalonNominate" then foot = "队长 " .. tostring(av.leader) .. " 号 · 挑选 " .. tostring(av.need) .. " 人出勤"
  elseif avalon and av and s.phase == "avalonVoteTeam" then foot = "已表决 " .. tostring(av.tv) .. " / " .. tostring(s.size)
  elseif avalon and av and s.phase == "avalonVoteMission" then foot = "已出牌 " .. tostring(av.mv) .. " / " .. tostring(av.need) .. " (需 " .. tostring(av.fails) .. " 败)"
  elseif s.phase == "vote" then foot = "已投 " .. tostring(s.votes or 0) .. " / " .. tostring(s.voteTotal or 0)
  end
  footer:set_text(foot)
  remain_base, remain_at = s.remain or 0, now_ms()
  set_leds(s)
end

-- ---------------- main loop ----------------
local last_text, last_phase = "", ""
local last_read, last_tick = 0, 0
local current = { ok = false, paired = false, err = "connecting" }
render(current)

while running do
  lvgl.process_events(30)
  local ms = now_ms()
  if ms - last_read >= 400 then
    last_read = ms
    local ok, txt = pcall(storage.read_file, state_path)
    if ok and type(txt) == "string" and txt ~= last_text then
      last_text = txt
      local ok2, s = pcall(json.decode, txt)
      if ok2 and type(s) == "table" then
        current = s
        if s.phase ~= last_phase then
          last_phase = s.phase or ""
          if strip then
            for i = 0, LED_COUNT - 1 do px(i, 80, 80, 80) end
            pcall(strip.refresh, strip); pcall(delay.delay_ms, 120)
          end
        end
        pcall(render, s)
      end
    end
  end

  if ms - last_tick >= 1000 and remain_base > 0 and (current.speaker or 0) > 0 then
    last_tick = ms
    local left = remain_base - math.floor((ms - remain_at) / 1000)
    if left < 0 then left = 0 end
    footer:set_text(string.format("发言倒计时 %d:%02d", math.floor(left / 60), left % 60))
    footer:set_style({ text_color = left <= 10 and C.red or C.muted })
    -- 催促灯：当剩余时间 <= 10 秒时，第6颗灯橙红急促交替闪烁
    if left <= 10 and strip then
      local blinkOn = (left % 2 == 0)
      px(led_for(6), blinkOn and 220 or 50, blinkOn and 50 or 0, 0)
      pcall(strip.refresh, strip)
    end
  end
end

-- ---------------- cleanup ----------------
pcall(thread.stop, "board_game_poll", 1000)
pcall(function() if strip then strip:clear(); strip:refresh(); strip:close() end end)
pcall(lvgl.deinit)
log("stopped")
