(() => {
  'use strict';
  function initHeaderIcons(){
    try{
      ['detailPostCount','detailReactionCount'].forEach(id=>{
        const el=document.getElementById(id);
        const row=el?.closest('div');
        if(row) row.hidden=true;
      });
    }catch(error){ console.warn('[Phase13.5.4] header init skipped', error); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initHeaderIcons,{once:true});
  else initHeaderIcons();
})();
