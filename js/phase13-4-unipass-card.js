import { getApps } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const MEMBER_KEYS=['unicaWorldMemberV4','unicaWorldMemberV3'];
function localMember(){for(const k of MEMBER_KEYS){try{const v=JSON.parse(localStorage.getItem(k)||'null');if(v)return v}catch{}}return null}
function setOpen(el,on){if(!el)return;el.classList.toggle('is-open',on);el.setAttribute('aria-hidden',on?'false':'true')}
function unlockBody(){document.body.classList.remove('passport-modal-open');if(!document.querySelector('.world-modal.is-open,.member-settings.is-open,.member-gate.is-open'))document.body.classList.remove('member-gate-open','modal-open')}
function closePass(){resetEditor();setOpen($('#passportModal'),false);unlockBody()}
function closeTitles(){setOpen($('#passportTitlesModal'),false);document.body.classList.remove('passport-titles-open');unlockBody()}
function openPassShell(){setOpen($('#passportModal'),true);document.body.classList.add('passport-modal-open','modal-open')}
function fillOwn(member){if(!member)return false;$('#detailAvatar').innerHTML=window.UNICA_BLOOM_BADGE?.html?.(member,'normal')||'';$('#detailName').textContent=member.name||'うにメン';$('#detailNumber').textContent=`No.${String(Number(member.number||0)).padStart(4,'0')}`;$('#detailJoined').textContent=String(member.joined||member.joinedAt||'—').slice(0,10).replaceAll('-','.');const joined=new Date(member.joined||member.joinedAt||Date.now());const days=Math.max(1,Math.floor((Date.now()-joined.getTime())/86400000)+1);$('#detailDays').textContent=`${days}日`;$('#detailPrefecture').textContent=member.prefecture||'—';$('#detailBirthday').textContent=member.birthMonth&&member.birthDay?`${member.birthMonth}月${member.birthDay}日`:'—';$('#detailTitle').textContent=member.title||'はじまりのうにメン';showProfile(member,!!ownUid());return true}
function ownUid(){try{return getAuth(getApps()[0]).currentUser?.uid||''}catch{return ''}}
function openOwnPass(){const m=localMember();if(!m){$('#openPassButton')?.click();return}const uid=ownUid();if(uid){window.dispatchEvent(new CustomEvent('unica:open-member-pass',{detail:{uid}}));setTimeout(openPassShell,0)}else{fillOwn(m);openPassShell()}}
function titleValues(){const m=localMember()||{};const current=$('#detailTitle')?.textContent?.trim()||m.title||'はじまりのうにメン';const arr=[current];['titles','earnedTitles','titleHistory','badges'].forEach(k=>{const v=m[k];if(Array.isArray(v))v.forEach(x=>arr.push(typeof x==='string'?x:(x?.name||x?.title||'')))});return [...new Set(arr.filter(Boolean))]}
function openTitles(){const list=$('#passportTitlesList');const modal=$('#passportTitlesModal');const current=$('#detailTitle')?.textContent?.trim();const rows=titleValues();if(!list||!modal)return;list.innerHTML=rows.length?rows.map((t,i)=>`<div class="passport-title-item"><span>${i===0?'🏷️':'✨'}</span><div><strong>${String(t).replace(/[<>&]/g,'')}</strong><small>${t===current?'現在設定中':'獲得済み'}</small></div>${t===current?'<em>使用中</em>':''}</div>`).join(''):'<div class="passport-title-empty">獲得した称号はまだありません。</div>';if(modal.parentElement!==document.body)document.body.appendChild(modal);setOpen(modal,true);document.body.classList.add('passport-modal-open','passport-titles-open','modal-open')}

// Remove legacy rows that may be injected after page load.
function cleanLegacyRows(){['detailFavoriteSongs','detailCheerCount','detailSupportLevel','detailBirthdayWishCount'].forEach(id=>$('#'+id)?.closest('div')?.remove())}
cleanLegacyRows();

// Capture phase prevents older handlers from opening the legacy presentation.
document.addEventListener('click',e=>{
 const edit=e.target.closest('#detailOpenSettings');if(edit){e.preventDefault();e.stopImmediatePropagation();openEditor();return}
 const close=e.target.closest('[data-close-passport]');if(close){e.preventDefault();e.stopImmediatePropagation();closePass();return}
 const closeT=e.target.closest('[data-close-passport-titles]');if(closeT){e.preventDefault();e.stopImmediatePropagation();closeTitles();return}
 if(e.target.closest('#openPassportTitles')){e.preventDefault();openTitles();return}
 const own=e.target.closest('#statusOpenPass,#openPassButton,[data-world-nav="pass"]');if(own){e.preventDefault();e.stopImmediatePropagation();openOwnPass();return}
},true);

