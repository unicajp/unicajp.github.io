(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  let lastFocus = null;
  let closing = false;

  const modalSelector = [
    '.milk-match-modal','.milk-lyrics-modal','.scent16-modal',
    '.birthday-experience-modal','.birthday-calendar-modal','.birthday-comment-modal',
    '.birthday-album-modal','.birthday-history-modal','.passport-detail-modal'
  ].join(',');

  function isOpen(el) {
    return !!el && (el.classList.contains('is-open') || el.getAttribute('aria-hidden') === 'false');
  }

  function openModals() { return $$(modalSelector).filter(isOpen); }

  function syncViewport() {
    document.documentElement.style.setProperty('--app-vh', `${window.innerHeight * 0.01}px`);
  }

  function syncModalState() {
    const opened = openModals();
    document.body.classList.toggle('phase1244-modal-open', opened.length > 0);
    if (!opened.length && lastFocus && document.contains(lastFocus)) {
      try { lastFocus.focus({ preventScroll: true }); } catch (_) {}
      lastFocus = null;
    }
  }

  function closeTopModal() {
    if (closing) return;
    const top = openModals().at(-1);
    if (!top) return;
    const close = top.querySelector('[data-close-milk-match],[data-close-milk-lyrics],[data-close-scent16],[data-close-birthday],[data-close-birthday-calendar],[data-close-birthday-comment],[data-close-birthday-album],[data-close-birthday-history],[data-close-passport],.modal-close,.close-button,[aria-label="閉じる"]');
    if (!close) return;
    closing = true;
    close.click();
    setTimeout(() => { closing = false; syncModalState(); }, 180);
  }

  function trapFocus(event) {
    if (event.key !== 'Tab') return;
    const top = openModals().at(-1);
    if (!top) return;
    const focusable = $$('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])', top)
      .filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function installLazyImages() {
    $$('img').forEach((img, i) => {
      if (!img.hasAttribute('decoding')) img.decoding = 'async';
      if (i > 1 && !img.hasAttribute('loading')) img.loading = 'lazy';
    });
  }

  function installNetworkNotice() {
    const notice = document.createElement('div');
    notice.className = 'phase1244-offline';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    document.body.appendChild(notice);
    let timer = 0;
    const show = online => {
      clearTimeout(timer);
      notice.textContent = online ? '通信が回復しました' : 'オフラインです。保存やランキング更新は通信復帰後にお試しください。';
      notice.classList.toggle('is-online', online);
      notice.classList.add('is-visible');
      if (online) timer = setTimeout(() => notice.classList.remove('is-visible'), 2400);
    };
    window.addEventListener('offline', () => show(false));
    window.addEventListener('online', () => show(true));
    if (!navigator.onLine) show(false);
  }

  function markFeatureOpeners() {
    ['openMilkMatch','openScent16','openBirthdayCalendar','statusOpenPass','openPrefectureDirectory','openMilkLyrics'].forEach(id => {
      const el = document.getElementById(id);
      el?.addEventListener('click', () => { lastFocus = el; }, true);
    });
  }

  function observeModals() {
    const nodes = $$(modalSelector);
    const observer = new MutationObserver(syncModalState);
    nodes.forEach(node => observer.observe(node, { attributes: true, attributeFilter: ['class','aria-hidden'] }));
    syncModalState();
  }

  function init() {
    syncViewport();
    window.addEventListener('resize', syncViewport, { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(syncViewport, 120), { passive: true });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeTopModal();
      trapFocus(event);
    });
    installLazyImages();
    installNetworkNotice();
    markFeatureOpeners();
    observeModals();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
