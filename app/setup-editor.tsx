import {ROLES,ROLE_IDS,recommendedConfig,roleSummary,configurationError,configName,victoryText,witchText,type GameConfig,type Role} from '@/lib/rules';
import './setup.css';

export function SetupSummary({setup,size}:{setup:GameConfig;size:number}){
 return <div className="setup-summary"><strong>{configName(setup,size)} <span>无警长</span></strong><p>{roleSummary(setup)}</p><small>{victoryText(setup)} {witchText(setup)}</small></div>;
}

export default function SetupEditor({size,setup,onChange}:{size:number;setup:GameConfig;onChange:(value:GameConfig)=>void}){
 const total=Object.values(setup.roles).reduce((sum,n)=>sum+n,0),error=configurationError(size,setup);
 function count(role:Role,n:number){onChange({...setup,roles:{...setup.roles,[role]:n}});}
 return <section className="setup-picker" aria-label="玩法配置">
  <div className="mode-choice" role="group" aria-label="选择玩法">
   <button type="button" aria-pressed={setup.mode==='recommended'} onClick={()=>onChange(recommendedConfig(size,setup.preset))}>标准推荐</button>
   <button type="button" aria-pressed={setup.mode==='custom'} onClick={()=>onChange({...setup,mode:'custom'})}>自选玩法</button>
  </div>
  {setup.mode==='recommended'?<>
   {size>=10&&<label>推荐板型<select className="field" value={setup.preset} onChange={e=>onChange(recommendedConfig(size,e.target.value as 'classic'|'guard'))}><option value="classic">{size>=11?'预女猎白 · 白痴局':'预女猎 · 经典局'}</option><option value="guard">预女猎守 · 守卫局</option></select></label>}
   <SetupSummary setup={setup} size={size}/>
   <p className="setup-note">{size>=10?'采用常见配比和屠边规则，适合有法官的熟人语音局。':'小桌使用原有角色配置和人数胜负规则，适合快速开局。'} 发牌前可切换为自选玩法。</p>
  </>:<>
   <div className="setup-total" aria-live="polite">角色合计 <b>{total} / {size}</b><span>{total===size?'人数匹配':total<size?'还差 '+(size-total)+' 位':'多了 '+(total-size)+' 位'}</span></div>
   <div className="role-editor">{ROLE_IDS.map(role=>{
    const max=role==='wolf'||role==='villager'?size:1;
    return <div className="role-counter" key={role}><span>{ROLES[role]}<small>{role==='wolf'?'狼人阵营':role==='villager'?'好人 · 平民':'好人 · 神职'}</small></span><div><button type="button" aria-label={'减少'+ROLES[role]} disabled={setup.roles[role]===0} onClick={()=>count(role,setup.roles[role]-1)}>−</button><output aria-label={ROLES[role]+'数量'}>{setup.roles[role]}</output><button type="button" aria-label={'增加'+ROLES[role]} disabled={setup.roles[role]>=max} onClick={()=>count(role,setup.roles[role]+1)}>＋</button></div></div>;
   })}</div>
   <label>狼人获胜条件<select className="field" value={setup.victory} onChange={e=>onChange({...setup,victory:e.target.value as GameConfig['victory']})}><option value="edge">屠边：村民全灭或神职全灭</option><option value="parity">人数：狼人不少于好人</option></select></label>
   {setup.roles.witch>0&&<label>女巫自救<select className="field" value={setup.witchSelfSave} onChange={e=>onChange({...setup,witchSelfSave:e.target.value as GameConfig['witchSelfSave']})}><option value="never">全程不能自救</option><option value="firstNight">仅第一夜可以自救</option></select></label>}
   <p className={'setup-note '+(error?'invalid':'')} role={error?'alert':undefined}>{error||'配置有效。各神职最多 1 位；身份会按本配置随机发放。'}</p>
  </>}
 </section>;
}