document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if($('#passportTitlesModal')?.classList.contains('is-open'))closeTitles();else if($('#passportModal')?.classList.contains('is-open'))closePass()});
window.addEventListener('unica:open-member-pass',()=>setTimeout(()=>{cleanLegacyRows();openPassShell()},10));

let passProfile=null,passOwn=false,passRevision=0,selectedIcon='',saving=false;
const editor=$('#passProfileEditor');
function resetEditor(){if(editor)editor.hidden=true;$('#passEditMessage').textContent='';}
function loading(){passRevision++;passProfile=null;passOwn=false;resetEditor();$('#detailOpenSettings').hidden=true;$('#detailPunyukaName').textContent='読み込み中…';$('#detailPunyukaImage').replaceChildren();}
function showProfile(profile,own){passRevision++;passProfile=profile;passOwn=own;resetEditor();$('#detailOpenSettings').hidden=!own;const journey=window.UNICA_BLOOM_BADGE?.journeyFor?.(profile);const id=journey?.equippedId||profile.punyakoJourney?.equippedId;const choice=window.UNICA_SCENT16?.getAvatarChoices?.().find(f=>f.id===id);const canonical=choice?.name||window.UNICA_SCENT16?.typeById?.(id)?.name||journey?.equippedName||profile.punyakoJourney?.equippedName;$('#detailPunyukaName').textContent=canonical||'まだぷにゅかはいません';$('#detailPunyukaImage').textContent=canonical?'アイコンに設定中':'';if(own){$('#detailName').textContent=profile.name||'うにメン';$('#detailPrefecture').textContent=profile.prefecture||'—';$('#detailBirthday').textContent=profile.birthMonth&&profile.birthDay?`${profile.birthMonth}月${profile.birthDay}日`:'—';$('#detailAvatar').innerHTML=window.UNICA_BLOOM_BADGE?.html?.(profile,'normal')||'';}}
window.UNICA_PASS_CARD={loading,showProfile};
function options(select,max,unit){select.replaceChildren(new Option('未設定','0'));for(let n=1;n<=max;n++)select.add(new Option(n+unit,String(n)));}
function updateDays(value){const month=Number($('#passEditMonth').value);options($('#passEditDay'),month?new Date(2000,month,0).getDate():31,'日');$('#passEditDay').value=String(value||0);if(!$('#passEditDay').value)$('#passEditDay').value='0';}
function openEditor(){if(!passOwn||!passProfile||saving)return;$('#passEditName').value=passProfile.name||'';$('#passEditPrefecture').replaceChildren(...[...$('#memberPrefecture').options].map(o=>o.cloneNode(true)));$('#passEditPrefecture').value=passProfile.prefecture||'';options($('#passEditMonth'),12,'月');$('#passEditMonth').value=String(passProfile.birthMonth||0);updateDays(passProfile.birthDay);selectedIcon=passProfile.punyakoJourney?.equippedId||'';const container=$('#passEditIcons');container.replaceChildren();const choices=window.UNICA_SCENT16?.getAvatarChoices?.()||[];for(const f of choices){const b=document.createElement('button');b.type='button';b.className='pass-icon-choice';b.setAttribute('aria-pressed',String(f.id===selectedIcon));const img=document.createElement('img');img.src=f.image;img.alt='';const label=document.createElement('span');label.textContent=f.name;b.append(img,label);b.addEventListener('click',()=>{selectedIcon=f.id;for(const c of container.children)c.setAttribute('aria-pressed',String(c===b));});container.append(b);}if(!choices.length)container.textContent='ぷにゅか診断でアイコンを獲得できます。';$('#passEditMessage').textContent='';editor.hidden=false;$('#passEditName').focus();}
$('#passEditMonth').addEventListener('change',()=>{const d=Number($('#passEditDay').value);updateDays(Number($('#passEditMonth').value)?d:0);});
$('#passEditCancel').addEventListener('click',resetEditor);
editor.addEventListener('submit',async e=>{e.preventDefault();if(!passOwn||saving)return;const revision=passRevision;const owner=ownUid();saving=true;for(const el of editor.elements)el.disabled=true;$('#passEditMessage').textContent='保存中…';try{const p=await window.UNICA_FIREBASE.updateMemberProfile({name:$('#passEditName').value,prefecture:$('#passEditPrefecture').value,birthMonth:$('#passEditMonth').value,birthDay:$('#passEditDay').value,iconId:selectedIcon});if(!p)throw Error('ログインを確認して、もう一度開いてください。');if(revision===passRevision&&owner===ownUid())showProfile(p,true);}catch(err){if(revision===passRevision)$('#passEditMessage').textContent=err?.code==='permission-denied'?'保存できませんでした。しばらくしてからお試しください。':(err.message||'保存できませんでした。');}finally{saving=false;for(const el of editor.elements)el.disabled=false;}});
window.addEventListener('unica:punyako-avatar-updated',()=>{if(passOwn&&editor.hidden&&!saving){const m=localMember();if(m)showProfile(m,true);}});
