import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp,
  collection, query, where, onSnapshot, writeBatch
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDbd5CZCWKd-CYlvwAvR7AyY3G94_CdkgU',
  authDomain: 'unica-world.firebaseapp.com',
  projectId: 'unica-world',
  storageBucket: 'unica-world.firebasestorage.app',
  messagingSenderId: '640407918994',
  appId: '1:640407918994:web:64e30aa04e3496da46094b'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const MEMBER_KEY = 'unicaWorldMemberV4';
const LEGACY_MEMBER_KEY = 'unicaWorldMemberV3';
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
let uid = null;
let presenceTimer = null;

function setStatus(state, text) {
  const badge = document.getElementById('firebaseStatus');
  if (!badge) return;
  badge.dataset.state = state;
  badge.textContent = text;
}

function localMember() {
  try {
    return JSON.parse(localStorage.getItem(MEMBER_KEY) || localStorage.getItem(LEGACY_MEMBER_KEY) || 'null');
  } catch (_) {
    return null;
  }
}

async function saveMember(member) {
  if (!uid || !member) return;
  await setDoc(doc(db, 'users', uid), {
    ...member,
    uid,
    updatedAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
    prefecturePublic: member.prefecturePublic !== false,
    birthdayPublic: member.birthdayPublic !== false
  }, { merge: true });
}

async function removeMember() {
  if (!uid) return;
  await deleteDoc(doc(db, 'users', uid));
}

async function restoreMember() {
  if (!uid) return;
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    const remote = snap.data();
    const existing = localMember();
    if (!existing || Number(remote.updatedAt?.seconds || 0) >= Number(existing.firebaseUpdatedAt || 0)) {
      const clean = { ...remote, firebaseUpdatedAt: Number(remote.updatedAt?.seconds || 0) };
      delete clean.updatedAt;
      delete clean.lastSeenAt;
      delete clean.uid;
      localStorage.setItem(MEMBER_KEY, JSON.stringify(clean));
      window.dispatchEvent(new CustomEvent('unica:firebase-member-restored', { detail: clean }));
    }
  } else {
    const member = localMember();
    if (member) await saveMember(member);
  }
}

async function heartbeat() {
  if (!uid) return;
  await setDoc(doc(db, 'presence', uid), {
    uid,
    lastSeenAt: serverTimestamp(),
    visible: document.visibilityState === 'visible'
  }, { merge: true });
}

function listenOnlineCount() {
  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS);
  const q = query(collection(db, 'presence'), where('lastSeenAt', '>=', cutoff));
  return onSnapshot(q, snap => {
    const count = snap.docs.filter(d => d.data().visible !== false).length;
    document.querySelectorAll('[data-online-count], #onlineCount, #communityOnlinePeople').forEach(el => {
      el.textContent = String(count);
    });
    window.dispatchEvent(new CustomEvent('unica:online-count', { detail: { count } }));
  }, error => console.warn('Online count listener:', error));
}

async function syncCommunityRows(rows = []) {
  if (!uid) return;
  const batch = writeBatch(db);
  rows.filter(row => row && !String(row.id || '').startsWith('demo-')).forEach(row => {
    batch.set(doc(db, 'supportComments', String(row.id)), {
      ...row,
      ownerUid: row.ownerUid || uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
  });
  await batch.commit();
}

async function syncCheer(data) {
  if (!uid || !data) return;
  const today = data.date || new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
  await setDoc(doc(db, 'dailyCheers', `${today}_${uid}`), {
    uid,
    date: today,
    member: localMember()?.name || '',
    createdAt: serverTimestamp()
  }, { merge: true });
}

window.UNICA_FIREBASE = {
  app, auth, db,
  get uid() { return uid; },
  saveMember: member => saveMember(member).catch(console.error),
  removeMember: () => removeMember().catch(console.error),
  syncCommunityRows: rows => syncCommunityRows(rows).catch(console.error),
  syncCheer: data => syncCheer(data).catch(console.error),
  heartbeat: () => heartbeat().catch(console.error)
};

setStatus('connecting', 'Firebase 接続中');

onAuthStateChanged(auth, async user => {
  if (!user) {
    try { await signInAnonymously(auth); }
    catch (error) {
      console.error(error);
      setStatus('error', 'Firebase設定を確認');
    }
    return;
  }

  uid = user.uid;
  try {
    await restoreMember();
    await heartbeat();
    listenOnlineCount();
    presenceTimer = window.setInterval(heartbeat, 60_000);
    setStatus('online', 'Firebase 接続済み');
    window.dispatchEvent(new CustomEvent('unica:firebase-ready', { detail: { uid } }));
  } catch (error) {
    console.error(error);
    setStatus('error', 'Firestore設定を確認');
  }
});

document.addEventListener('visibilitychange', heartbeat);
window.addEventListener('beforeunload', () => {
  if (presenceTimer) clearInterval(presenceTimer);
});
