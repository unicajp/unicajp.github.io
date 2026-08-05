import {
  collection, deleteDoc, doc, getDocs, orderBy, query,
  serverTimestamp, setDoc, where, writeBatch, runTransaction
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const $ = selector => document.querySelector(selector);
const trigger = $('#unikaAdminTrigger');
const passwordModal = $('#adminPasswordModal');
const membersModal = $('#adminMembersModal');
const deleteModal = $('#adminDeleteModal');
const passwordInput = $('#adminPasswordInput');
const passwordMessage = $('#adminPasswordMessage');
const membersMessage = $('#adminMembersMessage');
const list = $('#adminMemberList');
const search = $('#adminMemberSearch');
let taps = [];
let members = [];
let adminUnlocked = false;
let pendingDelete = null;

function setOpen(modal, open) {
  modal?.classList.toggle('is-open', open);
  modal?.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('member-gate-open', Boolean(document.querySelector('.admin-modal.is-open')));
}

function openPassword() {
  setOpen(passwordModal, true);
  passwordMessage.textContent = '';
  passwordInput.value = '';
  window.setTimeout(() => passwordInput.focus(), 80);
}

trigger?.addEventListener('click', event => {
  const now = Date.now();
  taps = taps.filter(time => now - time < 4000);
  taps.push(now);
  if (taps.length >= 10) {
    taps = [];
    event.preventDefault();
    openPassword();
  }
});

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function formatNumber(value) {
  const number = Number(value || 0);
  return number > 0 ? `No.${String(number).padStart(4, '0')}` : '番号なし';
}

function renderMembers() {
  const keyword = search.value.trim().toLowerCase();
  const rows = members.filter(member => {
    const haystack = `${member.name || ''} ${member.number || ''} ${member.prefecture || ''}`.toLowerCase();
    return !keyword || haystack.includes(keyword);
  });
  $('#adminMemberCount').textContent = String(members.length);
  list.innerHTML = rows.length ? rows.map(member => `
    <article class="admin-member-row">
      <span class="admin-member-avatar">${escapeHtml(member.avatar || member.emojiOne || '🌸')}</span>
      <span class="admin-member-info">
        <strong>${escapeHtml(member.name || '名前未設定')}</strong>
        <small>${escapeHtml(formatNumber(member.number))}${member.prefecture ? ` ・ ${escapeHtml(member.prefecture)}` : ''}</small>
      </span>
      <button class="admin-delete-button" type="button" data-admin-delete="${escapeHtml(member.uid)}">削除</button>
    </article>`).join('') : '<div class="admin-empty">該当するうにメンはいません。</div>';

  list.querySelectorAll('[data-admin-delete]').forEach(button => {
    button.addEventListener('click', () => {
      pendingDelete = members.find(member => member.uid === button.dataset.adminDelete);
      if (!pendingDelete) return;
      $('#adminDeleteTarget').textContent = `${pendingDelete.avatar || '🌸'} ${pendingDelete.name || '名前未設定'}（${formatNumber(pendingDelete.number)}）`;
      $('#adminDeleteMessage').textContent = '';
      setOpen(deleteModal, true);
    });
  });
}


async function reconcileMemberNumberPool() {
  const api = window.UNICA_FIREBASE;
  if (!api?.db) return;
  const occupied = new Set(members.map(row => Number(row.number || 0)).filter(n => Number.isInteger(n) && n > 0));
  const counterRef = doc(api.db, 'system', 'memberCounterV3');
  await runTransaction(api.db, async transaction => {
    const counterSnap = await transaction.get(counterRef);
    const counter = counterSnap.exists() ? counterSnap.data() : {};
    const highestOccupied = occupied.size ? Math.max(...occupied) : 0;
    const lastNumber = Math.max(Number(counter.lastNumber || 0), highestOccupied);
    const availableNumbers = [];
    for (let number = 1; number <= lastNumber; number++) {
      if (!occupied.has(number)) availableNumbers.push(number);
    }
    transaction.set(counterRef, {
      lastNumber,
      availableNumbers,
      updatedAt: serverTimestamp()
    }, { merge: true });
  });
}

async function loadMembers() {
  membersMessage.classList.remove('is-success');
  membersMessage.textContent = 'うにメン一覧を読み込み中…';
  list.innerHTML = '';
  const api = window.UNICA_FIREBASE;
  if (!api?.db) throw new Error('Firebaseへの接続が完了していません。');
  const snap = await getDocs(query(collection(api.db, 'users'), orderBy('number', 'asc')));
  members = snap.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() }));
  await reconcileMemberNumberPool();
  membersMessage.textContent = '';
  renderMembers();
}

