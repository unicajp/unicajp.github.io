(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const waitForFirebase = async () => {
    for (let i = 0; i < 80; i += 1) {
      if (window.UNICA_FIREBASE?.auth) return window.UNICA_FIREBASE;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Firebaseの読み込みに失敗しました。');
  };

  function recoverDoor() {
    const intro = $('#intro');
    const trigger = $('#introTrigger');
    if (!intro || !trigger) return;

    // スクロール制御用クラスが扉より先に残っていても、扉を必ずタップ可能にする。
    intro.style.pointerEvents = 'auto';
    trigger.style.pointerEvents = 'auto';
    trigger.style.touchAction = 'manipulation';

    let requested = false;
    const requestOpen = () => {
      if (document.body.classList.contains('opened') || requested) return;
      requested = true;
      trigger.click();
      window.setTimeout(() => {
        // 元のイベントが何らかの理由で届かなかった場合の安全な復旧処理。
        if (!document.body.classList.contains('opened')) {
          document.body.classList.add('opened');
          window.setTimeout(() => document.body.classList.add('site-entered'), 1500);
          window.setTimeout(() => intro.classList.add('is-hidden'), 2050);
        }
      }, 80);
    };

    trigger.addEventListener('pointerup', requestOpen, { passive: true });
    trigger.addEventListener('touchend', requestOpen, { passive: true });
  }

  function setMessage(el, text, state = '') {
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('is-error', state === 'error');
    el.classList.toggle('is-success', state === 'success');
  }

  function friendlyError(error) {
    const code = String(error?.code || '');
    if (code.includes('popup-closed-by-user')) return 'Google連携をキャンセルしました。';
    if (code.includes('popup-blocked')) return 'ポップアップがブロックされました。ブラウザ設定を確認してください。';
    if (code.includes('credential-already-in-use')) return 'このGoogleアカウントは、すでに別のうにパスと連携されています。新しい端末では「Googleで引き継ぐ」を使用してください。';
    if (code.includes('account-exists-with-different-credential')) return 'このGoogleアカウントは別のログイン方法で登録されています。';
    if (code.includes('unauthorized-domain')) return 'Firebase Authenticationの承認済みドメインに、このサイトのドメインを追加してください。';
    return error?.message || 'Google認証に失敗しました。時間をおいてもう一度お試しください。';
  }

  async function updateGoogleState() {
    const linkButton = $('#googleLinkButton');
    const title = $('#googleLinkTitle');
    const description = $('#googleLinkDescription');
    try {
      const api = await waitForFirebase();
      const info = api.authInfo?.() || {};
      if (!linkButton) return;
      linkButton.classList.toggle('is-linked', Boolean(info.googleLinked));
      linkButton.disabled = Boolean(info.googleLinked);
      if (info.googleLinked) {
        if (title) title.textContent = 'Google連携済み';
        if (description) description.textContent = info.email || '機種変更後も同じうにパスを利用できます';
      } else {
        if (title) title.textContent = 'Googleアカウントと連携';
        if (description) description.textContent = '機種変更後も同じうにパスを引き継げます';
      }
    } catch (_) {}
  }

  async function linkGoogle() {
    const button = $('#googleLinkButton');
    const message = $('#googleLinkMessage');
    if (!button || button.disabled) return;
    button.disabled = true;
    setMessage(message, 'Googleアカウントを開いています…');
    try {
      const api = await waitForFirebase();
      await api.linkGoogleAccount();
      setMessage(message, 'Googleアカウントと連携しました。機種変更後も引き継げます。', 'success');
      await updateGoogleState();
    } catch (error) {
      setMessage(message, friendlyError(error), 'error');
      button.disabled = false;
    }
  }

  async function restoreWithGoogle() {
    const button = $('#googleRestoreButton');
    const message = $('#googleRestoreMessage');
    if (!button || button.disabled) return;
    button.disabled = true;
    setMessage(message, 'Googleアカウントを確認しています…');
    try {
      const api = await waitForFirebase();
      await api.signInGoogleAccount();
      setMessage(message, 'うにパスを引き継ぎました。', 'success');
      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (error) {
      setMessage(message, friendlyError(error), 'error');
      button.disabled = false;
    }
  }

  function init() {
    recoverDoor();
    $('#googleLinkButton')?.addEventListener('click', linkGoogle);
    $('#googleRestoreButton')?.addEventListener('click', restoreWithGoogle);
    window.addEventListener('unica:auth-provider-changed', updateGoogleState);
    window.addEventListener('unica:firebase-ready', updateGoogleState);
    updateGoogleState();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
