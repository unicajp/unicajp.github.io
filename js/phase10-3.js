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
    const likeButton = $('[data-like-remote], [data-like-post]', card);
    return {
      id: card.dataset.postId || likeButton?.dataset.likeRemote || likeButton?.dataset.likePost || '',
      name: $('.member-name-text, header strong', card)?.textContent?.replace('（あなた）', '')?.trim() || 'うにメン',
      profile: {},
      text: $('p', card)?.textContent?.trim() || '',
      count: Number(likeButton?.querySelector('b')?.textContent || 0),
      liked: Boolean(likeButton?.classList.contains('is-liked')),
      likeButton
    };
  }

  function makeFloatingCommentsInteractive() {
    const layer = $('#supportCommentFloatLayer');
    if (!layer) return;
    
    layer.addEventListener('click', async (event) => {
      const likeControl = event.target.closest('.home-comment-like');
      if (!likeControl || event.target.closest('.support-float-next')) return;
      const floating = event.target.closest('.home-comment-row');
      if (!floating || floating.dataset.busy === 'true') return;
      event.preventDefault();
      event.stopPropagation();

      /* トップでは誤操作防止のため、いいね済みコメントの解除は行わない。 */
      if (floating.classList.contains('is-liked')) {
        floating.classList.add('is-tapped');
        window.setTimeout(() => floating.classList.remove('is-tapped'), 430);
        toast('いいね済みです。解除は応援コメント画面からできます。');
        return;
      }

      const postId = floating.dataset.postId;
      if (!postId) return;
      floating.dataset.busy = 'true';
      floating.classList.add('is-tapped');
      const toggle = window.UNICA_TOGGLE_COMMENT_LIKE;
      let result = null;
      if (typeof toggle === 'function') result = await toggle(postId);
      else {
        const card = commentCards().find((row) => row.dataset.postId === postId);
        const likeButton = card && $('[data-like-remote], [data-like-post]', card);
        if (likeButton && !likeButton.classList.contains('is-liked')) likeButton.click();
        else $('[data-world-nav="community"]')?.click();
      }
      window.setTimeout(() => floating.classList.remove('is-tapped'), 430);
      if (result) {
        const heart = $('.home-comment-like b', floating);
        if (heart) heart.textContent = `♥ ${result.count}`;
        floating.classList.add('is-liked');
        likeControl.setAttribute('aria-pressed', 'true');
        toast('いいねしました。');
      }
      floating.dataset.busy = 'false';
    });
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
      const nextSignature = JSON.stringify(rows.map(row => [row.id, row.text, row.name, row.count, row.liked, dateLabel(row), row.profile]));
      if (signature === nextSignature) return;
      signature = nextSignature;
      const scrollTop = layer.scrollTop;
      const fragment = document.createDocumentFragment();
      rows.forEach(data => {
        const card = document.createElement('article');
        card.className = `home-comment-row${data.liked ? ' is-liked' : ''}`;
        card.dataset.postId = data.id || '';
        card.innerHTML = '<span class="home-comment-avatar"></span><div class="home-comment-copy"><header><strong></strong><time></time></header><p></p></div><button type="button" class="home-comment-like" aria-label="このコメントにいいね"><b></b></button>';
        $('.home-comment-avatar', card).innerHTML = window.UNICA_BLOOM_BADGE?.html?.(data.profile || {}, 'tiny') || '';
        $('strong', card).textContent = data.name || 'うにメン';
        $('time', card).textContent = dateLabel(data);
        if (timestamp(data)) $('time', card).dateTime = new Date(timestamp(data) * 1000).toISOString();
        $('p', card).textContent = data.text;
        $('b', card).textContent = `${data.liked ? '♥' : '♡'} ${Number(data.count || 0)}`;
        $('.home-comment-like', card).setAttribute('aria-pressed', String(Boolean(data.liked)));
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
    makeFloatingCommentsInteractive();
    observeFirebaseComments();
    ensureCheerFeedback();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
