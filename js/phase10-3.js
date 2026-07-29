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
    let timer = 0;
    let index = 0;
    let mutationTimer = 0;
    const DISPLAY_MS = 15200;

    const show = () => {
      const latestRows = Array.isArray(window.UNICA_TOP_SUPPORT_COMMENTS)
        ? window.UNICA_TOP_SUPPORT_COMMENTS.slice(0,30)
        : [];
      const cards = commentCards().slice(0,30);
      if (!latestRows.length && !cards.length) {
        layer.replaceChildren();
        return;
      }
      const source = latestRows.length ? latestRows : cards;
      const raw = source[index % source.length];
      const data = latestRows.length ? raw : dataFromCard(raw);
      index += 1;
      if (!data?.text) return;

      const floating = document.createElement('button');
      floating.type = 'button';
      floating.className = `support-floating-comment support-floating-comment-button${data.liked ? ' is-liked' : ''}`;
      floating.dataset.postId = data.id;
      floating.setAttribute('aria-label', data.liked
        ? `${data.name}さんのコメント。いいね済みです。解除は応援コメント画面で行えます`
        : `${data.name}さんのコメント。タップでいいね`);
      floating.innerHTML = '<span class="support-float-avatar"></span><div class="support-float-copy"><p></p><small></small></div><span class="support-float-controls"><span class="support-float-like-button" role="button" tabindex="0" aria-label="このコメントにいいね"><b class="support-float-like"></b></span><button type="button" class="support-float-next" aria-label="次のコメントを表示">›</button></span>';
      $('.support-float-avatar', floating).textContent = data.avatar;
      $('p', floating).textContent = data.text;
      $('small', floating).textContent = `${data.name}さんからの応援`; 
      $('.support-float-like', floating).textContent = `${data.liked ? '♥' : '♡'} ${data.count}`;
      layer.replaceChildren(floating);
    };

    const scheduleNext = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        show();
        scheduleNext();
      }, DISPLAY_MS);
    };

    const showAndRestart = () => {
      show();
      scheduleNext();
    };

    const restart = () => {
      window.clearTimeout(mutationTimer);
      mutationTimer = window.setTimeout(showAndRestart, 120);
    };

    layer.addEventListener('click', (event) => {
      const next = event.target.closest('.support-float-next');
      if (!next) return;
      event.preventDefault();
      event.stopPropagation();
      showAndRestart();
    });

    new MutationObserver(restart).observe(list, { childList: true, subtree: true });
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
