/* Phase13.5.1 — stable shared navigation.
   No MutationObserver, no :scope selector, no swipe handling.
   Existing feature close handlers remain the source of truth. */
(() => {
  'use strict';

  const CLOSE_SELECTOR = [
    '[data-close-settings]', '[data-close-world-modal]', '[data-close-scent16]',
    '[data-close-community]', '[data-close-passport]', '[data-close-passport-titles]',
    '[data-close-prefecture-directory]', '[data-close-prefecture-members]',
    '[data-close-guest-lock]', '[data-close-birthday-calendar]',
    '[data-close-birthday-experience]', '[data-close-birthday-comment]',
    '[data-close-birthday-album]', '[data-close-birthday-history]',
    '[data-close-admin]', '[data-close-admin-members]', '[data-close-milk-match]',
    '[data-close-milk-lyrics]', '#closeMilkReleaseCelebration'
  ].join(',');

  function isActualButton(element) {
    return element instanceof HTMLButtonElement &&
      !element.classList.contains('world-modal-backdrop') &&
      !String(element.className || '').includes('backdrop');
  }

  function normalizeCloseButtons(root = document) {
    try {
      root.querySelectorAll(CLOSE_SELECTOR).forEach((button) => {
        if (!isActualButton(button)) return;
        button.classList.add('uw-common-back');
        button.textContent = '← 戻る';
        button.setAttribute('aria-label', '前の画面に戻る');
        button.setAttribute('title', '戻る');
      });
    } catch (error) {
      console.warn('[UNICA navigation] close-button setup skipped:', error);
    }
  }

  function init() {
    normalizeCloseButtons(document);

    // Feature screens that render later may opt in by dispatching this event.
    window.addEventListener('unica:navigation-refresh', () => {
      normalizeCloseButtons(document);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
