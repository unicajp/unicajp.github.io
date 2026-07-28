(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);

  async function waitForFirebase() {
    for (let i = 0; i < 100; i += 1) {
      if (window.UNICA_FIREBASE?.auth) return window.UNICA_FIREBASE;
      await new Promise(resolve => window.setTimeout(resolve, 100));
    }
    throw new Error('Firebaseの読み込みに失敗しました。');
  }

  function setMessage(element, text, state = '') {
    if (!element) return;
    element.textContent = text;
    element.classList.toggle('is-error', state === 'error');
    element.classList.toggle('is-success', state === 'success');
  }

  function friendlyError(error) {
    const code = String(error?.code || '');
    if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) return 'Google連携をキャンセルしました。';
    if (code.includes('popup-blocked')) return 'Google画面を開けませんでした。ブラウザのポップアップ設定を確認してください。';
    if (code.includes('credential-already-in-use')) return 'このGoogleアカウントは、すでに別のうにパスと連携されています。';
    if (code.includes('account-exists-with-different-credential')) return 'このGoogleアカウントは別のログイン方法で登録されています。';
    if (code.includes('unauthorized-domain')) return 'このサイトのドメインがFirebaseで承認されていません。';
    if (code.includes('network-request-failed')) return '通信に失敗しました。接続を確認して、もう一度お試しください。';
    return error?.message || 'Google認証に失敗しました。';
  }

  async function updateGoogleState() {
    const button = $('#googleLinkButton');
    if (!button) return;
    try {
      const api = await waitForFirebase();
      const info = api.authInfo?.() || {};
      const title = $('#googleLinkTitle');
      const description = $('#googleLinkDescription');
      const linked = Boolean(info.googleLinked);
      button.classList.toggle('is-linked', linked);
      button.disabled = linked;
      if (title) title.textContent = linked ? 'Google連携済み' : 'Googleアカウントと連携';
      if (description) description.textContent = linked
        ? (info.email || '機種変更後も同じうにパスを利用できます')
        : '機種変更後も同じうにパスを引き継げます';
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
      setMessage(message, 'Googleアカウントと連携しました。うにメンNo.と登録情報はそのままです。', 'success');
      await updateGoogleState();
    } catch (error) {
      setMessage(message, friendlyError(error), 'error');
      button.disabled = false;
    }
  }

  async function restoreGoogle() {
    const button = $('#googleRestoreButton');
    const message = $('#googleRestoreMessage');
    if (!button || button.disabled) return;
    button.disabled = true;
    setMessage(message, 'Googleアカウントを確認しています…');
    try {
      const api = await waitForFirebase();
      await api.signInGoogleAccount();
      setMessage(message, 'うにパスを引き継ぎました。', 'success');
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setMessage(message, friendlyError(error), 'error');
      button.disabled = false;
    }
  }

  function init() {
    $('#googleLinkButton')?.addEventListener('click', linkGoogle);
    $('#googleRestoreButton')?.addEventListener('click', restoreGoogle);
    window.addEventListener('unica:auth-provider-changed', updateGoogleState);
    window.addEventListener('unica:firebase-ready', updateGoogleState);
    updateGoogleState();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
