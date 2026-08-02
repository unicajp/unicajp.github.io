(() => {
  'use strict';

  const SIZE = 8;
  const TYPES = ['ミ', 'ル', 'ク', 'の', '匂', 'い'];
  const MAX_MOVES = 20;
  const GOAL_SCORE = 3000;
  const BEST_KEY = 'unicaMilkMatchBestV1';

  const modal = document.getElementById('milkMatchModal');
  const boardEl = document.getElementById('milkMatchBoard');
  const scoreEl = document.getElementById('milkMatchScore');
  const movesEl = document.getElementById('milkMatchMoves');
  const bestEl = document.getElementById('milkMatchBest');
  const goalBar = document.getElementById('milkMatchGoalBar');
  const comboEl = document.getElementById('milkMatchCombo');
  const openBtn = document.getElementById('openMilkMatch');
  const newGameBtn = document.getElementById('milkMatchNewGame');
  const hintBtn = document.getElementById('milkMatchHint');

  if (!modal || !boardEl || !openBtn) return;

  let board = [];
  let score = 0;
  let moves = MAX_MOVES;
  let selected = null;
  let locked = false;
  let touchStart = null;
  let gameEnded = false;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const index = (r, c) => r * SIZE + c;
  const rc = i => ({ r: Math.floor(i / SIZE), c: i % SIZE });
  const adjacent = (a, b) => {
    const A = rc(a), B = rc(b);
    return Math.abs(A.r - B.r) + Math.abs(A.c - B.c) === 1;
  };

  function getBest() {
    return Number(localStorage.getItem(BEST_KEY) || 0);
  }

  function setBest(value) {
    const best = Math.max(getBest(), value);
    localStorage.setItem(BEST_KEY, String(best));
    bestEl.textContent = best.toLocaleString('ja-JP');
  }

  function createsMatchAt(arr, r, c, type) {
    if (c >= 2 && arr[index(r, c - 1)] === type && arr[index(r, c - 2)] === type) return true;
    if (r >= 2 && arr[index(r - 1, c)] === type && arr[index(r - 2, c)] === type) return true;
    return false;
  }

  function createBoard() {
    const arr = new Array(SIZE * SIZE);
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        let type;
        do type = Math.floor(Math.random() * TYPES.length);
        while (createsMatchAt(arr, r, c, type));
        arr[index(r, c)] = type;
      }
    }
    return hasPossibleMove(arr) ? arr : createBoard();
  }

  function findMatches(arr = board) {
    const found = new Set();
    for (let r = 0; r < SIZE; r++) {
      let runStart = 0;
      for (let c = 1; c <= SIZE; c++) {
        const same = c < SIZE && arr[index(r, c)] !== null && arr[index(r, c)] === arr[index(r, runStart)];
        if (!same) {
          if (c - runStart >= 3 && arr[index(r, runStart)] !== null) {
            for (let x = runStart; x < c; x++) found.add(index(r, x));
          }
          runStart = c;
        }
      }
    }
    for (let c = 0; c < SIZE; c++) {
      let runStart = 0;
      for (let r = 1; r <= SIZE; r++) {
        const same = r < SIZE && arr[index(r, c)] !== null && arr[index(r, c)] === arr[index(runStart, c)];
        if (!same) {
          if (r - runStart >= 3 && arr[index(runStart, c)] !== null) {
            for (let y = runStart; y < r; y++) found.add(index(y, c));
          }
          runStart = r;
        }
      }
    }
    return [...found];
  }

  function swapIn(arr, a, b) {
    [arr[a], arr[b]] = [arr[b], arr[a]];
  }

  function hasPossibleMove(arr) {
    for (let i = 0; i < arr.length; i++) {
      const { r, c } = rc(i);
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= SIZE || nc >= SIZE) continue;
        const j = index(nr, nc);
        swapIn(arr, i, j);
        const ok = findMatches(arr).length > 0;
        swapIn(arr, i, j);
        if (ok) return true;
      }
    }
    return false;
  }

  function findHint() {
    for (let i = 0; i < board.length; i++) {
      const { r, c } = rc(i);
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= SIZE || nc >= SIZE) continue;
        const j = index(nr, nc);
        swapIn(board, i, j);
        const ok = findMatches().length > 0;
        swapIn(board, i, j);
        if (ok) return [i, j];
      }
    }
    return null;
  }

  function updateStats() {
    scoreEl.textContent = score.toLocaleString('ja-JP');
    movesEl.textContent = moves;
    bestEl.textContent = getBest().toLocaleString('ja-JP');
    goalBar.style.width = `${Math.min(100, (score / GOAL_SCORE) * 100)}%`;
  }

  function tileButton(type, i) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'milk-match-tile';
    btn.dataset.index = String(i);
    btn.dataset.type = String(type);
    btn.setAttribute('role', 'gridcell');
    btn.setAttribute('aria-label', `${TYPES[type]} のピース`);
    btn.textContent = TYPES[type];
    return btn;
  }

  function render() {
    boardEl.innerHTML = '';
    board.forEach((type, i) => boardEl.appendChild(tileButton(type, i)));
    if (selected !== null) boardEl.children[selected]?.classList.add('is-selected');
    updateStats();
  }

  function showCombo(chain) {
    comboEl.textContent = chain > 1 ? `${chain} COMBO!` : 'MATCH!';
    comboEl.classList.remove('show');
    void comboEl.offsetWidth;
    comboEl.classList.add('show');
  }

  async function resolveMatches(initial = true) {
    let chain = 0;
    let matches = findMatches();
    while (matches.length) {
      chain++;
      showCombo(chain);
      const gain = matches.length * 60 * chain;
      score += gain;
      updateStats();
      matches.forEach(i => boardEl.children[i]?.classList.add('is-matched'));
      await sleep(270);
      matches.forEach(i => board[i] = null);

      for (let c = 0; c < SIZE; c++) {
        const values = [];
        for (let r = SIZE - 1; r >= 0; r--) {
          const value = board[index(r, c)];
          if (value !== null) values.push(value);
        }
        for (let r = SIZE - 1, k = 0; r >= 0; r--, k++) {
          board[index(r, c)] = k < values.length ? values[k] : Math.floor(Math.random() * TYPES.length);
        }
      }
      render();
      await sleep(180);
      matches = findMatches();
    }
    if (!hasPossibleMove(board)) {
      board = createBoard();
      render();
      toast('盤面をシャッフルしました');
    }
    if (initial) setBest(score);
  }

  async function attemptSwap(a, b) {
    if (locked || gameEnded || !adjacent(a, b)) return;
    locked = true;
    selected = null;
    swapIn(board, a, b);
    render();
    await sleep(130);
    if (!findMatches().length) {
      swapIn(board, a, b);
      render();
      boardEl.children[a]?.classList.add('is-invalid');
      boardEl.children[b]?.classList.add('is-invalid');
      await sleep(240);
      locked = false;
      return;
    }
    moves--;
    await resolveMatches();
    setBest(score);
    if (score >= GOAL_SCORE || moves <= 0) finishGame(score >= GOAL_SCORE);
    locked = false;
  }

  function finishGame(cleared) {
    gameEnded = true;
    const layer = document.createElement('div');
    layer.className = 'milk-match-result';
    layer.innerHTML = `<div class="milk-match-result-card"><b>${cleared ? '🌸' : '🍼'}</b><h3>${cleared ? 'ステージクリア！' : 'チャレンジ終了'}</h3><p>${score.toLocaleString('ja-JP')}点<br>${cleared ? '次のPhaseでミルクのかけらを獲得できるようになります。' : '3,000点を目指してもう一度挑戦しよう。'}</p><button type="button">もう一度</button></div>`;
    boardEl.parentElement.appendChild(layer);
    layer.querySelector('button').addEventListener('click', () => {
      layer.remove();
      startGame();
    });
  }

  function startGame() {
    board = createBoard();
    score = 0;
    moves = MAX_MOVES;
    selected = null;
    locked = false;
    gameEnded = false;
    boardEl.parentElement.querySelector('.milk-match-result')?.remove();
    render();
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
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (!board.length || gameEnded) startGame();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', openModal);
  modal.querySelectorAll('[data-close-milk-match]').forEach(el => el.addEventListener('click', closeModal));
  newGameBtn?.addEventListener('click', startGame);
  hintBtn?.addEventListener('click', () => {
    if (locked || gameEnded) return;
    const pair = findHint();
    if (!pair) return;
    pair.forEach(i => boardEl.children[i]?.classList.add('is-hint'));
    setTimeout(() => pair.forEach(i => boardEl.children[i]?.classList.remove('is-hint')), 1600);
  });

  boardEl.addEventListener('click', event => {
    const tile = event.target.closest('.milk-match-tile');
    if (!tile || locked || gameEnded) return;
    const i = Number(tile.dataset.index);
    if (selected === null) {
      selected = i;
      render();
    } else if (selected === i) {
      selected = null;
      render();
    } else if (adjacent(selected, i)) {
      const from = selected;
      selected = null;
      attemptSwap(from, i);
    } else {
      selected = i;
      render();
    }
  });

  boardEl.addEventListener('pointerdown', event => {
    const tile = event.target.closest('.milk-match-tile');
    if (!tile || locked || gameEnded) return;
    touchStart = { i: Number(tile.dataset.index), x: event.clientX, y: event.clientY };
  });
  boardEl.addEventListener('pointerup', event => {
    if (!touchStart || locked || gameEnded) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) {
      touchStart = null;
      return;
    }
    const { r, c } = rc(touchStart.i);
    let nr = r, nc = c;
    if (Math.abs(dx) > Math.abs(dy)) nc += dx > 0 ? 1 : -1;
    else nr += dy > 0 ? 1 : -1;
    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) attemptSwap(touchStart.i, index(nr, nc));
    touchStart = null;
  });
  boardEl.addEventListener('pointercancel', () => touchStart = null);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  bestEl.textContent = getBest().toLocaleString('ja-JP');
})();
