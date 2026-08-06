import { getApps } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const MEMBER_KEYS=['unicaWorldMemberV4','unicaWorldMemberV3'];
function localMember(){for(const k of MEMBER_KEYS){try{const v=JSON.parse(localStorage.getItem(k)||'null');if(v)return v}catch{}}return null}
function setOpen(el,on){if(!el)return;el.classList.toggle('is-open',on);el.setAttribute('aria-hidden',on?'false':'true')}
function unlockBody(){document.body.classList.remove('passport-modal-open');if(!document.querySelector('.world-modal.is-open,.member-settings.is-open,.member-gate.is-open'))document.body.classList.remove('member-gate-open','modal-open')}
function closePass(){setOpen($('#passportModal'),false);unlockBody()}
function closeTitles(){setOpen($('#passportTitlesModal'),false);document.body.classList.remove('passport-titles-open');unlockBody()}
function openPassShell(){setOpen($('#passportModal'),true);document.body.classList.add('passport-modal-open','modal-open')}
function fillOwn(member){if(!member)return false;$('#detailAvatar').textContent=(member.avatar||'🌸');$('#detailName').textContent=member.name||'うにメン';$('#detailNumber').textContent=`No.${String(Number(member.number||0)).padStart(4,'0')}`;$('#detailJoined').textContent=String(member.joined||member.joinedAt||'—').slice(0,10).replaceAll('-','.');const joined=new Date(member.joined||member.joinedAt||Date.now());const days=Math.max(1,Math.floor((Date.now()-joined.getTime())/86400000)+1);$('#detailDays').textContent=`${days}日`;$('#detailPrefecture').textContent=member.prefecture||'—';$('#detailBirthday').textContent=member.birthMonth&&member.birthDay?`${member.birthMonth}月${member.birthDay}日`:'—';$('#detailTitle').textContent=member.title||'はじまりのうにメン';return true}
function ownUid(){try{return getAuth(getApps()[0]).currentUser?.uid||''}catch{return ''}}
function openOwnPass(){const m=localMember();if(!m){$('#openPassButton')?.click();return}const uid=ownUid();if(uid){window.dispatchEvent(new CustomEvent('unica:open-member-pass',{detail:{uid}}));setTimeout(openPassShell,0)}else{fillOwn(m);openPassShell()}}
function titleValues(){const m=localMember()||{};const current=$('#detailTitle')?.textContent?.trim()||m.title||'はじまりのうにメン';const arr=[current];['titles','earnedTitles','titleHistory','badges'].forEach(k=>{const v=m[k];if(Array.isArray(v))v.forEach(x=>arr.push(typeof x==='string'?x:(x?.name||x?.title||'')))});return [...new Set(arr.filter(Boolean))]}
function openTitles(){const list=$('#passportTitlesList');const modal=$('#passportTitlesModal');const current=$('#detailTitle')?.textContent?.trim();const rows=titleValues();if(!list||!modal)return;list.innerHTML=rows.length?rows.map((t,i)=>`<div class="passport-title-item"><span>${i===0?'🏷️':'✨'}</span><div><strong>${String(t).replace(/[<>&]/g,'')}</strong><small>${t===current?'現在設定中':'獲得済み'}</small></div>${t===current?'<em>使用中</em>':''}</div>`).join(''):'<div class="passport-title-empty">獲得した称号はまだありません。</div>';if(modal.parentElement!==document.body)document.body.appendChild(modal);setOpen(modal,true);document.body.classList.add('passport-modal-open','passport-titles-open','modal-open')}

// Remove legacy rows that may be injected after page load.
function cleanLegacyRows(){['detailFavoriteSongs','detailCheerCount','detailSupportLevel','detailBirthdayWishCount'].forEach(id=>$('#'+id)?.closest('div')?.remove())}
cleanLegacyRows();

// Capture phase prevents older handlers from opening the legacy presentation.
document.addEventListener('click',e=>{
 const close=e.target.closest('[data-close-passport]');if(close){e.preventDefault();e.stopImmediatePropagation();closePass();return}
 const closeT=e.target.closest('[data-close-passport-titles]');if(closeT){e.preventDefault();e.stopImmediatePropagation();closeTitles();return}
 if(e.target.closest('#openPassportTitles')){e.preventDefault();openTitles();return}
 const own=e.target.closest('#statusOpenPass,#openPassButton,[data-world-nav="pass"]');if(own){e.preventDefault();e.stopImmediatePropagation();openOwnPass();return}
},true);

document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if($('#passportTitlesModal')?.classList.contains('is-open'))closeTitles();else if($('#passportModal')?.classList.contains('is-open'))closePass()});
window.addEventListener('unica:open-member-pass',()=>setTimeout(()=>{cleanLegacyRows();openPassShell()},10));
