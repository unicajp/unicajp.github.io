(() => {
  'use strict';

  const body = document.body;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const isVisibleOpen = (selector) => $$(selector).some((el) => {
    if (!el.classList.contains('is-open')) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });

  function syncScrollLocks() {
    const intro = $('#intro');
    const introFinished = !intro || intro.classList.contains('is-hidden') || body.classList.contains('opened');
    if (introFinished) body.classList.add('opened');

    const supportOpen = Boolean($('#communityModal.is-open'));
    const guestOpen = Boolean($('#guestLockModal.is-open'));
    const memberGateOpen = isVisibleOpen('.member-gate');
    const settingsOpen = isVisibleOpen('.member-settings');
    const generalModalOpen = $$('.world-modal.is-open').some((modal) => modal.id !== 'communityModal');

    body.classList.toggle('support-modal-open', supportOpen);
    body.classList.toggle('guest-lock-open', guestOpen);
    body.classList.toggle('member-gate-open', memberGateOpen || settingsOpen);
    body.classList.toggle('modal-open', generalModalOpen);

    if (!supportOpen && !guestOpen && !memberGateOpen && !settingsOpen && !generalModalOpen) {
      body.style.removeProperty('overflow');
      body.style.removeProperty('position');
      body.style.removeProperty('top');
      body.style.removeProperty('width');
      body.style.removeProperty('touch-action');
      document.documentElement.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('touch-action');
    }
  }

  function makeScrollable(el) {
    if (!el) return;
    el.style.webkitOverflowScrolling = 'touch';
    el.style.touchAction = 'pan-y';
    el.addEventListener('touchmove', (event) => {
      event.stopPropagation();
    }, { passive: true });
  }

  function init() {
    [
      ...$$('.world-modal-panel'),
      ...$$('.member-register'),
      ...$$('.member-settings-panel'),
      ...$$('.guest-lock-panel'),
      ...$$('.prefecture-directory-panel'),
      ...$$('.prefecture-members-panel'),
      $('#communityList')
    ].forEach(makeScrollable);

    const observer = new MutationObserver(syncScrollLocks);
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-hidden']
    });

    document.addEventListener('click', () => window.setTimeout(syncScrollLocks, 0), true);
    window.addEventListener('pageshow', syncScrollLocks);
    window.addEventListener('resize', syncScrollLocks);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) syncScrollLocks();
    });

    syncScrollLocks();
    window.setTimeout(syncScrollLocks, 300);
    window.setTimeout(syncScrollLocks, 2500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
