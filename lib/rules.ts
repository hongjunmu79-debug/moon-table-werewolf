export const ROLES:Record<string,string>={wolf:'狼人',seer:'预言家',witch:'女巫',hunter:'猎人',idiot:'白痴',guard:'守卫',villager:'村民'};
export const ROLE_IDS=['wolf','seer','witch','hunter','idiot','guard','villager'] as const;
export type Role=typeof ROLE_IDS[number];
export type RoleCounts=Record<Role,number>;
export type GameConfig={mode:'recommended'|'custom';preset:'classic'|'guard';roles:RoleCounts;victory:'edge'|'parity';witchSelfSave:'never'|'firstNight'|'always';sheriff:boolean;sheriffExplosion:'single'|'double'};
export const PLAYER_SIZES=[6,7,8,9,10,11,12];
export const ROLE_HELP:Record<string,string>={
 wolf:'每晚与狼队选择袭击目标，可以自刀或选择狼队成员。狼队唯一最高票生效，平票为空刀。',
 seer:'每晚可查验另一位存活玩家的阵营，结果仅自己和法官可见。',
 witch:'整局一瓶解药、一瓶毒药，每夜最多一瓶。能否首夜自救以本桌约定为准。',
 hunter:'被刀或被放逐后可以开枪带走一人；中毒不能开枪。',
 idiot:'首次被投票放逐时亮明身份并留在场上，此后不能投票或被放逐。仍可发言，遭狼刀、毒药或猎人枪击会出局。',
 guard:'每晚可守护一位存活玩家，可以守自己，不能连续两夜守同一人。能挡狼刀，不能挡毒药；同守同救仍会出局。',
 villager:'白天认真听发言，用投票找出狼人。'
};
export const PHASES:Record<string,string>={lobby:'等待入座',deal:'确认身份',night:'天黑请闭眼',guard:'守卫行动',wolves:'狼人行动',seer:'预言家行动',witch:'女巫行动',dawn:'天亮了',speech:'依次发言',vote:'放逐投票',hunter:'猎人开枪',dusk:'本日结束',ended:'本局结束',sheriffSignup:'上警报名',sheriffSpeech:'警长竞选发言',sheriffVote:'警长竞选投票',badge:'移交警徽',order:'警长决定发言顺序',runoffSpeech:'放逐平票 PK 发言',explosion:'狼人自爆 · 白天结束'};
export class RuleError extends Error {}
function fail(message:string):never{throw new RuleError(message);}
export function recommendedConfig(size:number,preset:'classic'|'guard'='classic'):GameConfig{
 if(!PLAYER_SIZES.includes(size))fail('支持 6–12 人局，不含法官');
 if(!['classic','guard'].includes(preset))fail('推荐配置无效');
 const wolves=size>=12?4:size>=9?3:2;
 const roles:RoleCounts={wolf:wolves,seer:1,witch:1,hunter:size>=8?1:0,idiot:size>=11&&preset==='classic'?1:0,guard:size>=10&&preset==='guard'?1:0,villager:0};
 roles.villager=size-Object.values(roles).reduce((sum,n)=>sum+n,0);
 return {mode:'recommended',preset,roles,victory:'edge',witchSelfSave:'firstNight',sheriff:false,sheriffExplosion:'single'};
}
export function legacyConfig(size:number):GameConfig{
 const config=recommendedConfig(size);
 return {...config,victory:size<=9?'parity':'edge',witchSelfSave:'never',sheriff:false};
}
export function resolveConfig(size:number,input?:unknown):GameConfig{
 if(!PLAYER_SIZES.includes(size))fail('支持 6–12 人局，不含法官');
 if(input===undefined)return recommendedConfig(size);
 if(!input||typeof input!=='object'||Array.isArray(input))fail('玩法配置无效');
 const value=input as Record<string,unknown>;
 const sheriff=value.sheriff===undefined?false:value.sheriff;
 if(typeof sheriff!=='boolean')fail('警长开关必须是布尔值');
 if(sheriff&&size<9)fail('警长流程支持 9–12 人局');
 const sheriffExplosion=value.sheriffExplosion===undefined?'single':value.sheriffExplosion;
 if(typeof sheriffExplosion!=='string'||!['single','double'].includes(sheriffExplosion))fail('请选择警上自爆的警徽规则');
 const witchSelfSave=value.witchSelfSave===undefined?'firstNight':value.witchSelfSave;
 if(typeof witchSelfSave!=='string'||!['never','firstNight','always'].includes(witchSelfSave))fail('请选择有效的女巫自救规则');
 if(value.mode==='recommended'){
  if(value.preset!==undefined&&!['classic','guard'].includes(String(value.preset)))fail('推荐配置无效');
  return {...recommendedConfig(size,(value.preset||'classic') as 'classic'|'guard'),witchSelfSave:witchSelfSave as GameConfig['witchSelfSave'],sheriff,sheriffExplosion:sheriffExplosion as GameConfig['sheriffExplosion']};
 }
 if(value.mode!=='custom')fail('请选择推荐玩法或自选玩法');
 if(!value.roles||typeof value.roles!=='object'||Array.isArray(value.roles))fail('请配置身份数量');
 const supplied=value.roles as Record<string,unknown>;
 if(Object.keys(supplied).some(role=>!ROLE_IDS.includes(role as Role)))fail('含有暂不支持的角色');
 const roles={} as RoleCounts;
 for(const role of ROLE_IDS){
  const n=Object.hasOwn(supplied,role)?supplied[role]:0;
  if(typeof n!=='number'||!Number.isInteger(n)||n<0||n>size)fail('身份数量必须是非负整数');
  if(!['wolf','villager'].includes(role)&&n>1)fail(ROLES[role]+'最多 1 位');
  roles[role]=n as number;
 }
 if(Object.values(roles).reduce((sum,n)=>sum+n,0)!==size)fail('身份总数必须等于 '+size+' 位玩家');
 if(roles.wolf<1||roles.wolf*2>=size)fail('至少 1 位狼人，且狼人必须少于好人');
 if(roles.villager<1)fail('至少保留 1 位村民');
 if(roles.seer+roles.witch+roles.hunter+roles.idiot+roles.guard<1)fail('至少保留 1 位神职');
 if(typeof value.victory!=='string'||!['edge','parity'].includes(value.victory))fail('请选择有效的胜负条件');
 return {mode:'custom',preset:'classic',roles,victory:value.victory as 'edge'|'parity',witchSelfSave:witchSelfSave as GameConfig['witchSelfSave'],sheriff,sheriffExplosion:sheriffExplosion as GameConfig['sheriffExplosion']};
}
export function configDeck(config:GameConfig):string[]{return ROLE_IDS.flatMap(role=>Array(config.roles[role]).fill(role));}
export function deck(n:number){return configDeck(recommendedConfig(n));}
export function configName(config:GameConfig,size:number){
 if(config.mode==='custom')return '自选玩法';
 return config.roles.guard?'预女猎守 · 推荐配置':config.roles.idiot?'预女猎白 · 标准配置':'标准推荐配置';
}
export function victoryText(config:GameConfig){return config.victory==='edge'?'屠边：狼人全灭，好人胜；神职或村民任一类全部出局，狼人胜。':'人数制：狼人全灭，好人胜；存活狼人不少于存活好人，狼人胜。';}
export function configurationError(size:number,input:unknown){try{resolveConfig(size,input);return '';}catch(e){return e instanceof Error?e.message:'配置无效';}}
export function roleSummary(config:GameConfig){return ROLE_IDS.filter(role=>config.roles[role]>0).map(role=>ROLES[role]+' × '+config.roles[role]).join(' · ');}
export function witchText(config:GameConfig){return config.witchSelfSave==='always'?'女巫全程可以自救（须有解药）。':config.witchSelfSave==='firstNight'?'女巫仅第一夜可以自救。':'女巫全程不能自救。';}
export function selfSaveAllowed(config:GameConfig,day:number){return config.witchSelfSave==='always'||config.witchSelfSave==='firstNight'&&day===1;}
