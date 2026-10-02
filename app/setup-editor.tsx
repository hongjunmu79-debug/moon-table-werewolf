import {ROLES,ROLE_IDS,recommendedConfig,roleSummary,configurationError,configName,victoryText,witchText,type GameConfig,type Role} from '@/lib/rules';
import './setup.css';

export function SetupSummary({setup,size}:{setup:GameConfig;size:number}){
 return <div className="setup-summary"><strong>{configName(setup,size)} <span>{setup.sheriff?'有警长 · 1.5 票':'无警长'}</span></strong><p>{roleSummary(setup)}</p><small>{victoryText(setup)} {witchText(setup)}{setup.sheriff?' 警上'+(setup.sheriffExplosion==='double'?'双爆':'单爆')+'吞警徽。':''}</small></div>;
}

export default function SetupEditor({size,setup,onChange}:{size:number;setup:GameConfig;onChange:(value:GameConfig)=>void}){
 const total=Object.values(setup.roles).reduce((sum,n)=>sum+n,0),error=configurationError(size,setup);
 function count(role:Role,n:number){onChange({...setup,roles:{...setup.roles,[role]:n}});}
 function recommend(preset:GameConfig['preset']){onChange({...recommendedConfig(size,preset),witchSelfSave:setup.witchSelfSave,sheriff:size>=9&&setup.sheriff,sheriffExplosion:setup.sheriffExplosion});}
 return <section className="setup-picker" aria-label="玩法配置">
  <div className="mode-choice" role="group" aria-label="选择玩法">
   <button type="button" aria-pressed={setup.mode==='recommended'} onClick={()=>recommend(setup.preset)}>标准推荐</button>
   <button type="button" aria-pressed={setup.mode==='custom'} onClick={()=>onChange({...setup,mode:'custom'})}>自选玩法</button>
  </div>
  {setup.mode==='recommended'?<>
   {size>=10&&<label>推荐板型<select className="field" value={setup.preset} onChange={e=>recommend(e.target.value as 'classic'|'guard')}><option value="classic">{size>=11?'预女猎白 · 白痴局':'预女猎 · 经典局'}</option><option value="guard">预女猎守 · 守卫局</option></select></label>}
   <SetupSummary setup={setup} size={size}/>
   <p className="setup-note">推荐配置采用屠边规则。女巫默认仅首夜可自救，可按本桌约定调整。{size>=9?'警长流程可选。':''} 发牌前可切换为自选玩法。</p>
  </>:<>
   <div className="setup-total" aria-live="polite">角色合计 <b>{total} / {size}</b><span>{total===size?'人数匹配':total<size?'还差 '+(size-total)+' 位':'多了 '+(total-size)+' 位'}</span></div>
   <div className="role-editor">{ROLE_IDS.map(role=>{
    const max=role==='wolf'||role==='villager'?size:1;
    return <div className="role-counter" key={role}><span>{ROLES[role]}<small>{role==='wolf'?'狼人阵营':role==='villager'?'好人 · 平民':'好人 · 神职'}</small></span><div><button type="button" aria-label={'减少'+ROLES[role]} disabled={setup.roles[role]===0} onClick={()=>count(role,setup.roles[role]-1)}>−</button><output aria-label={ROLES[role]+'数量'}>{setup.roles[role]}</output><button type="button" aria-label={'增加'+ROLES[role]} disabled={setup.roles[role]>=max} onClick={()=>count(role,setup.roles[role]+1)}>＋</button></div></div>;
   })}</div>
   <label>狼人获胜条件<select className="field" value={setup.victory} onChange={e=>onChange({...setup,victory:e.target.value as GameConfig['victory']})}><option value="edge">屠边：村民全灭或神职全灭</option><option value="parity">人数：狼人不少于好人</option></select></label>
   <p className={'setup-note '+(error?'invalid':'')} role={error?'alert':undefined}>{error||'配置有效。各神职最多 1 位；身份会按本配置随机发放。'}</p>
  </>}
  {setup.roles.witch>0&&<label>女巫自救<select className="field" value={setup.witchSelfSave} onChange={e=>onChange({...setup,witchSelfSave:e.target.value as GameConfig['witchSelfSave']})}><option value="firstNight">仅首夜可自救 · 第二夜起不能</option><option value="always">全程可自救 · 须有解药</option><option value="never">全程不能自救</option></select></label>}
  {size>=9&&<label>警长流程<select className="field" value={setup.sheriff?'on':'off'} onChange={e=>onChange({...setup,sheriff:e.target.value==='on'})}><option value="off">不开警长 · 简洁主持</option><option value="on">开启警长 · 竞选 / 1.5 票 / 警徽</option></select></label>}
  {size>=9&&setup.sheriff&&<label>警上自爆规则<select className="field" value={setup.sheriffExplosion||'single'} onChange={e=>onChange({...setup,sheriffExplosion:e.target.value as GameConfig['sheriffExplosion']})}><option value="single">单爆吞警徽 · 本局不再竞选</option><option value="double">双爆吞警徽 · 首爆暂停，次日续选</option></select></label>}
 </section>;
}
