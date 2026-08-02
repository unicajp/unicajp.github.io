(() => {
  'use strict';

  const SIZE = 8;
  const PIECES = [
    { name: 'ミルク', icon: '🥛' },
    { name: '哺乳瓶', icon: '🍼' },
    { name: '花', icon: '🌸' },
    { name: '光', icon: '✨' }
  ];
  const TYPES = PIECES.map(piece => piece.name);
  const STORY_STAGES = [
    // Ver.4.9: 全ステージを少し軽めに再調整。
    // Chapter 1は早めに解放し、後半は段階的に難しくなる。
    { moves: 18, goal: 18000 },
    { moves: 17, goal: 27000 },
    { moves: 16, goal: 36000 },
    { moves: 15, goal: 45000 },
    { moves: 14, goal: 54000 },
    { moves: 13, goal: 63000 },
    { moves: 12, goal: 72000 },
    { moves: 11, goal: 81000 },
    { moves: 10, goal: 90000 }
  ];
  const STORY_MOVES = STORY_STAGES[0].moves;
  const STORY_GOAL = STORY_STAGES[0].goal;
  const UNLIMITED_MOVES = 60;
  const UNLIMITED_GOAL = 60000;
  const DAILY_LIMIT = 3;
  // Phase11.3.2 TEST MODE: 公開前の動作確認中は回数を消費しない。
  // 本番公開時は false に戻すだけで、1日3回制限が再有効化されます。
  const TEST_MODE = false;
  const CLEAR_REWARD = 2;
  const BEST_KEY = 'unicaMilkMatchBestV1';
  const PROGRESS_KEY = 'unicaMilkMatchProgressV2';
  const RECORD_KEY = 'unicaMilkMatchRecordsV2C';
  const CHALLENGE_KEY = 'unicaMilkMatchDailyChallengeV2D';

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
  const rankingSpotBtn = document.getElementById('milkMatchRankingSpot');
  const rankingPreviewEl = document.getElementById('milkMatchRankingPreview');
  const rulesBtn = document.getElementById('milkMatchRules');

  if (!modal || !boardEl || !openBtn) return;

  let board = [];
  let specials = [];
  let score = 0;
  let mode = 'story';
  let storyStageIndex = 0;
  let moves = STORY_MOVES;
  let skill = 0;
  let runMaxCombo = 0;
  let runMatched = 0;
  let runSkills = 0;
  let runTypeCounts = Array(TYPES.length).fill(0);
  let dailyChallenge = getDailyChallenge();
  let selected = null;
  let lastSwap = null;
  let pendingPlayerCreation = null;
  let locked = false;
  let gameEnded = true;
  let attemptActive = false;
  let progress = loadProgress();
  let gesture = null;
  let suppressClickUntil = 0;
  let audioContext = null;
  let soundEnabled = localStorage.getItem('unicaMilkMatchSound') !== 'off';
  let soundVolume = Math.max(0, Math.min(3, Number(localStorage.getItem('unicaMilkMatchVolume') || 1.2)));
  const storyModeBtn = document.getElementById('milkMatchStoryMode');
  const unlimitedModeBtn = document.getElementById('milkMatchUnlimitedMode');
  const modeLabelEl = document.getElementById('milkMatchModeLabel');
  const goalTextEl = document.getElementById('milkMatchGoalText');
  const skillBarEl = document.getElementById('milkMatchSkillBar');
  const skillTextEl = document.getElementById('milkMatchSkillText');
  const skillMeterEl = document.getElementById('milkMatchSkillMeter');
  const skillWrapEl = skillBarEl?.closest('.milk-match-skill');
  const skillRainbowBtn = document.getElementById('milkMatchSkillRainbow');
  const skillShuffleBtn = document.getElementById('milkMatchSkillShuffle');
  const volumeSlider = document.getElementById('milkMatchVolume');
  const soundToggleBtn = document.getElementById('milkMatchSoundToggle');
  const recordsBtn = document.getElementById('milkMatchRecords');
  const challengeEl = document.getElementById('milkMatchChallenge');
  const challengeTextEl = document.getElementById('milkMatchChallengeText');
  const challengeBarEl = document.getElementById('milkMatchChallengeBar');

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
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, Math.min(.95, volume * soundVolume * 4.2)), now + .012);
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
    gain.gain.value = Math.min(.95, volume * soundVolume * 4.2);
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



  function addSkill(amount) {
    const wasReady = skill >= 100;
    skill = Math.min(100, skill + Math.max(0, amount));
    updateStats();
    if (!wasReady && skill >= 100) {
      toast('🥛 MILK SKILL READY！ 下のボタンから使えます');
      sfx.clear();
    }
  }

  function makeBurst(indices, chain) {
    // DOM粒子を大量生成するとスマホでラグが出るため、表示数を制限する。
    const wrap = boardEl.parentElement;
    const wrapRect = wrap.getBoundingClientRect();
    const layer = document.createElement('div');
    layer.className = 'milk-match-fx-layer';
    wrap.appendChild(layer);
    const visible = indices.length <= 10
      ? indices
      : indices.filter((_, i) => i % Math.ceil(indices.length / 10) === 0).slice(0, 10);
    const sparkCount = chain >= 4 ? 3 : 2;
    visible.forEach((i, order) => {
      const tile = boardEl.children[i];
      if (!tile) return;
      const rect = tile.getBoundingClientRect();
      const x = rect.left - wrapRect.left + rect.width / 2;
      const y = rect.top - wrapRect.top + rect.height / 2;
      const ring = document.createElement('i');
      ring.className = 'milk-match-burst-ring';
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      ring.style.animationDelay = `${Math.min(order, 6) * 12}ms`;
      layer.appendChild(ring);
      for (let n = 0; n < sparkCount; n++) {
        const particle = document.createElement('b');
        particle.className = 'milk-match-spark';
        const angle = (Math.PI * 2 * n / sparkCount) + (order * .65);
        const distance = 18 + Math.random() * 16 + Math.min(chain, 5);
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
        particle.style.animationDelay = `${Math.min(order, 6) * 10}ms`;
        layer.appendChild(particle);
      }
    });
    setTimeout(() => layer.remove(), 680);
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
        : [],
      storyStage: Math.max(0, Math.min(STORY_STAGES.length - 1, Number.isInteger(Number(value.storyStage)) ? Number(value.storyStage) : 0)),
      stageStars: Array.from({ length: STORY_STAGES.length }, (_, i) => Math.max(0, Math.min(3, Number(value.stageStars?.[i] || 0))))
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
        unlockedChapters: [...new Set([...(l.unlockedChapters || []), ...(r.unlockedChapters || [])])].sort((a, b) => a - b),
        storyStage: Math.max(l.storyStage || 0, r.storyStage || 0),
        stageStars: Array.from({ length: STORY_STAGES.length }, (_, i) =>
          Math.max(Number(l.stageStars?.[i] || 0), Number(r.stageStars?.[i] || 0))
        )
      };
      saveProgress();
    } catch (error) {
      console.warn('Milk Match restore:', error);
    }
  }




  function seededDayNumber() {
    return Number(todayJst().replaceAll('-', '')) || 1;
  }

  function getDailyChallenge() {
    const seed = seededDayNumber();
    const variants = [
      { kind: 'type', type: seed % TYPES.length, target: 45, label: `「${PIECES[seed % TYPES.length].name}」を45個消す` },
      { kind: 'combo', target: 5, label: '5 COMBO以上を達成' },
      { kind: 'special', target: 3, label: '特殊アイテムを3個作る' },
      { kind: 'score', target: 50000, label: '50,000点を達成' }
    ];
    const data = variants[seed % variants.length];
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(CHALLENGE_KEY) || '{}'); } catch (_) {}
    return { ...data, date: todayJst(), completed: saved.date === todayJst() && saved.completed === true };
  }

  function challengeProgress() {
    if (dailyChallenge.kind === 'type') return runTypeCounts[dailyChallenge.type] || 0;
    if (dailyChallenge.kind === 'combo') return runMaxCombo;
    if (dailyChallenge.kind === 'special') return runSkills;
    return score;
  }

  function updateChallengeUi() {
    if (!challengeEl || !challengeTextEl || !challengeBarEl) return;
    challengeEl.hidden = mode !== 'unlimited';
    if (mode !== 'unlimited') return;
    const value = dailyChallenge.completed ? dailyChallenge.target : challengeProgress();
    const pct = Math.min(100, value / dailyChallenge.target * 100);
    challengeTextEl.textContent = dailyChallenge.completed ? `✅ 本日達成：${dailyChallenge.label}` : `本日の挑戦：${dailyChallenge.label}（${Math.min(value,dailyChallenge.target).toLocaleString('ja-JP')}/${dailyChallenge.target.toLocaleString('ja-JP')}）`;
    challengeBarEl.style.width = `${pct}%`;
    challengeEl.classList.toggle('is-complete', dailyChallenge.completed || pct >= 100);
  }

  function completeDailyChallengeIfNeeded() {
    if (mode !== 'unlimited' || dailyChallenge.completed) return false;
    if (challengeProgress() < dailyChallenge.target) return false;
    dailyChallenge.completed = true;
    localStorage.setItem(CHALLENGE_KEY, JSON.stringify({ date: todayJst(), completed: true, label: dailyChallenge.label }));
    updateChallengeUi();
    toast('🏆 デイリーチャレンジ達成！');
    sfx.clear();
    return true;
  }

  function comboMultiplier(chain) {
    const table = [0, 1, 1.45, 1.95, 2.6, 3.35, 4.2, 5.15];
    return table[Math.min(chain, table.length - 1)] || (5.15 + (chain - 7) * 1.1);
  }

  function weekKeyJst() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(now);
    const o = Object.fromEntries(parts.map(x => [x.type, x.value]));
    const d = new Date(`${o.year}-${o.month}-${o.day}T00:00:00+09:00`);
    const day = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - day);
    return d.toISOString().slice(0,10);
  }

  function loadRecords() {
    try {
      const r = JSON.parse(localStorage.getItem(RECORD_KEY) || '{}');
      return { runs: Array.isArray(r.runs) ? r.runs.slice(0,100) : [], bestCombo: Number(r.bestCombo||0), totalMatches: Number(r.totalMatches||0), totalSkills: Number(r.totalSkills||r.totalFevers||0) };
    } catch (_) { return { runs: [], bestCombo: 0, totalMatches: 0, totalSkills: 0 }; }
  }

  function saveUnlimitedRecord() {
    if (mode !== 'unlimited') return;
    const records = loadRecords();
    records.runs.unshift({ score, combo: runMaxCombo, matched: runMatched, skills: runSkills, date: todayJst(), week: weekKeyJst(), at: Date.now() });
    records.runs = records.runs.sort((a,b)=>b.score-a.score || b.at-a.at).slice(0,100);
    records.bestCombo = Math.max(records.bestCombo, runMaxCombo);
    records.totalMatches += runMatched;
    records.totalSkills += runSkills;
    localStorage.setItem(RECORD_KEY, JSON.stringify(records));
  }

  function rankingRows(period='all') {
    const records = loadRecords();
    const today = todayJst(), week = weekKeyJst();
    const rows = records.runs.filter(x => period==='today' ? x.date===today : period==='week' ? x.week===week : true);
    return rows.sort((a,b)=>b.score-a.score || b.combo-a.combo || b.at-a.at).slice(0,10);
  }

  async function refreshOnlineRanking(period, layer) {
    const host = layer?.querySelector('[data-online-ranking]');
    if (!host) return;
    host.innerHTML = '<p class="milk-online-loading">オンラインランキングを読み込み中…</p>';
    try {
      const api = window.UNICA_FIREBASE;
      if (!api?.loadMilkMatchLeaderboard) throw new Error('Firebase準備中');
      const rows = await api.loadMilkMatchLeaderboard(period);
      if (!rows.length) {
        host.innerHTML = '<p class="milk-online-empty">まだオンライン記録がありません</p>';
        return;
      }
      const myUid = api.uid || '';
      host.innerHTML = rows.slice(0,10).map((row, i) => `<div class="milk-online-row ${row.uid===myUid?'is-me':''}"><b>${i+1}</b><strong>${escapeHtml(row.name)}</strong><em>${Number(row.score || 0).toLocaleString('ja-JP')}</em></div>`).join('');
    } catch (error) {
      console.warn('Online ranking:', error);
      host.innerHTML = '<p class="milk-online-empty">オンラインランキングを取得できませんでした</p>';
    }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  async function refreshRankingPreview() {
    if (!rankingPreviewEl) return;
    rankingPreviewEl.textContent = 'ランキング読込中…';
    try {
      const api = window.UNICA_FIREBASE;
      if (!api?.loadMilkMatchLeaderboard) throw new Error('Firebase準備中');
      const rows = await api.loadMilkMatchLeaderboard('all');
      if (!rows.length) {
        rankingPreviewEl.textContent = '最初の記録を目指そう';
        return;
      }
      const top = rows[0];
      rankingPreviewEl.textContent = `1位 ${top.name}　${Number(top.score || 0).toLocaleString('ja-JP')}点`;
    } catch (_) {
      rankingPreviewEl.textContent = 'ランキングを見る';
    }
  }

  function showSimpleRules() {
    const resumePlay = attemptActive && !gameEnded;
    const layer = createOverlay('milk-match-result milk-match-rules-layer', `
      <div class="milk-match-rules-card">
        <div class="milk-match-rules-head"><div><small>HOW TO PLAY</small><h3>かんたんルール</h3></div><button type="button" data-rules-close aria-label="ルールを閉じる">×</button></div>
        <ol class="milk-match-rules-list">
          <li><b>1</b><span>同じ絵柄を<strong>3つ以上</strong>そろえて消す</span></li>
          <li><b>2</b><span><strong>4つ</strong>でライン、<strong>5つ以上</strong>で虹アイテム</span></li>
          <li><b>3</b><span>特殊アイテム同士を合わせると強力な合体効果</span></li>
          <li><b>4</b><span>STORYは目標点で歌詞解放、SCOREはハイスコア勝負</span></li>
        </ol>
        <div class="milk-match-combo-guide">
          <span>⇆＋⇅<strong>虹になって発動</strong></span>
          <span>🌈＋🌈<strong>全特殊発動 → 全消し・2倍</strong></span>
        </div>
        <button type="button" class="milk-match-rules-ok" data-rules-close>わかった</button>
      </div>`);
    const close = () => {
      layer.remove();
      if (resumePlay) { render(); updateStats(); } else showLobby();
    };
    layer.querySelectorAll('[data-rules-close]').forEach(btn => btn.addEventListener('click', close));
    layer.addEventListener('click', event => { if (event.target === layer) close(); });
  }


  function showRecords(period='all') {
    const resumePlay = attemptActive && !gameEnded;
    const labels = {today:'今日',week:'今週',all:'累計'};
    const layer = createOverlay('milk-match-result milk-match-records', `
      <div class="milk-match-record-card milk-match-online-card">
        <div class="milk-match-record-head">
          <div><small>ONLINE SCORE RANKING</small><h3>🌐 オンラインランキング</h3></div>
          <button type="button" data-record-close aria-label="ランキングを閉じる">×</button>
        </div>
        <div class="milk-match-record-tabs">${['today','week','all'].map(k=>`<button type="button" data-record-period="${k}" class="${period===k?'is-active':''}">${labels[k]}</button>`).join('')}</div>
        <div class="milk-online-ranking milk-online-ranking-main">
          <div class="milk-online-columns" aria-hidden="true"><span>順位</span><span>うにメン</span><span>スコア</span></div>
          <div data-online-ranking></div>
        </div>
        <p class="milk-online-note">無制限モードのベストスコア TOP10</p>
      </div>`);
    const closeRecords = () => {
      layer.remove();
      if (resumePlay) {
        render();
        updateStats();
      } else {
        showLobby();
      }
    };
    layer.querySelector('[data-record-close]')?.addEventListener('click', closeRecords);
    layer.addEventListener('click', event => {
      if (event.target === layer) closeRecords();
    });
    layer.querySelectorAll('[data-record-period]').forEach(b=>b.addEventListener('click',()=>{
      layer.remove();
      showRecords(b.dataset.recordPeriod);
    }));
    refreshOnlineRanking(period, layer);
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

  function findMatchGroups(arr) {
    const groups = [];
    for (let r = 0; r < SIZE; r++) {
      let c = 0;
      while (c < SIZE) {
        const type = arr[idx(r, c)];
        let end = c + 1;
        while (end < SIZE && type !== null && arr[idx(r, end)] === type) end++;
        if (type !== null && end - c >= 3) groups.push({ indices: Array.from({length:end-c}, (_,k)=>idx(r,c+k)), direction:'h', type });
        c = end;
      }
    }
    for (let c = 0; c < SIZE; c++) {
      let r = 0;
      while (r < SIZE) {
        const type = arr[idx(r, c)];
        let end = r + 1;
        while (end < SIZE && type !== null && arr[idx(end, c)] === type) end++;
        if (type !== null && end - r >= 3) groups.push({ indices: Array.from({length:end-r}, (_,k)=>idx(r+k,c)), direction:'v', type });
        r = end;
      }
    }
    return groups;
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
    // 特殊アイテムはヒント候補から除外する。
    // 優先順位は「同じ種類を5個以上」→「同じ種類を4個」→「同じ種類を3個」。
    // 複数種類が同時に消える手でも合算せず、1種類ごとの最大消去数だけで評価する。
    let best = null;
    let bestRank = -1;
    let bestSameTypeCount = -1;
    let bestTotalMatched = -1;

    for (let i = 0; i < board.length; i++) {
      const { r, c } = pos(i);
      const candidates = [];
      if (c + 1 < SIZE) candidates.push(idx(r, c + 1));
      if (r + 1 < SIZE) candidates.push(idx(r + 1, c));

      for (const j of candidates) {
        // アイテムそのものを動かす手は案内しない。
        if (specials[i] || specials[j]) continue;

        swap(board, i, j);
        const matched = findMatches(board);
        const groups = findMatchGroups(board);
        swap(board, i, j);

        if (!matched.length) continue;
        // マッチに特殊アイテムが巻き込まれる手も、通常ヒントから除外する。
        if (matched.some(index => specials[index])) continue;

        // 同じ種類ごとに、重複を除いた消去予定マスをまとめる。
        const indicesByType = new Map();
        for (const group of groups) {
          if (!indicesByType.has(group.type)) indicesByType.set(group.type, new Set());
          const set = indicesByType.get(group.type);
          group.indices.forEach(index => set.add(index));
        }

        let sameTypeCount = 0;
        for (const set of indicesByType.values()) {
          sameTypeCount = Math.max(sameTypeCount, set.size);
        }
        if (sameTypeCount < 3) continue;

        // 5個以上を最優先、次に4個、最後に3個。
        const rank = sameTypeCount >= 5 ? 3 : sameTypeCount === 4 ? 2 : 1;
        const totalMatched = matched.length;

        if (
          rank > bestRank
          || (rank === bestRank && sameTypeCount > bestSameTypeCount)
          || (rank === bestRank && sameTypeCount === bestSameTypeCount && totalMatched > bestTotalMatched)
        ) {
          bestRank = rank;
          bestSameTypeCount = sameTypeCount;
          bestTotalMatched = totalMatched;
          best = [i, j];
        }
      }
    }
    return best;
  }


  function chooseCreationAtTarget(groups, target) {
    const movedType = board[target];
    if (!Number.isInteger(movedType)) return null;

    // スライド先を基準に、同じ種類が横・縦へ何個連続しているかを直接数える。
    // group の分割状態に依存しないため、5個以上は必ず虹を優先し、4個ラインに降格しない。
    const { r, c } = pos(target);
    const horizontal = [target];
    for (let x = c - 1; x >= 0 && board[idx(r, x)] === movedType; x--) horizontal.unshift(idx(r, x));
    for (let x = c + 1; x < SIZE && board[idx(r, x)] === movedType; x++) horizontal.push(idx(r, x));

    const vertical = [target];
    for (let y = r - 1; y >= 0 && board[idx(y, c)] === movedType; y--) vertical.unshift(idx(y, c));
    for (let y = r + 1; y < SIZE && board[idx(y, c)] === movedType; y++) vertical.push(idx(y, c));

    const matchedHorizontal = horizontal.length >= 3 ? horizontal : [];
    const matchedVertical = vertical.length >= 3 ? vertical : [];
    const indices = [...new Set([...matchedHorizontal, ...matchedVertical])];
    if (indices.length < 4) return null;

    // 1種類の同色ピース合計が5個以上なら、形に関係なく虹を最優先。
    const special = indices.length >= 5
      ? 'rainbow'
      : (matchedHorizontal.length >= 4 ? 'line-h' : 'line-v');

    return { target, special, indices, type: movedType };
  }


  function choosePlayerCreation(groups, from, to) {
    // 通常交換では、スライド先の同色グループだけを評価する。
    return chooseCreationAtTarget(groups, to);
  }

  function chooseMovedSpecialCreation(groups, a, b) {
    // 特殊アイテムを移動した場合は、特殊ではない通常ピース側で成立した
    // 4個・5個マッチを特殊アイテムへ変換する。
    const candidates = [a, b].filter(index => !specials[index]);
    const creations = candidates
      .map(index => chooseCreationAtTarget(groups, index))
      .filter(Boolean)
      .sort((x, y) => y.indices.length - x.indices.length);
    return creations[0] || null;
  }

  async function animateGatherToTarget(indices, target, special) {
    if (!indices?.length || target == null) return;
    const targetTile = boardEl.children[target];
    if (!targetTile) return;
    const boardRect = boardEl.getBoundingClientRect();
    const targetRect = targetTile.getBoundingClientRect();
    const tx = targetRect.left - boardRect.left + targetRect.width / 2;
    const ty = targetRect.top - boardRect.top + targetRect.height / 2;
    const animations = [];
    indices.forEach((i, order) => {
      if (i === target) return;
      const tile = boardEl.children[i];
      if (!tile) return;
      const rect = tile.getBoundingClientRect();
      const x = rect.left - boardRect.left + rect.width / 2;
      const y = rect.top - boardRect.top + rect.height / 2;
      tile.classList.add('is-gathering');
      animations.push(tile.animate([
        { transform:'translate(0,0) scale(1)', opacity:1, filter:'brightness(1)' },
        { transform:`translate(${tx-x}px,${ty-y}px) scale(.38)`, opacity:.15, filter:'brightness(1.65)' }
      ], { duration: 210 + order * 14, easing:'cubic-bezier(.2,.78,.2,1)', fill:'forwards' }).finished.catch(()=>{}));
    });
    targetTile.classList.add(special === 'rainbow' ? 'is-rainbow-forming' : 'is-special-forming');
    await Promise.all(animations);
    await sleep(45);
  }

  function currentStoryStage() {
    storyStageIndex = Math.max(0, Math.min(STORY_STAGES.length - 1, Number(storyStageIndex) || 0));
    return STORY_STAGES[storyStageIndex];
  }

  function storyGoal() { return currentStoryStage().goal; }
  function storyMoves() { return currentStoryStage().moves; }

  function starsForClear(remainingMoves) {
    if (remainingMoves >= 5) return 3;
    if (remainingMoves >= 3) return 2;
    return 1;
  }

  function updateStats() {
    if (scoreEl) scoreEl.textContent = score.toLocaleString('ja-JP');
    if (movesEl) movesEl.textContent = String(moves);
    if (bestEl) bestEl.textContent = getBest().toLocaleString('ja-JP');
    const goal = mode === 'story' ? storyGoal() : UNLIMITED_GOAL;
    if (goalBar) goalBar.style.width = `${Math.min(100, score / goal * 100)}%`;
    if (modeLabelEl) modeLabelEl.textContent = mode === 'story' ? 'STORY' : 'UNLIMITED';
    if (goalTextEl) goalTextEl.textContent = mode === 'story' ? `STAGE ${storyStageIndex + 1}｜${storyMoves()}手以内に ${storyGoal().toLocaleString('ja-JP')}点` : `${UNLIMITED_MOVES}手のスコアアタック`;
    const skillValue = Math.max(0, Math.min(100, Number(skill) || 0));
    if (skillBarEl) {
      skillBarEl.style.width = `${skillValue}%`;
      skillBarEl.style.transform = 'none';
    }
    if (skillTextEl) skillTextEl.textContent = skillValue >= 100 ? 'READY!' : `${Math.floor(skillValue)} / 100`;
    if (skillMeterEl) skillMeterEl.setAttribute('aria-valuenow', String(Math.floor(skillValue)));
    skillWrapEl?.classList.toggle('is-ready', skill >= 100);
    if (skillRainbowBtn) skillRainbowBtn.disabled = skill < 100 || gameEnded || !attemptActive;
    if (skillShuffleBtn) skillShuffleBtn.disabled = true;
    updateProgressUi();
    updateChallengeUi();
  }

  function makeTile(type, i) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'milk-match-tile';
    tile.dataset.index = String(i);
    tile.dataset.type = String(type);
    tile.setAttribute('role', 'gridcell');
    const special = specials[i];
    if (special) {
      tile.classList.add('has-special');
      tile.dataset.special = special;
    }
    tile.setAttribute('aria-label', `${PIECES[type].name}のピース ${i + 1}${special ? '、特殊アイテム' : ''}`);
    const specialSymbol = special === 'line-h' ? '⇆' : special === 'line-v' ? '⇅' : special === 'rainbow' ? '🌈' : '';
    const specialName = special === 'line-h' ? '横一列' : special === 'line-v' ? '縦一列' : special === 'rainbow' ? '同色ぜんぶ' : '';
    const mark = special
      ? `<i class="milk-match-special-mark" aria-hidden="true"><b>${specialSymbol}</b><em>${specialName}</em></i>`
      : '';
    tile.innerHTML = `<span class="milk-match-piece-icon">${PIECES[type].icon}</span><small>${PIECES[type].name}</small>${mark}`;
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
    comboEl.classList.remove('is-all-clear');
    comboEl.innerHTML = chain > 1
      ? `<strong>${chain} COMBO!</strong><small>+${gain.toLocaleString('ja-JP')}</small>`
      : `<strong>GREAT!</strong><small>+${gain.toLocaleString('ja-JP')}</small>`;
    comboEl.classList.remove('show');
    void comboEl.offsetWidth;
    comboEl.classList.add('show');
    if (chain > 1) sfx.combo(chain);
  }

  function showAllClearCelebration(gain = 0) {
    if (!comboEl) return;
    comboEl.innerHTML = `
      <span class="milk-all-clear-crown">🌈</span>
      <strong>全消し！</strong>
      <b>POINT ×2</b>
      <small>+${gain.toLocaleString('ja-JP')}</small>
    `;
    comboEl.classList.remove('show', 'is-all-clear');
    void comboEl.offsetWidth;
    comboEl.classList.add('show', 'is-all-clear');
  }

  function collapseBoard() {
    for (let c = 0; c < SIZE; c++) {
      const kept = [];
      for (let r = SIZE - 1; r >= 0; r--) {
        const i = idx(r, c);
        if (board[i] !== null) kept.push({ type: board[i], special: specials[i] || null });
      }
      let k = 0;
      for (let r = SIZE - 1; r >= 0; r--) {
        const i = idx(r, c);
        if (k < kept.length) {
          board[i] = kept[k].type;
          specials[i] = kept[k].special;
          k++;
        } else {
          board[i] = Math.floor(Math.random() * TYPES.length);
          specials[i] = null;
        }
      }
    }
  }

  async function resolveBoard() {
    let chain = 0;
    const MAX_CASCADE = 24;
    while (true) {
      if (chain >= MAX_CASCADE) {
        // Safety guard: a malformed/preserved match must never loop forever.
        board = createBoard();
        specials = Array(SIZE * SIZE).fill(null);
        pendingPlayerCreation = null;
        render();
        toast('連鎖を整理して盤面を更新しました');
        break;
      }
      const groups = findMatchGroups(board);
      if (!groups.length) break;
      const matches = [...new Set(groups.flatMap(g => g.indices))];
      const matchedSpecialOrigins = matches.filter(i => specials[i]);
      if (matchedSpecialOrigins.length) {
        // 特殊アイテムが3マッチ等に巻き込まれた場合、通常消去せず必ず効果を発動する。
        await explodeSpecialChain(matchedSpecialOrigins, false);
        chain++;
        runMaxCombo = Math.max(runMaxCombo, chain);
        await resolveBoard();
        break;
      }
      chain++;
      runMaxCombo = Math.max(runMaxCombo, chain);
      runMatched += matches.length;
      const sizeBonus = matches.length >= 5 ? 1.55 : matches.length === 4 ? 1.22 : 1;
      const gain = Math.round(matches.length * 34 * comboMultiplier(chain) * sizeBonus);
      score += gain;
      matches.forEach(i => { const t = board[i]; if (Number.isInteger(t)) runTypeCounts[t]++; });
      const creations = new Map();
      const specialPriority = { 'line-h': 1, 'line-v': 1, rainbow: 2 };
      if (chain === 1 && pendingPlayerCreation) {
        creations.set(pendingPlayerCreation.target, pendingPlayerCreation.special);
        await animateGatherToTarget(pendingPlayerCreation.indices, pendingPlayerCreation.target, pendingPlayerCreation.special);
      }
      groups.filter(group => group.indices.length >= 4).forEach(group => {
        const special = group.indices.length >= 5 ? 'rainbow' : (group.direction === 'h' ? 'line-h' : 'line-v');
        if (chain === 1 && pendingPlayerCreation && group.indices.some(i => pendingPlayerCreation.indices.includes(i))) return;
        const center = group.indices[Math.floor(group.indices.length / 2)];
        const current = creations.get(center);
        if (!current || specialPriority[special] > specialPriority[current]) creations.set(center, special);
      });
      // Only a special item created by this resolution is preserved.
      // Preserving an already-existing special inside a 3-match leaves the same
      // matched shape on the board and can cause an endless cascade.
      const preserved = new Set(creations.keys());

      showCombo(chain, gain);
      updateStats();
      completeDailyChallengeIfNeeded();
      makeBurst(matches, chain);
      sfx.match(chain);
      matches.forEach((i, order) => {
        if (preserved.has(i)) return;
        const tile = boardEl.children[i];
        if (!tile) return;
        tile.style.setProperty('--pop-delay', `${Math.min(order, 10) * 20}ms`);
        tile.classList.add('is-matched');
      });
      await sleep(270);
      matches.forEach(i => {
        if (!preserved.has(i)) { board[i] = null; specials[i] = null; }
      });
      creations.forEach((special, i) => { specials[i] = special; });
      // 通常マッチでも少しずつ蓄積し、4個・5個マッチでは大きく増える。
      // 4個マッチは約半分、5個以上はほぼ即使用可能になる調整。
      // ゲージが進んでいる実感を明確にする。通常マッチでも最低12、連鎖・大量消去で加速。
      // Ver.3.18: 通常プレイ約8〜12手で満タンになるよう再調整。
      let charge = 4 + Math.max(0, matches.length - 3) * 2 + Math.max(0, chain - 1) * 3;
      if (creations.size) {
        creations.forEach(sp => { charge += sp === 'rainbow' ? 24 : 14; });
        runSkills += creations.size;
      }
      // Ver.4.9: 虹ゲージの蓄積量を従来の約半分に抑える。
      charge = Math.max(1, Math.ceil(Math.min(42, charge) / 2));
      addSkill(charge);
      collapseBoard();
      render();
      [...boardEl.children].forEach((tile, i) => {
        tile.style.setProperty('--fall-delay', `${(pos(i).r * 10) + (pos(i).c * 4)}ms`);
        tile.classList.add('is-falling');
      });
      sfx.fall();
      await sleep(170);
    }

    pendingPlayerCreation = null;
    if (!hasPossibleMove(board)) {
      boardEl.classList.add('is-shuffling');
      sfx.shuffle();
      await sleep(250);
      board = createBoard();
      specials = Array(SIZE * SIZE).fill(null);
      render();
      boardEl.classList.remove('is-shuffling');
      toast('手詰まりのためシャッフルしました');
    }
    setBest(score);
  }

  function playSpecialBeam(special, originIndex) {
    const origin = boardEl.children[originIndex];
    if (!origin) return;
    const beam = document.createElement('div');
    beam.className = `milk-match-special-beam ${special}`;
    const boardRect = boardEl.getBoundingClientRect();
    const tileRect = origin.getBoundingClientRect();
    const x = tileRect.left - boardRect.left + tileRect.width / 2;
    const y = tileRect.top - boardRect.top + tileRect.height / 2;
    beam.style.setProperty('--beam-x', `${x}px`);
    beam.style.setProperty('--beam-y', `${y}px`);
    boardEl.appendChild(beam);
    setTimeout(() => beam.remove(), 700);
  }

  function getDirectSpecialTargets(index, special, baseType) {
    if (special === 'line-h') {
      const { r } = pos(index);
      return Array.from({ length: SIZE }, (_, c) => idx(r, c));
    }
    if (special === 'line-v') {
      const { c } = pos(index);
      return Array.from({ length: SIZE }, (_, r) => idx(r, c));
    }
    return board.map((t, j) => t === baseType ? j : -1).filter(j => j >= 0);
  }

  function collectSpecialChain(originIndex) {
    const queue = [originIndex];
    const activated = new Set();
    const allTargets = new Set();
    const waves = [];

    while (queue.length) {
      const index = queue.shift();
      if (activated.has(index) || !specials[index]) continue;
      activated.add(index);
      const special = specials[index];
      const baseType = board[index];
      const direct = [...new Set(getDirectSpecialTargets(index, special, baseType))];
      waves.push({ index, special, targets: direct });
      direct.forEach(target => {
        allTargets.add(target);
        if (target !== index && specials[target] && !activated.has(target)) queue.push(target);
      });
    }
    return { activated: [...activated], targets: [...allTargets], waves };
  }

  function collectSpecialChains(originIndices, protectedIndices = []) {
    const protectedSet = new Set(protectedIndices.filter(Number.isInteger));
    const queue = [...new Set(originIndices.filter(i => Number.isInteger(i) && specials[i] && !protectedSet.has(i)))];
    const activated = new Set();
    const allTargets = new Set();
    const waves = [];
    while (queue.length) {
      const index = queue.shift();
      if (activated.has(index) || !specials[index] || protectedSet.has(index)) continue;
      activated.add(index);
      const special = specials[index];
      const baseType = board[index];
      const direct = [...new Set(getDirectSpecialTargets(index, special, baseType))];
      waves.push({ index, special, targets: direct });
      direct.forEach(target => {
        if (!protectedSet.has(target)) allTargets.add(target);
        if (target !== index && specials[target] && !activated.has(target) && !protectedSet.has(target)) queue.push(target);
      });
    }
    return { activated: [...activated], targets: [...allTargets], waves };
  }

  async function explodeSpecialChain(originIndices, consumeMove = false, extraTargets = [], preservedCreation = null) {
    const preservedTarget = preservedCreation?.target;
    const protectedIndices = Number.isInteger(preservedTarget) ? [preservedTarget] : [];
    const chain = collectSpecialChains(originIndices, protectedIndices);
    if (!chain.waves.length) return false;
    const targets = [...new Set([
      ...chain.targets.filter(j => (board[j] !== null || specials[j]) && j !== preservedTarget),
      ...extraTargets.filter(j => Number.isInteger(j) && j >= 0 && j < board.length && board[j] !== null && j !== preservedTarget)
    ])];
    chain.waves.forEach((wave, waveIndex) => {
      const originTile = boardEl.children[wave.index];
      if (originTile) {
        originTile.style.setProperty('--chain-delay', `${waveIndex * 95}ms`);
        originTile.classList.add('is-special-activating', 'is-chain-special');
      }
      setTimeout(() => {
        playSpecialBeam(wave.special, wave.index);
        sfx.combo(wave.special === 'rainbow' ? 8 : 5);
      }, waveIndex * 95);
    });
    targets.forEach((j, order) => {
      const tile = boardEl.children[j];
      if (!tile) return;
      tile.style.setProperty('--special-delay', `${Math.min(order, 18) * 12}ms`);
      tile.classList.add('is-special-target');
    });
    makeBurst(targets, Math.min(10, 5 + chain.waves.length));
    await sleep(400 + Math.min(4, chain.waves.length - 1) * 95);
    const chainBonus = 1 + Math.max(0, chain.waves.length - 1) * 0.35;
    const gain = Math.round(targets.length * 92 * chainBonus);
    score += gain;
    runMatched += targets.length;
    targets.forEach(j => {
      const t = board[j];
      if (Number.isInteger(t)) runTypeCounts[t]++;
      board[j] = null;
      specials[j] = null;
    });
    if (preservedCreation && Number.isInteger(preservedCreation.target)) {
      board[preservedCreation.target] = preservedCreation.type;
      specials[preservedCreation.target] = preservedCreation.special;
      runSkills++;
      addSkill(preservedCreation.special === 'rainbow' ? 12 : 7);
    }
    if (consumeMove) moves = Math.max(0, moves - 1);
    showCombo(Math.max(3, chain.waves.length + 2), gain);
    if (chain.waves.length > 1) toast(`特殊アイテム ${chain.waves.length}連鎖！`);
    collapseBoard();
    render();
    [...boardEl.children].forEach(tile => tile.classList.add('is-falling'));
    await sleep(190);
    return true;
  }


  async function clearNormalMatchesBeforeMovedSpecial(movedSpecials) {
    const groups = findMatchGroups(board);
    if (!groups.length) return [];

    const movedSet = new Set(movedSpecials);
    const allMatched = [...new Set(groups.flatMap(group => group.indices))];
    // 特殊アイテム自身は残し、通常ピースだけ先に消える見た目を再生する。
    // この段階では盤面配列を空にしない。特殊効果とまとめて消去して座標崩れを防ぐ。
    const normalMatches = allMatched.filter(i => !specials[i] && !movedSet.has(i));
    if (!normalMatches.length) return [];

    runMaxCombo = Math.max(runMaxCombo, 1);
    runMatched += normalMatches.length;
    normalMatches.forEach(i => {
      const type = board[i];
      if (Number.isInteger(type)) runTypeCounts[type]++;
    });
    const sizeBonus = normalMatches.length >= 5 ? 1.35 : normalMatches.length === 4 ? 1.16 : 1;
    const gain = Math.round(normalMatches.length * 34 * sizeBonus);
    score += gain;

    showCombo(1, gain);
    updateStats();
    makeBurst(normalMatches, 1);
    sfx.match(1);
    normalMatches.forEach((i, order) => {
      const tile = boardEl.children[i];
      if (!tile) return;
      tile.style.setProperty('--pop-delay', `${Math.min(order, 10) * 20}ms`);
      tile.classList.add('is-matched');
    });
    await sleep(290);
    return normalMatches;
  }


  async function processMovedSpecialQueue(movedSpecials, movedCreation = null) {
    const queue = [...new Set(movedSpecials)].map(index => ({
      index, special: specials[index], baseType: board[index]
    })).filter(item => item.special);
    if (!queue.length) return false;

    // 1) 通常ピースが先に消えるアニメーション。
    // 2) 盤面を落下させる前に特殊アイテムを発動。
    // 3) 通常消去分と特殊効果分をまとめて空にしてから一度だけ落下。
    let normalMatches = await clearNormalMatchesBeforeMovedSpecial(queue.map(item => item.index));
    if (movedCreation) {
      // 変換先は通常消去や特殊効果で消さず、集約演出後に特殊アイテムとして残す。
      normalMatches = normalMatches.filter(index => index !== movedCreation.target);
      await animateGatherToTarget(movedCreation.indices, movedCreation.target, movedCreation.special);
    }

    queue.forEach(item => {
      if (!specials[item.index]) specials[item.index] = item.special;
      if (board[item.index] === null || board[item.index] === undefined) board[item.index] = item.baseType;
      boardEl.children[item.index]?.classList.add('is-special-primed');
    });
    await sleep(150);

    let fired = false;
    try {
      fired = await explodeSpecialChain(queue.map(item => item.index), false, normalMatches, movedCreation);
    } catch (error) {
      console.error('Moved special activation:', error);
    }

    if (!fired) {
      // 保険：特殊処理が失敗しても、通常マッチだけは確実に消して盤面を復旧する。
      normalMatches.forEach(index => {
        board[index] = null;
        specials[index] = null;
      });
      queue.forEach(item => {
        board[item.index] = null;
        specials[item.index] = null;
      });
      if (movedCreation) {
        board[movedCreation.target] = movedCreation.type;
        specials[movedCreation.target] = movedCreation.special;
      }
      collapseBoard();
      render();
      [...boardEl.children].forEach(tile => tile.classList.add('is-falling'));
      await sleep(190);
    }
    return fired;
  }


  function isLineSpecial(value) {
    return value === 'line-h' || value === 'line-v';
  }

  async function activateLineLineCombo(a, b, preferredType = null) {
    const target = b;
    // ライン同士の交換では、交換後の盤面状態に依存せず必ず虹合体を成立させる。
    // 移動先に元々あったピースの種類を優先し、取得不能時だけ現在値へフォールバックする。
    const sourceType = Number.isInteger(board[a]) ? board[a] : null;
    const targetType = Number.isInteger(board[b]) ? board[b] : sourceType;
    const rainbowType = Number.isInteger(preferredType)
      ? preferredType
      : (Number.isInteger(targetType) ? targetType : (Number.isInteger(sourceType) ? sourceType : 0));

    try {
      boardEl.children[a]?.classList.add('is-special-combo-source');
      boardEl.children[b]?.classList.add('is-special-combo-target');
      sfx.combo(6);
      await sleep(130);

      // ライン2個をスライド先へ集約し、虹へ変化させる。
      // board に null を置いた状態で render() すると描画処理が例外になり、
      // 虹が表示される前にフォールバック発動へ進んでしまうため、
      // 移動元は一時的な透明プレースホルダーとして描画する。
      const placeholderType = (rainbowType + 1) % TYPES.length;
      board[a] = placeholderType;
      specials[a] = null;
      board[target] = rainbowType;
      specials[target] = 'rainbow';
      render();

      const sourceTile = boardEl.children[a];
      sourceTile?.classList.add('is-combo-source-vacated');
      const targetTile = boardEl.children[target];
      targetTile?.classList.add('is-rainbow-forming', 'is-combo-created');
      toast('🌈 ライン合体！ 虹アイテム完成');
      showComboLabel?.('虹アイテム完成！');
      // 虹の見た目を十分確認できる時間を確保する。
      await sleep(1800);

      // 発動直前まで虹を盤面に固定し、移動元だけ空きマスへ戻す。
      board[a] = null;
      specials[a] = null;
      board[target] = rainbowType;
      specials[target] = 'rainbow';
      render();
      const activeRainbowTile = boardEl.children[target];
      activeRainbowTile?.classList.add('is-rainbow-ready');
      toast('🌈 虹アイテムが発動します');
      await sleep(700);
      activeRainbowTile?.classList.add('is-special-activating');
      await sleep(320);

      // 汎用キューを経由せず、生成した虹をこの場で確実に発動する。
      const targets = board
        .map((type, index) => type === rainbowType ? index : -1)
        .filter(index => index >= 0);
      if (!targets.includes(target)) targets.push(target);

      targets.forEach((index, order) => {
        const tile = boardEl.children[index];
        if (!tile) return;
        tile.style.setProperty('--special-delay', `${Math.min(order, 18) * 12}ms`);
        tile.classList.add('is-special-target');
      });
      boardEl.children[target]?.classList.add('is-special-activating');
      playSpecialBeam('rainbow', target);
      sfx.combo(8);
      toast('🌈 同じアイコンを全消し！');
      makeBurst(targets, 8);
      await sleep(520);

      const gain = Math.round(targets.length * 110 + 900);
      score += gain;
      runMatched += targets.length;
      runSkills += 2;
      targets.forEach(index => {
        const type = board[index];
        if (Number.isInteger(type)) runTypeCounts[type]++;
        board[index] = null;
        specials[index] = null;
      });
      showCombo(5, gain);
      updateStats();

      collapseBoard();
      render();
      [...boardEl.children].forEach(tile => tile.classList.add('is-falling'));
      await sleep(190);
      return true;
    } catch (error) {
      console.error('Line + line combo failed:', error);
      // 失敗時も空白や発動待ちを残さず、盤面を必ず復旧する。
      if (board[a] == null) board[a] = Math.floor(Math.random() * TYPES.length);
      // 例外時も「ただ消える」状態にはせず、対象色を最低限消して盤面を復旧する。
      const fallbackTargets = board
        .map((type, index) => type === rainbowType ? index : -1)
        .filter(index => index >= 0);
      fallbackTargets.forEach(index => {
        board[index] = null;
        specials[index] = null;
      });
      specials[a] = null;
      collapseBoard();
      render();
      [...boardEl.children].forEach(tile => tile.classList.add('is-falling'));
      toast('🌈 ライン合体を発動しました');
      await sleep(190);
      return true;
    }
  }

  async function activateRainbowRainbowCombo(a, b) {
    const allSpecials = specials.map((sp, i) => sp ? i : -1).filter(i => i >= 0);
    const allIndices = board.map((_, i) => i);

    boardEl.classList.add('is-double-rainbow');
    allSpecials.forEach((index, order) => {
      const tile = boardEl.children[index];
      if (!tile) return;
      tile.style.setProperty('--chain-delay', `${Math.min(order, 12) * 45}ms`);
      tile.classList.add('is-special-activating', 'is-chain-special');
      setTimeout(() => playSpecialBeam(specials[index], index), Math.min(order, 12) * 45);
    });
    toast('🌈🌈 DOUBLE RAINBOW！');
    sfx.combo(10);
    await sleep(520);

    // 全特殊アイテムの効果を見せた後、通常ピースも含めて全消し。得点は2倍。
    allIndices.forEach((index, order) => {
      const tile = boardEl.children[index];
      if (!tile) return;
      tile.style.setProperty('--special-delay', `${Math.min(order, 20) * 10}ms`);
      tile.classList.add('is-special-target');
    });
    makeBurst(allIndices, 10);
    await sleep(360);
    const specialCount = allSpecials.length;
    const baseGain = (allIndices.length * 105) + (specialCount * 650);
    const gain = Math.round(baseGain * 2);
    score += gain;
    runMatched += allIndices.length;
    runSkills += specialCount;
    allIndices.forEach(index => {
      const type = board[index];
      if (Number.isInteger(type)) runTypeCounts[type]++;
      board[index] = null;
      specials[index] = null;
    });
    showAllClearCelebration(gain);
    updateStats();
    await sleep(1500);
    collapseBoard();
    render();
    [...boardEl.children].forEach(tile => tile.classList.add('is-falling'));
    await sleep(220);
    boardEl.classList.remove('is-double-rainbow');
    return true;
  }

  async function activateSpecial(i) {
    if (locked || gameEnded || !attemptActive || !specials[i]) return;
    locked = true;
    selected = null;
    await explodeSpecialChain([i], true);
    await resolveBoard();
    const goal = mode === 'story' ? storyGoal() : UNLIMITED_GOAL;
    if ((mode === 'story' && score >= goal) || moves <= 0) finishGame(mode === 'story' ? score >= goal : true);
    locked = false;
  }

  async function attemptSwap(a, b) {
    if (locked || gameEnded || !attemptActive || !adjacent(a, b)) return;
    locked = true;
    selected = null;

    // 交換前の種類・特殊状態を保持する。虹を通常ピースへスライドした場合、
    // 発動対象色は「移動先に元々あった通常ピースの色」に固定する。
    const beforeA = { type: board[a], special: specials[a] };
    const beforeB = { type: board[b], special: specials[b] };

    const A = pos(a), B = pos(b);
    const dx = (B.c - A.c) * 100;
    const dy = (B.r - A.r) * 100;
    const tileA = boardEl.children[a];
    const tileB = boardEl.children[b];
    sfx.swap();
    tileA?.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx}%,${dy}%) scale(1.12)`}],{duration:115,easing:'cubic-bezier(.18,.82,.2,1)',fill:'forwards'});
    tileB?.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${-dx}%,${-dy}%) scale(1.12)`}],{duration:115,easing:'cubic-bezier(.18,.82,.2,1)',fill:'forwards'});
    await sleep(55);
    swap(board, a, b);
    swap(specials, a, b);

    // 虹＋通常の交換では、虹が移動した先に元々あった通常ピースの色を記憶させる。
    // collectSpecialChains() は虹マスの board 値を対象色として使うため、ここで確定する。
    if (beforeA.special === 'rainbow' && !beforeB.special && Number.isInteger(beforeB.type)) {
      board[b] = beforeB.type;
    } else if (beforeB.special === 'rainbow' && !beforeA.special && Number.isInteger(beforeA.type)) {
      board[a] = beforeA.type;
    }

    render();
    boardEl.children[a]?.classList.add('is-swap-land');
    boardEl.children[b]?.classList.add('is-swap-land');
    // 先に移動を完了して着地を見せ、その後に特殊アイテムを発動する。
    await sleep(240);

    const movedSpecials = [a, b].filter(i => specials[i]);
    if (movedSpecials.length) {
      moves--;
      lastSwap = { from: a, to: b };
      try {
        // 特殊アイテム同士の合体は通常の特殊キューより先に専用処理する。
        if (movedSpecials.length === 2 && specials[a] === 'rainbow' && specials[b] === 'rainbow') {
          await activateRainbowRainbowCombo(a, b);
          await resolveBoard();
        } else if (
          isLineSpecial(beforeA.special) &&
          isLineSpecial(beforeB.special)
        ) {
          // 交換後の specials 配列ではなく交換前の状態で判定する。
          // これにより、描画・着地処理中に特殊状態が変化してもライン合体を取りこぼさない。
          await activateLineLineCombo(a, b, beforeB.type);
          await resolveBoard();
        } else {
          const movedGroups = findMatchGroups(board);
          const movedCreation = chooseMovedSpecialCreation(movedGroups, a, b);
          // 通常消去を先に見せ、通常ピース側の4/5マッチ変換を確定してから
          // 待機キューの特殊アイテムを発動する。
          await processMovedSpecialQueue(movedSpecials, movedCreation);
          await resolveBoard();
        }
      } catch (error) {
        console.error('Special swap failed:', error);
        collapseBoard();
        render();
        toast('盤面を復旧しました');
      } finally {
        lastSwap = null;
        locked = false;
      }
      const goal = mode === 'story' ? storyGoal() : UNLIMITED_GOAL;
      if ((mode === 'story' && score >= goal) || moves <= 0) finishGame(mode === 'story' ? score >= goal : true);
      updateStats();
      refreshRankingPreview();
      return;
    }

    if (findMatches(board).length === 0) {
      swap(board, a, b);
      swap(specials, a, b);
      render();
      boardEl.children[a]?.classList.add('is-invalid');
      boardEl.children[b]?.classList.add('is-invalid');
      sfx.invalid();
      await sleep(360);
      lastSwap = null;
      pendingPlayerCreation = null;
      locked = false;
      updateStats();
      return;
    }

    moves--;
    lastSwap = { from: a, to: b };
    pendingPlayerCreation = choosePlayerCreation(findMatchGroups(board), a, b);
    await resolveBoard();
    lastSwap = null;

    const goal = mode === 'story' ? storyGoal() : UNLIMITED_GOAL;
    if ((mode === 'story' && score >= goal) || moves <= 0) {
      finishGame(mode === 'story' ? score >= goal : true);
    }
    locked = false;
    updateStats();
  }

  async function useSkill(kind) {
    if (skill < 100 || locked || gameEnded || !attemptActive) {
      if (skill < 100) toast(`MILK SKILLはあと${Math.max(0, 100 - Math.floor(skill))}で使えます`);
      return;
    }
    locked = true;
    selected = null;
    skill = 0;
    updateStats();
    sfx.clear();
    if (kind === 'shuffle') {
      boardEl.classList.add('is-shuffling');
      await sleep(180);
      board = createBoard();
      specials = Array(SIZE * SIZE).fill(null);
      render();
      boardEl.classList.remove('is-shuffling');
      toast('🔀 盤面をシャッフルしました');
    } else {
      const candidates = board.map((_, i) => i).filter(i => !specials[i]);
      const target = selected !== null && candidates.includes(selected) ? selected : candidates[Math.floor(Math.random() * candidates.length)];
      if (Number.isInteger(target)) {
        specials[target] = 'rainbow';
        render();
        boardEl.children[target]?.classList.add('is-rainbow-forming');
        toast('🌈 虹アイテムを生成しました');
      }
    }
    updateStats();
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
    lastSwap = null;
    progress = normalizeProgress(progress);
    // 選択中ステージを維持。未解放位置だけ進行中ステージへ戻す。
    const maxUnlockedStage = Math.max(0, Math.min(STORY_STAGES.length - 1, progress.storyStage || 0));
    if (!Number.isInteger(storyStageIndex) || storyStageIndex < 0 || storyStageIndex > maxUnlockedStage) storyStageIndex = maxUnlockedStage;
    if (!board.length) { board = createBoard(); specials = Array(SIZE * SIZE).fill(null); }
    render();
    const remaining = remainingPlays();
    const isStory = mode === 'story';
    const stage = currentStoryStage();
    const stageButtons = STORY_STAGES.map((item, i) => {
      const unlocked = i <= progress.storyStage;
      const stars = progress.stageStars?.[i] || 0;
      const starText = `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`;
      return `<button type="button" class="milk-stage-chip ${i===storyStageIndex?'is-current':''} ${unlocked?'':'is-locked'}" data-story-stage="${i}" ${unlocked?'':'disabled'} aria-label="ステージ${i+1} ${stars}つ星"><b>${i+1}</b><span aria-hidden="true">${unlocked ? starText : '🔒'}</span></button>`;
    }).join('');
    const layer = createOverlay('milk-match-lobby', `
      <div class="milk-match-lobby-card ${isStory ? 'is-story' : 'is-score'}">
        <div class="milk-lobby-head"><span>${isStory ? '📖' : '🏆'}</span><div><small>${isStory ? `STORY STAGE ${storyStageIndex + 1}` : 'SCORE MODE'}</small><h3>${isStory ? '歌詞を解放' : 'スコアに挑戦'}</h3></div></div>
        ${isStory ? `<div class="milk-stage-map" aria-label="ストーリーステージ">${stageButtons}</div>` : ''}
        <div class="milk-lobby-rule">
          <strong>${isStory ? `${stage.moves}手で ${stage.goal.toLocaleString('ja-JP')}点` : `${UNLIMITED_MOVES}手のスコアアタック`}</strong>
          <span>${isStory ? `クリアでChapter ${storyStageIndex + 1}解放・★評価` : '回数無制限・スコア記録'}</span>
        </div>
        <p>${isStory ? '後半ほど手数が減り、目標スコアが上がります。' : '自己ベストと日替わりチャレンジを楽しもう。'}</p>
        <button class="milk-lobby-start" type="button" ${(!TEST_MODE && isStory && remaining <= 0) ? 'disabled' : ''}>${isStory ? `STAGE ${storyStageIndex + 1} 開始` : 'スコア挑戦'}</button>
      </div>`);
    layer.querySelector('.milk-lobby-start')?.addEventListener('click', beginAttempt);
    layer.querySelectorAll('[data-story-stage]').forEach(button => button.addEventListener('click', () => {
      storyStageIndex = Number(button.dataset.storyStage);
      updateStats();
      showLobby();
    }));
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
    specials = Array(SIZE * SIZE).fill(null);
    lastSwap = null;
    score = 0;
    moves = mode === 'story' ? storyMoves() : UNLIMITED_MOVES;
    skill = 0;
    selected = null;
    locked = false;
    gameEnded = false;
    attemptActive = true;
    runMaxCombo = 0;
    runMatched = 0;
    runSkills = 0;
    runTypeCounts = Array(TYPES.length).fill(0);
    dailyChallenge = getDailyChallenge();
    render();
    toast('隣り合うアイコンを入れ替えて3つ揃えよう');
  }

  function finishGame(cleared) {
    gameEnded = true;
    if (mode === 'unlimited') {
      completeDailyChallengeIfNeeded();
      saveUnlimitedRecord();
      window.UNICA_FIREBASE?.submitMilkMatchLeaderboard?.({ score, bestCombo: runMaxCombo, matched: runMatched })
        .then(result => { if (result && result.eligible === false) toast('オンライン順位への登録は、うにメン登録後に有効になります'); })
        .catch(error => console.warn('Leaderboard submit:', error));
    }
    attemptActive = false;
    let earnedStars = 0;
    let chapterUnlocked = false;
    if (cleared && mode === 'story') {
      progress = normalizeProgress(progress);
      earnedStars = starsForClear(moves);
      progress.stageStars[storyStageIndex] = Math.max(progress.stageStars[storyStageIndex] || 0, earnedStars);
      if (!progress.unlockedChapters.includes(storyStageIndex)) {
        progress.unlockedChapters.push(storyStageIndex);
        progress.unlockedChapters.sort((a,b)=>a-b);
        chapterUnlocked = true;
      }
      if (storyStageIndex < STORY_STAGES.length - 1) {
        progress.storyStage = Math.max(progress.storyStage || 0, storyStageIndex + 1);
      }
      saveProgress();
    }
    if (cleared) sfx.clear();
    const remaining = remainingPlays();
    const goal = mode === 'story' ? storyGoal() : UNLIMITED_GOAL;
    const ratio = goal > 0 ? score / goal : 0;
    const grade = ratio >= 1.75 ? 'S' : ratio >= 1.4 ? 'A' : ratio >= 1.15 ? 'B' : ratio >= 1 ? 'C' : 'D';
    const resultKind = mode === 'unlimited' ? 'is-score' : (cleared ? 'is-clear' : 'is-fail');
    const title = mode === 'unlimited' ? 'SCORE RESULT' : (cleared ? `STAGE ${storyStageIndex + 1} CLEAR` : 'TRY AGAIN');
    const subtitle = mode === 'unlimited' ? 'スコアアタック終了' : (cleared ? (chapterUnlocked ? `Chapter ${storyStageIndex + 1} 解放` : 'ベスト記録更新') : '目標まであと少し');
    const starsHtml = mode === 'story' && cleared ? `<div class="milk-result-stars" aria-label="${earnedStars}つ星">${[1,2,3].map(n=>`<span class="${n<=earnedStars?'is-on':''}">★</span>`).join('')}<small>残り${moves}手</small></div>` : '';
    const isFinal = mode === 'story' && cleared && storyStageIndex === STORY_STAGES.length - 1;
    const layer = createOverlay(`milk-match-result ${resultKind}`, `
      <div class="milk-match-result-card">
        <div class="milk-result-top"><span>${mode === 'unlimited' ? '🏆' : (cleared ? '✦' : '↻')}</span><div><small>${title}</small><h3>${subtitle}</h3></div></div>
        ${starsHtml}
        <div class="milk-result-score"><small>SCORE</small><strong>${score.toLocaleString('ja-JP')}</strong><em>RANK ${grade}</em></div>
        <div class="milk-result-grid">
          <div><small>MAX COMBO</small><strong>${runMaxCombo}</strong></div>
          <div><small>CLEAR PIECES</small><strong>${runMatched}</strong></div>
          <div><small>SKILLS</small><strong>${runSkills}</strong></div>
        </div>
        ${cleared && mode === 'story' ? `<div class="milk-result-reward"><span>${isFinal ? '🎉' : '📖'}</span><div><small>${isFinal ? 'COMPLETE' : 'UNLOCK'}</small><strong>${isFinal ? '歌詞図鑑コンプリート！' : `Chapter ${storyStageIndex + 1}を解放`}</strong></div></div>` : ''}
        ${mode === 'story' && !cleared ? `<div class="milk-result-missing"><span>目標</span><strong>${goal.toLocaleString('ja-JP')}点</strong><small>あと ${Math.max(0, goal-score).toLocaleString('ja-JP')}点</small></div>` : ''}
        ${mode === 'unlimited' ? `<p class="milk-result-note">${dailyChallenge.completed ? '🏆 本日のチャレンジ達成' : `本日の挑戦：${dailyChallenge.label}`}</p>` : ''}
        <button type="button">${mode === 'story' && cleared && storyStageIndex < STORY_STAGES.length - 1 ? '次のステージへ' : (TEST_MODE || remaining > 0 ? 'もう一度挑戦' : '今日はここまで')}</button>
      </div>`);
    layer.querySelector('button')?.addEventListener('click', () => {
      if (mode === 'story' && cleared && storyStageIndex < STORY_STAGES.length - 1) {
        storyStageIndex += 1;
      }
      showLobby();
    });
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
    if (soundToggleBtn) soundToggleBtn.textContent = soundEnabled && soundVolume > 0 ? '🔊' : '🔇';
  }
  refreshSoundControls();
  volumeSlider?.addEventListener('input', () => {
    soundVolume = Math.max(0, Math.min(3, Number(volumeSlider.value) / 100));
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
  skillRainbowBtn?.addEventListener('click', () => useSkill('rainbow'));
  skillShuffleBtn?.addEventListener('click', () => useSkill('shuffle'));
  storyModeBtn?.addEventListener('click', () => setMode('story'));
  unlimitedModeBtn?.addEventListener('click', () => setMode('unlimited'));
  recordsBtn?.addEventListener('click', () => showRecords('all'));
  rankingSpotBtn?.addEventListener('click', () => showRecords('all'));
  rulesBtn?.addEventListener('click', showSimpleRules);

  openBtn.addEventListener('click', openModal);
  modal.querySelectorAll('[data-close-milk-match]').forEach(el => el.addEventListener('click', closeModal));
  newGameBtn?.addEventListener('click', showLobby);
  hintBtn?.addEventListener('click', () => {
    if (locked || gameEnded || !attemptActive) {
      toast('ゲーム開始後にヒントを使えます');
      return;
    }
    const pair = findHint();
    if (!pair || pair.length < 2) {
      toast('ヒントが見つからないため盤面を確認してください');
      return;
    }
    pair.forEach(i => boardEl.children[i]?.classList.add('is-hint'));
    toast('✨ 光っている2つを入れ替えてみよう');
    setTimeout(() => pair.forEach(i => boardEl.children[i]?.classList.remove('is-hint')), 2200);
  });

  boardEl.addEventListener('click', event => {
    if (Date.now() < suppressClickUntil) return;
    const tile = tileFromEvent(event);
    if (!tile || locked || gameEnded || !attemptActive) return;
    const i = Number(tile.dataset.index);
    if (!Number.isInteger(i)) return;
    if (specials[i]) {
      activateSpecial(i);
      return;
    }

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
  if (window.UNICA_FIREBASE?.uid) restoreProgressFromFirebase();

  board = createBoard();
  render();
  updateProgressUi();
})();
