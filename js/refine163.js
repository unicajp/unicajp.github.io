(()=>{'use strict';
const $=s=>document.querySelector(s);
// Move the existing profile content, keeping IDs, listeners and original forms.
for(const [id,label]of [['unico','プロフィール・動画・SNSを見る'],['unika','うにかについて、もう少し']]){
 const section=document.getElementById(id),hero=section?.querySelector(':scope>.profile-hero');if(!section||!hero||section.querySelector('.profile163-details'))continue;
 const details=document.createElement('details');details.className='profile163-details';details.id=`profile163-${id}`;const summary=document.createElement('summary');summary.textContent=label;details.append(summary);
 for(const node of [...section.children])if(node!==hero)details.append(node);
 section.append(details);
}
function openProfile(id){const details=document.getElementById(`profile163-${id}`);if(details)details.open=true;}
document.addEventListener('click',event=>{const nav=event.target.closest('[data-app-route="unico"]');if(nav){openProfile('unico');return;}const link=event.target.closest('a[href="#unico"],a[href="#unika"]');if(link)openProfile(link.getAttribute('href').slice(1));},true);
window.addEventListener('hashchange',()=>{if(location.hash==='#unico'||location.hash==='#unika')openProfile(location.hash.slice(1));});if(location.hash==='#unico'||location.hash==='#unika')openProfile(location.hash.slice(1));
const rooms={music:['音楽を楽しむ','曲を聴く・Studioで歌って投稿'],play:['ぷにゅかと遊ぶ','診断で自分を知る・みんなでミッション'],read:['うにこの言葉','インタビューを読む・質問を送る'],people:['うにメンとつながる','応援を書く・仲間を見つける']};
function labelRooms(){let ready=0;for(const [key,[title,copy]]of Object.entries(rooms)){const root=document.getElementById(`world159-${key}`);if(!root)continue;ready++;if(root.dataset.refined163)continue;root.dataset.refined163='1';const h=root.querySelector('.w159-heading h2'),p=root.querySelector('.w159-heading p');if(h)h.textContent=title;if(p)p.textContent=copy;}return ready===4;}
if(!labelRooms()){const observer=new MutationObserver(()=>{if(labelRooms())observer.disconnect();});observer.observe($('#worldHome')||document.body,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),15000);}
// Make the repeated lower music label the heading for its preview video.
const music=$('#music .eyebrow');if(music)music.textContent='OFFICIAL PREVIEW';
const volume=$('#volume');if(volume&&!volume.getAttribute('aria-label'))volume.setAttribute('aria-label','BGMの音量');
const track=$('#trackSelect');if(track&&!track.getAttribute('aria-label'))track.setAttribute('aria-label','BGMを選ぶ');
// A read marker remains visible when the reading room is filtered out.
const nav=$('#world159Nav [data-world159="read"]');function unread(){const button=$('#world159Nav [data-world159="read"]'),badge=$('#home86InterviewNew');if(!button||!badge)return;button.classList.toggle('u163-has-new',!badge.hidden);button.setAttribute('aria-label',badge.hidden?'読む':'読む・未読のインタビューがあります');}
unread();const readBadge=$('#home86InterviewNew');if(readBadge)new MutationObserver(unread).observe(readBadge,{attributes:true,attributeFilter:['hidden']});
if(!nav){const target=$('#worldHome');if(target){const o=new MutationObserver(()=>{if($('#world159Nav')){unread();o.disconnect();const b=$('#home86InterviewNew');if(b)new MutationObserver(unread).observe(b,{attributes:true,attributeFilter:['hidden']});}});o.observe(target,{childList:true,subtree:true});setTimeout(()=>o.disconnect(),15000);}}
})();
