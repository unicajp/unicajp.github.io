import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore, collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDbd5CZCWKd-CYlvwAvR7AyY3G94_CdkgU',
  authDomain: 'unica-world.firebaseapp.com',
  projectId: 'unica-world',
  storageBucket: 'unica-world.firebasestorage.app',
  messagingSenderId: '640407918994',
  appId: '1:640407918994:web:64e30aa04e3496da46094b'
};

const app = getApps()[0] || initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

let members = [];
let selectedMonth = new Date().getMonth() + 1;
let celebrationTimer = null;

function publicBirthdays() {
  return members.filter(member =>
    member && member.birthdayPublic !== false &&
    Number(member.birthMonth) >= 1 && Number(member.birthMonth) <= 12 &&
    Number(member.birthDay) >= 1 && Number(member.birthDay) <= 31
  );
}

function membersForMonth(month) {
  return publicBirthdays()
    .filter(member => Number(member.birthMonth) === Number(month))
    .sort((a, b) => Number(a.birthDay) - Number(b.birthDay) || String(a.name || '').localeCompare(String(b.name || ''), 'ja'));
}

function todayMembers() {
  const now = new Date();
  return publicBirthdays().filter(member =>
    Number(member.birthMonth) === now.getMonth() + 1 && Number(member.birthDay) === now.getDate()
  );
}

function avatar(member) {
  return esc(member.avatar || member.emojiOne || '🌸');
}

function formatNames(rows, max = 3) {
  if (!rows.length) return '';
  const names = rows.slice(0, max).map(row => `${row.name || 'うにメン'}さん`);
  const rest = rows.length - names.length;
  return names.join('・') + (rest > 0 ? `ほか${rest}人` : '');
}

function renderHome() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const rows = membersForMonth(month);
  const today = todayMembers();
  $('#birthdayMonthLabel') && ($('#birthdayMonthLabel').textContent = `${month}月`);
  $('#birthdayMonthCount') && ($('#birthdayMonthCount').textContent = `${rows.length}人`);
  $('#birthdayMonthSummary') && ($('#birthdayMonthSummary').textContent = rows.length ? `${formatNames(rows)}がお誕生日です。` : `${month}月のお誕生日メンバーはまだいません。`);

  const list = $('#birthdayMonthList');
  if (list) {
    list.innerHTML = rows.length
      ? rows.slice(0, 6).map(row => `<button class="birthday-mini-member" type="button" data-birthday-uid="${esc(row.uid || '')}"><span>${avatar(row)}</span><strong>${esc(row.name || 'うにメン')}</strong><small>${Number(row.birthDay)}日</small></button>`).join('')
      : '<p class="birthday-month-empty">今月のお誕生日メンバーが登録されると、ここに表示されます。</p>';
  }

  const celebration = $('#birthdayTodayCelebration');
  if (celebration) {
    celebration.hidden = today.length === 0;
    if (today.length) {
      celebration.innerHTML = `<span aria-hidden="true">🎉</span><div><small>HAPPY BIRTHDAY</small><strong>今日は${formatNames(today, 4)}のお誕生日！</strong><p>うにメンみんなで、お祝いの気持ちを届けよう。</p></div><button type="button" data-open-birthday-calendar>お祝いする</button>`;
      document.body.classList.add('has-member-birthday-today');
      startCelebrationTicker(today);
    } else {
      document.body.classList.remove('has-member-birthday-today');
      stopCelebrationTicker();
    }
  }
}

function renderMonthButtons() {
  const wrap = $('#birthdayCalendarMonths');
  if (!wrap) return;
  wrap.innerHTML = Array.from({length: 12}, (_, index) => {
    const month = index + 1;
    const count = membersForMonth(month).length;
    return `<button type="button" role="tab" aria-selected="${month === selectedMonth}" class="${month === selectedMonth ? 'is-active' : ''}" data-birthday-month="${month}"><strong>${month}</strong><small>月</small><em>${count}</em></button>`;
  }).join('');
}

