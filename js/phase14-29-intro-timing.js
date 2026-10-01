(()=>{
  'use strict';
  const intro = document.getElementById('intro');
  const trigger = document.getElementById('introTrigger');
  if(!intro || !trigger) return;

  let scheduled = false;
  trigger.addEventListener('click', () => {
    if(scheduled) return;
    scheduled = true;

    // Show the opened door clearly first.
    window.setTimeout(() => {
      intro.classList.add('door-soft-fade');
    }, 980);

    // Then leave only the surrounding glow feeling before entering the site.
    window.setTimeout(() => {
      document.body.classList.add('site-entered');
    }, 1320);

    window.setTimeout(() => {
      intro.classList.add('is-hidden');
    }, 1620);
  }, {passive:true});
})();