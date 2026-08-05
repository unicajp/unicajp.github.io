(() => {
  'use strict';

  /*
   * Scroll-only repair.
   * This file deliberately does not access #intro, #introTrigger, openSite,
   * or any opening-door event, animation, class, or timing.
   */
  const body = document.body;

  const selectors = {
    memberGate: '#memberGate.is-open',
    settings: '#memberSettings.is-open',
    guest: '#guestLockModal.is-open',
    support: '#communityModal.is-open',
    anyWorldModal: '.world-modal.is-open'
  };

  function isOpen(selector) {
    return Boolean(document.querySelector(selector));
  }

  function syncScrollLocks() {
    const memberLocked = isOpen(selectors.memberGate) || isOpen(selectors.settings) ||
      isOpen('#passportModal.is-open') || isOpen('#notificationModal.is-open');
    const guestLocked = isOpen(selectors.guest);
    const supportLocked = isOpen(selectors.support);
    const modalLocked = isOpen(selectors.anyWorldModal);

    body.classList.toggle('member-gate-open', memberLocked);
    body.classList.toggle('guest-lock-open', guestLocked);
    body.classList.toggle('support-modal-open', supportLocked);
    body.classList.toggle('modal-open', modalLocked);

    /* Remove only stale inline locks left by a previously closed panel. */
    if (!memberLocked && !guestLocked && !supportLocked && !modalLocked) {
      if (body.style.overflow === 'hidden') body.style.removeProperty('overflow');
      if (body.style.touchAction === 'none') body.style.removeProperty('touch-action');
      if (document.documentElement.style.overflow === 'hidden') {
        document.documentElement.style.removeProperty('overflow');
      }
    }
  }

  function prepareScrollablePanels() {
    document.querySelectorAll(
      '.world-modal-panel,.member-register,.member-settings-panel,.guest-lock-panel,' +
      '.support-panel,.notification-panel,.passport-detail-panel,' +
      '.prefecture-directory-panel,.prefecture-members-panel'
    ).forEach((panel) => {
      panel.setAttribute('data-scroll-ready', 'true');
    });
  }

  prepareScrollablePanels();
  syncScrollLocks();

  const observer = new MutationObserver(() => {
    prepareScrollablePanels();
    syncScrollLocks();
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'aria-hidden']
  });

  document.addEventListener('click', () => window.setTimeout(syncScrollLocks, 0), true);
  document.addEventListener('touchend', () => window.setTimeout(syncScrollLocks, 0), { passive: true, capture: true });
  window.addEventListener('pageshow', syncScrollLocks);
  window.addEventListener('resize', prepareScrollablePanels, { passive: true });
})();
