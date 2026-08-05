(() => {
  'use strict';

  const modal = document.getElementById('milkMatchModal');
  const combo = document.getElementById('milkMatchCombo');
  const boardWrap = modal?.querySelector('.milk-match-board-wrap');
  if (!modal || !combo || !boardWrap) return;

  const parseCombo = () => {
    const text = combo.textContent || '';
    const n = Number(text.match(/(\d+)\s*COMBO/i)?.[1] || 0);
    combo.classList.remove('is-tier-1','is-tier-2','is-tier-3','is-tier-4');
    if (combo.classList.contains('is-all-clear')) return;
    combo.classList.add(n >= 15 ? 'is-tier-4' : n >= 10 ? 'is-tier-3' : n >= 5 ? 'is-tier-2' : 'is-tier-1');
    if (combo.classList.contains('show')) burst(n >= 10 ? 18 : n >= 5 ? 11 : 6, n >= 10 ? ['🌸','✨','✦','💫'] : ['✨','✦']);
  };

  const burst = (count, icons) => {
    const old = boardWrap.querySelectorAll('.mb-effect-particle');
    if (old.length > 38) old.forEach(el => el.remove());
    for (let i = 0; i < count; i += 1) {
      const p = document.createElement('i');
      p.className = 'mb-effect-particle';
      p.textContent = icons[i % icons.length];
      const angle = (Math.PI * 2 * i / count) + (Math.random() - .5) * .5;
      const distance = 90 + Math.random() * 130;
      p.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
      p.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
      p.style.setProperty('--r', `${Math.round((Math.random() - .5) * 420)}deg`);
      p.style.setProperty('--d', `${760 + Math.random() * 560}ms`);
      p.style.setProperty('--s', `${13 + Math.random() * 15}px`);
      boardWrap.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once:true });
    }
  };

  let allClearActive = false;
  const observer = new MutationObserver(() => {
    parseCombo();
    const nowAllClear = combo.classList.contains('is-all-clear') && combo.classList.contains('show');
    if (nowAllClear && !allClearActive) {
      allClearActive = true;
      burst(34, ['🌈','🌸','✨','⭐','💎']);
      modal.classList.add('mb-all-clear-active');
      setTimeout(() => modal.classList.remove('mb-all-clear-active'), 3200);
    } else if (!nowAllClear) {
      allClearActive = false;
    }
  });
  observer.observe(combo, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });

  // Keep leaderboard preview fresh whenever the game opens.
  const open = document.getElementById('openMilkMatch');
  open?.addEventListener('click', () => {
    modal.classList.add('mb-ui-ready');
    setTimeout(() => document.getElementById('milkMatchRankingSpot')?.classList.add('is-loaded'), 250);
  });

  // Accessible feedback for skill placement mode.
  const skillButton = document.getElementById('milkMatchSkillRainbow');
  const board = document.getElementById('milkMatchBoard');
  skillButton?.addEventListener('click', () => {
    if (!skillButton.disabled) {
      board?.setAttribute('aria-label', '虹を置きたいマスを選んでください');
      board?.classList.add('mb-choose-rainbow');
    }
  });
  board?.addEventListener('click', () => {
    if (board.classList.contains('mb-choose-rainbow')) {
      setTimeout(() => {
        board.classList.remove('mb-choose-rainbow');
        board.setAttribute('aria-label', 'マッチ3ゲーム盤面');
      }, 650);
    }
  });
})();
