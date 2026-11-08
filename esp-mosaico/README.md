# ESP32 MOSAicO 桌面中央公屏与语音法官硬件集成指南

本模块专为 **乐鑫 ESP32 MOSAicO (基于 ESP32-S3，配备 2.16 英寸 480×480 AMOLED 触摸屏、扬声器、麦克风与 Wi-Fi)** 定制，作为线下桌游的**桌面中央公屏**与**电子法官/语音裁判**。

---

## 硬件架构与职责分工

```
[玩家手中的 10 张物理白卡 / NC 卡]
          │
          │ (Web-NFC 或点击卡号 #1~#10 绑定)
          ▼
   [玩家手机网页] ───────────────────┐
   - 私密查看身份 (长按显示，松开黑屏)   │
   - 秘密出勤表决 (成功/失败)         │ (HTTP / WebSocket)
                                     ▼
                      [腾讯云 CloudBase 后端]
                                     ▲
                                     │ (实时长轮询 / WebSocket 同步)
                                     │
                 [乐鑫 ESP32 MOSAicO 桌面中央公屏]
                 - 480×480 AMOLED 环形表盘显示
                 - 5 轮任务进度 (圆环 R1~R5 实时变蓝/变红)
                 - 组队否决计数 (1~5 💀)
                 - 扬声器播报电子法官中文语音包
```

---

## 1. 软件模式（即刻可用）

即使 ESP32 MOSAicO 硬件还在路上或未连烧录器，系统已**内置 100% 还原的 480×480 AMOLED 仿真公屏**：
1. 打开部署在腾讯云或本地的桌游网页（例如 `http://localhost:8089` 或腾讯云域名）。
2. 在右上角点击 **【ESP32 主机公屏】** 按钮。
3. 即可弹出或全屏显示 **480×480 圆形 AMOLED 表盘**，内置：
   - Web Audio 仿真蜂鸣与和弦音效（任务通过铃音、失败低吼、胜利号角）。
   - Web Speech 电子法官中文播报（自动跟随房间阶段播报）。

---

## 2. 乐鑫 ESP-GSP 场景编译与本地仿真 (`sim.exe`)

本机已安装 ESP-Mosaico 工具链：
- 场景编译器：`C:\Users\23715\.cache\esp-mosaico\gspc\0.6.1\gspc.exe`
- 仿真宿主：`C:\Users\23715\.cache\esp-mosaico\sim\1.5.1\sim.exe`

在 `esp-mosaico` 目录下运行 `preview_sim.bat` 即可启动本地 480×480 仿真窗口。

---

## 3. ESP-Claw 固件烧录与联网配网

1. 打开 `esp-mosaico/mosaico_client.lua`，修改其中的服务器地址为你的腾讯云 CloudBase 域名：
   ```lua
   local SERVER_URL = "https://moon-table-werewolf-319788-10-1407258995.sh.run.tcloudbase.com"
   local ROOM_ID = "你的房间ID"
   ```
2. 使用 VS Code / Cloud Code 的 ESP-IDF 或 ESP-Claw 插件：
   ```bash
   idf.py -p COMx flash monitor
   ```
3. 上电后，ESP32 MOSAicO 会自动连接 Wi-Fi，保持长连接并同步房间大盘数据，驱动 AMOLED 屏幕显示并由板载喇叭播报法官语音！
