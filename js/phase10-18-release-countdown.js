(() => {
  'use strict';

  const RELEASE = { year: 2026, month: 8, day: 1 };
  const RELEASE_LINK = 'https://linkco.re/qRn9AShM';
  const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const releaseUtc = Date.UTC(RELEASE.year, RELEASE.month - 1, RELEASE.day) - JST_OFFSET_MS;
  const eventStartUtc = Date.UTC(2026, 6, 1) - JST_OFFSET_MS;

  const getJstParts = (time = Date.now()) => {
    const date = new Date(time + JST_OFFSET_MS);
    return {
      year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(),
      hour: date.getUTCHours(), minute: date.getUTCMinutes(), second: date.getUTCSeconds()
    };
  };

  const isReleaseDay = (parts) => parts.year === RELEASE.year && parts.month === RELEASE.month && parts.day === RELEASE.day;
  const isAfterRelease = (time) => time >= releaseUtc;

  function buildConfetti() {
    const layer = document.getElementById('milkReleaseConfetti');
    if (!layer || layer.children.length) return;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 54; i += 1) {
      const piece = document.createElement('i');
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.setProperty('--h', String(Math.floor(Math.random() * 360)));
      piece.style.setProperty('--d', `${4.2 + Math.random() * 4.5}s`);
      piece.style.setProperty('--delay', `${Math.random() * -7}s`);
      piece.style.setProperty('--r', `${Math.random() * 360}deg`);
      piece.style.setProperty('--x', `${-90 + Math.random() * 180}px`);
      fragment.appendChild(piece);
    }
    layer.appendChild(fragment);
  }

  function openCelebration() {
    const modal = document.getElementById('milkReleaseCelebration');
    if (!modal) return;
    buildConfetti();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('modal-open');
  }

  function closeCelebration() {
    const modal = document.getElementById('milkReleaseCelebration');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('modal-open');
    try { localStorage.setItem('unicaMilkReleaseCelebration20260801', 'seen'); } catch (_) {}
  }

  function maybeCelebrate(parts) {
    if (!isReleaseDay(parts)) return;
    let seen = false;
    try { seen = localStorage.getItem('unicaMilkReleaseCelebration20260801') === 'seen'; } catch (_) {}
    if (!seen) window.setTimeout(openCelebration, 900);
  }

  function render() {
    const card = document.getElementById('milkReleaseCountdown');
    if (!card) return;
    const now = Date.now();
    const parts = getJstParts(now);
    const daysEl = document.getElementById('milkReleaseDays');
    const clockEl = document.getElementById('milkReleaseClock');
    const leadEl = document.getElementById('milkReleaseLead');
    const noteEl = document.getElementById('milkReleaseNote');
    const badgeEl = document.getElementById('milkReleaseBadge');
    const progressEl = document.getElementById('milkReleaseProgress');
    const linkEl = document.getElementById('milkReleaseLink');

    if (isAfterRelease(now)) {
      card.classList.remove('is-eve');
      card.classList.add('is-released');
      leadEl.textContent = isReleaseDay(parts) ? 'ついに本日' : '好評配信中';
      daysEl.textContent = isReleaseDay(parts) ? '本日リリース！' : '配信中';
      clockEl.textContent = isReleaseDay(parts) ? '2026.08.01' : '「ミルクの匂い」を聴いてみてね';
      noteEl.textContent = '何気ない今日を、未来の宝物に。';
      badgeEl.textContent = 'OUT NOW';
      progressEl.style.width = '100%';
      linkEl.hidden = false;
      linkEl.href = RELEASE_LINK;
      return;
    }

    const diff = Math.max(0, releaseUtc - now);
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.ceil(diff / 86400000);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    daysEl.textContent = `あと${days}日`;
    clockEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    badgeEl.textContent = days <= 1 ? 'TOMORROW' : 'COUNTDOWN';
    noteEl.textContent = days <= 1 ? '明日、うにかの新しい物語が始まります。' : '8月1日、うにかの新しい物語が始まります。';
    card.classList.toggle('is-eve', days <= 1);
    const duration = Math.max(1, releaseUtc - eventStartUtc);
    const elapsed = Math.min(duration, Math.max(0, now - eventStartUtc));
    progressEl.style.width = `${Math.max(4, (elapsed / duration) * 100)}%`;
  }

  function init() {
    const close = document.getElementById('closeMilkReleaseCelebration');
    const modal = document.getElementById('milkReleaseCelebration');
    close?.addEventListener('click', closeCelebration);
    modal?.addEventListener('click', (event) => { if (event.target === modal) closeCelebration(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeCelebration(); });
    render();
    maybeCelebrate(getJstParts());
    window.setInterval(render, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
