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
      avatar: $('.community-post-avatar', card)?.textContent?.trim() || '🌸',
      text: $('p', card)?.textContent?.trim() || '',
      count: Number(likeButton?.querySelector('b')?.textContent || 0),
      liked: Boolean(likeButton?.classList.contains('is-liked')),
      likeButton
    };
  }

  function makeFloatingCommentsInteractive() {
    const layer = $('#supportCommentFloatLayer');
    if (!layer) return;
    layer.setAttribute('aria-label', '最新の応援コメント。ハートボタンでいいね、矢印ボタンで次のコメントを表示できます。');
    layer.addEventListener('click', async (event) => {
      const likeControl = event.target.closest('.support-float-like-button');
      if (!likeControl || event.target.closest('.support-float-next')) return;
      const floating = event.target.closest('.support-floating-comment-button');
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
        const heart = $('.support-float-like', floating);
        if (heart) heart.textContent = `♥ ${result.count}`;
        floating.classList.add('is-liked');
        toast('いいねしました。');
      }
      floating.dataset.busy = 'false';
    });
  }

  function observeFirebaseComments() {
    const list = $('#communityList');
    const layer = $('#supportCommentFloatLayer');
    if (!list || !layer) return;

    let featuredIndex = 0;
    let latestPrevious = -1;
    let featuredTimer = 0;
    let latestTimer = 0;
    let mutationTimer = 0;
    const FEATURED_MS = 10000;
    const LATEST_MS = 8500;

    const cardFallbackRows = () => commentCards().map(dataFromCard).filter(Boolean);
    const getFeatured = () => {
      const rows = Array.isArray(window.UNICA_TOP_SUPPORT_FEATURED)
        ? window.UNICA_TOP_SUPPORT_FEATURED.filter(row => row?.text)
        : [];
      if (rows.length) return rows.slice(0, 5);
      return cardFallbackRows()
        .sort((a,b) => Number(b.count||0) - Number(a.count||0))
        .slice(0,5);
    };
    const getLatest = () => {
      const rows = Array.isArray(window.UNICA_TOP_SUPPORT_LATEST)
        ? window.UNICA_TOP_SUPPORT_LATEST.filter(row => row?.text)
        : [];
      return (rows.length ? rows : cardFallbackRows()).slice(0,10);
    };

    /* 最新ほど選ばれやすい重み。10件なら 10,9,...1。 */
    const weightedLatestIndex = (rows) => {
      if (rows.length <= 1) return 0;
      const weights = rows.map((_, i) => rows.length - i);
      const total = weights.reduce((sum, n) => sum + n, 0);
      let chosen = 0;
      for (let retry = 0; retry < 4; retry += 1) {
        let roll = Math.random() * total;
        chosen = 0;
        for (let i = 0; i < weights.length; i += 1) {
          roll -= weights[i];
          if (roll <= 0) { chosen = i; break; }
        }
        if (chosen !== latestPrevious) break;
      }
      latestPrevious = chosen;
      return chosen;
    };

    const makeCard = (kind, data) => {
      if (!data?.text) return null;
      const card = document.createElement('div');
      card.className = `support-floating-comment support-floating-comment-button support-floating-comment-${kind}${data.liked ? ' is-liked' : ''}`;
      card.dataset.postId = data.id || '';
      card.dataset.kind = kind;
      card.setAttribute('role', 'group');
      card.setAttribute('aria-label', `${kind === 'featured' ? '注目' : '新着'}コメント。${data.name}さんからの応援`);
      card.innerHTML = '<span class="support-float-label"></span><span class="support-float-avatar"></span><div class="support-float-copy"><p></p><small></small></div><span class="support-float-controls"><button type="button" class="support-float-like-button" aria-label="このコメントにいいね"><b class="support-float-like"></b></button><button type="button" class="support-float-next" aria-label="次のコメントを表示">›</button></span>';
      $('.support-float-label', card).textContent = kind === 'featured' ? '注目' : '新着';
      $('.support-float-avatar', card).textContent = data.avatar || '🌸';
      $('p', card).textContent = data.text;
      $('small', card).textContent = `${data.name}さん`;
      $('.support-float-like', card).textContent = `${data.liked ? '♥' : '♡'} ${Number(data.count||0)}`;
      return card;
    };

    const replaceCard = (kind, data) => {
      const nextCard = makeCard(kind, data);
      const current = layer.querySelector(`[data-kind="${kind}"]`);
      if (!nextCard) {
        current?.remove();
        return;
      }
      nextCard.classList.add('is-entering');
      if (current) current.replaceWith(nextCard);
      else layer.appendChild(nextCard);
      requestAnimationFrame(() => nextCard.classList.remove('is-entering'));
    };

    const showFeatured = () => {
      const rows = getFeatured();
      if (!rows.length) return replaceCard('featured', null);
      replaceCard('featured', rows[featuredIndex % rows.length]);
      featuredIndex += 1;
    };
    const showLatest = () => {
      const rows = getLatest();
      if (!rows.length) return replaceCard('latest', null);
      replaceCard('latest', rows[weightedLatestIndex(rows)]);
    };

    const scheduleFeatured = () => {
      clearTimeout(featuredTimer);
      featuredTimer = setTimeout(() => { showFeatured(); scheduleFeatured(); }, FEATURED_MS);
    };
    const scheduleLatest = () => {
      clearTimeout(latestTimer);
      latestTimer = setTimeout(() => { showLatest(); scheduleLatest(); }, LATEST_MS);
    };
    const restart = () => {
      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(() => {
        showFeatured();
        showLatest();
        scheduleFeatured();
        scheduleLatest();
      }, 120);
    };

    layer.addEventListener('click', (event) => {
      const next = event.target.closest('.support-float-next');
      if (!next) return;
      event.preventDefault();
      event.stopPropagation();
      const card = next.closest('.support-floating-comment-button');
      if (card?.dataset.kind === 'featured') {
        showFeatured();
        scheduleFeatured();
      } else {
        showLatest();
        scheduleLatest();
      }
    });

    new MutationObserver(restart).observe(list, { childList: true, subtree: true });
    layer.classList.add('is-two-tier');
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
