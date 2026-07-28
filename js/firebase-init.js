import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp,
  collection, query, where, onSnapshot, writeBatch, runTransaction
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
const LEGACY_MEMBER_KEYS = ['unicaWorldMemberV3', 'unicaWorldMemberV2', 'unicaWorldMemberV1'];
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
let uid = null;
let presenceTimer = null;
let resolveAuthReady;
const authReady = new Promise(resolve => { resolveAuthReady = resolve; });

function setStatus(state, text) {
  const badge = document.getElementById('firebaseStatus');
  if (!badge) return;
  badge.dataset.state = state;
  badge.textContent = text;
}

function localMember() {
  try {
    const current = JSON.parse(localStorage.getItem(MEMBER_KEY) || 'null');
    if (current) return current;
    for (const key of LEGACY_MEMBER_KEYS) {
      const legacy = JSON.parse(localStorage.getItem(key) || 'null');
      if (legacy) return legacy;
    }
    return null;
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

async function ensureMemberNumber(profile = null) {
  await authReady;
  if (!uid) throw new Error('Firebase認証が完了していません。');

  const userRef = doc(db, 'users', uid);
  const counterRef = doc(db, 'system', 'memberCounterV3');

  const assigned = await runTransaction(db, async transaction => {
    const [userSnap, counterSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(counterRef)
    ]);
    const userData = userSnap.exists() ? userSnap.data() : {};

    // 連番方式V3で発行済みなら同じ番号を永久に保持する。旧ランダム番号は再採番する。
    if (userData.memberNumberVersion === 3 && Number(userData.number) > 0) {
      return Number(userData.number);
    }

    const lastNumber = counterSnap.exists() ? Number(counterSnap.data().lastNumber || 0) : 0;
    const nextNumber = lastNumber + 1;
    transaction.set(counterRef, {
      lastNumber: nextNumber,
      updatedAt: serverTimestamp()
    }, { merge: true });
    transaction.set(userRef, {
      ...(profile || {}),
      uid,
      number: nextNumber,
      memberNumberVersion: 3,
      updatedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp()
    }, { merge: true });
    return nextNumber;
  });

  const member = { ...(localMember() || profile || {}), number: assigned, memberNumberVersion: 3 };
  localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
  window.dispatchEvent(new CustomEvent('unica:firebase-member-restored', { detail: member }));
  return assigned;
}

async function migrateLegacyMemberNumber() {
  const member = localMember();
  if (!member) return;
  if (member.memberNumberVersion === 3 && Number(member.number) > 0) return;
  await ensureMemberNumber(member);
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
  ensureMemberNumber,
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
  resolveAuthReady?.(uid);
  try {
    await restoreMember();
    await migrateLegacyMemberNumber();
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
