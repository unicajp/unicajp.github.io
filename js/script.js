(() => {
  'use strict';

  const body = document.body;
  const intro = document.getElementById('intro');
  const introTrigger = document.getElementById('introTrigger');
  const tapSound = document.getElementById('tapSound');
  const bgm = document.getElementById('bgm');
  const promoVideo = document.getElementById('promoVideo');
  const promoSoundBtn = document.getElementById('promoSoundBtn');
  const promoSoundLabel = promoSoundBtn?.querySelector('.sound-label');
  const playerToggle = document.getElementById('playerToggle');
  const playerIcon = document.getElementById('playerIcon');
  const trackSelect = document.getElementById('trackSelect');
  const trackTitle = document.getElementById('trackTitle');
  const volume = document.getElementById('volume');
  const siteHeader = document.getElementById('siteHeader');
  const scrollProgress = document.getElementById('scrollProgress');
  const footer = document.querySelector('.site-footer');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let opened = false;
  let fadeTimer = null;
  let rafPending = false;

  function playTap() {
    if (!tapSound) return;
    tapSound.currentTime = 0;
    tapSound.volume = 0.38;
    tapSound.play().catch(() => {});
  }

  function setPlayerState(isPlaying) {
    if (!playerIcon || !playerToggle) return;
    playerIcon.textContent = isPlaying ? 'Ⅱ' : '▶';
    playerToggle.setAttribute('aria-label', isPlaying ? 'BGMを停止' : 'BGMを再生');
  }

  function fadeInBgm() {
    if (!bgm || !volume) return;
    window.clearInterval(fadeTimer);
    const target = Number(volume.value);
    bgm.volume = 0;
    bgm.play().then(() => {
      setPlayerState(true);
      let current = 0;
      fadeTimer = window.setInterval(() => {
        current = Math.min(target, current + 0.012);
        bgm.volume = current;
        if (current >= target) window.clearInterval(fadeTimer);
      }, 90);
    }).catch(() => setPlayerState(false));
  }

  function openSite() {
    if (opened) return;
    opened = true;
    playTap();
    body.classList.add('opened');
    // UNICA WORLDの固定メニューを、扉を開いた後に表示する。
    // 以前の版では site-entered が一度も付かず、追加機能へ移動できない状態だった。
    window.setTimeout(() => body.classList.add('site-entered'), 1650);
    window.setTimeout(fadeInBgm, 620);
    window.setTimeout(() => intro?.classList.add('is-hidden'), 2100);
    window.setTimeout(() => {
      document.querySelectorAll('.hero .reveal').forEach((element, index) => {
        window.setTimeout(() => element.classList.add('is-visible'), index * 180);
      });
    }, 1450);
    window.setTimeout(() => { if (!readMember()) openMemberGate(); }, 2250);
  }

  introTrigger?.addEventListener('click', openSite);

  playerToggle?.addEventListener('click', () => {
    playTap();
    if (!bgm || !volume) return;
    if (bgm.paused) {
      bgm.volume = Number(volume.value);
      bgm.play().then(() => setPlayerState(true)).catch(() => setPlayerState(false));
    } else {
      bgm.pause();
      setPlayerState(false);
    }
  });

  volume?.addEventListener('input', () => {
    if (bgm) bgm.volume = Number(volume.value);
  });

  trackSelect?.addEventListener('change', () => {
    playTap();
    if (!bgm || !volume) return;
    const option = trackSelect.options[trackSelect.selectedIndex];
    const shouldResume = !bgm.paused;
    bgm.pause();
    bgm.src = trackSelect.value;
    bgm.load();
    if (trackTitle) trackTitle.textContent = option.dataset.title;
    if (shouldResume) {
      bgm.volume = Number(volume.value);
      bgm.play().then(() => setPlayerState(true)).catch(() => setPlayerState(false));
    } else {
      setPlayerState(false);
    }
  });

  promoSoundBtn?.addEventListener('click', () => {
    playTap();
    if (!promoVideo || !promoSoundLabel) return;
    if (promoVideo.muted) {
      promoVideo.muted = false;
      promoVideo.volume = 0.85;
      promoVideo.play().catch(() => {});
      promoSoundLabel.textContent = '音声をOFF';
      if (bgm && !bgm.paused) {
        bgm.pause();
        setPlayerState(false);
      }
    } else {
      promoVideo.muted = true;
      promoSoundLabel.textContent = '音声をON';
    }
  });

  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (opened) playTap();
    });
  });

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -5% 0px' });

  document.querySelectorAll('.reveal').forEach(element => {
    if (!element.closest('.hero')) revealObserver.observe(element);
  });

  const footerObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) footer?.classList.add('is-awake');
    });
  }, { threshold: 0.22 });
  if (footer) footerObserver.observe(footer);

  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('.site-nav a')];
  const sectionObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach(link => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`);
    });
  }, { rootMargin: '-30% 0px -55% 0px', threshold: [0, .1, .3, .6] });
  sections.forEach(section => sectionObserver.observe(section));

  function createParticles(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container || reduceMotion) return;
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement('span');
      particle.className = 'light-particle';
      particle.style.setProperty('--x', `${6 + Math.random() * 88}%`);
      particle.style.setProperty('--y', `${8 + Math.random() * 84}%`);
      particle.style.setProperty('--size', `${2 + Math.random() * 4}px`);
      particle.style.setProperty('--duration', `${9 + Math.random() * 10}s`);
      particle.style.setProperty('--delay', `${-Math.random() * 14}s`);
      fragment.appendChild(particle);
    }
    container.appendChild(fragment);
  }

  createParticles('lightParticles', 22);
  createParticles('endingParticles', 15);

  function updateScrollEffects() {
    const scrollY = window.scrollY;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
    if (scrollProgress) scrollProgress.style.width = `${progress * 100}%`;
    siteHeader?.classList.toggle('is-scrolled', scrollY > 24);

    if (!reduceMotion) {
      document.querySelectorAll('[data-depth]').forEach(element => {
        const depth = Number(element.dataset.depth || 0);
        element.style.transform = `translate3d(0, ${scrollY * depth}px, 0)`;
      });
    }
    rafPending = false;
  }

  window.addEventListener('scroll', () => {
    if (!rafPending) {
      rafPending = true;
      window.requestAnimationFrame(updateScrollEffects);
    }
  }, { passive: true });
  updateScrollEffects();

  function pauseBgmWhenLeavingPage() {
    window.clearInterval(fadeTimer);
    if (bgm && !bgm.paused) {
      bgm.pause();
      setPlayerState(false);
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // ブラウザを閉じる・別アプリへ移動する・別タブへ切り替えるとBGMを停止。
      // 戻ってきた際は自動再開せず、利用者が再生ボタンを押したときだけ再生する。
      pauseBgmWhenLeavingPage();
      if (promoVideo && !promoVideo.muted) {
        promoVideo.muted = true;
        if (promoSoundLabel) promoSoundLabel.textContent = '音声をON';
      }
    }
  });
  window.addEventListener('pagehide', pauseBgmWhenLeavingPage);


  // うにメン / うにパス
  const MEMBER_KEY = 'unicaWorldMemberV4';
  const LEGACY_MEMBER_KEYS = ['unicaWorldMemberV3', 'unicaWorldMemberV2', 'unicaWorldMemberV1'];
  const memberGate = document.getElementById('memberGate');

  const PREFECTURES = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
  const memberPrefecture = document.getElementById('memberPrefecture');
  const memberBirthMonth = document.getElementById('memberBirthMonth');
  const memberBirthDay = document.getElementById('memberBirthDay');
  if(memberPrefecture) memberPrefecture.innerHTML += PREFECTURES.map(x=>`<option value="${x}">${x}</option>`).join('');
  if(memberBirthMonth) memberBirthMonth.innerHTML += Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1}月</option>`).join('');
  function fillBirthDays(){ if(!memberBirthDay)return; const m=Number(memberBirthMonth?.value||1); const max=new Date(2024,m,0).getDate(); const selected=Number(memberBirthDay.value||0); memberBirthDay.innerHTML='<option value="">日</option>'+Array.from({length:max},(_,i)=>`<option value="${i+1}">${i+1}日</option>`).join(''); if(selected<=max) memberBirthDay.value=selected||''; }
  memberBirthMonth?.addEventListener('change',fillBirthDays); fillBirthDays();

  const registerStepOne = document.getElementById('registerStepOne');
  const registerStepConfirm = document.getElementById('registerStepConfirm');
  const registerStepComplete = document.getElementById('registerStepComplete');
  const memberNickname = document.getElementById('memberNickname');
  const memberEmojiOne = document.getElementById('memberEmojiOne');
  const emojiPreview = document.getElementById('emojiPreview');
  const registerError = document.getElementById('registerError');
  const registerSubmit = document.getElementById('registerSubmit');
  const registerConfirm = document.getElementById('registerConfirm');
  const registerBack = document.getElementById('registerBack');
  const registerSkip = document.getElementById('registerSkip');
  const enterWorld = document.getElementById('enterWorld');
  const openPassButton = document.getElementById('openPassButton');
  const passAvatarButton = document.getElementById('passAvatar');
  const openMemberSettingsButton = document.getElementById('openMemberSettings');
  const memberSettings = document.getElementById('memberSettings');
  const settingsMenu = document.getElementById('settingsMenu');
  const withdrawalStep = document.getElementById('withdrawalStep');
  const withdrawalConfirmInput = document.getElementById('withdrawalConfirmInput');
  const withdrawalConfirmButton = document.getElementById('withdrawalConfirm');
  const withdrawalError = document.getElementById('withdrawalError');
  const miniToast = document.getElementById('miniToast');
  let member = null;
  let pendingRegistration = null;
  let editIconMode = false;

  function readMember() {
    try {
      const current = JSON.parse(localStorage.getItem(MEMBER_KEY) || 'null');
      if (current) return current;
      let legacy = null;
      for (const key of LEGACY_MEMBER_KEYS) {
        legacy = JSON.parse(localStorage.getItem(key) || 'null');
        if (legacy) break;
      }
      if (!legacy) return null;
      const migrated = {
        ...legacy,
        emojiOne: legacy.emojiOne || firstGrapheme(legacy.avatar) || '🌸',
        avatar: firstGrapheme(legacy.avatar) || legacy.emojiOne || '🌸'
      };
      writeMember(migrated);
      return migrated;
    } catch (_) { return null; }
  }

  function writeMember(value) {
    localStorage.setItem(MEMBER_KEY, JSON.stringify(value));
    window.UNICA_FIREBASE?.saveMember(value);
  }

  function splitGraphemes(value) {
    const text = String(value || '').trim();
    if (!text) return [];
    if (window.Intl?.Segmenter) {
      return [...new Intl.Segmenter('ja', { granularity: 'grapheme' }).segment(text)].map(part => part.segment);
    }
    return Array.from(text);
  }

  function firstGrapheme(value) { return splitGraphemes(value)[0] || ''; }
  function normalizeEmoji(value, fallback) { return firstGrapheme(value) || fallback; }
  function combinedAvatar(one) { return normalizeEmoji(one, '🌸'); }

  function memberDays(dateText) {
    const started = new Date(`${dateText}T00:00:00+09:00`);
    return Math.max(1, Math.floor((Date.now() - started.getTime()) / 86400000) + 1);
  }

  function safeText(value) { return String(value ?? ''); }

  function updateEmojiPreview(commit = false) {
    const raw = memberEmojiOne?.value || '';
    const one = normalizeEmoji(raw, '🌸');
    // スマホの絵文字入力中は値を書き戻さない。
    // ZWJ・肌色・旗など複数コードポイントの絵文字が途中で切れるのを防ぐ。
    if (commit && memberEmojiOne) memberEmojiOne.value = one;
    if (emojiPreview) emojiPreview.textContent = one;
  }

  function showRegisterStep(step) {
    registerStepOne.hidden = step !== 'one';
    registerStepConfirm.hidden = step !== 'confirm';
    registerStepComplete.hidden = step !== 'complete';
  }

  function updateMemberView() {
    member = readMember();
    const passNumber = document.getElementById('passNumber');
    const passWelcome = document.getElementById('passWelcome');
    const passName = document.getElementById('passName');
    const passStatus = document.getElementById('passStatus');
    const passDays = document.getElementById('passDays');
    const passPoints = document.getElementById('passPoints');
    const passCheers = document.getElementById('passCheers');
    const passTitle = document.getElementById('passTitle');
    const memberMessage = document.getElementById('memberMessage');

    if (!member) {
      if (passNumber) passNumber.textContent = 'NOT ISSUED';
      if (passAvatarButton) passAvatarButton.textContent = '🌸';
      if (passWelcome) passWelcome.textContent = 'まだ、うにパスは発行されていません。';
      if (passName) passName.textContent = 'UNICA WORLDへようこそ';
      if (passStatus) passStatus.textContent = '未登録';
      if (passDays) passDays.textContent = '0日';
      if (passPoints) passPoints.textContent = '🥛 0';
      if (passCheers) passCheers.textContent = '0';
      if (passTitle) passTitle.textContent = 'まだ称号はありません';
      if (openPassButton) openPassButton.textContent = 'うにメン登録をはじめる';
      if (memberMessage) memberMessage.textContent = '最初に名前を登録すると、あなたのうにパスが発行されます。これから出会う曲や世界の記録は、ここに残っていきます。';
      if (openMemberSettingsButton) openMemberSettingsButton.hidden = true;
      updateWorldHome();
      renderCheerSummary();
      return;
    }

    if (passNumber) passNumber.textContent = `No.${String(member.number).padStart(4, '0')}`;
    if (passAvatarButton) passAvatarButton.textContent = member.avatar;
    if (passWelcome) passWelcome.textContent = `おかえりなさい、${safeText(member.name)}さん。`;
    if (passName) passName.textContent = safeText(member.name);
    if (passStatus) passStatus.textContent = '創設うにメン';
    if (passDays) passDays.textContent = `${memberDays(member.joined)}日`;
    if (passPoints) passPoints.textContent = `🥛 ${member.milk ?? 0}`;
    if (passCheers) passCheers.textContent = String(member.cheers ?? 0);
    if (passTitle) passTitle.textContent = member.title || 'はじまりのうにメン';
    if (openPassButton) openPassButton.textContent = 'うにパスをひらく';
    if (memberMessage) memberMessage.textContent = 'あなたがこの世界に来た日から、時間は少しずつ積み重なっています。アイコンは、うにパスの丸いマークからいつでも変更できます。';
    if (openMemberSettingsButton) openMemberSettingsButton.hidden = false;
    updateWorldHome();
    renderCheerSummary();
  }

  function openMemberGate(force = false, options = {}) {
    member = readMember();
    editIconMode = Boolean(options.editIcon);
    if (member && !force && !editIconMode) return;

    if (editIconMode && member) {
      memberNickname.value = member.name;
      memberNickname.disabled = true;
      memberEmojiOne.value = member.emojiOne || firstGrapheme(member.avatar) || '🌸';
      registerSubmit.textContent = '新しいアイコンを確認する';
      document.querySelector('.register-notice strong').textContent = 'アイコン変更';
      document.querySelector('.register-notice p').innerHTML = 'ニックネームは変更できません。<br>プロフィールの絵文字だけを変更します。';
      registerSkip.textContent = '変更せず戻る';
    } else {
      memberNickname.disabled = false;
      memberNickname.value = '';
      memberEmojiOne.value = '🌸';
      registerSubmit.textContent = '登録内容を確認する';
      document.querySelector('.register-notice strong').textContent = '大切なお知らせ';
      document.querySelector('.register-notice p').innerHTML = 'ニックネームは登録後に変更できません。<br>アイコンは、あとから何度でも変更できます。';
      registerSkip.textContent = '今は登録せず、公式サイトを見る';
    }

    pendingRegistration = null;
    registerError.textContent = '';
    updateEmojiPreview();
    showRegisterStep('one');
    memberGate.classList.add('is-open');
    memberGate.setAttribute('aria-hidden', 'false');
    body.classList.add('member-gate-open');
    window.setTimeout(() => (editIconMode ? memberEmojiOne : memberNickname)?.focus(), 450);
  }

  function closeMemberGate() {
    memberGate.classList.remove('is-open');
    memberGate.setAttribute('aria-hidden', 'true');
    body.classList.remove('member-gate-open');
    editIconMode = false;
  }

  function toast(message) {
    if (!miniToast) return;
    miniToast.textContent = message;
    miniToast.classList.add('is-show');
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => miniToast.classList.remove('is-show'), 2300);
  }

  let emojiComposing = false;
  memberEmojiOne?.addEventListener('compositionstart', () => { emojiComposing = true; });
  memberEmojiOne?.addEventListener('compositionend', () => { emojiComposing = false; updateEmojiPreview(false); });
  memberEmojiOne?.addEventListener('input', () => { if (!emojiComposing) updateEmojiPreview(false); });
  memberEmojiOne?.addEventListener('blur', () => updateEmojiPreview(true));

  document.querySelectorAll('[data-emoji]').forEach(button => {
    button.addEventListener('click', () => {
      if (!memberEmojiOne) return;
      memberEmojiOne.value = button.dataset.emoji || '';
      updateEmojiPreview(true);
      memberEmojiOne.focus();
    });
  });

  registerSubmit?.addEventListener('click', () => {
    const name = memberNickname.value.trim();
    if (!name) {
      registerError.textContent = 'ニックネームを入力してください。';
      memberNickname.focus();
      return;
    }
    if (name.length > 16) {
      registerError.textContent = 'ニックネームは16文字以内で入力してください。';
      return;
    }

    const emojiOne = normalizeEmoji(memberEmojiOne.value, '🌸');
    const prefecture = memberPrefecture?.value || '';
    const birthMonth = Number(memberBirthMonth?.value || 0);
    const birthDay = Number(memberBirthDay?.value || 0);
    if (!editIconMode && !prefecture) {
      registerError.textContent = '都道府県を選択してください。';
      memberPrefecture?.focus();
      return;
    }
    if (!editIconMode && (!birthMonth || !birthDay)) {
      registerError.textContent = '誕生日の月と日を選択してください。';
      memberBirthMonth?.focus();
      return;
    }
    pendingRegistration = { name, emojiOne, avatar: combinedAvatar(emojiOne), prefecture, birthMonth, birthDay };
    document.getElementById('confirmAvatar').textContent = pendingRegistration.avatar;
    document.getElementById('confirmName').textContent = pendingRegistration.name;
    const locationBirthday = document.getElementById('confirmLocationBirthday');
    if (locationBirthday) locationBirthday.textContent = editIconMode ? 'アイコンのみ変更' : `${prefecture}・${birthMonth}月${birthDay}日`;
    registerError.textContent = '';
    showRegisterStep('confirm');
  });

  registerBack?.addEventListener('click', () => showRegisterStep('one'));

  async function waitForFirebaseApi(timeoutMs = 10000) {
    const started = Date.now();
    while (!window.UNICA_FIREBASE?.ensureMemberNumber) {
      if (Date.now() - started > timeoutMs) throw new Error('Firebaseの初期化に時間がかかっています。通信環境を確認してください。');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return window.UNICA_FIREBASE;
  }

  registerConfirm?.addEventListener('click', async () => {
    if (!pendingRegistration) return;

    if (editIconMode && member) {
      member = { ...member, emojiOne: pendingRegistration.emojiOne, avatar: pendingRegistration.avatar };
      delete member.emojiTwo;
      writeMember(member);
      updateMemberView();
      closeMemberGate();
      toast('うにパスのアイコンを変更しました。');
      return;
    }

    const now = new Date();
    const joined = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(now);
    member = {
      name: pendingRegistration.name,
      emojiOne: pendingRegistration.emojiOne,
      avatar: pendingRegistration.avatar,
      number: null,
      memberNumberVersion: 2,
      joined,
      milk: 0,
      tickets: 0,
      gardenProgress: 0,
      prefecture: pendingRegistration.prefecture || '',
      birthMonth: Number(pendingRegistration.birthMonth || 0),
      birthDay: Number(pendingRegistration.birthDay || 0),
      blooms: 0,
      cheers: 0,
      title: 'はじまりのうにメン',
      passStyle: 'normal',
      rewards: []
    };

    registerConfirm.disabled = true;
    registerConfirm.textContent = '会員番号を発行中…';
    try {
      const firebaseApi = await waitForFirebaseApi();
      member.number = await firebaseApi.ensureMemberNumber(member);
      writeMember(member);
    } catch (error) {
      console.error(error);
      registerError.textContent = error?.message || '会員番号を発行できませんでした。通信環境を確認して、もう一度お試しください。';
      showRegisterStep('one');
      return;
    } finally {
      registerConfirm.disabled = false;
      registerConfirm.textContent = 'この内容で登録する';
    }

    document.getElementById('completeAvatar').textContent = member.avatar;
    document.getElementById('completeName').textContent = member.name;
    document.getElementById('completeNumber').textContent = `No.${String(member.number).padStart(4, '0')}`;
    const completeRegion = document.getElementById('completeRegion');
    if (completeRegion) completeRegion.textContent = `${member.prefecture}・${member.birthMonth}月${member.birthDay}日`;
    showRegisterStep('complete');
    updateMemberView();
  });

  registerSkip?.addEventListener('click', closeMemberGate);
  enterWorld?.addEventListener('click', () => {
    closeMemberGate();
    document.getElementById('unime')?.scrollIntoView({ behavior: 'smooth' });
  });

  openPassButton?.addEventListener('click', () => {
    member = readMember();
    if (!member) { openMemberGate(true); return; }
    openPassportDetail();
  });

  passAvatarButton?.addEventListener('click', () => {
    if (!readMember()) { openMemberGate(true); return; }
    openMemberGate(true, { editIcon: true });
  });

  document.querySelectorAll('[data-mini]').forEach(button => button.addEventListener('click', () => {
    const type = button.dataset.mini;
    if (!readMember()) { openMemberGate(true); return; }
    if (type === 'gacha') toast('うにガチャは「ミルクの匂い」リリース日に開放されます。');
    if (type === 'fortune') openFortuneModal();
    if (type === 'cheer') toast('うにエールは次の段階で実装予定です。');
  }));


  // Header / artist cheer button
  const heroCheerButton = document.getElementById('heroCheerButton');
  const heartBurst = document.getElementById('heartBurst');
  function updateDailyCheerButton(){
    const current = readMember();
    const done = Boolean(current && hasCheeredToday(current));
    if (!heroCheerButton) return;
    heroCheerButton.classList.toggle('is-done', done);
    heroCheerButton.textContent = done ? '♥' : '♡';
    heroCheerButton.setAttribute('aria-pressed', done ? 'true' : 'false');
    heroCheerButton.setAttribute('aria-label', done ? '今日のエールは送信済みです' : 'うにかへ今日のエールを送る');
  }
  heroCheerButton?.addEventListener('click', () => {
    const current = readMember();
    if (!current) { openMemberGate(true); return; }
    if (hasCheeredToday(current)) {
      toast('今日のエールは送信済みです。また明日送れます。');
      return;
    }

    current.cheers = Number(current.cheers || 0) + 1;
    addCheerForToday(current);
    writeMember(current);
    member = current;
    updateMemberView();

    heroCheerButton.classList.remove('is-cheered');
    void heroCheerButton.offsetWidth;
    heroCheerButton.classList.add('is-cheered');
    heroCheerButton.setAttribute('aria-label', '今日のエールは送信済みです');
    heroCheerButton.setAttribute('aria-pressed', 'true');
    if (heartBurst) {
      heartBurst.innerHTML = '';
      ['♡','♥','♡','♥','♡'].forEach((heart, index) => {
        const span = document.createElement('span');
        span.textContent = heart;
        span.style.setProperty('--i', String(index));
        heartBurst.appendChild(span);
      });
      heartBurst.classList.remove('is-active');
      void heartBurst.offsetWidth;
      heartBurst.classList.add('is-active');
    }
    document.getElementById('heroCheerCounter')?.classList.remove('is-updated');
    void document.getElementById('heroCheerCounter')?.offsetWidth;
    document.getElementById('heroCheerCounter')?.classList.add('is-updated');
    updateDailyCheerButton();
    toast('今日のエールを送りました。');
  });

  // UNICA WORLD ホーム
  const treeModal = null;
  const onlineModal = document.getElementById('onlineModal');
  const TREE_MEMBER_COUNT = 10; // 公開時はデータベースの実数へ置き換え
  const treeStages = [
    { min: 0, goal: 10, name: '世界の種', emoji: '🌰' },
    { min: 10, goal: 50, name: '小さな若木', emoji: '🌱' },
    { min: 50, goal: 100, name: '葉を広げる木', emoji: '🌿' },
    { min: 100, goal: 300, name: '花を待つ木', emoji: '🌳' },
    { min: 300, goal: 500, name: '幸せが咲く木', emoji: '🌸' },
    { min: 500, goal: 1000, name: '世界を包む大樹', emoji: '🌲' },
    { min: 1000, goal: 1000, name: 'UNICA WORLDの大樹', emoji: '✨🌳✨' }
  ];

  function currentTreeStage(count) {
    return [...treeStages].reverse().find(stage => count >= stage.min) || treeStages[0];
  }

  function dailyWorldMessage() {
    const messages = [
      '今日も小さな幸せがありますように。',
      '花は今日も、少しだけ大きくなりました。',
      '誰かのエールが、この世界を育てています。',
      'あなたが来てくれて、今日も世界が少し賑やかになりました。',
      '何でもない今日も、いつか宝物になります。',
      'ここでは、急がずゆっくり歩いてください。',
      '今日の記憶にも、やさしい光が残りますように。'
    ];
    const now = new Date();
    const dayKey = Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', day: 'numeric' }).format(now));
    return messages[dayKey % messages.length];
  }

  function updateWorldHome() {
    const current = readMember();
    const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', hour: '2-digit', hour12: false }).format(new Date()));
    const greeting = document.getElementById('worldGreeting');
    const daily = document.getElementById('worldDailyMessage');
    const mood = document.getElementById('onlineMoodText');
    const onlineCount = current ? 1 : 0;
    const stage = currentTreeStage(TREE_MEMBER_COUNT);
    const nextCount = Math.max(0, stage.goal - TREE_MEMBER_COUNT);
    const range = Math.max(1, stage.goal - stage.min);
    const progress = stage.goal === stage.min ? 100 : Math.min(100, ((TREE_MEMBER_COUNT - stage.min) / range) * 100);

    if (greeting) greeting.textContent = current ? `おかえりなさい、${current.name}さん。` : 'UNICA WORLDへようこそ。';
    if (daily) daily.textContent = dailyWorldMessage();
    if (mood) mood.textContent = hour >= 21 || hour < 5 ? '今日は静かな夜です。' : hour < 11 ? 'やさしい朝が始まっています。' : hour < 17 ? '今日も世界に光が差しています。' : '穏やかな夕暮れです。';
    const countText = document.getElementById('onlineCountText');
    if (countText) countText.textContent = `${onlineCount}人`;

    const statusAvatar = document.getElementById('statusAvatar');
    const statusName = document.getElementById('statusName');
    const statusNumber = document.getElementById('statusNumber');
    const statusPosts = document.getElementById('statusPosts');
    const statusReactions = document.getElementById('statusReactions');
    if (statusAvatar) statusAvatar.textContent = current ? (current.emojiOne || firstGrapheme(current.avatar) || '🌸') : '🌸';
    if (statusName) statusName.textContent = current ? (current.name || '未登録') : '未登録';
    if (statusNumber) statusNumber.textContent = current ? (current.memberNumber || 'MEMBER') : 'NOT ISSUED';
    const myPosts = current ? readCommunityPosts().filter(x => x.number === current.number) : [];
    const reactions = myPosts.reduce((sum, x) => sum + Number(x.likes || 0), 0);
    if (statusPosts) statusPosts.textContent = String(myPosts.length);
    if (statusReactions) statusReactions.textContent = String(reactions);
    renderCommunityHome(); 
    const stageName = document.getElementById('treeStageName');
    const progressText = document.getElementById('treeProgressText');
    if (stageName) stageName.textContent = stage.name;
    if (progressText) progressText.textContent = stage.goal === stage.min ? '世界とともに、これからも育ち続けます' : `次の成長まで、あと${nextCount}人`;
    const crown = document.querySelector('#treeVisual .tree-crown');
    if (crown) crown.textContent = stage.emoji;
    const modalEmoji = document.getElementById('treeModalEmoji');
    const modalStage = document.getElementById('treeModalStage');
    const memberCount = document.getElementById('treeMemberCount');
    const nextGoal = document.getElementById('treeNextGoal');
    const meter = document.getElementById('treeMeterBar');
    if (modalEmoji) modalEmoji.textContent = stage.emoji;
    if (modalStage) modalStage.textContent = stage.name;
    if (memberCount) memberCount.textContent = `${TREE_MEMBER_COUNT}人のうにメン`;
    if (nextGoal) nextGoal.textContent = stage.goal === stage.min ? '最終段階' : `次の成長：${stage.goal}人`;
    if (meter) meter.style.width = `${progress}%`;

    const list = document.getElementById('onlineMemberList');
    if (list) {
      list.innerHTML = current
        ? `<div class="online-member-item"><span>${safeText(current.avatar)}</span><div><strong>${safeText(current.name)}</strong></div></div>`
        : '<div class="online-member-item"><span>🌙</span><div><strong>オンラインなし</strong></div></div>';
    }
  }

  function openWorldModal(modal) {
    if (!modal) return;
    updateWorldHome();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    body.classList.add('member-gate-open');
  }

  function closeWorldModals() {
    [treeModal, onlineModal].forEach(modal => {
      modal?.classList.remove('is-open');
      modal?.setAttribute('aria-hidden', 'true');
    });
    if (!memberGate?.classList.contains('is-open') && !memberSettings?.classList.contains('is-open')) body.classList.remove('member-gate-open');
  }

  document.getElementById('openTree')?.addEventListener('click', () => openWorldModal(treeModal));
  document.getElementById('openOnline')?.addEventListener('click', () => openWorldModal(onlineModal));
  document.querySelectorAll('[data-close-world-modal]').forEach(button => button.addEventListener('click', closeWorldModals));

  function showSettingsMenu() {
    if (settingsMenu) settingsMenu.hidden = false;
    if (withdrawalStep) withdrawalStep.hidden = true;
    if (withdrawalConfirmInput) withdrawalConfirmInput.value = '';
    if (withdrawalConfirmButton) withdrawalConfirmButton.disabled = true;
    if (withdrawalError) withdrawalError.textContent = '';
  }

  function openSettings() {
    member = readMember();
    if (!member) { openMemberGate(true); return; }
    document.getElementById('settingsAvatar').textContent = member.avatar;
    document.getElementById('settingsName').textContent = member.name;
    document.getElementById('settingsNumber').textContent = `No.${String(member.number).padStart(4, '0')}`;
    showSettingsMenu();
    memberSettings?.classList.add('is-open');
    memberSettings?.setAttribute('aria-hidden', 'false');
    body.classList.add('member-gate-open');
  }

  function closeSettings() {
    memberSettings?.classList.remove('is-open');
    memberSettings?.setAttribute('aria-hidden', 'true');
    body.classList.remove('member-gate-open');
    showSettingsMenu();
  }

  openMemberSettingsButton?.addEventListener('click', openSettings);
  document.querySelectorAll('[data-close-settings]').forEach(button => button.addEventListener('click', closeSettings));

  document.getElementById('settingsEditIcon')?.addEventListener('click', () => {
    closeSettings();
    openMemberGate(true, { editIcon: true });
  });

  document.getElementById('openWithdrawal')?.addEventListener('click', () => {
    if (settingsMenu) settingsMenu.hidden = true;
    if (withdrawalStep) withdrawalStep.hidden = false;
    window.setTimeout(() => withdrawalConfirmInput?.focus(), 100);
  });

  document.getElementById('withdrawalBack')?.addEventListener('click', showSettingsMenu);

  withdrawalConfirmInput?.addEventListener('input', () => {
    const matches = withdrawalConfirmInput.value.trim() === 'たいかい';
    if (withdrawalConfirmButton) withdrawalConfirmButton.disabled = !matches;
    if (withdrawalError) withdrawalError.textContent = matches || !withdrawalConfirmInput.value ? '' : '「たいかい」とひらがなで入力してください。';
  });

  withdrawalConfirmButton?.addEventListener('click', () => {
    if (withdrawalConfirmInput?.value.trim() !== 'たいかい') return;
    localStorage.removeItem(MEMBER_KEY);
    LEGACY_MEMBER_KEYS.forEach(key => localStorage.removeItem(key));
    window.UNICA_FIREBASE?.removeMember();
    member = null;
    pendingRegistration = null;
    closeSettings();
    updateMemberView();
    toast('退会が完了しました。うにパスを削除しました。');
    window.setTimeout(() => openMemberGate(true), 850);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && memberSettings?.classList.contains('is-open')) closeSettings();
    if (event.key === 'Escape' && (treeModal?.classList.contains('is-open') || onlineModal?.classList.contains('is-open'))) closeWorldModals();
  });



  // Phase 7.9.6: Cheer ranking and omikuji history
  const CHEER_KEY = 'unicaCheerDailyV1';
  const FORTUNE_KEY = 'unicaFortuneHistoryV1';
  const cheerRankingModal = null;
  const fortuneModal = document.getElementById('fortuneModal');
  const todayKey = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());

  function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch (_) { return fallback; } }
  function readCheerData() { const data=readJson(CHEER_KEY,{}); return data.date===todayKey()?data:{date:todayKey(),users:{}}; }
  function cheerMemberId(current) { return String(current?.number || current?.name || ''); }
  function hasCheeredToday(current) { return Boolean(readCheerData().users[cheerMemberId(current)]); }
  function addCheerForToday(current) { const data=readCheerData(); const id=cheerMemberId(current); if (!id || data.users[id]) return false; data.users[id]={name:current.name,avatar:current.avatar,count:1}; localStorage.setItem(CHEER_KEY,JSON.stringify(data)); window.UNICA_FIREBASE?.syncCheer(data); renderCheerSummary(); return true; }
  function cheerRows() { const current=readMember(); const rows=Object.values(readCheerData().users); return rows.sort((a,b)=>b.count-a.count).map((x,i)=>({...x,rank:i+1,isMe:current&&x.name===current.name})); }
  function renderCheerSummary() { const rows=cheerRows(); const total=rows.reduce((s,x)=>s+Number(x.count||0),0); const home=document.getElementById('todayCheerTotal'); const near=document.getElementById('heroCheerTotal'); const modal=document.getElementById('cheerModalTotal'); if(home)home.textContent=String(total); if(near)near.textContent=String(total); if(modal)modal.textContent=String(total); const list=document.getElementById('cheerRankingList'); if(list) list.innerHTML=rows.slice(0,10).map(x=>`<div class="cheer-rank-row${x.isMe?' is-me':''}"><b>${x.rank}</b><span class="rank-avatar">${x.avatar}</span><strong>${safeText(x.name)}${x.isMe?'（あなた）':''}</strong><em>${x.count}</em></div>`).join(''); }
  function openCheerRanking(){ renderCheerSummary(); cheerRankingModal?.classList.add('is-open'); cheerRankingModal?.setAttribute('aria-hidden','false'); body.classList.add('member-gate-open'); }
  function closeCheerRanking(){ cheerRankingModal?.classList.remove('is-open'); cheerRankingModal?.setAttribute('aria-hidden','true'); body.classList.remove('member-gate-open'); }

  document.querySelectorAll('[data-close-cheer-ranking]').forEach(b=>b.addEventListener('click',closeCheerRanking));

  const fortunePool = [
    {fortune:'うに吉',rarity:'UR',weight:1,points:150,reward:'ミルクの記憶',icon:'🍼',text:'何気ない今日が、いつか大切な宝物になります。'},
    {fortune:'大吉',rarity:'SSR',weight:4,points:100,reward:'虹色の花びら',icon:'🌈',text:'思いがけない幸せが、静かに近づいています。'},
    {fortune:'中吉',rarity:'SR',weight:15,points:50,reward:'きらめく星',icon:'⭐',text:'小さな一歩が、未来の宝物につながる日。'},
    {fortune:'吉',rarity:'R',weight:30,points:30,reward:'白いリボン',icon:'🎀',text:'誰かへのやさしさが、自分にも返ってきます。'},
    {fortune:'小吉',rarity:'N',weight:30,points:20,reward:'幸せの芽',icon:'🌱',text:'焦らず育てることで、やさしい変化が生まれます。'},
    {fortune:'末吉',rarity:'N',weight:20,points:10,reward:'月のしずく',icon:'🌙',text:'今日は静かに整えるほど、明日が軽くなります。'}
  ];
  function drawWeightedFortune(){
    const total=fortunePool.reduce((sum,item)=>sum+item.weight,0);
    let roll=Math.random()*total;
    for(const item of fortunePool){ roll-=item.weight; if(roll<0)return item; }
    return fortunePool[fortunePool.length-1];
  }
  function readFortuneHistory(){ return readJson(FORTUNE_KEY,[]); }
  function writeFortuneHistory(rows){ localStorage.setItem(FORTUNE_KEY,JSON.stringify(rows)); }
  function todayMine(){ const current=readMember(); return readFortuneHistory().find(x=>x.date===todayKey()&&current&&x.number===current.number); }
  function renderFortune(){ const current=readMember(); const mine=todayMine(); const result=document.getElementById('fortuneResult'); const draw=document.getElementById('drawFortune'); if(result){ if(mine){ result.classList.add('is-drawn'); result.innerHTML=`<small>今日の運勢・${mine.rarity||'N'}</small><strong>${mine.icon} ${mine.fortune}</strong><p>${mine.text}<br><b>今日のしるし：${mine.reward}</b></p>`; } else { result.classList.remove('is-drawn'); result.innerHTML='<small>今日の運勢</small><strong>まだ引いていません</strong><p>一日一回、うにみくじを引けます。</p>'; } } if(draw){ draw.disabled=Boolean(mine); draw.textContent=mine?'今日は引きました':'うにみくじを引く'; }
    const all=readFortuneHistory().map(x=>({...x,isMe:current&&x.number===current.number}));
    const history=document.getElementById('fortuneHistoryList'); if(history)history.innerHTML=all.slice(0,20).map(x=>`<div class="fortune-history-row"><span class="history-avatar">${x.avatar}</span><div><strong>${safeText(x.name)}${x.isMe?'（あなた）':''}</strong><small>${x.date===todayKey()?'今日':x.date} ${x.time||''}</small></div><em><b>${x.fortune}${x.rarity?`・${x.rarity}`:''}</b>${x.reward}</em></div>`).join('');
    const myHistory=readFortuneHistory().filter(x=>current&&x.number===current.number);
    const collection=fortunePool.map(item=>{const owned=myHistory.filter(x=>x.reward===item.reward);return {...item,count:owned.length,unlocked:owned.length>0};});
    const unlockedCount=collection.filter(x=>x.unlocked).length;
    const summary=document.getElementById('fortuneCollectionSummary'); if(summary)summary.innerHTML=`<strong>${unlockedCount} / ${collection.length}</strong><small>見つけたコレクション</small>`;
    const list=document.getElementById('fortuneCollectionList'); if(list)list.innerHTML=collection.map(item=>`<div class="fortune-collection-item${item.unlocked?' is-unlocked':''}"><span class="collection-icon">${item.unlocked?item.icon:'?'}</span><div><strong>${item.unlocked?safeText(item.reward):'？？？'}</strong><small>${item.unlocked?`${item.rarity}・${item.fortune}`:'うにみくじで発見できます'}</small></div><em>${item.unlocked?`×${item.count}`:'未発見'}</em></div>`).join(''); }
  function openFortuneModal(){ if(!readMember()){openMemberGate(true);return;} renderFortune(); fortuneModal?.classList.add('is-open'); fortuneModal?.setAttribute('aria-hidden','false'); body.classList.add('member-gate-open'); }
  function closeFortuneModal(){ fortuneModal?.classList.remove('is-open'); fortuneModal?.setAttribute('aria-hidden','true'); body.classList.remove('member-gate-open'); }
  document.querySelectorAll('[data-close-fortune]').forEach(b=>b.addEventListener('click',closeFortuneModal));
  document.getElementById('drawFortune')?.addEventListener('click',()=>{ const current=readMember(); if(!current||todayMine())return; const result=drawWeightedFortune(); const now=new Date(); const time=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hour12:false}).format(now); writeMember(current); member=current; updateMemberView(); const rows=readFortuneHistory(); rows.unshift({...result,name:current.name,avatar:current.avatar,number:current.number,date:todayKey(),time}); writeFortuneHistory(rows.slice(0,100)); renderFortune(); toast(`${result.rarity} ${result.fortune}！`); });
  document.querySelectorAll('[data-fortune-tab]').forEach(button=>button.addEventListener('click',()=>{ document.querySelectorAll('[data-fortune-tab]').forEach(x=>x.classList.toggle('is-active',x===button)); const history=button.dataset.fortuneTab==='history'; document.getElementById('fortuneHistoryPanel').hidden=!history; document.getElementById('fortuneCollectionPanel').hidden=history; }));


  // Phase 7.9.22: support comments for UNICA
  const COMMUNITY_KEY = 'unicaSupportCommentsV3';
  const COMMUNITY_POST_LIMIT = 1;
  const communityModal = document.getElementById('communityModal');
  const communityComment = document.getElementById('communityComment');
  const floatLayer = document.getElementById('supportCommentFloatLayer');
  let activeCommunityTab = 'new';
  let floatTimer = null;
  let floatIndex = 0;
  function communityId(){ return `support-${Date.now()}-${Math.random().toString(36).slice(2,7)}`; }
  function readCommunityPosts(){
    const rows=readJson(COMMUNITY_KEY,[]);
    const clean=rows.filter(x=>x && !String(x.id||'').startsWith('demo-'));
    if(clean.length!==rows.length) localStorage.setItem(COMMUNITY_KEY,JSON.stringify(clean));
    localStorage.removeItem('unicaSupportDemoLikesV1');
    return clean;
  }
  function writeCommunityPosts(rows){ const saved=rows.slice(0,300); localStorage.setItem(COMMUNITY_KEY,JSON.stringify(saved)); window.UNICA_FIREBASE?.syncCommunityRows(saved); }
  function postsTodayBy(current){ return readCommunityPosts().filter(x=>current&&String(x.number)===String(current.number)&&x.date===todayKey()).length; }
  function allCommunityPosts(){
    return readCommunityPosts().filter(x=>x && !String(x.id||'').startsWith('demo-'));
  }
  function communityStats(current){
    const posts=readCommunityPosts();
    const mine=current?posts.filter(x=>String(x.number)===String(current.number)):[];
    return {posts:mine.length,reactions:mine.reduce((s,x)=>s+Number(x.likes||0),0),totalLikes:allCommunityPosts().reduce((s,x)=>s+Number(x.likes||0),0)};
  }
  function formatSupportDate(x){ return `${x.date===todayKey()?'今日':x.date}${x.time?' '+x.time:''}`; }
  function renderCommunityHome(){
    const current=readMember(); const all=allCommunityPosts(); const stats=communityStats(current);
    const hp=document.getElementById('homeCommunityPosts'); if(hp)hp.textContent=String(all.length);
    const hm=document.getElementById('homeCommunityMembers'); if(hm)hm.textContent=String(stats.totalLikes);
    const latest=document.getElementById('communityHomeLatest');
    const newest=[...all].sort((a,b)=>`${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))[0];
    if(latest) latest.innerHTML=newest?`<span>${newest.avatar}</span><div><strong>${safeText(newest.name)}</strong><p>${safeText(newest.text)}</p></div><em>♥ ${Number(newest.likes||0)}</em>`:'<div><strong>まだ応援コメントはありません</strong><p>最初の言葉を届けてみよう。</p></div>';
    startSupportFloat();
  }
  function sortedCommunityPosts(current){
    let posts=allCommunityPosts();
    if(activeCommunityTab==='mine') posts=posts.filter(x=>current&&String(x.number)===String(current.number));
    if(activeCommunityTab==='popular') return posts.sort((a,b)=>Number(b.likes||0)-Number(a.likes||0)||`${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
    return posts.sort((a,b)=>`${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }
  function renderCommunity(){
    const current=readMember(); if(!current)return;
    const used=postsTodayBy(current), left=Math.max(0,COMMUNITY_POST_LIMIT-used);
    const submit=document.getElementById('submitCommunityComment'); const status=document.getElementById('communityStatus');
    const avatar=document.getElementById('communityComposeAvatar'); if(avatar)avatar.textContent=current.avatar||'🌸';
    const name=document.getElementById('communityComposeName'); if(name)name.textContent=current.name||'あなた';
    if(communityComment) communityComment.disabled=left===0;
    if(submit){submit.disabled=left===0;submit.textContent=left===0?'今日は送信済み':`応援を送る（あと${left}件）`;}
    if(status)status.textContent=left===0?'本日の送信上限に達しました。コメントへの「いいね」は引き続き送れます。':'';
    const online=document.getElementById('communityOnlineCount'); if(online)online.textContent=String(allCommunityPosts().length);
    const posts=sortedCommunityPosts(current);
    const list=document.getElementById('communityList');
    if(list)list.innerHTML=posts.map(x=>{
      const mine=String(x.number)===String(current.number); const liked=(x.likedBy||[]).map(String).includes(String(current.number));
      return `<article class="community-post-plus support-comment-card${mine?' is-me':''}" data-post-id="${x.id}">
        <header><span class="community-post-avatar">${x.avatar}</span><div><strong>${safeText(x.name)}${mine?'（あなた）':''}</strong><small>${safeText(x.prefecture||'')}${x.prefecture?'・':''}${formatSupportDate(x)}</small></div>${mine?`<button class="community-more" data-delete-post="${x.id}" aria-label="自分の応援コメントを削除" type="button">×</button>`:'<span></span>'}</header>
        <p>${safeText(x.text)}</p>
        <div class="community-post-actions support-actions"><button class="${liked?'is-liked':''}" data-like-post="${x.id}" type="button" aria-label="この応援コメントにいいね">${liked?'♥':'♡'} いいね <b>${Number(x.likes||0)}</b></button></div>
      </article>`;
    }).join('') || `<div class="community-empty">${activeCommunityTab==='mine'?'まだ応援コメントを送っていません。うにかへ最初の言葉を届けてみよう。':'まだ応援コメントはありません。'}</div>`;
    bindCommunityActions(); renderCommunityHome();
  }
  function findLocalPost(id){ const rows=readCommunityPosts(); return {rows,index:rows.findIndex(x=>x.id===id)}; }
  function toggleLike(id,current){
    const found=findLocalPost(id);
    if(found.index>=0){
      const post=found.rows[found.index]; post.likedBy=post.likedBy||[]; const ids=post.likedBy.map(String); const i=ids.indexOf(String(current.number));
      if(i>=0){post.likedBy.splice(i,1);post.likes=Math.max(0,Number(post.likes||0)-1);}else{post.likedBy.push(current.number);post.likes=Number(post.likes||0)+1;}
      writeCommunityPosts(found.rows); return;
    }
    return;
  }
  function bindCommunityActions(){
    document.querySelectorAll('[data-like-post]').forEach(btn=>btn.addEventListener('click',()=>{const current=readMember();if(!current){openMemberGate(true);return;}toggleLike(btn.dataset.likePost,current);renderCommunity();updateMemberView();}));
    document.querySelectorAll('[data-delete-post]').forEach(btn=>btn.addEventListener('click',()=>{if(!confirm('この応援コメントを削除しますか？'))return;const found=findLocalPost(btn.dataset.deletePost);if(found.index>=0){found.rows.splice(found.index,1);writeCommunityPosts(found.rows);renderCommunity();updateMemberView();toast('応援コメントを削除しました。');}}));
  }
  function todayFloatComments(){ return allCommunityPosts().filter(x=>x.date===todayKey()); }
  function showNextSupportFloat(){
    if(!floatLayer)return; const rows=todayFloatComments(); if(!rows.length){floatLayer.innerHTML='';return;}
    const x=rows[floatIndex%rows.length]; floatIndex++;
    const bubble=document.createElement('div'); bubble.className='support-floating-comment'; bubble.innerHTML=`<span>${x.avatar}</span><div><p>${safeText(x.text)}</p><small>${safeText(x.name)}　♥ ${Number(x.likes||0)}</small></div>`;
    floatLayer.innerHTML=''; floatLayer.appendChild(bubble); setTimeout(()=>bubble.remove(),6500);
  }
  function startSupportFloat(){
    if(!floatLayer||floatTimer)return; showNextSupportFloat(); floatTimer=setInterval(showNextSupportFloat,8000);
  }
  function openCommunityModal(){ if(!readMember()){openMemberGate(true);return;} renderCommunity(); communityModal?.classList.add('is-open'); communityModal?.setAttribute('aria-hidden','false'); body.classList.add('member-gate-open'); }
  function closeCommunityModal(){ communityModal?.classList.remove('is-open'); communityModal?.setAttribute('aria-hidden','true'); body.classList.remove('member-gate-open'); }
  document.querySelectorAll('[data-close-community]').forEach(b=>b.addEventListener('click',closeCommunityModal));
  communityComment?.addEventListener('input',()=>{const count=document.getElementById('communityCount');if(count)count.textContent=`${communityComment.value.length} / 80`;});
  document.getElementById('submitCommunityComment')?.addEventListener('click',()=>{
    const current=readMember();const value=communityComment?.value.trim();if(!current||postsTodayBy(current)>=COMMUNITY_POST_LIMIT)return;
    if(!value){const s=document.getElementById('communityStatus');if(s)s.textContent='応援コメントを入力してください。';return;}
    const time=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
    const rows=readCommunityPosts();rows.unshift({id:communityId(),name:current.name,avatar:current.avatar,number:current.number,prefecture:current.prefecture||'',text:value,date:todayKey(),time,likes:0,likedBy:[]});writeCommunityPosts(rows);
    if(communityComment)communityComment.value='';const count=document.getElementById('communityCount');if(count)count.textContent='0 / 80';renderCommunity();updateMemberView();toast('うにかへ応援コメントを送りました。');
  });
  document.querySelectorAll('[data-community-tab]').forEach(btn=>btn.addEventListener('click',()=>{activeCommunityTab=btn.dataset.communityTab;document.querySelectorAll('[data-community-tab]').forEach(x=>x.classList.toggle('is-active',x===btn));renderCommunity();}));
  renderCommunityHome();
  window.addEventListener('unica:firebase-member-restored', () => { updateMemberView(); renderCommunityHome(); });

  // Phase 7.9.24 — personalized daily message
  const dailyMessageCard = document.getElementById('dailyMessageCard');
  const dailyMessageDetail = document.getElementById('dailyMessageDetail');
  const openDailyMessage = document.getElementById('openDailyMessage');

  const dailyMessageData = {
    flowers: [
      ['かすみ草','感謝'],['ラベンダー','あなたを待っています'],['チューリップ','思いやり'],
      ['マーガレット','信頼'],['ミモザ','やさしさ'],['スイートピー','門出'],
      ['カモミール','逆境に耐える'],['ガーベラ','希望'],['コスモス','調和'],
      ['ネモフィラ','どこでも成功'],['アネモネ','希望'],['すずらん','幸せの再来']
    ],
    colors: ['ミルクホワイト','さくらピンク','ラベンダー','クリームイエロー','ミントグリーン','空色','ピーチベージュ','ローズグレー'],
    items: ['お気に入りのマグカップ','小さなハンカチ','イヤホン','手帳','ヘアアクセサリー','やさしい香りのハンドクリーム','お気に入りの写真','温かい飲み物'],
    messages: [
      '今日は、頑張ったことを自分で認めてあげる日にしましょう。小さな一歩も、ちゃんと未来へつながっています。',
      '誰かにかけたやさしい言葉が、思っている以上に長く心に残りそうです。あなたのままで大丈夫。',
      '急がなくても大丈夫です。好きな音楽をひとつ聴いて、心の歩幅を整えてみてください。',
      '何でもない今日の中に、あとから宝物になる瞬間が隠れています。少しだけ周りを見渡してみましょう。',
      '迷ったときは、心が少し軽くなるほうを選んでみてください。あなたの感覚を信じてよい日です。',
      '今日は「ありがとう」をひとつ言葉にすると、やさしい流れが生まれそうです。自分への感謝でも構いません。',
      '疲れを感じたら、立ち止まることも前進です。ゆっくり休む時間が、明日のあなたを守ってくれます。',
      'あなたが大切にしてきたものが、静かに力をくれる日です。思い出や好きな曲に触れてみてください。',
      'うまくできないことより、今日できたことを数えてみましょう。小さな達成が心をあたためてくれます。',
      '今日は新しいことをひとつだけ試してみると、思いがけない楽しさに出会えそうです。',
      '言葉にできない気持ちは、無理に答えを出さなくて大丈夫。音楽と一緒に、ゆっくりほどいていきましょう。',
      'あなたの笑顔を待っている人がいます。まずは自分を少しだけ喜ばせることから始めてみてください。'
    ]
  };

  function dailySeed(member) {
    const key = `${member?.name || 'guest'}|${member?.birthMonth || 0}|${member?.birthDay || 0}|${todayKey()}`;
    let hash = 2166136261;
    for (let i = 0; i < key.length; i += 1) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function dailyPick(rows, seed, shift = 0) {
    return rows[(seed + shift * 2654435761) % rows.length];
  }

  function renderDailyMessage() {
    const member = readMember();
    const preview = document.getElementById('dailyMessagePreview');
    const flowerEmoji = document.getElementById('dailyMessageFlower');
    if (!member) {
      if (preview) preview.textContent = 'うにメン登録をすると、あなた専用の言葉が届きます。';
      if (flowerEmoji) flowerEmoji.textContent = '💐';
      if (dailyMessageDetail) dailyMessageDetail.hidden = true;
      return;
    }
    const seed = dailySeed(member);
    const flower = dailyPick(dailyMessageData.flowers, seed, 1);
    const color = dailyPick(dailyMessageData.colors, seed, 2);
    const item = dailyPick(dailyMessageData.items, seed, 3);
    const message = dailyPick(dailyMessageData.messages, seed, 4);
    const flowerEmojis = ['🌷','🪻','🌼','🌸','🌹','💐'];
    if (preview) preview.textContent = `${member.name}さんへ、今日だけの小さな手紙。`;
    if (flowerEmoji) flowerEmoji.textContent = dailyPick(flowerEmojis, seed, 5);
    const dateText = new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'long',day:'numeric',weekday:'short'}).format(new Date());
    const set = (id, value) => { const el=document.getElementById(id); if(el) el.textContent=value; };
    set('dailyMessageDate', dateText);
    set('dailyMessageTitle', `${member.name}さん、今日のあなたへ`);
    set('dailyMessageText', message);
    set('dailyFlowerName', flower[0]);
    set('dailyFlowerMeaning', flower[1]);
    set('dailyLuckyColor', color);
    set('dailyLuckyItem', item);
  }

  openDailyMessage?.addEventListener('click', () => {
    const member = readMember();
    if (!member) { openMemberGate(true); return; }
    renderDailyMessage();
    if (dailyMessageDetail) {
      const firstReveal = dailyMessageDetail.hidden;
      dailyMessageDetail.hidden = false;
      dailyMessageCard?.classList.add('is-open');
      const cta = document.getElementById('dailyFortuneCta');
      if (cta) cta.textContent = '今日の結果';
      if (firstReveal) {
        dailyMessageCard?.classList.remove('is-revealing');
        void dailyMessageCard?.offsetWidth;
        dailyMessageCard?.classList.add('is-revealing');
        window.setTimeout(() => dailyMessageCard?.classList.remove('is-revealing'), 1200);
      }
    }
  });
  renderDailyMessage();

  function renderBirthdayGreeting(){ const current=readMember(); const banner=document.getElementById('birthdayBanner'); if(!banner||!current)return; const now=new Date(); const isBirthday=Number(current.birthMonth)===now.getMonth()+1&&Number(current.birthDay)===now.getDate(); banner.hidden=!isBirthday; if(isBirthday){banner.innerHTML=`<span>🎂</span><div><small>HAPPY BIRTHDAY</small><strong>${safeText(current.name)}さん、お誕生日おめでとう！</strong><p>うにコミュのみんなと過ごす、特別な一日になりますように。</p></div><em>今日の主役</em>`;document.body.classList.add('is-birthday');} }
  renderBirthdayGreeting();

  // Phase 7: detailed passport and persistent world navigation
  const passportModal = document.getElementById('passportModal');

  function fillPassportDetail() {
    const current = readMember();
    if (!current) return false;
    document.getElementById('detailAvatar').textContent = firstGrapheme(current.avatar) || '🌸';
    document.getElementById('detailName').textContent = current.name || '—';
    document.getElementById('detailNumber').textContent = `No.${String(current.number).padStart(4, '0')}`;
    document.getElementById('detailJoined').textContent = String(current.joined || '—').replaceAll('-', '.');
    document.getElementById('detailDays').textContent = `${memberDays(current.joined)}日`;
    const stats = communityStats(current);
    document.getElementById('detailPostCount').textContent = `💬 ${stats.posts}`;
    document.getElementById('detailReactionCount').textContent = `♡ ${stats.reactions}`;
    document.getElementById('detailPrefecture').textContent=current.prefecture||'—';
    document.getElementById('detailBirthday').textContent=current.birthMonth&&current.birthDay?`${current.birthMonth}月${current.birthDay}日`:'—';
    document.querySelector('.passport-detail-card')?.setAttribute('data-pass-style', current.passStyle || 'normal');
    document.getElementById('detailTitle').textContent = current.title || 'はじまりのうにメン';
    return true;
  }

  function openPassportDetail() {
    if (!fillPassportDetail()) { openMemberGate(true); return; }
    passportModal?.classList.add('is-open');
    passportModal?.setAttribute('aria-hidden', 'false');
    body.classList.add('member-gate-open');
  }

  function closePassportDetail() {
    passportModal?.classList.remove('is-open');
    passportModal?.setAttribute('aria-hidden', 'true');
    if (!memberSettings?.classList.contains('is-open')) body.classList.remove('member-gate-open');
  }

  document.querySelectorAll('[data-close-passport]').forEach(button => button.addEventListener('click', closePassportDetail));
  document.getElementById('detailOpenSettings')?.addEventListener('click', () => { closePassportDetail(); openSettings(); });

  document.querySelectorAll('[data-world-nav]').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.worldNav;
      document.querySelectorAll('[data-world-nav]').forEach(item => item.classList.toggle('is-active', item === button));
      if (target === 'home') document.getElementById('worldHome')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (target === 'pass') openPassportDetail();
      if (target === 'settings') openSettings();
      if (target === 'community') openCommunityModal();
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && passportModal?.classList.contains('is-open')) closePassportDetail();
    if (event.key === 'Escape' && cheerRankingModal?.classList.contains('is-open')) closeCheerRanking();
    if (event.key === 'Escape' && fortuneModal?.classList.contains('is-open')) closeFortuneModal();
    if (event.key === 'Escape' && communityModal?.classList.contains('is-open')) closeCommunityModal();
  });

  updateMemberView();


  document.getElementById('statusOpenPass')?.addEventListener('click', () => document.getElementById('openPassButton')?.click());
  document.getElementById('statusSettings')?.addEventListener('click', () => document.getElementById('openMemberSettings')?.click());
})();
