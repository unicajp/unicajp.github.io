/* Phase13.5 — shared modal navigation. Existing close handlers remain the source of truth. */
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

  const PANEL_SELECTOR = [
    '.member-settings-panel','.world-modal-panel','.scent16-panel','.guest-lock-panel',
    '.birthday-experience-panel','.admin-panel','.milk-release-celebration-panel',
    '.milk-match-panel','.milk-lyrics-panel'
  ].join(',');

  function nearestClose(panel) {
    const container = panel.closest('[aria-hidden]') || panel.parentElement;
    if (!container) return null;
    return container.querySelector(CLOSE_SELECTOR);
  }

  function normalizeCloseButtons() {
    document.querySelectorAll(CLOSE_SELECTOR).forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return;
      // Backdrops also carry data-close attributes; only convert real buttons.
      if (button.classList.contains('world-modal-backdrop') || button.className.includes('backdrop')) return;
      button.classList.add('uw-common-back');
      button.textContent = '← 戻る';
      button.setAttribute('aria-label', '前の画面に戻る');
      button.setAttribute('title', '戻る');
    });
  }

  function addHandles() {
    document.querySelectorAll(PANEL_SELECTOR).forEach((panel) => {
      if (panel.querySelector(':scope > .uw-sheet-handle')) return;
      const handle = document.createElement('span');
      handle.className = 'uw-sheet-handle';
      handle.setAttribute('aria-hidden', 'true');
      panel.prepend(handle);
    });
  }

  function closePanel(panel) {
    const close = nearestClose(panel);
    if (!close) return;
    panel.classList.add('uw-sheet-closing');
    window.setTimeout(() => {
      panel.classList.remove('uw-sheet-closing');
      close.click();
    }, 150);
  }

  function enableSwipe(panel) {
    if (panel.dataset.uwSwipeReady === '1') return;
    panel.dataset.uwSwipeReady = '1';
    let startX = 0;
    let startY = 0;
    let lastY = 0;
    let active = false;

    panel.addEventListener('touchstart', (event) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      const rect = panel.getBoundingClientRect();
      const nearTop = touch.clientY - rect.top <= 82;
      const atScrollTop = panel.scrollTop <= 1;
      if (!nearTop && !atScrollTop) return;
      startX = touch.clientX;
      startY = touch.clientY;
      lastY = startY;
      active = true;
    }, {passive:true});

    panel.addEventListener('touchmove', (event) => {
      if (!active || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dx = touch.clientX - startX;
      const dy = Math.max(0, touch.clientY - startY);
      if (Math.abs(dx) > dy || dy < 6) return;
      lastY = touch.clientY;
      panel.classList.add('uw-sheet-dragging');
      panel.style.transform = `translateY(${Math.min(dy, 140)}px)`;
    }, {passive:true});

    panel.addEventListener('touchend', () => {
      if (!active) return;
      const distance = lastY - startY;
      active = false;
      panel.classList.remove('uw-sheet-dragging');
      panel.style.transform = '';
      if (distance >= 82) closePanel(panel);
    }, {passive:true});

    panel.addEventListener('touchcancel', () => {
      active = false;
      panel.classList.remove('uw-sheet-dragging');
      panel.style.transform = '';
    }, {passive:true});
  }

  function init() {
    normalizeCloseButtons();
    addHandles();
    document.querySelectorAll(PANEL_SELECTOR).forEach(enableSwipe);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();

  // Some feature panels are rendered later. Keep normalization lightweight and idempotent.
  const observer = new MutationObserver(() => init());
  observer.observe(document.documentElement, {childList:true, subtree:true});
})();