async function enterAdmin() {
  if (passwordInput.value !== 'uniuni') {
    passwordMessage.textContent = 'パスワードが違います。';
    passwordInput.select();
    return;
  }
  adminUnlocked = true;
  passwordMessage.textContent = '';
  setOpen(passwordModal, false);
  setOpen(membersModal, true);
  try { await loadMembers(); }
  catch (error) { membersMessage.textContent = error?.message || '一覧を読み込めませんでした。'; }
}

async function deleteMemberDirectly(member) {
  if (!adminUnlocked) throw new Error('管理画面を開き直してください。');
  const api = window.UNICA_FIREBASE;
  if (!api?.db) throw new Error('Firebaseへの接続が完了していません。');

  const db = api.db;
  const commentsSnap = await getDocs(query(collection(db, 'supportComments'), where('ownerUid', '==', member.uid)));
  const userRef = doc(db, 'users', member.uid);
  const counterRef = doc(db, 'system', 'memberCounterV3');

  // 会員番号を空き番号プールへ戻してから会員データを削除します。
  await runTransaction(db, async transaction => {
    const [userSnap, counterSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(counterRef)
    ]);
    const userData = userSnap.exists() ? userSnap.data() : member;
    const releasedNumber = Number(userData.number || member.number || 0);
    const counter = counterSnap.exists() ? counterSnap.data() : {};
    const availableNumbers = Array.isArray(counter.availableNumbers)
      ? counter.availableNumbers.map(Number).filter(n => Number.isInteger(n) && n > 0)
      : [];
    if (releasedNumber > 0 && !availableNumbers.includes(releasedNumber)) {
      availableNumbers.push(releasedNumber);
      availableNumbers.sort((a, b) => a - b);
    }
    transaction.set(counterRef, {
      lastNumber: Number(counter.lastNumber || 0),
      availableNumbers,
      updatedAt: serverTimestamp()
    }, { merge: true });
    transaction.set(doc(db, 'deletedMembers', member.uid), {
      uid: member.uid,
      name: member.name || '',
      number: releasedNumber,
      deletedAt: serverTimestamp(),
      deletedBy: api.uid || 'browser-admin'
    });
    transaction.delete(userRef);
  });

  const batch = writeBatch(db);
  batch.delete(doc(db, 'presence', member.uid));
  commentsSnap.docs.forEach(commentDoc => batch.delete(commentDoc.ref));
  await batch.commit();
}

$('#adminPasswordSubmit')?.addEventListener('click', enterAdmin);
passwordInput?.addEventListener('keydown', event => { if (event.key === 'Enter') enterAdmin(); });
search?.addEventListener('input', renderMembers);

document.querySelectorAll('[data-close-admin]').forEach(el => el.addEventListener('click', () => setOpen(passwordModal, false)));
document.querySelectorAll('[data-close-admin-members]').forEach(el => el.addEventListener('click', () => {
  setOpen(membersModal, false);
  adminUnlocked = false;
}));
$('#adminDeleteCancel')?.addEventListener('click', () => { pendingDelete = null; setOpen(deleteModal, false); });

$('#adminDeleteConfirm')?.addEventListener('click', async () => {
  if (!pendingDelete) return;
  const target = pendingDelete;
  const button = $('#adminDeleteConfirm');
  button.disabled = true;
  button.textContent = '削除中…';
  $('#adminDeleteMessage').textContent = '';
  try {
    await deleteMemberDirectly(target);
    members = members.filter(member => member.uid !== target.uid);
    renderMembers();
    setOpen(deleteModal, false);
    membersMessage.classList.add('is-success');
    membersMessage.textContent = `${target.name || 'うにメン'}を削除しました。`;
    pendingDelete = null;
  } catch (error) {
    console.error(error);
    $('#adminDeleteMessage').textContent = error?.message || '削除できませんでした。Firestoreルールを更新してください。';
  } finally {
    button.disabled = false;
    button.textContent = 'はい、削除する';
  }
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (deleteModal?.classList.contains('is-open')) setOpen(deleteModal, false);
  else if (membersModal?.classList.contains('is-open')) { setOpen(membersModal, false); adminUnlocked = false; }
  else if (passwordModal?.classList.contains('is-open')) setOpen(passwordModal, false);
});
