(() => {
  'use strict';

  const PROGRESS_KEY = 'unicaMilkMatchProgressV2';
  const VIEWED_KEY = 'unicaMilkLyricsViewedV1';
  const COMPLETE_KEY = 'unicaMilkLyricsCompleteShownV1';
  const CHAPTER_COSTS = [12, 16, 20, 24, 28, 32, 36, 40, 48];

  const CHAPTERS = [
    { lines:['昨日まで着ていた服が','少しだけ短く見える','気付けば増えた写真に','季節だけが写ってる'], audio:'assets/audio/milk_chapter_01.mp3' },
    { lines:['前あきのボタンをとめて','笑っていた朝のこと','当たり前になった景色が','今日も愛おしくなる'], audio:'assets/audio/milk_chapter_02.mp3' },
    { lines:['ミルクの匂いが消えるたび','花が少し背伸びする','嬉しいほど愛おしくて','少しだけ胸がきゅっとする'], audio:'assets/audio/milk_chapter_03.mp3' },
    { lines:['笑う日も 泣いた日も','季節の中に並んでく','あなたのいる毎日が','私を変えていく'], audio:'assets/audio/milk_chapter_04.mp3' },
    { lines:['大きな夢はいらないから','元気でいてほしいだけ','それだけなのに気付けば','願いは増えていくんだ'], audio:'assets/audio/milk_chapter_05.mp3' },
    { lines:['ミルクの匂いが消えるたび','花が少し背伸びする','嬉しいほど愛おしくて','少しだけ胸がきゅっとする'], audio:'assets/audio/milk_chapter_06.mp3' },
    { lines:['笑う日も 泣いた日も','季節の中に並んでく','あなたのいる毎日が','私を変えていく'], audio:'assets/audio/milk_chapter_07.mp3' },
    { lines:['洗ったばかりの服さえ','少し小さく見えてくる','いつの間にこんなふうに','大きくなっていたんだろう'], audio:'assets/audio/milk_chapter_08.mp3' },
    { lines:['ミルクの匂いが消えても','花は空へ伸びていく','少しずつ変わっていく','その全部を見ていたい','あなたのいる毎日を','何度だって抱きしめる','昨日までのミルクの匂いが','胸の中で咲いている'], audio:'assets/audio/milk_chapter_09.mp3' }
  ];

  const modal = document.getElementById('milkLyricsModal');
  const list = document.getElementById('milkLyricsList');
  const openBtn = document.getElementById('openMilkLyrics');
  const openFromGame = document.getElementById('openMilkLyricsFromGame');
  const fragmentEl = document.getElementById('milkLyricsFragments');
  const unlockedEl = document.getElementById('milkLyricsUnlocked');
  const homeUnlockedEl = document.getElementById('milkLyricsHomeUnlocked');
  const progressEl = document.getElementById('milkLyricsProgress');
  if (!modal || !list || !openBtn) return;

  let currentAudio = null;
  let currentIndex = -1;
  let rafId = 0;
  const audioAvailability = new Map();

  function readProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
      return {
        ...raw,
        fragments: Math.max(0, Number(raw.fragments || 0)),
        unlockedChapters: Array.isArray(raw.unlockedChapters)
          ? [...new Set(raw.unlockedChapters.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n < CHAPTERS.length))].sort((a,b)=>a-b)
          : []
      };
    } catch (_) {
      return { fragments: 0, unlockedChapters: [] };
    }
  }

  function saveProgress(progress) {
    progress.updatedAtMs = Date.now();
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent('unica:milk-match-progress', { detail: { ...progress } }));
    if (window.UNICA_FIREBASE?.saveMilkMatchProgress) {
      window.UNICA_FIREBASE.saveMilkMatchProgress(progress).catch(error => console.warn('Lyrics sync:', error));
    }
  }

  function readViewed() {
    try { return new Set(JSON.parse(localStorage.getItem(VIEWED_KEY) || '[]').map(Number)); }
    catch (_) { return new Set(); }
  }

  function markViewed(index) {
    const viewed = readViewed();
    viewed.add(index);
    localStorage.setItem(VIEWED_KEY, JSON.stringify([...viewed]));
  }

  function toast(message) {
    const el = document.getElementById('miniToast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('is-visible'), 2200);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function ensurePlayer() {
    let player = modal.querySelector('.milk-audio-player');
    if (player) return player;
    player = document.createElement('section');
    player.className = 'milk-audio-player';
    player.hidden = true;
    player.innerHTML = `
      <div class="milk-audio-now"><span>NOW PLAYING</span><strong id="milkAudioTitle">Chapter</strong></div>
      <button class="milk-audio-main" id="milkAudioMain" type="button" aria-label="再生・一時停止">▶</button>
      <div class="milk-audio-track">
        <input id="milkAudioSeek" type="range" min="0" max="1000" value="0" aria-label="再生位置">
        <div><time id="milkAudioCurrent">0:00</time><time id="milkAudioDuration">0:00</time></div>
      </div>
      <button class="milk-audio-stop" id="milkAudioStop" type="button">閉じる</button>`;
    modal.querySelector('.milk-lyrics-panel').appendChild(player);
    player.querySelector('#milkAudioMain').addEventListener('click', () => {
      if (!currentAudio) return;
      if (currentAudio.paused) currentAudio.play().catch(() => toast('再生できませんでした'));
      else currentAudio.pause();
      updatePlayerState();
    });
    player.querySelector('#milkAudioStop').addEventListener('click', stopAudio);
    player.querySelector('#milkAudioSeek').addEventListener('input', event => {
      if (!currentAudio || !Number.isFinite(currentAudio.duration)) return;
      currentAudio.currentTime = currentAudio.duration * (Number(event.target.value) / 1000);
      updatePlayerState();
    });
    return player;
  }

  function updatePlayerState() {
    const player = ensurePlayer();
    if (!currentAudio) { player.hidden = true; return; }
    player.hidden = false;
    player.querySelector('#milkAudioTitle').textContent = `CHAPTER ${String(currentIndex + 1).padStart(2,'0')}`;
    player.querySelector('#milkAudioMain').textContent = currentAudio.paused ? '▶' : 'Ⅱ';
    player.querySelector('#milkAudioCurrent').textContent = formatTime(currentAudio.currentTime);
    player.querySelector('#milkAudioDuration').textContent = formatTime(currentAudio.duration);
    const seek = player.querySelector('#milkAudioSeek');
    seek.value = Number.isFinite(currentAudio.duration) && currentAudio.duration > 0 ? Math.round((currentAudio.currentTime / currentAudio.duration) * 1000) : 0;
    list.querySelectorAll('[data-play]').forEach(btn => {
      const active = Number(btn.dataset.play) === currentIndex && !currentAudio.paused;
      btn.classList.toggle('is-playing', active);
      btn.textContent = active ? 'Ⅱ 一時停止' : '▶ このフレーズを聴く';
    });
  }

  function tick() {
    updatePlayerState();
    if (currentAudio && !currentAudio.paused) rafId = requestAnimationFrame(tick);
  }

  function stopAudio() {
    cancelAnimationFrame(rafId);
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    currentAudio = null;
    currentIndex = -1;
    updatePlayerState();
  }

  function playChapter(index) {
    const chapter = CHAPTERS[index];
    if (!chapter?.audio || audioAvailability.get(index) === false) {
      toast('このChapterの試聴音源は準備中です');
      return;
    }
    if (currentAudio && currentIndex === index) {
      if (currentAudio.paused) currentAudio.play().then(tick).catch(() => toast('再生できませんでした'));
      else currentAudio.pause();
      updatePlayerState();
      return;
    }
    stopAudio();
    const audio = new Audio(chapter.audio);
    audio.preload = 'metadata';
    currentAudio = audio;
    currentIndex = index;
    audio.addEventListener('loadedmetadata', updatePlayerState);
    audio.addEventListener('play', () => { updatePlayerState(); tick(); });
    audio.addEventListener('pause', updatePlayerState);
    audio.addEventListener('ended', stopAudio, { once:true });
    audio.addEventListener('error', () => {
      audioAvailability.set(index, false);
      stopAudio();
      render();
      toast('試聴音源がまだ配置されていません');
    }, { once:true });
    audio.play().catch(() => {
      stopAudio();
      toast('再生を開始できませんでした');
    });
  }

  function probeAudio(index) {
    if (audioAvailability.has(index)) return;
    audioAvailability.set(index, null);
    const test = new Audio();
    test.preload = 'metadata';
    const done = value => {
      if (audioAvailability.get(index) !== null) return;
      audioAvailability.set(index, value);
      render();
    };
    test.addEventListener('loadedmetadata', () => done(true), { once:true });
    test.addEventListener('error', () => done(false), { once:true });
    test.src = CHAPTERS[index].audio;
  }

  function render() {
    const progress = readProgress();
    const unlocked = progress.unlockedChapters;
    const viewed = readViewed();
    fragmentEl.textContent = String(progress.fragments);
    unlockedEl.textContent = String(unlocked.length);
    if (homeUnlockedEl) homeUnlockedEl.textContent = String(unlocked.length);
    progressEl.style.width = `${(unlocked.length / CHAPTERS.length) * 100}%`;
    list.innerHTML = '';

    CHAPTERS.forEach((chapter, chapterIndex) => {
      const isUnlocked = unlocked.includes(chapterIndex);
      const previousUnlocked = chapterIndex === 0 || unlocked.includes(chapterIndex - 1);
      const chapterCost = CHAPTER_COSTS[chapterIndex] || 48;
      const enough = progress.fragments >= chapterCost;
      const isNew = isUnlocked && !viewed.has(chapterIndex);
      const availability = audioAvailability.get(chapterIndex);
      if (isUnlocked) probeAudio(chapterIndex);

      const card = document.createElement('article');
      card.className = `milk-lyrics-card ${isUnlocked ? 'is-unlocked' : 'is-locked'} ${isNew ? 'has-new' : ''}`;
      card.dataset.chapter = String(chapterIndex);
      const lineHtml = isUnlocked
        ? chapter.lines.map(line => `<p>${escapeHtml(line)}</p>`).join('')
        : `<div class="milk-lyrics-hidden">${chapter.lines.map(() => '<span>••••••••••••</span>').join('')}</div>`;

      let actionHtml = '';
      if (isUnlocked) {
        if (availability === true) actionHtml = `<button class="milk-lyrics-play" type="button" data-play="${chapterIndex}">▶ このフレーズを聴く</button>`;
        else if (availability === false) actionHtml = `<button class="milk-lyrics-play" type="button" disabled>🎧 試聴音源準備中</button>`;
        else actionHtml = `<button class="milk-lyrics-play" type="button" disabled>🎧 音源を確認中…</button>`;
      } else {
        const label = !previousUnlocked ? '前のChapterを先に解放' : enough ? `🥛 ${chapterCost}個で解放` : `あと${chapterCost - progress.fragments}個`;
        actionHtml = `<button class="milk-lyrics-unlock" type="button" data-unlock="${chapterIndex}" ${(!previousUnlocked || !enough) ? 'disabled' : ''}>${label}</button>`;
      }

      card.innerHTML = `<header><span>CHAPTER ${String(chapterIndex + 1).padStart(2,'0')}</span><div>${isNew ? '<em>NEW</em>' : ''}<b>${isUnlocked ? '解放済み' : 'LOCKED'}</b></div></header><div class="milk-lyrics-text">${lineHtml}</div>${actionHtml}`;
      list.appendChild(card);
    });
  }

  function petals(count = 18) {
    const layer = document.createElement('div');
    layer.className = 'milk-petal-layer';
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      p.style.setProperty('--x', `${Math.random() * 100}%`);
      p.style.setProperty('--d', `${0.2 + Math.random() * 0.9}s`);
      p.style.setProperty('--r', `${Math.random() * 300 - 150}deg`);
      p.style.setProperty('--s', `${0.7 + Math.random() * 0.8}`);
      layer.appendChild(p);
    }
    modal.appendChild(layer);
    setTimeout(() => layer.remove(), 2200);
  }

  function showUnlockOverlay(index) {
    const overlay = document.createElement('div');
    overlay.className = 'milk-unlock-overlay';
    overlay.innerHTML = `<div><small>LYRICS UNLOCKED</small><strong>CHAPTER ${String(index + 1).padStart(2,'0')}</strong><p>${CHAPTERS[index].lines.map(escapeHtml).join('<br>')}</p><button type="button">図鑑に登録</button></div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
    const close = () => {
      overlay.classList.remove('is-visible');
      setTimeout(() => overlay.remove(), 350);
      markViewed(index);
      render();
    };
    overlay.querySelector('button').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }

  function showCompleteOverlay() {
    if (localStorage.getItem(COMPLETE_KEY) === '1') return;
    localStorage.setItem(COMPLETE_KEY, '1');
    const overlay = document.createElement('div');
    overlay.className = 'milk-complete-overlay';
    overlay.innerHTML = `<div><span>🌸</span><small>LYRICS COLLECTION</small><strong>COMPLETE</strong><p>「ミルクの匂い」の歌詞を<br>すべて解放しました。</p><button type="button">図鑑を見る</button></div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
    petals(32);
    overlay.querySelector('button').addEventListener('click', () => {
      overlay.classList.remove('is-visible');
      setTimeout(() => overlay.remove(), 350);
    });
  }

  function unlockChapter(index) {
    const progress = readProgress();
    if (progress.unlockedChapters.includes(index)) return;
    if (index > 0 && !progress.unlockedChapters.includes(index - 1)) return;
    const chapterCost = CHAPTER_COSTS[index] || 48;
    if (progress.fragments < chapterCost) return;
    progress.fragments -= chapterCost;
    progress.unlockedChapters.push(index);
    progress.unlockedChapters.sort((a,b)=>a-b);
    saveProgress(progress);
    render();
    petals();
    setTimeout(() => showUnlockOverlay(index), 250);
    const card = list.children[index];
    card?.classList.add('is-newly-unlocked');
    card?.scrollIntoView({ behavior:'smooth', block:'center' });
    if (progress.unlockedChapters.length === CHAPTERS.length) setTimeout(showCompleteOverlay, 1200);
  }

  function openModal() {
    render();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    stopAudio();
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (!document.getElementById('milkMatchModal')?.classList.contains('is-open')) document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', openModal);
  openFromGame?.addEventListener('click', openModal);
  modal.querySelectorAll('[data-close-milk-lyrics]').forEach(el => el.addEventListener('click', closeModal));
  list.addEventListener('click', event => {
    const unlock = event.target.closest('[data-unlock]');
    if (unlock) unlockChapter(Number(unlock.dataset.unlock));
    const play = event.target.closest('[data-play]');
    if (play) playChapter(Number(play.dataset.play));
    const card = event.target.closest('.milk-lyrics-card.has-new');
    if (card && !unlock) {
      markViewed(Number(card.dataset.chapter));
      card.classList.remove('has-new');
      card.querySelector('header em')?.remove();
    }
  });
  window.addEventListener('unica:milk-match-progress', render);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
  ensurePlayer();
  render();
})();
