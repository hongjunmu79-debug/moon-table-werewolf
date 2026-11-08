const fs = require('fs');
let code = fs.readFileSync('D:/moon-table-werewolf/esp-mosaico/board_game/scripts/main.lua', 'utf8');

const ledTargetOld = `  local p = s.phase or ""
  if NIGHT[p] then px(led_for(6), 50, 0, 100)
  elseif p == "vote" or p == "avalonVoteTeam" or p == "sheriffVote" then px(led_for(6), 0, 120, 30)
  elseif p == "avalonVoteMission" then px(led_for(6), 0, 40, 160)
  elseif p == "ended" then
    local good = (s.winner == "good" or s.winner == "好人")
    px(led_for(6), good and 0 or 160, 0, good and 160 or 0)
  elseif s.ok == false then px(led_for(6), 40, 0, 0)
  else px(led_for(6), 40, 40, 40) end
  pcall(strip.refresh, strip)`;

const ledTargetNew = `  local p = s.phase or ""
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
  pcall(strip.refresh, strip)`;

code = code.replace(ledTargetOld, ledTargetNew);

// Add countdown warning blink logic in main loop
const tickOld = `  if ms - last_tick >= 1000 and remain_base > 0 and (current.speaker or 0) > 0 then
    last_tick = ms
    local left = remain_base - math.floor((ms - remain_at) / 1000)
    if left < 0 then left = 0 end
    footer:set_text(string.format("发言倒计时 %d:%02d", math.floor(left / 60), left % 60))
    footer:set_style({ text_color = left <= 10 and C.red or C.muted })
  end`;

const tickNew = `  if ms - last_tick >= 1000 and remain_base > 0 and (current.speaker or 0) > 0 then
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
  end`;

code = code.replace(tickOld, tickNew);

// Also add PHASE translation for avalonReveal and avalonLady
code = code.replace(
  'avalonNominate = "队长挑选出勤", avalonVoteTeam = "全员组队表决", avalonVoteMission = "秘密出任务",',
  'avalonNominate = "队长挑选出勤", avalonVoteTeam = "全员组队表决", avalonVoteMission = "秘密出任务", avalonReveal = "逐张揭晓开牌", avalonLady = "湖中仙女验人",'
);

fs.writeFileSync('D:/moon-table-werewolf/esp-mosaico/board_game/scripts/main.lua', code, 'utf8');
console.log('esp-mosaico main.lua updated ok!');
