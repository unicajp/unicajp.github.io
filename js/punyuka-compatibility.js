/* Version 1. Fixed calibration: never depends on current members or randomness at runtime. */
(()=>{
'use strict';
const axes=['kindness','action','curiosity','sensitivity','flexibility'];
const hidden=['socialEnergy','spaceNeed','decisionSpeed','expressionLevel','recoveryStyle','noveltyNeed'];
const clip=x=>Math.max(0,Math.min(1,x));
const value=(map,key)=>Number(map?.[key]??50);
function raw(a,b){
 const full=a.n>=25&&b.n>=25&&hidden.every(k=>Number.isFinite(a.hidden?.[k])&&Number.isFinite(b.hidden?.[k]));
 const pace=full?['socialEnergy','spaceNeed','decisionSpeed','expressionLevel','recoveryStyle','noveltyNeed']:['action','sensitivity','curiosity'];
 const am=full?a.hidden:a.stats,bm=full?b.hidden:b.stats;
 const gaps=pace.map(k=>Math.abs(value(am,k)-value(bm,k))/70);
 const comfort=clip(1-(gaps.reduce((s,x)=>s+x,0)/gaps.length)*.6-Math.max(...gaps)*.4);
 // Different strengths can help a pair; identical strengths are not penalized outright.
 const actionBalance=clip((Math.abs(value(a.stats,'action')-value(b.stats,'action'))+Math.abs(value(a.stats,'curiosity')-value(b.stats,'curiosity')))/55);
 const commonCare=clip((Math.min(value(a.stats,'kindness'),value(b.stats,'kindness'))-20)/70);
 const support=clip(.5*actionBalance+.5*commonCare);
 const flexibility=clip(((value(a.stats,'flexibility')+value(b.stats,'flexibility'))/2-20)/70);
 const weakest=clip((Math.min(value(a.stats,'flexibility'),value(b.stats,'flexibility'))-20)/70);
 const adjustment=clip(.45*flexibility+.25*weakest+.30*commonCare);
 // Unspoken wishes: both very reserved can need explicit check-ins.
 const reserve=full?clip((50-Math.max(value(am,'expressionLevel'),value(bm,'expressionLevel')))/30)*.08:0;
 return {raw:clip(.45*comfort+.25*support+.30*adjustment-reserve),comfort,support,adjustment,full};
}
const calibration={"simple":[0.6191688311688311,0.6221688311688311,0.6236233766233766,0.6250649350649351,0.6259350649350649,0.6266233766233766,0.627288961038961,0.6276363636363635,0.628275974025974,0.6287207792207792,0.6290422077922079,0.6296948051948053,0.6302305194805194,0.630461038961039,0.6308961038961038,0.6313766233766234,0.6317142857142857,0.6319675324675325,0.6321948051948052,0.632801948051948,0.6331623376623376,0.6334610389610389,0.6338409090909091,0.6343019480519481,0.6346201298701298,0.635051948051948,0.6353506493506493,0.635814935064935,0.6361136363636363,0.6365259740259741,0.6367597402597402,0.6372694805194805,0.637538961038961,0.6379350649350649,0.6382142857142856,0.6388181818181818,0.6393538961038961,0.6396038961038961,0.6398733766233766,0.6403409090909091,0.6406396103896104,0.6411038961038961,0.6413571428571428,0.6423766233766234,0.6426753246753246,0.6435097402597403,0.6443506493506493,0.6458863636363636,0.6474285714285714,0.6495551948051947,0.6528051948051949],"full":[0.6438571428571428,0.6545227272727273,0.6601038961038961,0.6643019480519481,0.6677435064935067,0.6706850649350649,0.6732987012987013,0.6755746753246754,0.6777532467532468,0.679775974025974,0.6816071428571429,0.6833181818181818,0.6849090909090909,0.6864999999999999,0.6879448051948052,0.6893019480519481,0.6906753246753246,0.6919837662337661,0.6932792207792207,0.6945551948051948,0.6959090909090909,0.697090909090909,0.6982207792207792,0.6993051948051947,0.7005,0.7016103896103896,0.7027922077922077,0.704,0.7051688311688311,0.7063441558441559,0.7074480519480519,0.7085454545454546,0.7097564935064935,0.711038961038961,0.712301948051948,0.7135584415584415,0.7149415584415585,0.7160941558441558,0.717461038961039,0.7190454545454545,0.7206201298701298,0.7221461038961039,0.7236785714285714,0.725305194805195,0.7271915584415585,0.7291331168831168,0.7315714285714285,0.7342272727272727,0.7375292207792208,0.7425064935064934,0.7511396103896104]};
function percent(r,kind){
 const knots=calibration[kind];if(!knots.length)return Math.round(50+50*r);
 if(r<=knots[0])return 50;if(r>=knots[knots.length-1])return 100;
 let i=1;while(knots[i]<r)i++;
 const f=(i-1+(r-knots[i-1])/(knots[i]-knots[i-1]))/(knots.length-1);
 return Math.max(50,Math.min(100,Math.round(50+50*f)));
}
function evaluate(a,b){const r=raw(a,b);return {...r,percent:percent(r.raw,r.full?'full':'simple'),version:1};}
window.UNICA_COMPATIBILITY={raw,evaluate,calibration};
})();
