(()=>{
  'use strict';
  const intro = document.getElementById('intro');
  const trigger = document.getElementById('introTrigger');
  if(!intro || !trigger) return;

  let scheduled = false;
  trigger.addEventListener('click', () => {
    if(scheduled) return;
    scheduled = true;

    // Let the open-door artwork be visible long enough to register,
    // but do not leave the whole entrance in the old slow-motion state.
    window.setTimeout(() => {
      document.body.classList.add('site-entered');
    }, 1250);

    window.setTimeout(() => {
      intro.classList.add('is-hidden');
    }, 1580);
  }, {passive:true});
})();