(() => {
  'use strict';

  const SIZE = 8;
  const TYPES = ['ミ', 'ル', 'ク', 'の', '匂', 'い'];
  const STORY_MOVES = 35;
  const STORY_GOAL = 12000;
  const UNLIMITED_MOVES = 60;
  const UNLIMITED_GOAL = 30000;
  const DAILY_LIMIT = 3;
  // Phase11.3.2 TEST MODE: 公開前の動作確認中は回数を消費しない。
  // 本番公開時は false に戻すだけで、1日3回制限が再有効化されます。
  const TEST_MODE = false;
  const CLEAR_REWARD = 3;
  const BEST_KEY = 'unicaMilkMatchBestV1';
  const PROGRESS_KEY = 'unicaMilkMatchProgressV2';

  const modal = document.getElementById('milkMatchModal');
  const boardEl = document.getElementById('milkMatchBoard');
  const scoreEl = document.getElementById('milkMatchScore');
  const movesEl = document.getElementById('milkMatchMoves');
  const bestEl = document.getElementById('milkMatchBest');
  const fragmentsEl = document.getElementById('milkMatchFragments');
  const playsEl = document.getElementById('milkMatchPlays');
  const homeFragmentsEl = document.getElementById('milkMatchHomeFragments');
  const homePlaysEl = document.getElementById('milkMatchHomePlays');
  const goalBar = document.getElementById('milkMatchGoalBar');
  const comboEl = document.getElementById('milkMatchCombo');
  const openBtn = document.getElementById('openMilkMatch');
  const newGameBtn = document.getElementById('milkMatchNewGame');
  const hintBtn = document.getElementById('milkMatchHint');

  if (!modal || !boardEl || !openBtn) return;

  let board = [];
  let score = 0;
  let mode = 'story';
  let moves = STORY_MOVES;
  let fever = 0;
  let feverMoves = 0;
  let selected = null;
  let locked = false;
  let gameEnded = true;
  let attemptActive = false;
  let progress = loadProgress();
  let gesture = null;
  let suppressClickUntil = 0;
  let audioContext = null;
  let soundEnabled = localStorage.getItem('unicaMilkMatchSound') !== 'off';
  let soundVolume = Math.max(0, Math.min(2, Number(localStorage.getItem('unicaMilkMatchVolume') || 1.2)));
  const storyModeBtn = document.getElementById('milkMatchStoryMode');
  const unlimitedModeBtn = document.getElementById('milkMatchUnlimitedMode');
  const modeLabelEl = document.getElementById('milkMatchModeLabel');
  const goalTextEl = document.getElementById('milkMatchGoalText');
  const feverBarEl = document.getElementById('milkMatchFeverBar');
  const feverTextEl = document.getElementById('milkMatchFeverText');
  const feverWrapEl = feverBarEl?.closest('.milk-match-fever');
  const volumeSlider = document.getElementById('milkMatchVolume');
  const volumeValueEl = document.getElementById('milkMatchVolumeValue');
  const soundToggleBtn = document.getElementById('milkMatchSoundToggle');

  function ensureAudio() {
    if (!soundEnabled) return null;
    try {
      if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume();
      return audioContext;
    } catch (_) { return null; }
  }

  function tone(freq, duration = .09, type = 'sine', volume = .055, delay = 0, endFreq = null) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), now + duration);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume * soundVolume), now + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now); osc.stop(now + duration + .03);
  }

  function noise(duration = .12, volume = .018, delay = 0) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buf;
    gain.gain.value = volume * soundVolume;
    src.connect(gain).connect(ctx.destination);
    src.start(ctx.currentTime + delay);
  }

  const sfx = {
    select(){ tone(520,.055,'sine',.025); },
    swap(){ tone(280,.07,'triangle',.035,0,430); tone(430,.065,'triangle',.026,.045,610); },
    invalid(){ tone(150,.11,'sawtooth',.025,0,105); },
    match(chain=1){ const base=420+Math.min(chain,7)*55; tone(base,.11,'sine',.05); tone(base*1.5,.14,'triangle',.035,.055); noise(.11,.012); },
    fall(){ tone(220,.055,'triangle',.018,0,300); },
    combo(chain){ const base=500+chain*45; [0,1,2].forEach((n)=>tone(base*(1+n*.16),.12,'sine',.04,n*.055)); },
    clear(){ [523,659,784,1047].forEach((f,n)=>tone(f,.22,'sine',.045,n*.08)); },
    shuffle(){ tone(190,.22,'triangle',.03,0,500); noise(.2,.015); }
  };

  function makeBurst(indices, chain) {
    const wrap = boardEl.parentElement;
    const wrapRect = wrap.getBoundingClientRect();
    const layer = document.createElement('div');
    layer.className = 'milk-match-fx-layer';
    wrap.appendChild(layer);
    indices.forEach((i, order) => {
      const tile = boardEl.children[i];
      if (!tile) return;
      const rect = tile.getBoundingClientRect();
      const x = rect.left - wrapRect.left + rect.width/2;
      const y = rect.top - wrapRect.top + rect.height/2;
      const ring = document.createElement('i');
      ring.className = 'milk-match-burst-ring';
      ring.style.left = `${x}px`; ring.style.top = `${y}px`;
      ring.style.animationDelay = `${Math.min(order,8)*18}ms`;
      layer.appendChild(ring);
      for (let n=0;n<5;n++) {
        const p = document.createElement('b');
        p.className = 'milk-match-spark';
        const angle = (Math.PI*2*n/5)+(order*.7);
        const dist = 18 + Math.random()*24 + chain*2;
        p.style.left = `${x}px`; p.style.top = `${y}px`;
        p.style.setProperty('--dx', `${Math.cos(angle)*dist}px`);
        p.style.setProperty('--dy', `${Math.sin(angle)*dist}px`);
        p.style.animationDelay = `${Math.min(order,8)*16}ms`;
        layer.appendChild(p);
      }
    });
    setTimeout(()=>layer.remove(), 1050);
  }

  function pulseBoard() { /* 全画面フラッシュ・全体消失感を廃止 */ }

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const idx = (r, c) => r * SIZE + c;
  const pos = i => ({ r: Math.floor(i / SIZE), c: i % SIZE });

  function adjacent(a, b) {
    const A = pos(a), B = pos(b);
    return Math.abs(A.r - B.r) + Math.abs(A.c - B.c) === 1;
  }

  function todayJst() {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
  }

  function normalizeProgress(value = {}) {
    const today = todayJst();
    const sameDay = value.date === today;
    return {
      date: today,
      playsUsed: sameDay ? Math.max(0, Math.min(DAILY_LIMIT, Number(value.playsUsed || 0))) : 0,
      fragments: Math.max(0, Number(value.fragments || 0)),
      updatedAtMs: Number(value.updatedAtMs || 0),
      unlockedChapters: Array.isArray(value.unlockedChapters)
        ? [...new Set(value.unlockedChapters.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n < 9))].sort((a, b) => a - b)
        : []
    };
  }

  function loadProgress() {
    try { return normalizeProgress(JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')); }
    catch (_) { return normalizeProgress(); }
  }

  function saveProgress({ sync = true } = {}) {
    progress = normalizeProgress({ ...progress, updatedAtMs: Date.now() });
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    updateProgressUi();
    window.dispatchEvent(new CustomEvent('unica:milk-match-progress', { detail: { ...progress } }));
    if (sync) syncProgressToFirebase();
  }

  async function syncProgressToFirebase() {
    try {
      if (window.UNICA_FIREBASE?.saveMilkMatchProgress) {
        await window.UNICA_FIREBASE.saveMilkMatchProgress(progress);
      }
    } catch (error) {
      console.warn('Milk Match sync:', error);
    }
  }

  async function restoreProgressFromFirebase() {
    try {
      if (!window.UNICA_FIREBASE?.loadMilkMatchProgress) return;
      const remote = await window.UNICA_FIREBASE.loadMilkMatchProgress();
      if (!remote) return;
      const r = normalizeProgress(remote);
      const l = normalizeProgress(progress);
      progress = {
        date: todayJst(),
        playsUsed: Math.max(l.playsUsed, r.playsUsed),
        fragments: Math.max(l.fragments, r.fragments),
        updatedAtMs: Math.max(l.updatedAtMs, r.updatedAtMs),
        unlockedChapters: [...new Set([...(l.unlockedChapters || []), ...(r.unlockedChapters || [])])].sort((a, b) => a - b)
      };
      saveProgress();
    } catch (error) {
      console.warn('Milk Match restore:', error);
    }
  }

  function remainingPlays() {
    progress = normalizeProgress(progress);
    return TEST_MODE ? Infinity : Math.max(0, DAILY_LIMIT - progress.playsUsed);
  }

  function updateProgressUi() {
    const remaining = remainingPlays();
    if (fragmentsEl) fragmentsEl.textContent = String(progress.fragments);
    if (playsEl) playsEl.textContent = TEST_MODE ? '∞' : String(remaining);
    if (homeFragmentsEl) homeFragmentsEl.textContent = String(progress.fragments);
    if (homePlaysEl) homePlaysEl.textContent = TEST_MODE ? '∞' : String(remaining);
    if (newGameBtn) {
      newGameBtn.disabled = (!TEST_MODE && remaining <= 0) || attemptActive;
      newGameBtn.textContent = (!TEST_MODE && remaining <= 0) ? '本日は終了' : '次の挑戦';
    }
  }

  function getBest() { return Number(localStorage.getItem(BEST_KEY) || 0); }
  function setBest(value) {
    const best = Math.max(getBest(), value);
    localStorage.setItem(BEST_KEY, String(best));
    if (bestEl) bestEl.textContent = best.toLocaleString('ja-JP');
  }

  function swap(arr, a, b) {
    const tmp = arr[a];
    arr[a] = arr[b];
    arr[b] = tmp;
  }

  function findMatches(arr) {
    const found = new Set();

    for (let r = 0; r < SIZE; r++) {
      let c = 0;
      while (c < SIZE) {
        const type = arr[idx(r, c)];
        let end = c + 1;
        while (end < SIZE && type !== null && arr[idx(r, end)] === type) end++;
        if (type !== null && end - c >= 3) {
          for (let x = c; x < end; x++) found.add(idx(r, x));
        }
        c = end;
      }
    }

    for (let c = 0; c < SIZE; c++) {
      let r = 0;
      while (r < SIZE) {
        const type = arr[idx(r, c)];
        let end = r + 1;
        while (end < SIZE && type !== null && arr[idx(end, c)] === type) end++;
        if (type !== null && end - r >= 3) {
          for (let y = r; y < end; y++) found.add(idx(y, c));
        }
        r = end;
      }
    }

    return [...found];
  }

  function createsStartingMatch(arr, r, c, type) {
    return (c >= 2 && arr[idx(r, c - 1)] === type && arr[idx(r, c - 2)] === type)
      || (r >= 2 && arr[idx(r - 1, c)] === type && arr[idx(r - 2, c)] === type);
  }

  function hasPossibleMove(arr) {
    for (let i = 0; i < arr.length; i++) {
      const { r, c } = pos(i);
      const candidates = [];
      if (c + 1 < SIZE) candidates.push(idx(r, c + 1));
      if (r + 1 < SIZE) candidates.push(idx(r + 1, c));
      for (const j of candidates) {
        swap(arr, i, j);
        const works = findMatches(arr).length > 0;
        swap(arr, i, j);
        if (works) return true;
      }
    }
    return false;
  }

  function createBoard() {
    for (let attempt = 0; attempt < 200; attempt++) {
      const arr = new Array(SIZE * SIZE);
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          let type;
          do { type = Math.floor(Math.random() * TYPES.length); }
          while (createsStartingMatch(arr, r, c, type));
          arr[idx(r, c)] = type;
        }
      }
      if (hasPossibleMove(arr)) return arr;
    }
    throw new Error('盤面を生成できませんでした');
  }

  function findHint() {
    for (let i = 0; i < board.length; i++) {
      const { r, c } = pos(i);
      const candidates = [];
      if (c + 1 < SIZE) candidates.push(idx(r, c + 1));
      if (r + 1 < SIZE) candidates.push(idx(r + 1, c));
      for (const j of candidates) {
        swap(board, i, j);
        const works = findMatches(board).length > 0;
        swap(board, i, j);
        if (works) return [i, j];
      }
    }
    return null;
  }

  function updateStats() {
    if (scoreEl) scoreEl.textContent = score.toLocaleString('ja-JP');
    if (movesEl) movesEl.textContent = String(moves);
    if (bestEl) bestEl.textContent = getBest().toLocaleString('ja-JP');
    const goal = mode === 'story' ? STORY_GOAL : UNLIMITED_GOAL;
    if (goalBar) goalBar.style.width = `${Math.min(100, score / goal * 100)}%`;
    if (modeLabelEl) modeLabelEl.textContent = mode === 'story' ? 'STORY' : 'UNLIMITED';
    if (goalTextEl) goalTextEl.textContent = mode === 'story' ? `${STORY_MOVES}手以内に ${STORY_GOAL.toLocaleString('ja-JP')}点` : `${UNLIMITED_MOVES}手のスコアアタック`;
    if (feverBarEl) feverBarEl.style.width = `${Math.min(100, fever)}%`;
    if (feverTextEl) feverTextEl.textContent = feverMoves > 0 ? `残り${feverMoves}手` : `${Math.floor(fever)}%`;
    feverWrapEl?.classList.toggle('is-active', feverMoves > 0);
    boardEl.classList.toggle('is-fever', feverMoves > 0);
    updateProgressUi();
  }

  function makeTile(type, i) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'milk-match-tile';
    tile.dataset.index = String(i);
    tile.dataset.type = String(type);
    tile.setAttribute('role', 'gridcell');
    tile.setAttribute('aria-label', `${TYPES[type]}のピース ${i + 1}`);
    tile.innerHTML = `<span>${TYPES[type]}</span>`;
    return tile;
  }

  function render() {
    const fragment = document.createDocumentFragment();
    board.forEach((type, i) => fragment.appendChild(makeTile(type, i)));
    boardEl.replaceChildren(fragment);
    if (selected !== null) boardEl.children[selected]?.classList.add('is-selected');
    updateStats();
  }

  function showCombo(chain, gain = 0) {
    if (!comboEl) return;
    comboEl.innerHTML = chain > 1
      ? `<strong>${chain} COMBO!</strong><small>+${gain.toLocaleString('ja-JP')}</small>`
      : `<strong>GREAT!</strong><small>+${gain.toLocaleString('ja-JP')}</small>`;
    comboEl.classList.remove('show');
    void comboEl.offsetWidth;
    comboEl.classList.add('show');
    if (chain > 1) sfx.combo(chain);
  }

  function collapseBoard() {
    for (let c = 0; c < SIZE; c++) {
      const kept = [];
      for (let r = SIZE - 1; r >= 0; r--) {
        const value = board[idx(r, c)];
        if (value !== null) kept.push(value);
      }
      let k = 0;
      for (let r = SIZE - 1; r >= 0; r--) {
        board[idx(r, c)] = k < kept.length ? kept[k++] : Math.floor(Math.random() * TYPES.length);
      }
    }
  }

  async function resolveBoard() {
    let chain = 0;
    while (true) {
      const matches = findMatches(board);
      if (!matches.length) break;
      chain++;
      const multiplier = feverMoves > 0 ? 2 : 1;
      const gain = matches.length * 95 * chain * multiplier;
      score += gain;
      if (feverMoves <= 0) {
        fever = Math.min(100, fever + matches.length * 4 + Math.max(0, chain - 1) * 8);
        if (fever >= 100) {
          fever = 100;
          feverMoves = 5;
          sfx.clear();
          toast('🌸 MILK FEVER！ 5手のあいだ得点2倍');
        }
      }
      showCombo(chain, gain);
      updateStats();
      pulseBoard(chain);
      makeBurst(matches, chain);
      sfx.match(chain);
      matches.forEach((i, order) => {
        const tile = boardEl.children[i];
        if (!tile) return;
        tile.style.setProperty('--pop-delay', `${Math.min(order, 10) * 25}ms`);
        tile.classList.add('is-matched');
      });
      await sleep(620);
      matches.forEach(i => { board[i] = null; });
      collapseBoard();
      render();
      [...boardEl.children].forEach((tile, i) => {
        tile.style.setProperty('--fall-delay', `${(pos(i).r * 17) + (pos(i).c * 8)}ms`);
        tile.classList.add('is-falling');
      });
      sfx.fall();
      await sleep(470);
    }

    if (!hasPossibleMove(board)) {
      boardEl.classList.add('is-shuffling');
      sfx.shuffle();
      await sleep(360);
      board = createBoard();
      render();
      boardEl.classList.remove('is-shuffling');
      toast('手詰まりのためシャッフルしました');
    }
    setBest(score);
  }

  async function attemptSwap(a, b) {
    if (locked || gameEnded || !attemptActive || !adjacent(a, b)) return;
    locked = true;
    selected = null;

    const A = pos(a), B = pos(b);
    const dx = (B.c - A.c) * 100;
    const dy = (B.r - A.r) * 100;
    const tileA = boardEl.children[a];
    const tileB = boardEl.children[b];
    sfx.swap();
    tileA?.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx}%,${dy}%) scale(1.12)`}],{duration:260,easing:'cubic-bezier(.2,.9,.25,1)',fill:'forwards'});
    tileB?.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${-dx}%,${-dy}%) scale(1.12)`}],{duration:260,easing:'cubic-bezier(.2,.9,.25,1)',fill:'forwards'});
    await sleep(265);
    swap(board, a, b);
    render();
    boardEl.children[a]?.classList.add('is-swap-land');
    boardEl.children[b]?.classList.add('is-swap-land');
    await sleep(120);

    if (findMatches(board).length === 0) {
      swap(board, a, b);
      render();
      boardEl.children[a]?.classList.add('is-invalid');
      boardEl.children[b]?.classList.add('is-invalid');
      sfx.invalid();
      await sleep(360);
      locked = false;
      return;
    }

    moves--;
    if (feverMoves > 0) {
      feverMoves--;
      if (feverMoves === 0) fever = 0;
    }
    await resolveBoard();

    const goal = mode === 'story' ? STORY_GOAL : UNLIMITED_GOAL;
    if ((mode === 'story' && score >= goal) || moves <= 0) {
      finishGame(mode === 'story' ? score >= goal : true);
    }
    locked = false;
  }

  function createOverlay(className, html) {
    boardEl.parentElement.querySelector('.milk-match-lobby,.milk-match-result')?.remove();
    const layer = document.createElement('div');
    layer.className = className;
    layer.innerHTML = html;
    boardEl.parentElement.appendChild(layer);
    return layer;
  }

  function setMode(nextMode) {
    if (attemptActive || locked) return;
    mode = nextMode;
    storyModeBtn?.classList.toggle('is-active', mode === 'story');
    unlimitedModeBtn?.classList.toggle('is-active', mode === 'unlimited');
    updateStats();
    showLobby();
  }

  function showLobby() {
    attemptActive = false;
    gameEnded = true;
    selected = null;
    if (!board.length) board = createBoard();
    render();
    const remaining = remainingPlays();
    const isStory = mode === 'story';
    const layer = createOverlay('milk-match-lobby', `
      <div class="milk-match-lobby-card">
        <b>${isStory ? '📖' : '🏆'}</b>
        <h3>${isStory ? 'ストーリーモード' : '無制限モード'}</h3>
        <p>${isStory
          ? `歌詞解放用のモードです。<br><strong>${STORY_MOVES}手で${STORY_GOAL.toLocaleString('ja-JP')}点</strong>を目指します。<br>クリアでミルクのかけら${CLEAR_REWARD}個。`
          : `何度でも遊べるスコアアタックです。<br><strong>${UNLIMITED_MOVES}手</strong>で自己ベストを目指します。<br>ミルクのかけらは獲得しません。`}</p>
        <button type="button" ${(!TEST_MODE && isStory && remaining <= 0) ? 'disabled' : ''}>プレイ開始</button>
      </div>`);
    layer.querySelector('button')?.addEventListener('click', beginAttempt);
  }

  function beginAttempt() {
    if (mode === 'story' && !TEST_MODE && remainingPlays() <= 0) return;
    if (mode === 'story' && !TEST_MODE) {
      progress.playsUsed += 1;
      saveProgress();
    } else {
      updateProgressUi();
    }
    boardEl.parentElement.querySelector('.milk-match-lobby,.milk-match-result')?.remove();
    board = createBoard();
    score = 0;
    moves = mode === 'story' ? STORY_MOVES : UNLIMITED_MOVES;
    fever = 0;
    feverMoves = 0;
    selected = null;
    locked = false;
    gameEnded = false;
    attemptActive = true;
    render();
    toast('隣り合う文字を入れ替えて3つ揃えよう');
  }

  function finishGame(cleared) {
    gameEnded = true;
    attemptActive = false;
    const rewarded = cleared && mode === 'story';
    if (rewarded) {
      progress.fragments += CLEAR_REWARD;
      saveProgress();
    }
    if (cleared) sfx.clear();
    const remaining = remainingPlays();
    const layer = createOverlay('milk-match-result', `
      <div class="milk-match-result-card">
        <b>${cleared ? '🥛' : '🍼'}</b>
        <h3>${mode === 'unlimited' ? 'スコアアタック終了！' : (cleared ? 'ステージクリア！' : 'チャレンジ終了')}</h3>
        <p>${score.toLocaleString('ja-JP')}点<br>${mode === 'unlimited'
          ? '無制限モードは報酬なし。何度でも自己ベストに挑戦できます。'
          : (cleared ? `ミルクのかけらを <strong>${CLEAR_REWARD}個</strong> 獲得しました。` : `${STORY_GOAL.toLocaleString('ja-JP')}点を目指して次の挑戦へ。`)}<br><small>${TEST_MODE ? 'テスト中：何度でもプレイ可能' : `本日の残り ${remaining}回`}</small></p>
        <button type="button">${TEST_MODE || remaining > 0 ? '次へ' : '今日はここまで'}</button>
      </div>`);
    layer.querySelector('button')?.addEventListener('click', showLobby);
  }

  function toast(message) {
    const el = document.getElementById('miniToast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('is-visible'), 1800);
  }

  function openModal() {
    progress = normalizeProgress(progress);
    saveProgress({ sync: false });
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (!attemptActive) showLobby();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    gesture = null;
  }

  function tileFromEvent(event) {
    return event.target.closest?.('.milk-match-tile');
  }

  function refreshSoundControls() {
    if (volumeSlider) volumeSlider.value = String(Math.round(soundVolume * 100));
    if (volumeValueEl) volumeValueEl.textContent = `${Math.round(soundVolume * 100)}%`;
    if (soundToggleBtn) soundToggleBtn.textContent = soundEnabled && soundVolume > 0 ? '🔊' : '🔇';
  }
  refreshSoundControls();
  volumeSlider?.addEventListener('input', () => {
    soundVolume = Math.max(0, Math.min(2, Number(volumeSlider.value) / 100));
    soundEnabled = soundVolume > 0;
    localStorage.setItem('unicaMilkMatchVolume', String(soundVolume));
    localStorage.setItem('unicaMilkMatchSound', soundEnabled ? 'on' : 'off');
    refreshSoundControls();
  });
  volumeSlider?.addEventListener('change', () => {
    if (soundEnabled) { ensureAudio(); tone(700,.12,'sine',.08); }
  });
  soundToggleBtn?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem('unicaMilkMatchSound', soundEnabled ? 'on' : 'off');
    refreshSoundControls();
    if (soundEnabled) { ensureAudio(); tone(660,.1,'sine',.08); }
  });
  storyModeBtn?.addEventListener('click', () => setMode('story'));
  unlimitedModeBtn?.addEventListener('click', () => setMode('unlimited'));

  openBtn.addEventListener('click', openModal);
  modal.querySelectorAll('[data-close-milk-match]').forEach(el => el.addEventListener('click', closeModal));
  newGameBtn?.addEventListener('click', showLobby);
  hintBtn?.addEventListener('click', () => {
    if (locked || gameEnded || !attemptActive) return;
    const pair = findHint();
    if (!pair) return;
    pair.forEach(i => boardEl.children[i]?.classList.add('is-hint'));
    setTimeout(() => pair.forEach(i => boardEl.children[i]?.classList.remove('is-hint')), 1500);
  });

  boardEl.addEventListener('click', event => {
    if (Date.now() < suppressClickUntil) return;
    const tile = tileFromEvent(event);
    if (!tile || locked || gameEnded || !attemptActive) return;
    const i = Number(tile.dataset.index);
    if (!Number.isInteger(i)) return;

    if (selected === null) {
      selected = i;
      sfx.select();
      render();
      return;
    }
    if (selected === i) {
      selected = null;
      render();
      return;
    }
    if (adjacent(selected, i)) {
      const from = selected;
      selected = null;
      attemptSwap(from, i);
      return;
    }
    selected = i;
    render();
  });

  boardEl.addEventListener('pointerdown', event => {
    const tile = tileFromEvent(event);
    if (!tile || locked || gameEnded || !attemptActive) return;
    event.preventDefault();
    const i = Number(tile.dataset.index);
    gesture = { pointerId: event.pointerId, i, x: event.clientX, y: event.clientY };
    try { boardEl.setPointerCapture(event.pointerId); } catch (_) {}
  });

  boardEl.addEventListener('pointerup', event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const start = gesture;
    gesture = null;
    try { boardEl.releasePointerCapture(event.pointerId); } catch (_) {}

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 14) return;

    suppressClickUntil = Date.now() + 350;
    const { r, c } = pos(start.i);
    let nr = r, nc = c;
    if (Math.abs(dx) > Math.abs(dy)) nc += dx > 0 ? 1 : -1;
    else nr += dy > 0 ? 1 : -1;
    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
      attemptSwap(start.i, idx(nr, nc));
    }
  });

  boardEl.addEventListener('pointercancel', () => { gesture = null; });
  boardEl.addEventListener('contextmenu', event => event.preventDefault());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  window.addEventListener('unica:firebase-ready', restoreProgressFromFirebase, { once: true });
