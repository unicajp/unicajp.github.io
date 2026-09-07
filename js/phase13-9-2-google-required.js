(() => {
  'use strict';

  const MEMBER_KEY = 'unicaWorldMemberV4';
  const LEGACY_KEYS = ['unicaWorldMemberV3','unicaWorldMemberV2','unicaWorldMemberV1'];
  let bypassConfirm = false;
  let gate = null;

  const $ = s => document.querySelector(s);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function readMember() {
    try {
      const current = JSON.parse(localStorage.getItem(MEMBER_KEY) || 'null');
      if (current) return current;
      for (const key of LEGACY_KEYS) {
        const legacy = JSON.parse(localStorage.getItem(key) || 'null');
        if (legacy) return legacy;
      }
    } catch (_) {}
    return null;
  }

  async function apiReady() {
    for (let i = 0; i < 120; i += 1) {
      if (window.UNICA_FIREBASE?.authInfo && window.UNICA_FIREBASE?.linkGoogleAccount) return window.UNICA_FIREBASE;
      await sleep(100);
    }
    throw new Error('Firebaseの読み込みに失敗しました。');
  }

  function friendly(error) {
    const code = String(error?.code || '');
    if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) return 'Google連携がキャンセルされました。もう一度お試しください。';
    if (code.includes('popup-blocked')) return 'Google画面を開けませんでした。ブラウザのポップアップ設定を確認してください。';
    if (code.includes('credential-already-in-use')) return 'このGoogleアカウントは、すでに別のうにパスと連携されています。「Googleで引き継ぐ」から以前のうにパスを開いてください。';
    if (code.includes('unauthorized-domain')) return 'Firebaseでこのサイトのドメインが承認されていません。';
    if (code.includes('network-request-failed')) return '通信に失敗しました。接続を確認してください。';
    return error?.message || 'Google連携に失敗しました。';
  }

  function ensureRegisterNotice() {
    const step = $('#registerStepOne');
    if (!step || $('#googleRequiredNotice')) return;
    const notice = document.createElement('div');
    notice.id = 'googleRequiredNotice';
    notice.className = 'google-required-notice';
    notice.innerHTML = '<span class="google-required-g">G</span><div><strong>Googleアカウント連携が必須です</strong><small>ブラウザや機種が変わっても、同じうにパスを引き継げます。登録確定時にGoogle連携を行います。</small></div>';
    const freeCard = step.querySelector('.free-member-card');
    freeCard?.insertAdjacentElement('afterend', notice);
  }

  function ensureGate() {
    if (gate) return gate;
    gate = document.createElement('div');
    gate.id = 'googleRequiredGate';
    gate.className = 'google-required-gate';
    gate.setAttribute('aria-hidden', 'true');
    gate.innerHTML = `
      <div class="google-required-backdrop"></div>
      <section class="google-required-panel" role="dialog" aria-modal="true" aria-labelledby="googleRequiredTitle">
        <div class="google-required-icon">G</div>
        <p class="google-required-kicker">KEEP YOUR UNICA PASS</p>
        <h2 id="googleRequiredTitle">うにパスを守るため<br>Google連携が必要です</h2>
        <p>ブラウザ変更や機種変更でも、今の<strong>うにメンNo.・登録情報・記録</strong>をそのまま引き継げるようにします。</p>
        <button id="googleRequiredLink" type="button"><span>G</span> Googleアカウントと連携</button>
        <small>現在のうにパスにGoogleを連携します。新しいうにメン番号は発行されません。</small>
        <p id="googleRequiredMessage" class="google-required-message" aria-live="polite"></p>
      </section>`;
    document.body.appendChild(gate);
    $('#googleRequiredLink')?.addEventListener('click', linkExistingMember);
    return gate;
  }

  function showGate() {
    ensureGate();
    gate.classList.add('is-open');
    gate.setAttribute('aria-hidden', 'false');
    document.body.classList.add('google-required-open');
  }

  function hideGate() {
    gate?.classList.remove('is-open');
    gate?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('google-required-open');
  }

  async function enforceExistingMember() {
    try {
      const api = await apiReady();
      const info = api.authInfo();
      if (readMember() && info.signedIn && !info.googleLinked) showGate();
      else hideGate();
    } catch (_) {}
  }

  async function linkExistingMember() {
    const button = $('#googleRequiredLink');
    const message = $('#googleRequiredMessage');
    if (!button || button.disabled) return;
    button.disabled = true;
    if (message) message.textContent = 'Googleアカウントを開いています…';
    try {
      const api = await apiReady();
      await api.linkGoogleAccount();
      if (message) message.textContent = '連携しました。これからも同じうにパスを使えます。';
      await sleep(500);
      hideGate();
    } catch (error) {
      if (message) message.textContent = friendly(error);
      button.disabled = false;
    }
  }

  async function requireGoogleBeforeRegistration(event) {
    if (bypassConfirm) return;
    if (readMember()) return; // アイコン変更など既存会員処理は触らない

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const button = $('#registerConfirm');
    const error = $('#registerError');
    if (!button || button.disabled) return;
    button.disabled = true;
    const oldText = button.textContent;
    button.textContent = 'Googleアカウントを確認中…';
    if (error) error.textContent = '';

    try {
      const api = await apiReady();
      if (!api.authInfo().googleLinked) await api.linkGoogleAccount();
      bypassConfirm = true;
      button.disabled = false;
      button.textContent = oldText;
      button.click();
      setTimeout(() => { bypassConfirm = false; }, 0);
    } catch (err) {
      if (error) error.textContent = friendly(err);
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  function init() {
    ensureRegisterNotice();
    ensureGate();
    $('#registerConfirm')?.addEventListener('click', requireGoogleBeforeRegistration, true);
    window.addEventListener('unica:firebase-ready', () => setTimeout(enforceExistingMember, 150));
    window.addEventListener('unica:firebase-member-restored', () => setTimeout(enforceExistingMember, 150));
    window.addEventListener('unica:auth-provider-changed', () => setTimeout(enforceExistingMember, 100));
    setTimeout(enforceExistingMember, 1800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
