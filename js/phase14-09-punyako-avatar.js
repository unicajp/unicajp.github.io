(()=>{
'use strict';
const MEMBER_KEY='unicaWorldMemberV4';
const JOURNEY_KEY='unicaPunyakoJourneyV4';
const FORM_IMAGES={
  stage1_base:'assets/punyuka/stage1_base.webp',
  stage2_ear:'assets/punyuka/stage2_ear.webp',
  stage2_wing:'assets/punyuka/stage2_wing.webp',
  stage3_01_fluffy_ear:'assets/punyuka/stage3_01_fluffy_ear.webp',
  stage3_02_round_ear:'assets/punyuka/stage3_02_round_ear.webp',
  stage3_03_kira_wing:'assets/punyuka/stage3_03_kira_wing.webp',
  stage3_04_gira_wing:'assets/punyuka/stage3_04_gira_wing.webp',
  punyuka_01:'assets/punyuka/final/01_flower_rabbit.webp',
  punyuka_02:'assets/punyuka/final/02_sun_dog.webp',
  punyuka_03:'assets/punyuka/final/03_color_cat.webp',
  punyuka_04:'assets/punyuka/final/04_moon_fox.webp',
  punyuka_05:'assets/punyuka/final/05_guard_bear.webp',
  punyuka_06:'assets/punyuka/final/06_lucky_panda.webp',
  punyuka_07:'assets/punyuka/final/07_dream_sheep.webp',
  punyuka_08:'assets/punyuka/final/08_stargazer_koala.webp',
  punyuka_09:'assets/punyuka/final/09_healing_angel.webp',
  punyuka_10:'assets/punyuka/final/10_rainbow_pegasus.webp',
  punyuka_11:'assets/punyuka/final/11_flower_butterfly.webp',
  punyuka_12:'assets/punyuka/final/12_inspiration_fairy.webp',
  punyuka_13:'assets/punyuka/final/13_thunder_dragon.webp',
  punyuka_14:'assets/punyuka/final/14_trick_devil.webp',
  punyuka_15:'assets/punyuka/final/15_ice_penguin.webp',
  punyuka_16:'assets/punyuka/final/16_dawn_phoenix.webp'
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(k,f=null){try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}}
function localMember(){return read(MEMBER_KEY,null)}
function localJourney(){return read(JOURNEY_KEY,null)||localMember()?.punyakoJourney||null}
function isSelf(profile={}){
  const m=localMember()||{};
  const uid=String(window.UNICA_FIREBASE?.uid||'');
  if(profile.uid&&uid&&String(profile.uid)===uid)return true;
  if(profile.number&&m.number&&String(profile.number)===String(m.number))return true;
  return !!(profile.name&&m.name&&String(profile.name)===String(m.name));
}
function normalizeJourney(profile={}){
  const self=isSelf(profile);
  const j=profile.punyakoJourney||(self?localJourney():null)||null;
  if(j?.seedComplete){
    const id=String(j.equippedId||'stage1_base');
    return {seedComplete:true,equippedId:id,equippedImage:String(j.equippedImage||FORM_IMAGES[id]||FORM_IMAGES.stage1_base),equippedName:String(j.equippedName||'ぷにゅか')};
  }
  const typeId=String(profile.scentDiagnosis?.typeId||'');
  if(FORM_IMAGES[typeId])return {seedComplete:true,equippedId:typeId,equippedImage:FORM_IMAGES[typeId],equippedName:String(profile.scentDiagnosis?.scentName||'ぷにゅか')};
  return {seedComplete:false,equippedId:'',equippedImage:'',equippedName:'まだぷにゅかはいません'};
}
function html(profile={},size='normal'){
  const self=isSelf(profile),j=normalizeJourney(profile),tiny=size==='tiny';
  if(!j.seedComplete){
    return `<span class="unica-punyako-avatar ${tiny?'is-tiny':''} is-empty" ${self?'data-punyako-self="1"':''} title="ぷにゅか診断でぷにゅかを誕生させよう" aria-label="ぷにゅか未誕生"><span aria-hidden="true">✦</span></span>`;
  }
  return `<span class="unica-punyako-avatar ${tiny?'is-tiny':''}" ${self?'data-punyako-self="1"':''} data-punyako-id="${esc(j.equippedId)}" title="${esc(j.equippedName)}" aria-label="${esc(j.equippedName)}"><img src="${esc(j.equippedImage)}" alt="" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="upa-fallback" aria-hidden="true">✦</span></span>`;
}
function render(el,profile={},size='normal'){if(el)el.innerHTML=html(profile,size)}
function refreshSelf(){
  const m=localMember()||{};
  document.querySelectorAll('[data-punyako-self="1"]').forEach(old=>{
    const holder=document.createElement('span');
    holder.innerHTML=html(m,old.classList.contains('is-tiny')?'tiny':'normal');
    const next=holder.firstElementChild;
    if(next)old.replaceWith(next);
  });
}
window.UNICA_BLOOM_BADGE={html,render,refresh:refreshSelf,journeyFor:normalizeJourney,formImages:FORM_IMAGES};
window.UNICA_PUNYAKO_AVATAR={html,render,refreshSelf,formImages:FORM_IMAGES};
window.addEventListener('unica:punyako-avatar-updated',()=>requestAnimationFrame(refreshSelf));
window.addEventListener('storage',e=>{if([MEMBER_KEY,JOURNEY_KEY].includes(e.key))requestAnimationFrame(refreshSelf)});
})();