function renderCalendar() {
  const rows = membersForMonth(selectedMonth);
  $('#birthdayCalendarMonthTitle') && ($('#birthdayCalendarMonthTitle').textContent = `${selectedMonth}月のお誕生日`);
  $('#birthdayCalendarMonthCount') && ($('#birthdayCalendarMonthCount').textContent = `${rows.length}人`);
  const list = $('#birthdayCalendarList');
  if (!list) return;
  list.innerHTML = rows.length
    ? rows.map(row => `<article class="birthday-calendar-member"><span class="birthday-calendar-avatar">${avatar(row)}</span><div><strong>${esc(row.name || 'うにメン')}</strong><small>うにメン No.${String(Number(row.number || 0)).padStart(4, '0')}</small></div><time>${selectedMonth}月${Number(row.birthDay)}日</time>${isToday(row) ? '<em>今日！</em>' : ''}</article>`).join('')
    : `<div class="birthday-calendar-empty"><span>🎂</span><strong>${selectedMonth}月のお誕生日メンバーはいません</strong><p>プロフィールで誕生日を公開すると、こちらに表示されます。</p></div>`;
  renderMonthButtons();
}

function isToday(member) {
  const now = new Date();
  return Number(member.birthMonth) === now.getMonth() + 1 && Number(member.birthDay) === now.getDate();
}

function openCalendar(month = new Date().getMonth() + 1) {
  selectedMonth = Number(month) || new Date().getMonth() + 1;
  renderCalendar();
  const modal = $('#birthdayCalendarModal');
  modal?.classList.add('is-open');
  modal?.setAttribute('aria-hidden', 'false');
  document.body.classList.add('member-gate-open');
}

function closeCalendar() {
  const modal = $('#birthdayCalendarModal');
  modal?.classList.remove('is-open');
  modal?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('member-gate-open');
}

function stopCelebrationTicker() {
  if (celebrationTimer) clearInterval(celebrationTimer);
  celebrationTimer = null;
  document.querySelectorAll('.birthday-floating-message').forEach(node => node.remove());
}

function startCelebrationTicker(rows) {
  stopCelebrationTicker();
  let index = 0;
  const show = () => {
    if (document.hidden || !rows.length || $('.birthday-floating-message')) return;
    const member = rows[index++ % rows.length];
    const toast = document.createElement('div');
    toast.className = 'birthday-floating-message';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `<span>🎂</span><div><small>HAPPY BIRTHDAY</small><strong>${esc(member.name || 'うにメン')}さん、お誕生日おめでとう！</strong></div>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-show'));
    setTimeout(() => { toast.classList.remove('is-show'); setTimeout(() => toast.remove(), 500); }, 6500);
  };
  setTimeout(show, 1800);
  celebrationTimer = setInterval(show, 14000);
}

function bind() {
  $('#openBirthdayCalendar')?.addEventListener('click', () => openCalendar());
  $$('[data-close-birthday-calendar]').forEach(node => node.addEventListener('click', closeCalendar));
  document.addEventListener('click', event => {
    const monthButton = event.target.closest('[data-birthday-month]');
    if (monthButton) {
      selectedMonth = Number(monthButton.dataset.birthdayMonth);
      renderCalendar();
      return;
    }
    if (event.target.closest('[data-open-birthday-calendar]')) openCalendar();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeCalendar(); });
}

bind();
onAuthStateChanged(auth, user => {
  if (!user) return;
  onSnapshot(collection(db, 'users'), snapshot => {
    members = snapshot.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() }));
    renderHome();
    if ($('#birthdayCalendarModal')?.classList.contains('is-open')) renderCalendar();
  }, error => {
    console.warn('Birthday calendar listener:', error);
    $('#birthdayMonthSummary') && ($('#birthdayMonthSummary').textContent = '誕生日情報を読み込めませんでした。');
  });
});
