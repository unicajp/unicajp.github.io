(() => {
  'use strict';
  const MEMBER_KEY = 'unicaWorldMemberV4';
  const LEGACY_KEY = 'unicaWorldMemberV3';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const modal = $('#guestLockModal');

  const readMember = () => {
    try { return JSON.parse(localStorage.getItem(MEMBER_KEY) || localStorage.getItem(LEGACY_KEY) || 'null'); }
    catch (_) { return null; }
  };
  const isMember = () => Boolean(readMember());

  const gatedSelectors = [
    '#heroCheerButton', '#statusOpenPass', '#openPassButton', '#openMemberSettings', '#passAvatar',
    '#openDailyMessage', '[data-world-nav="community"]', '#notificationButton', '#songLikeButton',
    '#submitCommunityComment', '#drawFortune', '#openTree', '#communityHomeLatest', '#supportCommentFloatLayer',
    '#birthdayBanner', '#openPrefectureDirectory', '#prefectureHomeCard', '[data-member-only]'
  ];

  function openLock() {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('guest-lock-open');
    setTimeout(() => $('#guestLockRegister')?.focus(), 120);
  }
  function closeLock() {
    modal?.classList.remove('is-open');
    modal?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('guest-lock-open');
  }
  function openRegistration() {
    closeLock();
    window.__unicaGuestBypass = true;
    const trigger = $('#openPassButton') || $('#statusOpenPass');
    trigger?.click();
    setTimeout(() => { window.__unicaGuestBypass = false; }, 0);
  }

  function applyAccessState() {
    const guest = !isMember();
    document.body.classList.toggle('is-guest', guest);
    document.body.classList.toggle('is-unica-member', !guest);
    ['#communityHomeCard','#dailyMessageCard'].forEach(sel => $(sel)?.classList.toggle('member-only-surface', guest));
    if (guest) {
      const name = $('#statusName'); if (name && !name.textContent.trim()) name.textContent = '未登録';
      $('#heroCheerButton')?.setAttribute('aria-label','うにメン登録後にエールを送れます');
      $('#openDailyMessage')?.setAttribute('aria-label','うにメン登録後に今日のうに占いを利用できます');
    } else {
      $('#heroCheerButton')?.setAttribute('aria-label','うにかへエールを送る');
      $('#openDailyMessage')?.setAttribute('aria-label','今日のうに占いを開く');
      closeLock();
    }
  }

  document.addEventListener('click', (event) => {
    if (window.__unicaGuestBypass || isMember()) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const gated = gatedSelectors.some(sel => target.closest(sel));
    if (!gated) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openLock();
  }, true);

  $$('[data-close-guest-lock]').forEach(el => el.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeLock();
  }));
  // Capture phase fallback: always allow the close button/backdrop to close the modal
  // before the guest access interceptor evaluates the same click.
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-close-guest-lock]') : null;
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    closeLock();
  }, true);
  $('#guestLockRegister')?.addEventListener('click', openRegistration);
  modal?.addEventListener('keydown', e => { if (e.key === 'Escape') closeLock(); });

  ['#registerConfirm','#enterWorld','#withdrawalConfirm'].forEach(sel => {
    $(sel)?.addEventListener('click', () => setTimeout(applyAccessState, 80));
  });
  window.addEventListener('storage', applyAccessState);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) applyAccessState(); });

  applyAccessState();
  setTimeout(applyAccessState, 2600);
})();
