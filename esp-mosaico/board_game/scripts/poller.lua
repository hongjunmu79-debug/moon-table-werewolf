-- ============================================================
-- board_game / poller.lua
-- Background job: polls /api/mosaico/poll?deviceCode=...
-- Ultra-compact JSON (< 400 bytes), safe for ESP32 RAM.
-- ============================================================
local capability = require("capability")
local storage = require("storage")
local json = require("json")
local delay = require("delay")

local root = storage.get_root_dir()
local dir = storage.join_path(root, "board_game")
pcall(storage.mkdir, dir)
local state_path = storage.join_path(dir, "state.json")
local config_path = storage.join_path(dir, "config.json")

-- Default LAN server and device code (D093 from ESP32-S31 MAC 1c:29:04:d0:93:18)
local server = "http://192.168.3.7:8080"
local device_code = "D093"

if type(args) == "table" then
  if type(args.server) == "string" and args.server ~= "" then server = args.server end
  if type(args.device_code) == "string" and args.device_code ~= "" then device_code = args.device_code end
end

pcall(function()
  if storage.exists(config_path) then
    local c = json.decode(storage.read_file(config_path))
    if type(c) == "table" then
      if type(c.server) == "string" and c.server ~= "" then server = c.server end
      if type(c.device_code) == "string" and c.device_code ~= "" then device_code = c.device_code end
    end
  end
end)

server = server:gsub("/+$", "")
print("[board_game.poller] server=" .. server .. " device_code=" .. device_code)

local fails = 0
local last = ""

while true do
  local url = server .. "/api/mosaico/poll?deviceCode=" .. device_code
  local ok, out, err = capability.call("http_request", {
    url = url,
    method = "GET",
    timeout_ms = 2500,
    max_body_bytes = 1024,
  })

  local body = nil
  if ok then
    local status, resp = tostring(out):match("^HTTP (%d+)\n(.*)$")
    if status == "200" then body = resp end
  end

  if body then
    fails = 0
    if body ~= last then
      last = body
      pcall(storage.write_file, state_path, body)
    end
  else
    fails = fails + 1
    if fails >= 3 then
      pcall(storage.write_file, state_path, json.encode({
        ok = false,
        paired = false,
        code = device_code,
        err = tostring(err or out or "offline"),
        server = server
      }))
      last = ""
    end
  end

  delay.delay_ms(1200)
end
