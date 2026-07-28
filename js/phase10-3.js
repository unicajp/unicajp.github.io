(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function installFortuneSparkles() {
    const layer = $('#dailyFortuneSparkles');
    const button = $('#openDailyMessage');
    if (!layer || !button) return;
    button.addEventListener('click', () => {
      layer.innerHTML = '';
      for (let i = 0; i < 18; i += 1) {
        const sparkle = document.createElement('span');
        sparkle.textContent = i % 3 === 0 ? '✦' : '✧';
        sparkle.style.setProperty('--x', `${8 + Math.random() * 84}%`);
        sparkle.style.setProperty('--y', `${8 + Math.random() * 76}%`);
        sparkle.style.setProperty('--delay', `${Math.random() * 0.28}s`);
        sparkle.style.setProperty('--scale', `${0.65 + Math.random() * 0.8}`);
        layer.appendChild(sparkle);
      }
      layer.classList.remove('is-active');
      void layer.offsetWidth;
      layer.classList.add('is-active');
      window.setTimeout(() => layer.classList.remove('is-active'), 1300);
    });
  }

  function reinforceCommentScroll() {
    const modal = $('#communityModal');
    const panel = modal?.querySelector('.support-panel');
    const list = $('#communityList');
    if (!modal || !panel || !list) return;
    panel.classList.add('support-panel-scroll-fixed');
    list.classList.add('support-feed-scroll-fixed');
    list.setAttribute('tabindex', '0');
    list.setAttribute('aria-label', '応援コメント一覧。上下にスクロールできます。');

    // Prevent the page behind the modal from moving on touch devices.
    const lock = () => document.body.classList.add('support-modal-open');
    const unlock = () => document.body.classList.remove('support-modal-open');
    new MutationObserver(() => modal.classList.contains('is-open') ? lock() : unlock())
      .observe(modal, { attributes: true, attributeFilter: ['class'] });
    $$('[data-close-community]', modal).forEach((el) => el.addEventListener('click', unlock));
  }

  function makeFloatingCommentsInteractive() {
    const layer = $('#supportCommentFloatLayer');
    if (!layer) return;
    layer.setAttribute('aria-label', '最新の応援コメント');
    layer.addEventListener('click', (event) => {
      const floating = event.target.closest('.support-floating-comment');
      if (!floating) return;
      const communityButton = $('[data-world-nav="community"]');
      communityButton?.click();
    });
  }

  function observeFirebaseComments() {
    const list = $('#communityList');
    const layer = $('#supportCommentFloatLayer');
    if (!list || !layer) return;
    let timer = 0;
    let index = 0;

    const show = () => {
      const cards = $$('.support-comment-card', list);
      if (!cards.length) return;
      const card = cards[index % cards.length];
      index += 1;
      const name = $('.member-name-text, header strong', card)?.textContent?.replace('（あなた）', '')?.trim() || 'うにメン';
      const avatar = $('.community-post-avatar', card)?.textContent?.trim() || '🌸';
      const text = $('p', card)?.textContent?.trim() || '';
      if (!text) return;
      const floating = document.createElement('button');
      floating.type = 'button';
      floating.className = 'support-floating-comment support-floating-comment-button';
      floating.innerHTML = `<span>${avatar}</span><div><p></p><small></small></div>`;
      $('p', floating).textContent = text;
      $('small', floating).textContent = `${name}さんからの応援`;
      layer.replaceChildren(floating);
    };

    const restart = () => {
      window.clearInterval(timer);
      show();
      timer = window.setInterval(show, 6800);
    };
    new MutationObserver(restart).observe(list, { childList: true });
    restart();
  }

  function ensureCheerFeedback() {
    const button = $('#heroCheerButton');
    if (!button) return;
    button.addEventListener('click', () => {
      window.setTimeout(() => {
        if (button.classList.contains('is-done')) button.title = '今日のエール完了！';
      }, 0);
    });
  }

  function init() {
    installFortuneSparkles();
    reinforceCommentScroll();
    makeFloatingCommentsInteractive();
    observeFirebaseComments();
    ensureCheerFeedback();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
