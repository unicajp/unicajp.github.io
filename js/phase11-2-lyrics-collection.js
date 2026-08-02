(() => {
  'use strict';

  const PROGRESS_KEY = 'unicaMilkMatchProgressV2';
  const CHAPTER_COSTS = [12, 16, 20, 24, 28, 32, 36, 40, 48]; // 旧データ互換用
  const CHAPTERS = [
    ['昨日まで着ていた服が','少しだけ短く見える','気付けば増えた写真に','季節だけが写ってる'],
    ['前あきのボタンをとめて','笑っていた朝のこと','当たり前になった景色が','今日も愛おしくなる'],
    ['ミルクの匂いが消えるたび','花が少し背伸びする','嬉しいほど愛おしくて','少しだけ胸がきゅっとする'],
    ['笑う日も 泣いた日も','季節の中に並んでく','あなたのいる毎日が','私を変えていく'],
    ['大きな夢はいらないから','元気でいてほしいだけ','それだけなのに気付けば','願いは増えていくんだ'],
    ['ミルクの匂いが消えるたび','花が少し背伸びする','嬉しいほど愛おしくて','少しだけ胸がきゅっとする'],
    ['笑う日も 泣いた日も','季節の中に並んでく','あなたのいる毎日が','私を変えていく'],
    ['洗ったばかりの服さえ','少し小さく見えてくる','いつの間にこんなふうに','大きくなっていたんだろう'],
    ['ミルクの匂いが消えても','花は空へ伸びていく','少しずつ変わっていく','その全部を見ていたい','あなたのいる毎日を','何度だって抱きしめる','昨日までのミルクの匂いが','胸の中で咲いている']
  ];

  // 4行ごとに切り出した音源を配置後、ここへパスを設定してください。
  // 最終章だけ歌詞が8行のため、1つの音源として扱います。
  const AUDIO_SOURCES = ['', '', '', '', '', '', '', '', ''];

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

  function toast(message) {
    const el = document.getElementById('miniToast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('is-visible'), 2000);
  }

  function stopAudio() {
    if (!currentAudio) return;
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
    list.querySelectorAll('.is-playing').forEach(el => el.classList.remove('is-playing'));
  }

  function render() {
    const progress = readProgress();
    const unlocked = progress.unlockedChapters;
    fragmentEl.textContent = String(progress.fragments);
    unlockedEl.textContent = String(unlocked.length);
    if (homeUnlockedEl) homeUnlockedEl.textContent = String(unlocked.length);
    progressEl.style.width = `${(unlocked.length / CHAPTERS.length) * 100}%`;
    list.innerHTML = '';

    CHAPTERS.forEach((lines, chapterIndex) => {
      const isUnlocked = unlocked.includes(chapterIndex);
      const previousUnlocked = chapterIndex === 0 || unlocked.includes(chapterIndex - 1);
      const chapterCost = CHAPTER_COSTS[chapterIndex] || 48;
      const enough = progress.fragments >= chapterCost;
      const card = document.createElement('article');
      card.className = `milk-lyrics-card ${isUnlocked ? 'is-unlocked' : 'is-locked'}`;
      const lineHtml = isUnlocked
        ? lines.map(line => `<p>${escapeHtml(line)}</p>`).join('')
        : `<div class="milk-lyrics-hidden">${lines.map(() => '<span>••••••••••••</span>').join('')}</div>`;
      let actionHtml = '';
      if (isUnlocked) {
        actionHtml = AUDIO_SOURCES[chapterIndex]
          ? `<button class="milk-lyrics-play" type="button" data-play="${chapterIndex}">▶ このフレーズを聴く</button>`
          : `<button class="milk-lyrics-play" type="button" disabled>🎧 試聴音源準備中</button>`;
      } else {
        const label = !previousUnlocked ? '前のChapterを先に解放' : enough ? `🥛 ${chapterCost}個で解放` : `あと${chapterCost - progress.fragments}個`;
        actionHtml = `<button class="milk-lyrics-unlock" type="button" data-unlock="${chapterIndex}" ${(!previousUnlocked || !enough) ? 'disabled' : ''}>${label}</button>`;
      }
      const stars = Math.max(0, Math.min(3, Number(progress.stageStars?.[chapterIndex] || 0)));
      card.innerHTML = `<header><span>CHAPTER ${String(chapterIndex + 1).padStart(2,'0')}</span><b>${isUnlocked ? `解放済み ${stars ? '★'.repeat(stars) : ''}` : 'LOCKED'}</b></header><div class="milk-lyrics-text">${lineHtml}</div>${actionHtml}`;
      list.appendChild(card);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
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
    const card = list.children[index];
    card?.classList.add('is-newly-unlocked');
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast(`Chapter ${index + 1} を解放しました`);
  }

  function playChapter(index, button) {
    const source = AUDIO_SOURCES[index];
    if (!source) return;
    if (currentAudio && currentAudio.dataset.chapter === String(index)) {
      stopAudio();
      return;
    }
    stopAudio();
    const audio = new Audio(source);
    audio.dataset.chapter = String(index);
    currentAudio = audio;
    button.classList.add('is-playing');
    button.textContent = '■ 再生を止める';
    audio.addEventListener('ended', () => { stopAudio(); render(); }, { once: true });
    audio.addEventListener('error', () => { stopAudio(); toast('試聴音源を読み込めませんでした'); render(); }, { once: true });
    audio.play().catch(() => { stopAudio(); toast('再生を開始できませんでした'); render(); });
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
    if (play) playChapter(Number(play.dataset.play), play);
  });
  window.addEventListener('unica:milk-match-progress', render);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
  render();
})();
