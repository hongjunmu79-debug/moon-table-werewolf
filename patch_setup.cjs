const fs = require('fs');
let code = fs.readFileSync('D:/moon-table-werewolf/app/setup-editor.tsx', 'utf8');

const targetOld = `   <p className="setup-note">推荐配置采用屠边规则。女巫默认仅首夜可自救，可按本桌约定调整。{size>=9?'警长流程可选。':''} 发牌前可切换为自选玩法。</p>`;

const targetNew = `   <label>夜晚行动模式<select className="field" value={setup.nightMode||'openEyes'} onChange={e=>onChange({...setup,nightMode:e.target.value as GameConfig['nightMode']})}><option value="openEyes">📱 手机全睁眼暗操模式 (全员低头操作防闭眼场外)</option><option value="closedEyes">🙈 传统闭眼面杀模式 (纯黑OLED大按钮盲点)</option></select></label>
   <p className="setup-note">推荐配置采用屠边规则。女巫默认仅首夜可自救，可按本桌约定调整。{size>=9?'警长流程可选。':''} 发牌前可切换为自选玩法。</p>`;

code = code.replace(targetOld, targetNew);
fs.writeFileSync('D:/moon-table-werewolf/app/setup-editor.tsx', code, 'utf8');
console.log('setup-editor.tsx updated ok!');
