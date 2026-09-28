export const ROLES:Record<string,string>={wolf:'狼人',seer:'预言家',witch:'女巫',hunter:'猎人',villager:'村民'};
export const ROLE_HELP:Record<string,string>={wolf:'每晚与狼队选择袭击目标。狼队唯一最高票生效，平票为空刀。',seer:'每晚可查验另一位存活玩家的阵营，结果仅自己和法官可见。',witch:'整局一瓶解药、一瓶毒药，每夜最多一瓶。不能自救。',hunter:'被刀或被放逐后可以开枪带走一人；中毒不能开枪。',villager:'白天认真听发言，用投票找出狼人。'};
export const PHASES:Record<string,string>={lobby:'等待入座',deal:'确认身份',night:'天黑请闭眼',wolves:'狼人行动',seer:'预言家行动',witch:'女巫行动',dawn:'天亮了',speech:'依次发言',vote:'放逐投票',hunter:'猎人开枪',dusk:'本日结束',ended:'本局结束'};
export function deck(n:number){return [...Array(n===9?3:2).fill('wolf'),'seer','witch',...(n>=8?['hunter']:[]),...Array(n===6?2:3).fill('villager')];}
