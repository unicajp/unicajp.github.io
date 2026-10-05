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

  /* Phase10.16: scroll the whole comment panel, rather than trapping the feed
     inside a second small scrolling area. This fixes Android pages that stop
     before the comment cards. The opening door is intentionally untouched. */
  function reinforceCommentScroll() {
    const modal = $('#communityModal');
    const panel = modal?.querySelector('.support-panel');
    const list = $('#communityList');
    if (!modal || !panel || !list) return;

    panel.classList.remove('support-panel-scroll-fixed');
    list.classList.remove('support-feed-scroll-fixed');
    panel.classList.add('support-panel-whole-scroll');
    list.classList.add('support-feed-natural-flow');
    panel.setAttribute('tabindex', '0');
    panel.setAttribute('aria-label', '応援コメント画面。上下にスクロールできます。');

    const lock = () => document.body.classList.add('support-modal-open');
    const unlock = () => document.body.classList.remove('support-modal-open');
    new MutationObserver(() => {
      if (modal.classList.contains('is-open')) {
        lock();
        window.setTimeout(() => { panel.scrollTop = 0; }, 0);
      } else {
        unlock();
      }
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    $$('[data-close-community]', modal).forEach((el) => el.addEventListener('click', unlock));
  }

  function toast(text) {
    const el = $('#miniToast');
    if (!el) return;
    el.textContent = text;
    el.classList.add('is-show');
    window.setTimeout(() => el.classList.remove('is-show'), 1900);
  }

  function commentCards() {
    return $$('.support-comment-card', $('#communityList') || document);
  }

  function dataFromCard(card) {
    if (!card) return null;
    return {
      id: card.dataset.postId || '',
      name: $('.member-name-text, header strong', card)?.textContent?.replace('（あなた）', '')?.trim() || 'うにメン',
      profile: {},
      text: $('p', card)?.textContent?.trim() || '',
    };
  }

  function observeFirebaseComments() {
    const list = $('#communityList');
    const layer = $('#supportCommentFloatLayer');
    if (!list || !layer) return;

    const dateLabel = (row) => {
      if (row.date) return `${row.date.replaceAll('-', '/')} ${row.time || ''}`.trim();
      if (row.createdAt) return new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date(row.createdAt * 1000));
      return '日時不明';
    };
    const timestamp = (row) => Number(row.createdAt || 0) ||
      (Date.parse(`${row.date || ''}T${row.time || '00:00'}:00+09:00`) / 1000 || 0);
    let signature = '';
    const render = () => {
      const source = Array.isArray(window.UNICA_TOP_SUPPORT_LATEST)
        ? window.UNICA_TOP_SUPPORT_LATEST : commentCards().map(dataFromCard).filter(Boolean);
      const rows = [...source].filter(row => row.text).sort((a, b) => timestamp(b) - timestamp(a));
      const nextSignature = JSON.stringify(rows.map(row => [row.id, row.text, row.name, dateLabel(row), row.profile]));
      if (signature === nextSignature) return;
      signature = nextSignature;
      const scrollTop = layer.scrollTop;
      const fragment = document.createDocumentFragment();
      rows.forEach(data => {
        const card = document.createElement('article');
        card.className = 'home-comment-row';
        card.dataset.postId = data.id || '';
        card.innerHTML = '<span class="home-comment-avatar"></span><div class="home-comment-copy"><header><strong></strong><time></time></header><p></p></div>';
        $('.home-comment-avatar', card).innerHTML = window.UNICA_BLOOM_BADGE?.html?.(data.profile || {}, 'tiny') || '';
        $('strong', card).textContent = data.name || 'うにメン';
        $('time', card).textContent = dateLabel(data);
        if (timestamp(data)) $('time', card).dateTime = new Date(timestamp(data) * 1000).toISOString();
        $('p', card).textContent = data.text;
        fragment.appendChild(card);
      });
      if (!rows.length) {
        const empty = document.createElement('p');
        empty.className = 'home-comment-empty';
        empty.textContent = 'まだコメントはありません。最初の応援を届けよう。';
        fragment.appendChild(empty);
      }
      layer.replaceChildren(fragment);
      layer.scrollTop = scrollTop;
    };
    new MutationObserver(render).observe(list, { childList: true, subtree: true });
    layer.setAttribute('tabindex', '0');
    layer.setAttribute('role', 'region');
    layer.setAttribute('aria-label', 'みんなの応援コメント。新着順。上下にスクロールできます。');
    render();
  }

  function ensureCheerFeedback() {
    const button = $('#heroCheerButton');
    if (!button) return;
    button.addEventListener('click', () => {
      window.setTimeout(() => {
        if (button.classList.contains('is-done')) button.title = '本日の送信完了！';
      }, 0);
    });
  }

  function init() {
    installFortuneSparkles();
    reinforceCommentScroll();
    observeFirebaseComments();
    ensureCheerFeedback();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
