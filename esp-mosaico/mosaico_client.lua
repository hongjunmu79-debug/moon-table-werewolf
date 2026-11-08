-- ESP32 MOSAicO Avalon Board Game Host Client (ESP-Claw Lua Runtime)
-- Resolution: 480x480 AMOLED Display (ESP32-S3)

local http = require("http")
local timer = require("timer")
local audio = require("audio")
local display = require("display")

local CONFIG = {
  server_url = "https://moon-table-werewolf-319788-10-1407258995.sh.run.tcloudbase.com",
  room_id = "", -- Set dynamically or via pairing
  poll_interval_ms = 2000,
}

local current_state = {
  round = 1,
  phase = "lobby",
  missions = {"pending", "pending", "pending", "pending", "pending"},
  vote_tracker = 0,
  leader_seat = 1
}

local function speak_judge(text)
  print("[MOSAicO TTS]: " .. text)
  -- Calls onboard TTS or plays local MP3 voice package via I2S DAC
  audio.play_speech(text)
end

local function update_screen(data)
  if not data or not data.avalon then return end
  local av = data.avalon
  current_state.round = av.currentRound or 1
  current_state.missions = av.missionHistory or current_state.missions
  current_state.vote_tracker = av.voteTracker or 0
  current_state.leader_seat = av.leaderSeat or 1

  -- Draw 480x480 UI
  display.clear(0x0a0f1d) -- Deep slate navy
  
  -- Header
  display.draw_text_center(240, 30, "AVALON HOST CONSOLE", 0x818cf8, 2)
  display.draw_text_center(240, 55, "ROOM: " .. string.sub(data.id or "------", 1, 8), 0x94a3b8, 1)

  -- Draw 5 Mission Circles
  local circle_y = 150
  local xs = {80, 160, 240, 320, 400}
  for i = 1, 5 do
    local st = current_state.missions[i]
    local color = 0x334155
    if st == "success" then
      color = 0x2563eb -- Blue shield
    elseif st == "fail" then
      color = 0xdc2626 -- Red swords
    elseif i == current_state.round then
      color = 0xf59e0b -- Gold current
    end
    display.draw_circle(xs[i], circle_y, 28, color, true)
    display.draw_text_center(xs[i], circle_y - 6, "R" .. i, 0xffffff, 1)
  end

  -- Vote Tracker
  display.draw_text_center(240, 220, "VOTE REJECTIONS: " .. current_state.vote_tracker .. " / 5", 0xf59e0b, 1)

  -- Phase & Leader Info
  display.draw_text_center(240, 280, "PHASE: " .. string.upper(data.phase or "LOBBY"), 0xffffff, 2)
  if data.phase == "avalonNominate" then
    display.draw_text_center(240, 320, "LEADER: SEAT " .. current_state.leader_seat, 0x38bdf8, 2)
  elseif data.phase == "avalonVoteTeam" then
    display.draw_text_center(240, 320, "TEAM VOTING IN PROGRESS", 0xa78bfa, 2)
  elseif data.phase == "avalonVoteMission" then
    display.draw_text_center(240, 320, "SECRET MISSION RUNNING", 0x60a5fa, 2)
  end

  -- Refresh display buffer to AMOLED panel
  display.flush()
end

local function poll_server()
  if not CONFIG.room_id or CONFIG.room_id == "" then return end
  local url = CONFIG.server_url .. "/api/room?id=" .. CONFIG.room_id
  http.get(url, function(err, resp)
    if not err and resp and resp.status == 200 then
      local data = json.decode(resp.body)
      if data then
        update_screen(data)
      end
    end
  end)
end

-- Initialize
display.init_amoled_480x480()
speak_judge("乐鑫 MOSAicO 桌游公屏已启动")
timer.interval(CONFIG.poll_interval_ms, poll_server)
